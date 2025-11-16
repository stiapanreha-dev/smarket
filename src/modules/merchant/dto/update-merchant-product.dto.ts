import { PartialType } from '@nestjs/swagger';
import { CreateMerchantProductDto } from './create-merchant-product.dto';

export class UpdateMerchantProductDto extends PartialType(CreateMerchantProductDto) {}
