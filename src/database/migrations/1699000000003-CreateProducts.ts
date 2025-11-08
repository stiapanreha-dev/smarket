import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateProducts1699000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create products table
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'merchant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['PHYSICAL', 'SERVICE', 'COURSE'],
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'active', 'inactive', 'out_of_stock', 'archived'],
            default: "'draft'",
            isNullable: false,
          },
          {
            name: 'attrs',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'image_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'images',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'view_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'sales_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'review_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'seo',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'published_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for products
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_merchant_id',
        columnNames: ['merchant_id'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_type',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_status',
        columnNames: ['status'],
      }),
    );

    // Composite indexes for common queries
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_merchant_status',
        columnNames: ['merchant_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_type_status',
        columnNames: ['type', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_slug',
        columnNames: ['slug'],
        isUnique: true,
        where: 'slug IS NOT NULL',
      }),
    );

    // GIN index on attrs for JSONB queries
    await queryRunner.query(
      `CREATE INDEX "IDX_products_attrs_gin" ON "products" USING GIN ("attrs");`,
    );

    // Foreign key
    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        name: 'FK_products_merchant_id',
        columnNames: ['merchant_id'],
        referencedTableName: 'merchants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create product_variants table
    await queryRunner.createTable(
      new Table({
        name: 'product_variants',
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
            name: 'sku',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'price_minor',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'USD'",
          },
          {
            name: 'compare_at_price_minor',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'inventory_quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'inventory_policy',
            type: 'enum',
            enum: ['deny', 'continue', 'track'],
            default: "'deny'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'out_of_stock'],
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'attrs',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'image_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'position',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'weight',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'requires_shipping',
            type: 'boolean',
            default: true,
          },
          {
            name: 'taxable',
            type: 'boolean',
            default: true,
          },
          {
            name: 'barcode',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for product_variants
    await queryRunner.createIndex(
      'product_variants',
      new TableIndex({
        name: 'IDX_product_variants_product_id',
        columnNames: ['product_id'],
      }),
    );

    await queryRunner.createIndex(
      'product_variants',
      new TableIndex({
        name: 'IDX_product_variants_sku',
        columnNames: ['sku'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'product_variants',
      new TableIndex({
        name: 'IDX_product_variants_product_status',
        columnNames: ['product_id', 'status'],
      }),
    );

    // GIN index on attrs for JSONB queries
    await queryRunner.query(
      `CREATE INDEX "IDX_product_variants_attrs_gin" ON "product_variants" USING GIN ("attrs");`,
    );

    // Foreign key
    await queryRunner.createForeignKey(
      'product_variants',
      new TableForeignKey({
        name: 'FK_product_variants_product_id',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create product_translations table
    await queryRunner.createTable(
      new Table({
        name: 'product_translations',
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
            name: 'locale',
            type: 'enum',
            enum: ['en', 'ru', 'ar'],
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'attrs',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'search_vector',
            type: 'tsvector',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for product_translations
    await queryRunner.createIndex(
      'product_translations',
      new TableIndex({
        name: 'IDX_product_translations_product_locale',
        columnNames: ['product_id', 'locale'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'product_translations',
      new TableIndex({
        name: 'IDX_product_translations_locale',
        columnNames: ['locale'],
      }),
    );

    // GIN index for full-text search with trigram support
    await queryRunner.query(
      `CREATE INDEX "IDX_product_translations_search_gin" ON "product_translations" USING GIN ("search_vector");`,
    );

    // GIN index for trigram search on title
    await queryRunner.query(
      `CREATE INDEX "IDX_product_translations_title_trgm" ON "product_translations" USING GIN ("title" gin_trgm_ops);`,
    );

    // GIN index for trigram search on description
    await queryRunner.query(
      `CREATE INDEX "IDX_product_translations_description_trgm" ON "product_translations" USING GIN ("description" gin_trgm_ops);`,
    );

    // Foreign key
    await queryRunner.createForeignKey(
      'product_translations',
      new TableForeignKey({
        name: 'FK_product_translations_product_id',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create trigger to automatically update search_vector
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_product_translation_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_product_translation_search_vector
      BEFORE INSERT OR UPDATE ON product_translations
      FOR EACH ROW
      EXECUTE FUNCTION update_product_translation_search_vector();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger and function
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_update_product_translation_search_vector ON product_translations;`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_product_translation_search_vector();`);

    // Drop foreign keys
    await queryRunner.dropForeignKey('product_translations', 'FK_product_translations_product_id');
    await queryRunner.dropForeignKey('product_variants', 'FK_product_variants_product_id');
    await queryRunner.dropForeignKey('products', 'FK_products_merchant_id');

    // Drop tables
    await queryRunner.dropTable('product_translations', true);
    await queryRunner.dropTable('product_variants', true);
    await queryRunner.dropTable('products', true);
  }
}
