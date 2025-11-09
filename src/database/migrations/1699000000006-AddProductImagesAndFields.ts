import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddProductImagesAndFields1699000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to products table
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS base_price_minor BIGINT,
      ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
    `);

    // Update product status enum to include 'deleted'
    await queryRunner.query(`
      ALTER TYPE "products_status_enum"
      ADD VALUE IF NOT EXISTS 'deleted';
    `);

    // Create product_images table
    await queryRunner.createTable(
      new Table({
        name: 'product_images',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'variant_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'thumbnail_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'medium_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'large_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'alt_text',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'position',
            type: 'int',
            default: 0,
          },
          {
            name: 'width',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'height',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for product_images
    await queryRunner.createIndex(
      'product_images',
      new TableIndex({
        name: 'IDX_product_images_product_id',
        columnNames: ['product_id'],
      }),
    );

    await queryRunner.createIndex(
      'product_images',
      new TableIndex({
        name: 'IDX_product_images_product_position',
        columnNames: ['product_id', 'position'],
      }),
    );

    // Foreign keys
    await queryRunner.createForeignKey(
      'product_images',
      new TableForeignKey({
        name: 'FK_product_images_product_id',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'product_images',
      new TableForeignKey({
        name: 'FK_product_images_variant_id',
        columnNames: ['variant_id'],
        referencedTableName: 'product_variants',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('product_images', 'FK_product_images_variant_id');
    await queryRunner.dropForeignKey('product_images', 'FK_product_images_product_id');

    // Drop table
    await queryRunner.dropTable('product_images', true);

    // Remove columns from products
    await queryRunner.query(`
      ALTER TABLE products
      DROP COLUMN IF EXISTS base_price_minor,
      DROP COLUMN IF EXISTS currency;
    `);

    // Note: Cannot remove enum value in PostgreSQL without recreating the type
    // This would require more complex migration to handle existing data
  }
}
