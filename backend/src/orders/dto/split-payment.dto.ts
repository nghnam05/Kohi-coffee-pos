import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class NotifySplitPaymentDto {
  @IsNumber({}, { message: 'Số tiền thanh toán phải là số hợp lệ.' })
  @Min(1000, { message: 'Số tiền thanh toán tối thiểu là 1.000 đ.' })
  amount: number;

  @IsString()
  payerName: string;

  @IsString()
  @IsOptional()
  deviceId?: string;

  @IsArray({ message: 'itemIndexes phải là một mảng.' })
  itemIndexes: number[];

  @IsString()
  @IsOptional()
  paymentMethod?: string;
}

export class ConfirmSplitPaymentDto {
  @IsNumber({}, { message: 'Số tiền thanh toán phải là số hợp lệ.' })
  @Min(1000, { message: 'Số tiền thanh toán tối thiểu là 1.000 đ.' })
  amount: number;

  @IsString()
  @IsOptional()
  payerName?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsArray({ message: 'itemIndexes phải là một mảng.' })
  itemIndexes: number[];

  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
