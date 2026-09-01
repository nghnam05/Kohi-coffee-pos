import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { OrderDocument } from './schemas/order.schema.js';

@WebSocketGateway({ cors: true })
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected via WebSocket: ${client.id}`);
    this.authenticateSocket(client);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected via WebSocket: ${client.id}`);
  }

  @SubscribeMessage('register')
  handleRegister(@ConnectedSocket() client: Socket, @MessageBody() data?: { token?: string }) {
    this.authenticateSocket(client, data?.token);
  }

  private authenticateSocket(client: Socket, explicitToken?: string) {
    try {
      const rawToken =
        explicitToken ||
        client.handshake?.auth?.token ||
        client.handshake?.query?.token;

      if (!rawToken || typeof rawToken !== 'string') return;

      const token = rawToken.replace(/^Bearer\s+/i, '').trim();
      const payload = this.jwtService.verify(token);

      if (payload && payload.role) {
        if (payload.role === 'staff' || payload.role === 'waiter' || payload.role === 'barista') {
          client.join('staff');
          console.log(`Socket ${client.id} joined room 'staff' (user: ${payload.email || payload.sub})`);
        } else if (payload.role === 'admin') {
          client.join('admin');
          console.log(`Socket ${client.id} joined room 'admin' (user: ${payload.email || payload.sub})`);
        }
      }
    } catch (err) {
      // Unauthenticated client or invalid token
    }
  }

  emitNewOrder(order: OrderDocument): void {
    this.server.emit('newOrder', order);
  }

  emitStatusUpdate(orderId: string, status: string): void {
    this.server.emit('statusUpdated', { orderId, status });
  }

  emitPaymentNotified(order: any): void {
    if (this.server) {
      this.server.emit('paymentNotified', order);
    }
  }

  emitOrderDeleted(orderId: string): void {
    this.server.emit('orderDeleted', { orderId });
  }

  emitOrdersMerged(tableId: string, mergedOrder: any): void {
    this.server.emit('ordersMerged', { tableId, mergedOrder });
  }

  emitStaffCall(call: any): void {
    if (this.server) {
      this.server.emit('staffCallRequest', call);
    }
  }

  emitStaffCallAcknowledged(id: string): void {
    if (this.server) {
      this.server.emit('staffCallAcknowledged', { id });
    }
  }

  emitAttendanceUpdate(data: any): void {
    if (this.server) {
      this.server.emit('attendanceUpdated', data);
    }
  }

  emitNewReservation(reservation: any): void {
    if (this.server) {
      this.server.emit('newReservation', reservation);
      this.server.emit('tableUpdated', { tableId: reservation.tableId?._id || reservation.tableId, status: 'reserved' });
    }
  }

  emitDrinkReadyNotification(data: { orderId: string; tableName?: string; items?: any[] }): void {
    if (this.server) {
      this.server.emit('drinkReadyNotification', data);
    }
  }

  emitReservationStatusUpdate(id: string, status: string): void {
    if (this.server) {
      this.server.emit('reservationStatusUpdated', { id, status });
      this.server.emit('tableUpdated', { id, status });
    }
  }

  emitReservationDeleted(id: string): void {
    if (this.server) {
      this.server.emit('reservationDeleted', { id });
    }
  }

  emitTableUpdate(tableId: string, status: string): void {
    if (this.server) {
      this.server.emit('tableUpdated', { tableId, status });
    }
  }

  emitGuestJoined(data: { tableId: string; tableName: string }): void {
    if (this.server) {
      this.server.emit('guestJoined', data);
      this.server.emit('tableUpdated', { tableId: data.tableId, status: 'serving' });
    }
  }

  emitGuestLeft(data: { tableId: string; tableName: string }): void {
    if (this.server) {
      this.server.emit('guestLeft', data);
      this.server.emit('tableUpdated', { tableId: data.tableId, status: 'empty' });
    }
  }

  emitLowStockAlert(ingredient: any): void {
    if (this.server) {
      this.server.emit('lowStockAlert', ingredient);
    }
  }

  emitIngredientUpdated(ingredient: any): void {
    if (this.server) {
      this.server.emit('ingredientUpdated', ingredient);
    }
  }

  private sharedCarts = new Map<string, any[]>();

  @SubscribeMessage('joinTableRoom')
  handleJoinTableRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tableId: string },
  ) {
    if (data?.tableId) {
      client.join(`table_${data.tableId}`);
      const cart = this.sharedCarts.get(data.tableId) || [];
      client.emit('groupCartState', { tableId: data.tableId, items: cart });
    }
  }

  @SubscribeMessage('updateGroupCart')
  handleUpdateGroupCart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tableId: string; items: any[]; senderName?: string },
  ) {
    if (data?.tableId) {
      this.sharedCarts.set(data.tableId, data.items || []);
      this.server.to(`table_${data.tableId}`).emit('groupCartUpdated', {
        tableId: data.tableId,
        items: data.items || [],
        senderName: data.senderName,
      });
    }
  }

  @SubscribeMessage('clearGroupCart')
  handleClearGroupCart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tableId: string },
  ) {
    if (data?.tableId) {
      this.sharedCarts.delete(data.tableId);
      this.server.to(`table_${data.tableId}`).emit('groupCartCleared', { tableId: data.tableId });
    }
  }

  emitClearGroupCart(tableId: string): void {
    if (tableId) {
      this.sharedCarts.delete(tableId);
      if (this.server) {
        this.server.to(`table_${tableId}`).emit('groupCartCleared', { tableId });
      }
    }
  }

  transferGroupCart(fromTableId: string, toTableId: string): void {
    if (!fromTableId || !toTableId) return;
    const cart = this.sharedCarts.get(fromTableId) || [];
    if (cart.length > 0) {
      this.sharedCarts.set(toTableId, cart);
      this.sharedCarts.delete(fromTableId);
    }
    if (this.server) {
      this.server.to(`table_${toTableId}`).emit('groupCartUpdated', {
        tableId: toTableId,
        items: cart,
      });
      this.server.to(`table_${fromTableId}`).emit('groupCartCleared', { tableId: fromTableId });
    }
  }

  emitRewardVoucherIssued(data: { orderId: string; voucherCode: string; totalAmount: number; tableId?: string }): void {
    if (this.server) {
      this.server.emit('rewardVoucherIssued', data);
      if (data.tableId) {
        this.server.to(`table_${data.tableId}`).emit('rewardVoucherIssued', data);
      }
    }
  }
}

