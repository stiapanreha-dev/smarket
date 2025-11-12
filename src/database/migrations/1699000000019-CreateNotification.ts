import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotification1699000000019 implements MigrationInterface {
  name = 'CreateNotification1699000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'ORDER_UPDATE',
        'PAYMENT_SUCCESS',
        'SHIPPING_UPDATE',
        'BOOKING_REMINDER',
        'PROMO'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "type" "notification_type_enum" NOT NULL,
        "title" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "metadata" jsonb,
        "related_url" character varying(500),
        "is_read" boolean NOT NULL DEFAULT false,
        "read_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_id_is_read" ON "notifications" ("user_id", "is_read")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_id_created_at" ON "notifications" ("user_id", "created_at")
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_user_id"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user_id"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_notifications_user_id_created_at"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_notifications_user_id_is_read"
    `);

    await queryRunner.query(`DROP TABLE "notifications"`);

    await queryRunner.query(`DROP TYPE "notification_type_enum"`);
  }
}
