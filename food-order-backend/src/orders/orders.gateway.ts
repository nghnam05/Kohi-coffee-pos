import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OrderDocument } from './schemas/order.schema.js';

@WebSocketGateway({ cors: true })
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected via WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected via WebSocket: ${client.id}`);
  }

  emitNewOrder(order: OrderDocument): void {
    this.server.emit('newOrder', order);
  }

  emitStatusUpdate(orderId: string, status: string): void {
    this.server.emit('statusUpdated', { orderId, status });
  }

  emitOrderDeleted(orderId: string): void {
    this.server.emit('orderDeleted', { orderId });
  }

  emitOrdersMerged(tableId: string, mergedOrder: any): void {
    this.server.emit('ordersMerged', { tableId, mergedOrder });
  }
}
