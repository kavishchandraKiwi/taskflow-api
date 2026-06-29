import {pool} from './database';

async function testConnection() {
  const res = await pool.query('SELECT NOW()');
  console.log(res.rows);
}

testConnection();   