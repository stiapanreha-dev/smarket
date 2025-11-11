import { IsOptional, IsObject } from 'class-validator';

/**
 * DTO for creating a Stripe Payment Intent
 */
export class CreatePaymentIntentDto {
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}
