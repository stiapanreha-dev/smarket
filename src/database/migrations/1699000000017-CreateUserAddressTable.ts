import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateUserAddressTable1699000000017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_addresses table
    await queryRunner.createTable(
      new Table({
        name: 'user_addresses',
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
            name: 'full_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'address_line1',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'address_line2',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'state',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'postal_code',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'country',
            type: 'char',
            length: '2',
            isNullable: false,
            comment: 'ISO 3166-1 alpha-2 country code',
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
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

    // Create indexes
    await queryRunner.createIndex(
      'user_addresses',
      new TableIndex({
        name: 'IDX_user_addresses_user_id_is_default',
        columnNames: ['user_id', 'is_default'],
      }),
    );

    await queryRunner.createIndex(
      'user_addresses',
      new TableIndex({
        name: 'IDX_user_addresses_user_id_created_at',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'user_addresses',
      new TableForeignKey({
        name: 'FK_user_addresses_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('user_addresses', 'FK_user_addresses_user_id');

    // Drop indexes
    await queryRunner.dropIndex('user_addresses', 'IDX_user_addresses_user_id_created_at');
    await queryRunner.dropIndex('user_addresses', 'IDX_user_addresses_user_id_is_default');

    // Drop table
    await queryRunner.dropTable('user_addresses');
  }
}
