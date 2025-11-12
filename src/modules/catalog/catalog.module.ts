import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './catalog.controller';
import { CatalogSitemapController } from './catalog-sitemap.controller';
import { CatalogService } from './catalog.service';
import { ProductSearchService } from './product-search.service';
import { Product } from '../../database/entities/product.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { ProductTranslation } from '../../database/entities/product-translation.entity';
import { ProductImage } from '../../database/entities/product-image.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { AuditLogService } from '../../common/services/audit-log.service';
import { CacheService } from '../../common/services/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductVariant, ProductTranslation, ProductImage, AuditLog]),
  ],
  controllers: [CatalogController, CatalogSitemapController],
  providers: [CatalogService, ProductSearchService, AuditLogService, CacheService],
  exports: [CatalogService, ProductSearchService],
})
export class CatalogModule {}
