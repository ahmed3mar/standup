import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, Team, Standup } from '../models';
import * as dotenv from 'dotenv';

dotenv.config();

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

// Base configuration
const baseConfig = {
  entities: [User, Team, Standup],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: process.env.NODE_ENV !== 'production', // Use sync for development, migrations for production
  logging: process.env.DB_LOGGING === 'true',
};

// SQLite configuration (using better-sqlite3)
const sqliteConfig = {
  type: 'better-sqlite3' as const,
  database: process.env.DATABASE_PATH || './db.sqlite',
  ...baseConfig,
};

// PostgreSQL configuration
const postgresConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'standup',
  ...baseConfig,
};

// Select configuration based on DB_TYPE
const config = DB_TYPE === 'postgres' ? postgresConfig : sqliteConfig;

export const AppDataSource = new DataSource(config);

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<DataSource> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✓ Database connection established');
    }
    return AppDataSource;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('✓ Database connection closed');
  }
}
