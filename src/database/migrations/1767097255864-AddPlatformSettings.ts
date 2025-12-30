import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlatformSettings1767097255864 implements MigrationInterface {
  name = 'AddPlatformSettings1767097255864';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "platform_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying(50) NOT NULL, "value" jsonb NOT NULL, "description" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5d9031e30fac3ec3ec8b9602e17" UNIQUE ("key"), CONSTRAINT "PK_2934aeb70ec285196dcab4a2e96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5d9031e30fac3ec3ec8b9602e1" ON "platform_settings" ("key") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_5d9031e30fac3ec3ec8b9602e1"`);
    await queryRunner.query(`DROP TABLE "platform_settings"`);
  }
}
