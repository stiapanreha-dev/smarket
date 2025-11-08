import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateUsersAndMerchants1699000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'locale',
            type: 'enum',
            enum: ['en', 'ru', 'ar'],
            default: "'en'",
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'enum',
            enum: ['USD', 'EUR', 'RUB', 'AED'],
            default: "'USD'",
            isNullable: false,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['buyer', 'merchant', 'admin'],
            default: "'buyer'",
            isNullable: false,
          },
          {
            name: 'email_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'phone_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'last_login_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for users
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_email',
        columnNames: ['email'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_phone',
        columnNames: ['phone'],
        isUnique: true,
        where: 'phone IS NOT NULL',
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_role',
        columnNames: ['role'],
      }),
    );

    // Create merchants table
    await queryRunner.createTable(
      new Table({
        name: 'merchants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'owner_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'legal_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'website',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'logo_url',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'kyc_status',
            type: 'enum',
            enum: ['pending', 'in_review', 'approved', 'rejected', 'suspended'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'kyc_verified_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'payout_method',
            type: 'enum',
            enum: ['bank_transfer', 'paypal', 'stripe', 'crypto'],
            default: "'bank_transfer'",
            isNullable: false,
          },
          {
            name: 'payout_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'suspended'],
            default: "'inactive'",
            isNullable: false,
          },
          {
            name: 'tax_id',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'business_address',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for merchants
    await queryRunner.createIndex(
      'merchants',
      new TableIndex({
        name: 'IDX_merchants_owner_id',
        columnNames: ['owner_id'],
      }),
    );

    await queryRunner.createIndex(
      'merchants',
      new TableIndex({
        name: 'IDX_merchants_kyc_status',
        columnNames: ['kyc_status'],
      }),
    );

    await queryRunner.createIndex(
      'merchants',
      new TableIndex({
        name: 'IDX_merchants_status',
        columnNames: ['status'],
      }),
    );

    // Composite index for common queries
    await queryRunner.createIndex(
      'merchants',
      new TableIndex({
        name: 'IDX_merchants_kyc_status_status',
        columnNames: ['kyc_status', 'status'],
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'merchants',
      new TableForeignKey({
        name: 'FK_merchants_owner_id',
        columnNames: ['owner_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('merchants', 'FK_merchants_owner_id');

    // Drop merchants table and its indexes
    await queryRunner.dropTable('merchants', true);

    // Drop users table and its indexes
    await queryRunner.dropTable('users', true);
  }
}
