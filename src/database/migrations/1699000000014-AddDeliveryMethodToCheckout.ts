import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeliveryMethodToCheckout1699000000014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create delivery_method_type enum
    await queryRunner.query(`
      CREATE TYPE delivery_method_type AS ENUM (
        'standard',
        'express',
        'pickup'
      );
    `);

    // Update checkout_step enum to include delivery_method
    await queryRunner.query(`
      ALTER TYPE checkout_step ADD VALUE 'delivery_method' AFTER 'shipping_address';
    `);

    // Add delivery_method column to checkout_sessions table
    await queryRunner.addColumn(
      'checkout_sessions',
      new TableColumn({
        name: 'delivery_method',
        type: 'delivery_method_type',
        isNullable: true,
        comment: 'Selected delivery method for physical items',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove delivery_method column
    await queryRunner.dropColumn('checkout_sessions', 'delivery_method');

    // Drop delivery_method_type enum
    await queryRunner.query(`DROP TYPE IF EXISTS delivery_method_type;`);

    // Note: PostgreSQL doesn't support removing enum values directly
    // We would need to recreate the enum without 'delivery_method' value
    // For simplicity in a rollback, we'll leave the enum value
    // In production, you might want to recreate the entire enum
  }
}
