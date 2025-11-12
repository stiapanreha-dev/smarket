import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { Wishlist } from '@database/entities/wishlist.entity';
import { WishlistItem } from '@database/entities/wishlist-item.entity';
import { Product } from '@database/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist, WishlistItem, Product])],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
