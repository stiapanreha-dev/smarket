import { CheckoutStatus } from '../../../database/entities/checkout-session.entity';

export class CompleteCheckoutResponseDto {
  order_id: string;
  order_number: string;
  status: CheckoutStatus;
}
