import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import {
  IsEmail,
  IsPhoneNumber,
  IsString,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Merchant } from './merchant.entity';

export enum UserLocale {
  EN = 'en',
  RU = 'ru',
  AR = 'ar',
}

export enum UserCurrency {
  USD = 'USD',
  EUR = 'EUR',
  RUB = 'RUB',
  AED = 'AED',
}

export enum UserRole {
  BUYER = 'buyer',
  MERCHANT = 'merchant',
  ADMIN = 'admin',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['phone'], { unique: true, where: 'phone IS NOT NULL' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsPhoneNumber()
  @IsOptional()
  phone: string | null;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @MinLength(8)
  password_hash: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  first_name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  last_name: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsString()
  @IsOptional()
  avatar_url: string | null;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  date_of_birth: Date | null;

  @Column({
    type: 'enum',
    enum: UserLocale,
    default: UserLocale.EN,
  })
  @IsEnum(UserLocale)
  locale: UserLocale;

  @Column({
    type: 'enum',
    enum: UserCurrency,
    default: UserCurrency.USD,
  })
  @IsEnum(UserCurrency)
  currency: UserCurrency;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BUYER,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'boolean', default: false })
  phone_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email_verification_token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  email_verification_expires: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_reset_token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  password_reset_expires: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  password_changed_at: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @OneToMany(() => Merchant, (merchant) => merchant.owner)
  merchants: Merchant[];

  // Virtual fields
  get full_name(): string {
    if (this.first_name && this.last_name) {
      return `${this.first_name} ${this.last_name}`;
    }
    return this.first_name || this.last_name || this.email;
  }
}
