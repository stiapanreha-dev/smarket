import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { PaymentMethodType } from '../../../database/entities/checkout-session.entity';

export class UpdatePaymentMethodDto {
  @IsEnum(PaymentMethodType)
  payment_method: PaymentMethodType;

  @IsObject()
  @IsOptional()
  payment_details?: Record<string, any>; // Tokenized card data, PayPal email, etc.
}
