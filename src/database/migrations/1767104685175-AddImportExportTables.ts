import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImportExportTables1767104685175 implements MigrationInterface {
  name = 'AddImportExportTables1767104685175';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."import_sessions_file_format_enum" AS ENUM('csv', 'xlsx', 'xls', 'yml', 'xml', 'json')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."import_sessions_status_enum" AS ENUM('pending', 'parsing', 'parsed', 'analyzing', 'analyzed', 'reconciling', 'executing', 'completed', 'failed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "import_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "merchant_id" uuid NOT NULL, "user_id" uuid NOT NULL, "original_filename" character varying(500) NOT NULL, "file_format" "public"."import_sessions_file_format_enum" NOT NULL, "status" "public"."import_sessions_status_enum" NOT NULL DEFAULT 'pending', "total_rows" integer NOT NULL DEFAULT '0', "processed_rows" integer NOT NULL DEFAULT '0', "success_count" integer NOT NULL DEFAULT '0', "error_count" integer NOT NULL DEFAULT '0', "skip_count" integer NOT NULL DEFAULT '0', "new_count" integer NOT NULL DEFAULT '0', "update_count" integer NOT NULL DEFAULT '0', "analysis_result" jsonb, "column_mapping" jsonb, "error_message" text, "completed_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d1e679263b8401aa5ff3fb583fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_43d06c381c846c85985416afd9" ON "import_sessions" ("merchant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bdaef2df263ed0d5925c1684b5" ON "import_sessions" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5827c3e62dfec57fe280e5c9bb" ON "import_sessions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_049a2530eb1273d70a4a6fc062" ON "import_sessions" ("merchant_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."import_items_status_enum" AS ENUM('pending', 'matched', 'new', 'conflict', 'approved', 'rejected', 'imported', 'error')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."import_items_action_enum" AS ENUM('insert', 'update', 'skip')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."import_items_matched_by_enum" AS ENUM('sku', 'title', 'barcode', 'manual', 'ai')`,
    );
    await queryRunner.query(
      `CREATE TABLE "import_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "row_number" integer NOT NULL, "status" "public"."import_items_status_enum" NOT NULL DEFAULT 'pending', "action" "public"."import_items_action_enum" NOT NULL DEFAULT 'insert', "raw_data" jsonb NOT NULL, "mapped_data" jsonb, "matched_product_id" uuid, "matched_variant_id" uuid, "matched_by" "public"."import_items_matched_by_enum", "match_confidence" numeric(5,2), "changes" jsonb, "validation_errors" jsonb, "error_message" text, "created_product_id" uuid, "created_variant_id" uuid, "metadata" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3629174ac7c5736658b7404098c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2a725e66748ff58b62147c6c1d" ON "import_items" ("matched_variant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41d7fc572a4d1430a7138a99d7" ON "import_items" ("matched_product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b0464ec239ab83d172bf3546b" ON "import_items" ("session_id", "row_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_98453d41a10713256c200b9525" ON "import_items" ("session_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb6375194c724d2c821362c18a" ON "import_items" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0695e5e54d8b94f8c716ccfa2b" ON "import_items" ("session_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "import_sessions" ADD CONSTRAINT "FK_049a2530eb1273d70a4a6fc062d" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_sessions" ADD CONSTRAINT "FK_5827c3e62dfec57fe280e5c9bb4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_items" ADD CONSTRAINT "FK_0695e5e54d8b94f8c716ccfa2b2" FOREIGN KEY ("session_id") REFERENCES "import_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_items" ADD CONSTRAINT "FK_41d7fc572a4d1430a7138a99d7e" FOREIGN KEY ("matched_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_items" ADD CONSTRAINT "FK_2a725e66748ff58b62147c6c1d9" FOREIGN KEY ("matched_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_items" ADD CONSTRAINT "FK_a22adb4fb669346f7253f783cd9" FOREIGN KEY ("created_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_items" ADD CONSTRAINT "FK_8dfd99aca914efaac3d64b60955" FOREIGN KEY ("created_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "import_items" DROP CONSTRAINT "FK_8dfd99aca914efaac3d64b60955"`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_items" DROP CONSTRAINT "FK_a22adb4fb669346f7253f783cd9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_items" DROP CONSTRAINT "FK_2a725e66748ff58b62147c6c1d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_items" DROP CONSTRAINT "FK_41d7fc572a4d1430a7138a99d7e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_items" DROP CONSTRAINT "FK_0695e5e54d8b94f8c716ccfa2b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_sessions" DROP CONSTRAINT "FK_5827c3e62dfec57fe280e5c9bb4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_sessions" DROP CONSTRAINT "FK_049a2530eb1273d70a4a6fc062d"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_0695e5e54d8b94f8c716ccfa2b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cb6375194c724d2c821362c18a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_98453d41a10713256c200b9525"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8b0464ec239ab83d172bf3546b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_41d7fc572a4d1430a7138a99d7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2a725e66748ff58b62147c6c1d"`);
    await queryRunner.query(`DROP TABLE "import_items"`);
    await queryRunner.query(`DROP TYPE "public"."import_items_matched_by_enum"`);
    await queryRunner.query(`DROP TYPE "public"."import_items_action_enum"`);
    await queryRunner.query(`DROP TYPE "public"."import_items_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_049a2530eb1273d70a4a6fc062"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5827c3e62dfec57fe280e5c9bb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bdaef2df263ed0d5925c1684b5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_43d06c381c846c85985416afd9"`);
    await queryRunner.query(`DROP TABLE "import_sessions"`);
    await queryRunner.query(`DROP TYPE "public"."import_sessions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."import_sessions_file_format_enum"`);
  }
}
