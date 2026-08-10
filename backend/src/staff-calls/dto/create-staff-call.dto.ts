import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStaffCallDto {
  @IsMongoId()
  tableId: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  message?: string;
}
