import { IsString, IsOptional } from 'class-validator';

export class CompleteCheckoutDto {
  @IsString()
  @IsOptional()
  idempotency_key?: string; // Client-generated key to prevent duplicate orders
}
