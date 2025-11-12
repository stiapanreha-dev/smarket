import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Wishlist } from './wishlist.entity';
import { Product } from './product.entity';

/**
 * WishlistItem Entity
 * Represents an individual item in a user's wishlist
 */
@Entity('wishlist_items')
@Index(['wishlist_id', 'product_id'], { unique: true })
@Index(['wishlist_id'])
@Index(['product_id'])
export class WishlistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  wishlist_id: string;

  @Column({ type: 'uuid' })
  product_id: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  // Relations
  @ManyToOne(() => Wishlist, (wishlist) => wishlist.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'wishlist_id' })
  wishlist: Wishlist;

  @ManyToOne(() => Product, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
