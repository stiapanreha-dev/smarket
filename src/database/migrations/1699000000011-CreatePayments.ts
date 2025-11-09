import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayments1699000000011 implements MigrationInterface {
  name = 'CreatePayments1699000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payments table
    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

        -- Provider info
        provider VARCHAR(50) NOT NULL,
        provider_payment_id VARCHAR(255),

        -- Status
        status VARCHAR(50) NOT NULL DEFAULT 'pending',

        -- Amounts (in minor units, e.g., cents)
        amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
        currency VARCHAR(3) NOT NULL,

        -- Authorize vs Capture
        authorized_amount INTEGER CHECK (authorized_amount >= 0),
        captured_amount INTEGER DEFAULT 0 CHECK (captured_amount >= 0),
        refunded_amount INTEGER DEFAULT 0 CHECK (refunded_amount >= 0),

        -- Platform fee
        platform_fee INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),

        -- Idempotency
        idempotency_key VARCHAR(255) UNIQUE NOT NULL,

        -- Payment method info
        payment_method_type VARCHAR(50),
        payment_method_last4 VARCHAR(4),

        -- 3D Secure / Additional actions
        requires_action BOOLEAN DEFAULT FALSE,
        action_url TEXT,

        -- Metadata
        metadata JSONB DEFAULT '{}',
        error_message TEXT,

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        authorized_at TIMESTAMP WITH TIME ZONE,
        captured_at TIMESTAMP WITH TIME ZONE,
        failed_at TIMESTAMP WITH TIME ZONE,

        CONSTRAINT chk_payment_amounts CHECK (
          refunded_amount <= captured_amount AND
          captured_amount <= authorized_amount
        )
      )
    `);

    // Create payment_splits table
    await queryRunner.query(`
      CREATE TABLE payment_splits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
        merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

        -- Amounts (in minor units)
        gross_amount INTEGER NOT NULL CHECK (gross_amount >= 0),
        platform_fee INTEGER NOT NULL CHECK (platform_fee >= 0),
        processing_fee INTEGER NOT NULL DEFAULT 0 CHECK (processing_fee >= 0),
        net_amount INTEGER NOT NULL CHECK (net_amount >= 0),

        currency VARCHAR(3) NOT NULL,

        -- Status
        status VARCHAR(20) DEFAULT 'pending',

        -- Payout tracking
        payout_id UUID,
        escrow_release_date TIMESTAMP WITH TIME ZONE,
        escrow_released BOOLEAN DEFAULT FALSE,

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        CONSTRAINT chk_split_calculation CHECK (
          net_amount = gross_amount - platform_fee - processing_fee
        )
      )
    `);

    // Create refunds table
    await queryRunner.query(`
      CREATE TABLE refunds (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
        order_line_item_id UUID REFERENCES order_line_items(id),

        -- Provider info
        provider_refund_id VARCHAR(255),

        -- Amount
        amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
        currency VARCHAR(3) NOT NULL,

        -- Status
        status VARCHAR(50) NOT NULL DEFAULT 'pending',

        -- Reason
        reason TEXT,

        -- Metadata
        metadata JSONB DEFAULT '{}',
        error_message TEXT,

        -- Audit
        created_by UUID REFERENCES users(id),

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Create webhook_events table for tracking processed webhooks
    await queryRunner.query(`
      CREATE TABLE webhook_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider VARCHAR(50) NOT NULL,
        provider_event_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,

        -- Processing status
        processed BOOLEAN DEFAULT FALSE,
        processed_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        CONSTRAINT uq_provider_event UNIQUE (provider, provider_event_id)
      )
    `);

    // Create indexes for payments
    await queryRunner.query(`
      CREATE INDEX idx_payments_order_id ON payments(order_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_payments_provider_payment_id ON payments(provider, provider_payment_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_payments_status ON payments(status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_payments_created_at ON payments(created_at DESC)
    `);

    // Create indexes for payment_splits
    await queryRunner.query(`
      CREATE INDEX idx_payment_splits_payment_id ON payment_splits(payment_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_payment_splits_merchant_id ON payment_splits(merchant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_payment_splits_status ON payment_splits(status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_payment_splits_escrow ON payment_splits(escrow_released, escrow_release_date)
      WHERE status = 'captured' AND escrow_released = FALSE
    `);

    // Create indexes for refunds
    await queryRunner.query(`
      CREATE INDEX idx_refunds_payment_id ON refunds(payment_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_refunds_line_item_id ON refunds(order_line_item_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_refunds_status ON refunds(status)
    `);

    // Create indexes for webhook_events
    await queryRunner.query(`
      CREATE INDEX idx_webhook_events_provider ON webhook_events(provider, event_type)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_webhook_events_processed ON webhook_events(processed)
      WHERE processed = FALSE
    `);

    // Grant permissions
    await queryRunner.query(`
      GRANT SELECT, INSERT, UPDATE ON payments TO authenticated;
    `);
    await queryRunner.query(`
      GRANT SELECT, INSERT, UPDATE ON payment_splits TO authenticated;
    `);
    await queryRunner.query(`
      GRANT SELECT, INSERT, UPDATE ON refunds TO authenticated;
    `);
    await queryRunner.query(`
      GRANT SELECT, INSERT, UPDATE ON webhook_events TO authenticated;
    `);

    // Create function to update updated_at timestamp
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_payment_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create triggers
    await queryRunner.query(`
      CREATE TRIGGER trg_payments_updated_at
      BEFORE UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION update_payment_updated_at();
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_payment_splits_updated_at
      BEFORE UPDATE ON payment_splits
      FOR EACH ROW
      EXECUTE FUNCTION update_payment_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_payment_splits_updated_at ON payment_splits`,
    );
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments`);

    // Drop function
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_payment_updated_at()`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS webhook_events CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS refunds CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS payment_splits CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS payments CASCADE`);
  }
}
