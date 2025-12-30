import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Product } from '../../database/entities/product.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { CacheService } from '../../common/services/cache.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductVariant]),
    SettingsModule, // For VAT settings in cart summary
  ],
  controllers: [CartController],
  providers: [CartService, CacheService],
  exports: [CartService],
})
export class CartModule {}
