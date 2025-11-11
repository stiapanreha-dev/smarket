import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { User } from './user.entity';

/**
 * UserAddress Entity
 *
 * Stores user's saved addresses for checkout
 * Each user can have multiple addresses, one of which is the default
 */
@Entity('user_addresses')
@Index(['user_id', 'is_default'])
@Index(['user_id', 'created_at'])
export class UserAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  user_id: string;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  full_name: string;

  @Column({ type: 'varchar', length: 20 })
  @IsString()
  @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
  phone: string;

  @Column({ type: 'varchar', length: 200 })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  address_line1: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address_line2: string | null;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  state: string | null;

  @Column({ type: 'varchar', length: 10 })
  @IsString()
  @Matches(/^[A-Z0-9\s-]{3,10}$/i)
  postal_code: string;

  @Column({ type: 'char', length: 2 })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country: string; // ISO 3166-1 alpha-2 country code

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  is_default: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Helper methods
  getFullAddress(): string {
    const parts = [
      this.address_line1,
      this.address_line2,
      this.city,
      this.state,
      this.postal_code,
      this.country,
    ].filter(Boolean);

    return parts.join(', ');
  }
}
