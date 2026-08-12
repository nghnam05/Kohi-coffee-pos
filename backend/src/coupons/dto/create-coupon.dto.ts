import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsEnum(['percent', 'fixed'])
  type: 'percent' | 'fixed';

  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxUsage?: number;

  @IsDateString()
  expiresAt: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
