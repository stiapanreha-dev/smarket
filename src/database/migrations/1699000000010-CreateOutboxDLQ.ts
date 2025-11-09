import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOutboxDLQ1699000000010 implements MigrationInterface {
  name = 'CreateOutboxDLQ1699000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Dead Letter Queue table for failed events
    await queryRunner.query(`
      CREATE TABLE order_outbox_dlq (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        original_event_id UUID NOT NULL,
        aggregate_id UUID NOT NULL,
        aggregate_type VARCHAR(50) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        error_message TEXT NOT NULL,
        retry_count INTEGER NOT NULL,
        first_failed_at TIMESTAMP WITH TIME ZONE NOT NULL,
        moved_to_dlq_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        -- For potential reprocessing
        reprocessed BOOLEAN DEFAULT FALSE,
        reprocessed_at TIMESTAMP WITH TIME ZONE,

        -- Metadata for debugging
        metadata JSONB DEFAULT '{}',

        -- Reference to original outbox entry
        idempotency_key VARCHAR(255)
      )
    `);

    // Create indexes for DLQ
    await queryRunner.query(`
      CREATE INDEX idx_outbox_dlq_event_type ON order_outbox_dlq(event_type)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_outbox_dlq_aggregate ON order_outbox_dlq(aggregate_type, aggregate_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_outbox_dlq_moved_at ON order_outbox_dlq(moved_to_dlq_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_outbox_dlq_reprocessed ON order_outbox_dlq(reprocessed) WHERE reprocessed = FALSE
    `);

    // Add next_retry_at column to outbox for exponential backoff
    await queryRunner.query(`
      ALTER TABLE order_outbox
      ADD COLUMN next_retry_at TIMESTAMP WITH TIME ZONE
    `);

    // Create index for next_retry_at
    await queryRunner.query(`
      CREATE INDEX idx_outbox_next_retry ON order_outbox(next_retry_at)
      WHERE status IN ('pending', 'failed') AND next_retry_at IS NOT NULL
    `);

    // Grant permissions
    await queryRunner.query(`
      GRANT SELECT, INSERT, UPDATE ON order_outbox_dlq TO authenticated;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index on outbox
    await queryRunner.query(`DROP INDEX IF EXISTS idx_outbox_next_retry`);

    // Remove column from outbox
    await queryRunner.query(`
      ALTER TABLE order_outbox
      DROP COLUMN IF EXISTS next_retry_at
    `);

    // Drop DLQ table
    await queryRunner.query(`DROP TABLE IF EXISTS order_outbox_dlq CASCADE`);
  }
}
