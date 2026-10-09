import { Kysely, MysqlDialect, PostgresDialect } from 'kysely';
import { createPool } from 'mysql2';
import { Pool } from 'pg';
import type { DB } from './types';

const globalForDb = globalThis as unknown as { db?: Kysely<DB> };

function createDb(): Kysely<DB> {
  const provider = process.env.DB_PROVIDER ?? 'mysql';

  if (provider === 'mysql') {
    return new Kysely<DB>({
      dialect: new MysqlDialect({
        pool: createPool({
          uri: process.env.MYSQL_URL!,
          timezone: 'Z',
          connectionLimit: 5,
        }),
      }),
    });
  }

  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL!,
        max: 1, // serverless: satu koneksi per instance
        ssl: { rejectUnauthorized: false },
      }),
    }),
  });
}

export const db = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
