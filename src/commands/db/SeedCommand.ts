import { initializeDatabase, AppDataSource } from '../../database/data-source';
import { DatabaseSeeder } from '../../database/seeders';

/**
 * SeedCommand handles database seeding
 */
export class SeedCommand {
  async execute(): Promise<void> {
    try {
      await initializeDatabase();

      const seeder = new DatabaseSeeder();
      await seeder.run(AppDataSource);

      await AppDataSource.destroy();
    } catch (error) {
      console.error('✗ Seeding failed:', error);
      throw error;
    }
  }
}
