const { Pool } = require('pg');

// Get the connection info from environment variables
const host = process.env.PGHOST;
const port = process.env.PGPORT;
const user = process.env.PGUSER;
const password = process.env.PGPASSWORD;
const database = process.env.PGDATABASE;

// Log the connection info
console.log('Connection info:');
console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`User: ${user}`);
console.log(`Password: ${password ? '******' : 'Not set'}`);
console.log(`Database: ${database}`);

// Create a connection string
const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;

async function testConnection() {
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Testing connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('Connection successful!');
    console.log('Current time:', result.rows[0].now);
    
    // Create a test table
    console.log('Creating test table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Test table created.');
    
    // Insert a test user
    console.log('Inserting test user...');
    await pool.query(`
      INSERT INTO test_users (name) VALUES ('Test User')
    `);
    
    // Query the test user
    const users = await pool.query('SELECT * FROM test_users');
    console.log('Test users:', users.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Connection error:', error);
  }
}

testConnection();