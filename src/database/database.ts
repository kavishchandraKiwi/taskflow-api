import { Pool } from 'pg';

export const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT) || 5432,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
});
export default pool;