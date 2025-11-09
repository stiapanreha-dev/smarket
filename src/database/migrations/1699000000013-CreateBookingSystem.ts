import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookingSystem1699000000013 implements MigrationInterface {
  name = 'CreateBookingSystem1699000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create services table
    await queryRunner.query(`
      CREATE TABLE services (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        provider_id UUID REFERENCES users(id) ON DELETE SET NULL,

        -- Service details
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),

        -- Duration
        duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
        buffer_minutes INTEGER DEFAULT 0 CHECK (buffer_minutes >= 0),

        -- Pricing (in minor units)
        price_minor INTEGER NOT NULL CHECK (price_minor >= 0),
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',

        -- Status
        status VARCHAR(20) DEFAULT 'active',

        -- Metadata
        metadata JSONB DEFAULT '{}',

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        CONSTRAINT chk_service_status CHECK (status IN ('active', 'inactive', 'archived'))
      )
    `);

    // Create schedules table
    await queryRunner.query(`
      CREATE TABLE schedules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        provider_id UUID REFERENCES users(id) ON DELETE SET NULL,

        -- Timezone
        timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',

        -- Weekly schedule (JSONB)
        weekly_slots JSONB NOT NULL DEFAULT '{"monday":[],"tuesday":[],"wednesday":[],"thursday":[],"friday":[],"saturday":[],"sunday":[]}',
        /* Example structure:
        {
          "monday": [{"start": "09:00", "end": "18:00"}],
          "tuesday": [{"start": "09:00", "end": "12:00"}, {"start": "14:00", "end": "18:00"}],
          "wednesday": [],
          ...
        }
        */

        -- Exceptions (holidays, special days)
        exceptions JSONB DEFAULT '[]',
        /* Example structure:
        [
          {"date": "2024-12-31", "type": "holiday"},
          {"date": "2024-07-15", "slots": [{"start": "10:00", "end": "14:00"}]}
        ]
        */

        -- Metadata
        metadata JSONB DEFAULT '{}',

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        -- One schedule per service-provider combination
        CONSTRAINT uq_schedule_service_provider UNIQUE (service_id, provider_id)
      )
    `);

    // Create bookings table
    await queryRunner.query(`
      CREATE TABLE bookings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
        order_line_item_id UUID REFERENCES order_line_items(id) ON DELETE SET NULL,
        customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider_id UUID REFERENCES users(id) ON DELETE SET NULL,

        -- Time slot
        start_at TIMESTAMP WITH TIME ZONE NOT NULL,
        end_at TIMESTAMP WITH TIME ZONE NOT NULL,
        timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',

        -- Status
        status VARCHAR(50) NOT NULL DEFAULT 'pending',

        -- Cancellation
        cancellation_reason TEXT,
        cancelled_at TIMESTAMP WITH TIME ZONE,
        cancelled_by UUID REFERENCES users(id),

        -- Completion tracking
        completed_at TIMESTAMP WITH TIME ZONE,
        no_show_at TIMESTAMP WITH TIME ZONE,

        -- Reminders
        reminder_sent_at TIMESTAMP WITH TIME ZONE,

        -- Metadata
        metadata JSONB DEFAULT '{}',
        customer_notes TEXT,
        provider_notes TEXT,

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        -- Business rules
        CONSTRAINT chk_booking_time_valid CHECK (end_at > start_at),
        CONSTRAINT chk_booking_status CHECK (
          status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')
        ),

        -- Prevent double booking (same service + provider + time slot)
        CONSTRAINT uq_booking_slot UNIQUE (service_id, provider_id, start_at)
      )
    `);

    // Create indexes for services
    await queryRunner.query(`
      CREATE INDEX idx_services_merchant_id ON services(merchant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_services_provider_id ON services(provider_id)
      WHERE provider_id IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX idx_services_status ON services(status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_services_category ON services(category)
      WHERE category IS NOT NULL
    `);

    // Create indexes for schedules
    await queryRunner.query(`
      CREATE INDEX idx_schedules_service_id ON schedules(service_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_schedules_provider_id ON schedules(provider_id)
      WHERE provider_id IS NOT NULL
    `);

    // Create indexes for bookings
    await queryRunner.query(`
      CREATE INDEX idx_bookings_service_id ON bookings(service_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_bookings_customer_id ON bookings(customer_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_bookings_provider_id ON bookings(provider_id)
      WHERE provider_id IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX idx_bookings_time_range ON bookings(start_at, end_at)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_bookings_status ON bookings(status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_bookings_order_line_item ON bookings(order_line_item_id)
      WHERE order_line_item_id IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX idx_bookings_reminders ON bookings(start_at, reminder_sent_at)
      WHERE status IN ('confirmed', 'pending') AND reminder_sent_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX idx_bookings_provider_schedule ON bookings(provider_id, start_at)
      WHERE provider_id IS NOT NULL AND status NOT IN ('cancelled', 'no_show')
    `);

    // Grant permissions
    await queryRunner.query(`
      GRANT SELECT, INSERT, UPDATE ON services TO authenticated;
    `);
    await queryRunner.query(`
      GRANT SELECT, INSERT, UPDATE ON schedules TO authenticated;
    `);
    await queryRunner.query(`
      GRANT SELECT, INSERT, UPDATE ON bookings TO authenticated;
    `);

    // Create trigger functions for updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_booking_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create triggers
    await queryRunner.query(`
      CREATE TRIGGER trg_services_updated_at
      BEFORE UPDATE ON services
      FOR EACH ROW
      EXECUTE FUNCTION update_booking_updated_at();
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_schedules_updated_at
      BEFORE UPDATE ON schedules
      FOR EACH ROW
      EXECUTE FUNCTION update_booking_updated_at();
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_bookings_updated_at
      BEFORE UPDATE ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION update_booking_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_schedules_updated_at ON schedules`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_services_updated_at ON services`);

    // Drop function
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_booking_updated_at()`);

    // Drop tables (cascade will handle dependencies)
    await queryRunner.query(`DROP TABLE IF EXISTS bookings CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS schedules CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS services CASCADE`);
  }
}
