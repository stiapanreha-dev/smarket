import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsString, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('product_images')
@Index(['product_id', 'position'])
@Index(['product_id'])
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  variant_id: string | null;

  @Column({ type: 'varchar', length: 500 })
  @IsString()
  url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsString()
  @IsOptional()
  thumbnail_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsString()
  @IsOptional()
  medium_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsString()
  @IsOptional()
  large_url: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  @IsOptional()
  alt_text: string | null;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  position: number;

  @Column({ type: 'int', nullable: true })
  @IsNumber()
  @IsOptional()
  width: number | null;

  @Column({ type: 'int', nullable: true })
  @IsNumber()
  @IsOptional()
  height: number | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  // Relations
  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProductVariant, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant | null;
}
