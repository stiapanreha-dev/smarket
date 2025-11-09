import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCheckoutSessions1699000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create checkout_step enum
    await queryRunner.query(`
      CREATE TYPE checkout_step AS ENUM (
        'cart_review',
        'shipping_address',
        'payment_method',
        'order_review',
        'payment',
        'confirmation'
      );
    `);

    // Create checkout_status enum
    await queryRunner.query(`
      CREATE TYPE checkout_status AS ENUM (
        'in_progress',
        'completed',
        'expired',
        'cancelled',
        'failed'
      );
    `);

    // Create payment_method_type enum
    await queryRunner.query(`
      CREATE TYPE payment_method_type AS ENUM (
        'card',
        'apple_pay',
        'google_pay',
        'bank_transfer',
        'paypal',
        'crypto',
        'cash_on_delivery'
      );
    `);

    // Create checkout_sessions table
    await queryRunner.createTable(
      new Table({
        name: 'checkout_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'session_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'For guest checkout',
          },
          {
            name: 'cart_snapshot',
            type: 'jsonb',
            isNullable: false,
            comment: 'Snapshot of cart items with locked prices',
          },
          {
            name: 'step',
            type: 'checkout_step',
            default: "'cart_review'",
          },
          {
            name: 'shipping_address',
            type: 'jsonb',
            isNullable: true,
            comment: 'Format: {country, state, city, street, postal_code, phone}',
          },
          {
            name: 'billing_address',
            type: 'jsonb',
            isNullable: true,
            comment: 'Same format as shipping_address, null = use shipping',
          },
          {
            name: 'payment_method',
            type: 'payment_method_type',
            isNullable: true,
          },
          {
            name: 'payment_details',
            type: 'jsonb',
            isNullable: true,
            comment: 'Encrypted/tokenized payment details',
          },
          {
            name: 'totals',
            type: 'jsonb',
            isNullable: false,
            comment:
              'Format: {subtotal, tax_amount, shipping_amount, discount_amount, total_amount, currency}',
          },
          {
            name: 'promo_codes',
            type: 'jsonb',
            isNullable: true,
            comment: 'Array of applied promo codes with amounts',
          },
          {
            name: 'status',
            type: 'checkout_status',
            default: "'in_progress'",
          },
          {
            name: 'idempotency_key',
            type: 'varchar',
            length: '255',
            isNullable: true,
            isUnique: true,
            comment: 'For preventing duplicate order creation',
          },
          {
            name: 'order_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Link to created order after completion',
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
            comment: 'Error details if checkout failed',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional data: device info, referrer, etc.',
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: false,
            comment: 'Session expires after 30 minutes',
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
          {
            name: 'completed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'checkout_sessions',
      new TableIndex({
        name: 'IDX_checkout_sessions_user_id_status',
        columnNames: ['user_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'checkout_sessions',
      new TableIndex({
        name: 'IDX_checkout_sessions_session_id',
        columnNames: ['session_id'],
      }),
    );

    await queryRunner.createIndex(
      'checkout_sessions',
      new TableIndex({
        name: 'IDX_checkout_sessions_status_expires_at',
        columnNames: ['status', 'expires_at'],
        comment: 'For finding expired sessions to cleanup',
      }),
    );

    await queryRunner.createIndex(
      'checkout_sessions',
      new TableIndex({
        name: 'IDX_checkout_sessions_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Create foreign key to users
    await queryRunner.createForeignKey(
      'checkout_sessions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Create trigger to auto-update updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_checkout_sessions_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER checkout_sessions_updated_at_trigger
      BEFORE UPDATE ON checkout_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_checkout_sessions_updated_at();
    `);

    // Create partial index for active sessions
    await queryRunner.query(`
      CREATE INDEX IDX_checkout_sessions_active
      ON checkout_sessions (user_id, created_at)
      WHERE status = 'in_progress';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger and function
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS checkout_sessions_updated_at_trigger ON checkout_sessions;`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_checkout_sessions_updated_at();`);

    // Drop table (this will also drop indexes and foreign keys)
    await queryRunner.dropTable('checkout_sessions');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS payment_method_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS checkout_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS checkout_step;`);
  }
}
