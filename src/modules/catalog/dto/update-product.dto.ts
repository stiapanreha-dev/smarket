import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../../../database/entities/product.entity';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({
    enum: ProductStatus,
    description: 'Product status',
    example: ProductStatus.ACTIVE,
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}
