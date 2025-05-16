import { db, pool } from './db';

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
    
    // Test a query to the users table
    const usersResult = await db.query.users.findMany();
    console.log('Found users:', usersResult);
    
    return result.rows[0];
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

testConnection()
  .then(result => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
