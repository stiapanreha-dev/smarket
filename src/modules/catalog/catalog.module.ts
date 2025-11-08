import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { Product } from '../../database/entities/product.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { ProductTranslation } from '../../database/entities/product-translation.entity';
import { ProductImage } from '../../database/entities/product-image.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { AuditLogService } from '../../common/services/audit-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      ProductTranslation,
      ProductImage,
      AuditLog,
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService, AuditLogService],
  exports: [CatalogService],
})
export class CatalogModule {}
