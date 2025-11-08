/* eslint-disable no-console */
import 'reflect-metadata';
import dataSource from '../data-source';
import seed from './main.seed';

async function run() {
  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();
    console.log('Database connection established');

    console.log('Running seed...');
    await seed(dataSource);

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void run();
