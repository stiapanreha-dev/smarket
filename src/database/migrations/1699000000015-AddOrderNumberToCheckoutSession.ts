import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOrderNumberToCheckoutSession1699000000015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add order_number column to checkout_sessions table
    await queryRunner.addColumn(
      'checkout_sessions',
      new TableColumn({
        name: 'order_number',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'Human-readable order number (e.g., ORD-12345)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove order_number column
    await queryRunner.dropColumn('checkout_sessions', 'order_number');
  }
}
