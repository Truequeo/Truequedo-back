const { Pool } = require('pg');

/*const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'Truequeo',
  user: 'postgres',
  password: 'truequeo',
});*/

const pool = new Pool({
  host: 'db.jjynhasmnfkmhtvumcpi.supabase.co',
  port: 5432,
  database: 'Truequeo',
  user: 'postgres',
  password: 'truequeo123',
});
module.exports = { pool };
 