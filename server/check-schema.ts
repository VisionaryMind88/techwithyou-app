import { db, pool } from './db';

async function checkSchema() {
  try {
    // Check all tables
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('Available tables:', tables.rows.map(row => row.table_name));
    
    // Check schema definition vs actual database
    for (const tableName of tables.rows.map(row => row.table_name)) {
      const columns = await pool.query(
        
      );
      
      console.log();
      console.log('Columns:', columns.rows);
    }
  } catch (error) {
    console.error('Error checking schema:', error);
    throw error;
  }
}

checkSchema()
  .then(() => {
    console.log('
Schema check completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Schema check failed:', error);
    process.exit(1);
  });
