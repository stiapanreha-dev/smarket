import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateWishlistTables1699000000018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create wishlists table
    await queryRunner.createTable(
      new Table({
        name: 'wishlists',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
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

    // Create unique index on user_id (one wishlist per user)
    await queryRunner.createIndex(
      'wishlists',
      new TableIndex({
        name: 'IDX_wishlists_user_id',
        columnNames: ['user_id'],
        isUnique: true,
      }),
    );

    // Create foreign key for user_id
    await queryRunner.createForeignKey(
      'wishlists',
      new TableForeignKey({
        name: 'FK_wishlists_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Create wishlist_items table
    await queryRunner.createTable(
      new Table({
        name: 'wishlist_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'wishlist_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
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

    // Create unique index on wishlist_id and product_id (no duplicate products per wishlist)
    await queryRunner.createIndex(
      'wishlist_items',
      new TableIndex({
        name: 'IDX_wishlist_items_wishlist_id_product_id',
        columnNames: ['wishlist_id', 'product_id'],
        isUnique: true,
      }),
    );

    // Create index on wishlist_id
    await queryRunner.createIndex(
      'wishlist_items',
      new TableIndex({
        name: 'IDX_wishlist_items_wishlist_id',
        columnNames: ['wishlist_id'],
      }),
    );

    // Create index on product_id
    await queryRunner.createIndex(
      'wishlist_items',
      new TableIndex({
        name: 'IDX_wishlist_items_product_id',
        columnNames: ['product_id'],
      }),
    );

    // Create foreign key for wishlist_id
    await queryRunner.createForeignKey(
      'wishlist_items',
      new TableForeignKey({
        name: 'FK_wishlist_items_wishlist_id',
        columnNames: ['wishlist_id'],
        referencedTableName: 'wishlists',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Create foreign key for product_id
    await queryRunner.createForeignKey(
      'wishlist_items',
      new TableForeignKey({
        name: 'FK_wishlist_items_product_id',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop wishlist_items table
    await queryRunner.dropForeignKey('wishlist_items', 'FK_wishlist_items_product_id');
    await queryRunner.dropForeignKey('wishlist_items', 'FK_wishlist_items_wishlist_id');
    await queryRunner.dropIndex('wishlist_items', 'IDX_wishlist_items_product_id');
    await queryRunner.dropIndex('wishlist_items', 'IDX_wishlist_items_wishlist_id');
    await queryRunner.dropIndex('wishlist_items', 'IDX_wishlist_items_wishlist_id_product_id');
    await queryRunner.dropTable('wishlist_items');

    // Drop wishlists table
    await queryRunner.dropForeignKey('wishlists', 'FK_wishlists_user_id');
    await queryRunner.dropIndex('wishlists', 'IDX_wishlists_user_id');
    await queryRunner.dropTable('wishlists');
  }
}
