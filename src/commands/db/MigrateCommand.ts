import { initializeDatabase, AppDataSource } from '../../database/data-source';

/**
 * MigrateCommand handles database migrations
 */
export class MigrateCommand {
  async execute(): Promise<void> {
    console.log('Running database migrations...\n');

    try {
      await initializeDatabase();

      // Run pending migrations
      const pendingMigrations = await AppDataSource.showMigrations();

      if (pendingMigrations) {
        console.log('Pending migrations found, running them...');
        await AppDataSource.runMigrations({ transaction: 'all' });
        console.log('\n✓ All migrations executed successfully');
      } else {
        console.log('✓ Database is up to date (no pending migrations)');
      }

      await AppDataSource.destroy();
    } catch (error) {
      console.error('✗ Migration failed:', error);
      throw error;
    }
  }
}
