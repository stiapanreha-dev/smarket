import { DataSource } from 'typeorm';
import { hash } from 'argon2';
import { testUsers } from '../fixtures/users.fixture';

/**
 * Seed minimal test data required for tests
 */
export async function seedTestData(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Seed test users
    for (const [key, userData] of Object.entries(testUsers)) {
      const hashedPassword = await hash(userData.password);

      const existingUser = await queryRunner.query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUser.length === 0) {
        await queryRunner.query(
          `INSERT INTO users (email, password_hash, locale, currency, email_verified, role)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userData.email,
            hashedPassword,
            userData.locale || 'en',
            userData.currency || 'USD',
            true,
            userData.role || 'buyer'
          ]
        );
      }
    }

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding test data:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
