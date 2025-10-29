import { DataSource } from 'typeorm';
import { Seeder } from './Seeder';
import { TeamSeeder } from './TeamSeeder';

/**
 * Main database seeder that orchestrates all seeders
 */
export class DatabaseSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    console.log('Running database seeders...\n');

    // Run team seeder (includes users)
    const teamSeeder = new TeamSeeder();
    await teamSeeder.run(dataSource);

    console.log('\n✓ All seeders completed successfully');
  }
}
