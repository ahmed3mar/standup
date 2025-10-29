/**
 * Database configuration helper
 */

export interface DatabaseConfig {
  type: 'sqlite' | 'postgres';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  databasePath?: string;
  logging?: boolean;
}

export function getDatabaseConfig(): DatabaseConfig {
  const dbType = (process.env.DB_TYPE || 'sqlite') as 'sqlite' | 'postgres';

  if (dbType === 'postgres') {
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'standup',
      logging: process.env.DB_LOGGING === 'true',
    };
  }

  return {
    type: 'sqlite',
    databasePath: process.env.DATABASE_PATH || './db.sqlite',
    logging: process.env.DB_LOGGING === 'true',
  };
}

export function validateDatabaseConfig(): void {
  const config = getDatabaseConfig();

  if (config.type === 'postgres') {
    if (!config.username || !config.database) {
      throw new Error('PostgreSQL requires DB_USERNAME and DB_DATABASE');
    }
  }
}
