import { DataSource } from 'typeorm';
import { startTestDb, cleanupTestDb, truncateTables } from './utils/test-db';
import { seedTestData } from './utils/seed-test-data';

let testDataSource: DataSource;

/**
 * Global setup before all tests
 */
beforeAll(async () => {
  console.log('🚀 Starting test database...');

  // Start test database and get data source
  testDataSource = await startTestDb();

  // Run migrations
  console.log('🔄 Running migrations...');
  await testDataSource.runMigrations();

  // Seed initial test data
  console.log('🌱 Seeding test data...');
  await seedTestData(testDataSource);

  console.log('✅ Test database ready!');
}, 60000);

/**
 * Global cleanup after all tests
 */
afterAll(async () => {
  console.log('🧹 Cleaning up test database...');
  await cleanupTestDb(testDataSource);
  console.log('✅ Test database cleaned up!');
}, 30000);

/**
 * Clean tables before each test but keep schema
 */
beforeEach(async () => {
  if (testDataSource?.isInitialized) {
    await truncateTables(testDataSource);
    await seedTestData(testDataSource);
  }
}, 10000);

/**
 * Export data source for use in tests
 */
export const getTestDataSource = (): DataSource => testDataSource;
