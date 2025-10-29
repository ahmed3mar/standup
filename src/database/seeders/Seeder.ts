import { DataSource } from 'typeorm';

/**
 * Base interface for all seeders
 */
export interface Seeder {
  run(dataSource: DataSource): Promise<void>;
}
