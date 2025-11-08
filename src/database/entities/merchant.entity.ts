import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { User } from './user.entity';
import { Product } from './product.entity';

export enum KycStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  CRYPTO = 'crypto',
}

export enum MerchantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('merchants')
@Index(['owner_id'])
@Index(['kyc_status'])
@Index(['status'])
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  owner_id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  legal_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  @IsOptional()
  display_name: string | null;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  description: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsUrl()
  @IsOptional()
  website: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  @IsOptional()
  logo_url: string | null;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.PENDING,
  })
  @IsEnum(KycStatus)
  kyc_status: KycStatus;

  @Column({ type: 'timestamp', nullable: true })
  kyc_verified_at: Date | null;

  @Column({
    type: 'enum',
    enum: PayoutMethod,
    default: PayoutMethod.BANK_TRANSFER,
  })
  @IsEnum(PayoutMethod)
  payout_method: PayoutMethod;

  @Column({ type: 'jsonb', nullable: true })
  payout_details: Record<string, any> | null;

  @Column({
    type: 'enum',
    enum: MerchantStatus,
    default: MerchantStatus.INACTIVE,
  })
  @IsEnum(MerchantStatus)
  status: MerchantStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsString()
  @IsOptional()
  tax_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  business_address: {
    country: string;
    city: string;
    street: string;
    postal_code: string;
    state?: string;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    commission_rate?: number;
    auto_approve_products?: boolean;
    notification_preferences?: Record<string, boolean>;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.merchants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => Product, (product) => product.merchant)
  products: Product[];

  // Virtual fields
  get is_verified(): boolean {
    return this.kyc_status === KycStatus.APPROVED;
  }

  get is_active(): boolean {
    return this.status === MerchantStatus.ACTIVE && this.is_verified;
  }
}
