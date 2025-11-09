import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class EnhanceSearchIndexes1699000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add composite index for type, status, merchant_id for faster filtering
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_type_status_merchant',
        columnNames: ['type', 'status', 'merchant_id'],
      }),
    );

    // Add index on sales_count for popularity sorting
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_sales_count',
        columnNames: ['sales_count'],
      }),
    );

    // Add index on created_at for newest sorting
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Add composite index on product_variants for price range queries
    await queryRunner.createIndex(
      'product_variants',
      new TableIndex({
        name: 'IDX_product_variants_price_status',
        columnNames: ['price_minor', 'status'],
      }),
    );

    // Add index on inventory_quantity for stock availability queries
    await queryRunner.createIndex(
      'product_variants',
      new TableIndex({
        name: 'IDX_product_variants_inventory',
        columnNames: ['inventory_quantity'],
      }),
    );

    // GIN index for trigram search on SKU
    await queryRunner.query(
      `CREATE INDEX "IDX_product_variants_sku_trgm" ON "product_variants" USING GIN ("sku" gin_trgm_ops);`,
    );

    // Add composite index for product_translations slug and locale lookups
    await queryRunner.createIndex(
      'product_translations',
      new TableIndex({
        name: 'IDX_product_translations_slug_locale',
        columnNames: ['slug', 'locale'],
      }),
    );

    // Add "deleted" status to products enum if not exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'deleted'
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'products_status_enum'
          )
        ) THEN
          ALTER TYPE products_status_enum ADD VALUE 'deleted';
        END IF;
      END$$;
    `);

    // Create materialized view for faceted search aggregations (for performance)
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW product_facets AS
      SELECT
        p.type,
        p.status,
        p.merchant_id,
        COUNT(*) as product_count,
        MIN(v.price_minor) as min_price,
        MAX(v.price_minor) as max_price,
        SUM(CASE WHEN v.inventory_quantity > 0 THEN 1 ELSE 0 END) as in_stock_count
      FROM products p
      LEFT JOIN product_variants v ON p.id = v.product_id
      WHERE p.status = 'active'
      GROUP BY p.type, p.status, p.merchant_id;
    `);

    // Create index on materialized view
    await queryRunner.query(`
      CREATE INDEX IDX_product_facets_type ON product_facets(type);
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_product_facets_merchant ON product_facets(merchant_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop materialized view
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS product_facets;`);

    // Drop indexes
    await queryRunner.dropIndex('product_translations', 'IDX_product_translations_slug_locale');
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_variants_sku_trgm";`);
    await queryRunner.dropIndex('product_variants', 'IDX_product_variants_inventory');
    await queryRunner.dropIndex('product_variants', 'IDX_product_variants_price_status');
    await queryRunner.dropIndex('products', 'IDX_products_created_at');
    await queryRunner.dropIndex('products', 'IDX_products_sales_count');
    await queryRunner.dropIndex('products', 'IDX_products_type_status_merchant');
  }
}
