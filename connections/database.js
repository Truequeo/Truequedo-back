const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'Truequeo',
  user: 'postgres',
  password: 'truequeo',
});

module.exports = { pool };
 