import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRLS1699000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable Row-Level Security on merchant-owned tables
    await queryRunner.query(`ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE products ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;`);

    // Create a function to get current user's merchant IDs
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_current_user_merchant_ids()
      RETURNS UUID[] AS $$
      BEGIN
        -- This function should be set with the current user's merchant IDs
        -- In your application, you'll set this via SET LOCAL before queries
        RETURN COALESCE(
          current_setting('app.current_merchant_ids', true)::UUID[],
          ARRAY[]::UUID[]
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Create a function to check if user is admin
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION is_current_user_admin()
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN COALESCE(
          current_setting('app.is_admin', true)::BOOLEAN,
          false
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Merchants table policies
    // Policy: Merchants can only see their own merchant records
    await queryRunner.query(`
      CREATE POLICY merchants_select_policy ON merchants
      FOR SELECT
      USING (
        is_current_user_admin() OR
        owner_id::TEXT = current_setting('app.current_user_id', true) OR
        id = ANY(get_current_user_merchant_ids())
      );
    `);

    await queryRunner.query(`
      CREATE POLICY merchants_insert_policy ON merchants
      FOR INSERT
      WITH CHECK (
        is_current_user_admin() OR
        owner_id::TEXT = current_setting('app.current_user_id', true)
      );
    `);

    await queryRunner.query(`
      CREATE POLICY merchants_update_policy ON merchants
      FOR UPDATE
      USING (
        is_current_user_admin() OR
        owner_id::TEXT = current_setting('app.current_user_id', true) OR
        id = ANY(get_current_user_merchant_ids())
      );
    `);

    await queryRunner.query(`
      CREATE POLICY merchants_delete_policy ON merchants
      FOR DELETE
      USING (
        is_current_user_admin() OR
        owner_id::TEXT = current_setting('app.current_user_id', true)
      );
    `);

    // Products table policies
    await queryRunner.query(`
      CREATE POLICY products_select_policy ON products
      FOR SELECT
      USING (
        is_current_user_admin() OR
        status = 'active' OR
        merchant_id = ANY(get_current_user_merchant_ids())
      );
    `);

    await queryRunner.query(`
      CREATE POLICY products_insert_policy ON products
      FOR INSERT
      WITH CHECK (
        is_current_user_admin() OR
        merchant_id = ANY(get_current_user_merchant_ids())
      );
    `);

    await queryRunner.query(`
      CREATE POLICY products_update_policy ON products
      FOR UPDATE
      USING (
        is_current_user_admin() OR
        merchant_id = ANY(get_current_user_merchant_ids())
      );
    `);

    await queryRunner.query(`
      CREATE POLICY products_delete_policy ON products
      FOR DELETE
      USING (
        is_current_user_admin() OR
        merchant_id = ANY(get_current_user_merchant_ids())
      );
    `);

    // Product variants policies
    await queryRunner.query(`
      CREATE POLICY product_variants_select_policy ON product_variants
      FOR SELECT
      USING (
        is_current_user_admin() OR
        status = 'active' OR
        product_id IN (
          SELECT id FROM products WHERE merchant_id = ANY(get_current_user_merchant_ids())
        )
      );
    `);

    await queryRunner.query(`
      CREATE POLICY product_variants_insert_policy ON product_variants
      FOR INSERT
      WITH CHECK (
        is_current_user_admin() OR
        product_id IN (
          SELECT id FROM products WHERE merchant_id = ANY(get_current_user_merchant_ids())
        )
      );
    `);

    await queryRunner.query(`
      CREATE POLICY product_variants_update_policy ON product_variants
      FOR UPDATE
      USING (
        is_current_user_admin() OR
        product_id IN (
          SELECT id FROM products WHERE merchant_id = ANY(get_current_user_merchant_ids())
        )
      );
    `);

    await queryRunner.query(`
      CREATE POLICY product_variants_delete_policy ON product_variants
      FOR DELETE
      USING (
        is_current_user_admin() OR
        product_id IN (
          SELECT id FROM products WHERE merchant_id = ANY(get_current_user_merchant_ids())
        )
      );
    `);

    // Product translations policies
    await queryRunner.query(`
      CREATE POLICY product_translations_select_policy ON product_translations
      FOR SELECT
      USING (
        is_current_user_admin() OR
        product_id IN (SELECT id FROM products WHERE status = 'active') OR
        product_id IN (
          SELECT id FROM products WHERE merchant_id = ANY(get_current_user_merchant_ids())
        )
      );
    `);

    await queryRunner.query(`
      CREATE POLICY product_translations_insert_policy ON product_translations
      FOR INSERT
      WITH CHECK (
        is_current_user_admin() OR
        product_id IN (
          SELECT id FROM products WHERE merchant_id = ANY(get_current_user_merchant_ids())
        )
      );
    `);

    await queryRunner.query(`
      CREATE POLICY product_translations_update_policy ON product_translations
      FOR UPDATE
      USING (
        is_current_user_admin() OR
        product_id IN (
          SELECT id FROM products WHERE merchant_id = ANY(get_current_user_merchant_ids())
        )
      );
    `);

    await queryRunner.query(`
      CREATE POLICY product_translations_delete_policy ON product_translations
      FOR DELETE
      USING (
        is_current_user_admin() OR
        product_id IN (
          SELECT id FROM products WHERE merchant_id = ANY(get_current_user_merchant_ids())
        )
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all policies
    await queryRunner.query(`DROP POLICY IF EXISTS merchants_select_policy ON merchants;`);
    await queryRunner.query(`DROP POLICY IF EXISTS merchants_insert_policy ON merchants;`);
    await queryRunner.query(`DROP POLICY IF EXISTS merchants_update_policy ON merchants;`);
    await queryRunner.query(`DROP POLICY IF EXISTS merchants_delete_policy ON merchants;`);

    await queryRunner.query(`DROP POLICY IF EXISTS products_select_policy ON products;`);
    await queryRunner.query(`DROP POLICY IF EXISTS products_insert_policy ON products;`);
    await queryRunner.query(`DROP POLICY IF EXISTS products_update_policy ON products;`);
    await queryRunner.query(`DROP POLICY IF EXISTS products_delete_policy ON products;`);

    await queryRunner.query(
      `DROP POLICY IF EXISTS product_variants_select_policy ON product_variants;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS product_variants_insert_policy ON product_variants;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS product_variants_update_policy ON product_variants;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS product_variants_delete_policy ON product_variants;`,
    );

    await queryRunner.query(
      `DROP POLICY IF EXISTS product_translations_select_policy ON product_translations;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS product_translations_insert_policy ON product_translations;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS product_translations_update_policy ON product_translations;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS product_translations_delete_policy ON product_translations;`,
    );

    // Drop functions
    await queryRunner.query(`DROP FUNCTION IF EXISTS get_current_user_merchant_ids();`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS is_current_user_admin();`);

    // Disable Row-Level Security
    await queryRunner.query(`ALTER TABLE product_translations DISABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE products DISABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE merchants DISABLE ROW LEVEL SECURITY;`);
  }
}
