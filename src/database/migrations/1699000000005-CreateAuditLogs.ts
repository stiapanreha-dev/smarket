import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAuditLogs1699000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create audit_action enum
    await queryRunner.query(`
      CREATE TYPE audit_action AS ENUM (
        'profile_updated',
        'email_changed',
        'phone_changed',
        'password_changed',
        'password_reset_requested',
        'password_reset_completed',
        'email_verified',
        'phone_verified',
        'login',
        'logout',
        'failed_login',
        'token_refresh',
        'all_sessions_revoked',
        'account_created',
        'account_deleted',
        'role_changed'
      );
    `);

    // Create audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
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
            isNullable: true,
          },
          {
            name: 'action',
            type: 'audit_action',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'old_values',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'new_values',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'varchar',
            length: '500',
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
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_user_id_created_at',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_action_created_at',
        columnNames: ['action', 'created_at'],
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'audit_logs',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Enable RLS
    await queryRunner.query(`ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;`);

    // Create RLS policy - users can view their own audit logs
    await queryRunner.query(`
      CREATE POLICY audit_logs_select_policy ON audit_logs
        FOR SELECT
        USING (user_id = current_setting('app.current_user_id', true)::uuid);
    `);

    // Admins can view all audit logs
    await queryRunner.query(`
      CREATE POLICY audit_logs_admin_select_policy ON audit_logs
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM users
            WHERE users.id = current_setting('app.current_user_id', true)::uuid
            AND users.role = 'admin'
          )
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop RLS policies
    await queryRunner.query(`DROP POLICY IF EXISTS audit_logs_admin_select_policy ON audit_logs;`);
    await queryRunner.query(`DROP POLICY IF EXISTS audit_logs_select_policy ON audit_logs;`);

    // Drop table (this will also drop indexes and foreign keys)
    await queryRunner.dropTable('audit_logs');

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS audit_action;`);
  }
}
