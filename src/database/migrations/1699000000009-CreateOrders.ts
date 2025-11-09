import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrders1699000000009 implements MigrationInterface {
  name = 'CreateOrders1699000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create orders table
    await queryRunner.query(`
      CREATE TABLE orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        user_id UUID REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        currency VARCHAR(3) NOT NULL,
        subtotal INTEGER NOT NULL,
        tax_amount INTEGER NOT NULL,
        shipping_amount INTEGER NOT NULL,
        discount_amount INTEGER DEFAULT 0 NOT NULL,
        total_amount INTEGER NOT NULL,

        -- Guest checkout
        guest_email VARCHAR(255),
        guest_phone VARCHAR(20),

        -- Addresses (stored as JSONB)
        shipping_address JSONB,
        billing_address JSONB,

        -- Payment info
        payment_method VARCHAR(50),
        payment_status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        payment_intent_id VARCHAR(255),

        -- Metadata
        notes TEXT,
        metadata JSONB DEFAULT '{}',
        checkout_session_id UUID REFERENCES checkout_sessions(id),

        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,

        -- Constraints
        CONSTRAINT order_user_or_guest CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL)
      )
    `);

    // Create indexes for orders
    await queryRunner.query(`
      CREATE INDEX idx_orders_user ON orders(user_id) WHERE user_id IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX idx_orders_status ON orders(status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_orders_created ON orders(created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_orders_guest_email ON orders(guest_email) WHERE guest_email IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX idx_orders_checkout_session ON orders(checkout_session_id) WHERE checkout_session_id IS NOT NULL
    `);

    // Create order_line_items table
    await queryRunner.query(`
      CREATE TABLE order_line_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
        merchant_id UUID REFERENCES merchants(id) NOT NULL,
        product_id UUID REFERENCES products(id) NOT NULL,
        variant_id UUID REFERENCES product_variants(id),

        type VARCHAR(20) NOT NULL CHECK (type IN ('physical', 'digital', 'service')),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',

        -- Product snapshot (to preserve order data even if product changes/deleted)
        product_name VARCHAR(255) NOT NULL,
        product_sku VARCHAR(100),
        variant_attributes JSONB,

        -- Pricing (in minor units, e.g., cents)
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
        total_price INTEGER NOT NULL CHECK (total_price >= 0),
        currency VARCHAR(3) NOT NULL,

        -- Fulfillment
        fulfillment_status VARCHAR(50) DEFAULT 'pending',
        fulfillment_data JSONB DEFAULT '{}',

        -- FSM tracking
        status_history JSONB DEFAULT '[]',
        last_status_change TIMESTAMP WITH TIME ZONE,

        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes for order_line_items
    await queryRunner.query(`
      CREATE INDEX idx_line_items_order ON order_line_items(order_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_line_items_merchant ON order_line_items(merchant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_line_items_status ON order_line_items(status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_line_items_type ON order_line_items(type)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_line_items_fulfillment ON order_line_items(fulfillment_status)
    `);

    // Create order_status_transitions table (audit trail)
    await queryRunner.query(`
      CREATE TABLE order_status_transitions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        line_item_id UUID REFERENCES order_line_items(id) ON DELETE CASCADE,
        from_status VARCHAR(50),
        to_status VARCHAR(50) NOT NULL,
        reason TEXT,
        metadata JSONB DEFAULT '{}',
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        -- Either order_id or line_item_id must be set
        CONSTRAINT transition_target CHECK (order_id IS NOT NULL OR line_item_id IS NOT NULL)
      )
    `);

    // Create indexes for order_status_transitions
    await queryRunner.query(`
      CREATE INDEX idx_transitions_order ON order_status_transitions(order_id) WHERE order_id IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX idx_transitions_line_item ON order_status_transitions(line_item_id) WHERE line_item_id IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX idx_transitions_created ON order_status_transitions(created_at DESC)
    `);

    // Create order_outbox table (for event-driven architecture)
    await queryRunner.query(`
      CREATE TABLE order_outbox (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        aggregate_id UUID NOT NULL,
        aggregate_type VARCHAR(50) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
        retry_count INTEGER DEFAULT 0 NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE,

        -- For idempotency
        idempotency_key VARCHAR(255) UNIQUE
      )
    `);

    // Create indexes for order_outbox
    await queryRunner.query(`
      CREATE INDEX idx_outbox_status ON order_outbox(status, created_at) WHERE status IN ('pending', 'failed')
    `);
    await queryRunner.query(`
      CREATE INDEX idx_outbox_aggregate ON order_outbox(aggregate_type, aggregate_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_outbox_event_type ON order_outbox(event_type)
    `);

    // Add trigger for updated_at on orders
    await queryRunner.query(`
      CREATE TRIGGER update_orders_updated_at
      BEFORE UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `);

    // Add trigger for updated_at on order_line_items
    await queryRunner.query(`
      CREATE TRIGGER update_order_line_items_updated_at
      BEFORE UPDATE ON order_line_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `);

    // Add function to generate order numbers
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION generate_order_number()
      RETURNS TEXT AS $$
      DECLARE
        timestamp_part TEXT;
        random_part TEXT;
        order_num TEXT;
        attempts INT := 0;
      BEGIN
        LOOP
          timestamp_part := UPPER(TO_CHAR(EXTRACT(EPOCH FROM NOW())::BIGINT, 'FM999999999999999'));
          random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
          order_num := 'ORD-' || timestamp_part || '-' || random_part;

          -- Check if order number already exists
          IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = order_num) THEN
            RETURN order_num;
          END IF;

          attempts := attempts + 1;
          IF attempts > 10 THEN
            RAISE EXCEPTION 'Failed to generate unique order number after 10 attempts';
          END IF;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Grant permissions (if using RLS)
    await queryRunner.query(`
      GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
      GRANT SELECT, INSERT, UPDATE ON order_line_items TO authenticated;
      GRANT SELECT, INSERT ON order_status_transitions TO authenticated;
      GRANT SELECT, INSERT, UPDATE ON order_outbox TO authenticated;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop function
    await queryRunner.query(`DROP FUNCTION IF EXISTS generate_order_number()`);

    // Drop triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_order_line_items_updated_at ON order_line_items`,
    );
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_orders_updated_at ON orders`);

    // Drop tables in reverse order (respecting foreign keys)
    await queryRunner.query(`DROP TABLE IF EXISTS order_outbox CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_status_transitions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_line_items CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS orders CASCADE`);
  }
}
