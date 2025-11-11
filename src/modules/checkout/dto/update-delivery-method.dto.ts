import { IsEnum } from 'class-validator';
import { DeliveryMethodType } from '../../../database/entities/checkout-session.entity';

export class UpdateDeliveryMethodDto {
  @IsEnum(DeliveryMethodType)
  delivery_method: DeliveryMethodType;
}
