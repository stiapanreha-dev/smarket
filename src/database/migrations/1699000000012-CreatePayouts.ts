import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePayouts1699000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payouts table
    await queryRunner.createTable(
      new Table({
        name: 'payouts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'merchant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'amount_minor',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'method',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'account_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'batch_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'provider_payout_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'splits_included',
            type: 'uuid[]',
            isNullable: true,
            comment: 'Array of payment_split IDs included in this payout',
          },
          {
            name: 'processing_fee',
            type: 'integer',
            default: 0,
            comment: 'Fee charged by provider for processing payout',
          },
          {
            name: 'net_amount',
            type: 'integer',
            isNullable: true,
            comment: 'Amount after deducting processing fee',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'failure_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'processed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'arrived_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'When funds arrived at merchant account',
          },
          {
            name: 'cancelled_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'NOW()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    // Create indexes for payouts
    await queryRunner.createIndex(
      'payouts',
      new TableIndex({
        name: 'IDX_payouts_merchant_id',
        columnNames: ['merchant_id'],
      }),
    );

    await queryRunner.createIndex(
      'payouts',
      new TableIndex({
        name: 'IDX_payouts_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'payouts',
      new TableIndex({
        name: 'IDX_payouts_batch_id',
        columnNames: ['batch_id'],
      }),
    );

    await queryRunner.createIndex(
      'payouts',
      new TableIndex({
        name: 'IDX_payouts_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'payouts',
      new TableIndex({
        name: 'IDX_payouts_merchant_status',
        columnNames: ['merchant_id', 'status'],
      }),
    );

    // Add foreign key to merchants
    await queryRunner.createForeignKey(
      'payouts',
      new TableForeignKey({
        columnNames: ['merchant_id'],
        referencedTableName: 'merchants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create payout_batches table
    await queryRunner.createTable(
      new Table({
        name: 'payout_batches',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'batch_number',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'total_amount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'total_payouts',
            type: 'integer',
            default: 0,
          },
          {
            name: 'successful_payouts',
            type: 'integer',
            default: 0,
          },
          {
            name: 'failed_payouts',
            type: 'integer',
            default: 0,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            isNullable: false,
          },
          {
            name: 'scheduled_for',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'started_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'NOW()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    // Create indexes for payout_batches
    await queryRunner.createIndex(
      'payout_batches',
      new TableIndex({
        name: 'IDX_payout_batches_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'payout_batches',
      new TableIndex({
        name: 'IDX_payout_batches_scheduled_for',
        columnNames: ['scheduled_for'],
      }),
    );

    await queryRunner.createIndex(
      'payout_batches',
      new TableIndex({
        name: 'IDX_payout_batches_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Create reconciliation_reports table
    await queryRunner.createTable(
      new Table({
        name: 'reconciliation_reports',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'report_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'merchant_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Null for system-wide reports',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'daily, weekly, monthly, on-demand',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'total_splits',
            type: 'integer',
            default: 0,
          },
          {
            name: 'total_payouts',
            type: 'integer',
            default: 0,
          },
          {
            name: 'splits_amount',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'payouts_amount',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'discrepancy_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'discrepancy_amount',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'discrepancies',
            type: 'jsonb',
            default: "'[]'",
            comment: 'Array of discrepancy details',
          },
          {
            name: 'report_data',
            type: 'jsonb',
            default: "'{}'",
            comment: 'Detailed report data',
          },
          {
            name: 'generated_by',
            type: 'uuid',
            isNullable: true,
            comment: 'User ID who generated the report',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'NOW()',
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

    // Create indexes for reconciliation_reports
    await queryRunner.createIndex(
      'reconciliation_reports',
      new TableIndex({
        name: 'IDX_reconciliation_reports_date',
        columnNames: ['report_date'],
      }),
    );

    await queryRunner.createIndex(
      'reconciliation_reports',
      new TableIndex({
        name: 'IDX_reconciliation_reports_merchant_id',
        columnNames: ['merchant_id'],
      }),
    );

    await queryRunner.createIndex(
      'reconciliation_reports',
      new TableIndex({
        name: 'IDX_reconciliation_reports_type_status',
        columnNames: ['type', 'status'],
      }),
    );

    // Add foreign key to merchants for reconciliation_reports
    await queryRunner.createForeignKey(
      'reconciliation_reports',
      new TableForeignKey({
        columnNames: ['merchant_id'],
        referencedTableName: 'merchants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('reconciliation_reports', true);
    await queryRunner.dropTable('payout_batches', true);
    await queryRunner.dropTable('payouts', true);
  }
}
