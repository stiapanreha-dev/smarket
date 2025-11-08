import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExtensions1699000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID generation extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Enable trigram similarity search extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`);

    // Enable btree_gin for GIN indexes on multiple data types
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gin";`);

    // Enable unaccent for accent-insensitive text search (useful for internationalization)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "unaccent";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS "unaccent";`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "btree_gin";`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "pg_trgm";`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp";`);
  }
}
