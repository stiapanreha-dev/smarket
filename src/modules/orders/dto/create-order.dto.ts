import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Checkout session ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  checkout_session_id: string;

  @ApiPropertyOptional({
    description: 'Payment intent ID from payment provider',
    example: 'pi_1234567890',
  })
  @IsString()
  @IsOptional()
  payment_intent_id?: string;
}
