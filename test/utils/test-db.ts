import { DataSource, DataSourceOptions } from 'typeorm';
import { dataSourceOptions } from '../../src/database/data-source';
import { seedTestData } from './seed-test-data';

/**
 * Create test database configuration
 */
export function getTestDataSourceOptions(): DataSourceOptions {
  const testDbName = process.env.TEST_DB_DATABASE || 'snailmarket_test';

  return {
    ...dataSourceOptions,
    database: testDbName,
    dropSchema: false,
    synchronize: false,
    logging: false,
    // Ensure we use test database
    migrations: dataSourceOptions.migrations,
    entities: dataSourceOptions.entities,
  } as DataSourceOptions;
}

/**
 * Start test database
 */
export async function startTestDb(): Promise<DataSource> {
  const testDataSource = new DataSource(getTestDataSourceOptions());

  try {
    await testDataSource.initialize();
    console.log('✅ Test database initialized');
    return testDataSource;
  } catch (error) {
    console.error('❌ Error initializing test database:', error);
    throw error;
  }
}

/**
 * Cleanup test database
 */
export async function cleanupTestDb(dataSource: DataSource): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
}

/**
 * Truncate all tables but keep schema
 */
export async function truncateTables(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;
  const tableNames = entities.map(entity => `"${entity.tableName}"`).join(', ');

  if (tableNames) {
    // Disable foreign key checks temporarily
    await dataSource.query('SET session_replication_role = replica;');

    // Truncate all tables
    await dataSource.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);

    // Re-enable foreign key checks
    await dataSource.query('SET session_replication_role = DEFAULT;');
  }
}

/**
 * Reset test database state and reseed fixture data
 */
export async function resetTestDatabase(dataSource: DataSource): Promise<void> {
  if (dataSource?.isInitialized) {
    await truncateTables(dataSource);
    await seedTestData(dataSource);
  }
}

/**
 * Clear specific table
 */
export async function clearTable(dataSource: DataSource, tableName: string): Promise<void> {
  await dataSource.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
}

/**
 * Get table count for debugging
 */
export async function getTableCount(dataSource: DataSource, tableName: string): Promise<number> {
  const result = await dataSource.query(`SELECT COUNT(*) as count FROM "${tableName}";`);
  return parseInt(result[0].count, 10);
}
