import { pool } from './db';

async function inspectDatabase() {
  try {
    // Check all tables
    const tablesResult = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('Available tables:', tablesResult.rows.map(row => row.table_name));
    
    // For each table, check columns
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      const columnsResult = await pool.query(
        
      );
      
      console.log();
      console.log('Columns:', columnsResult.rows);
    }
  } catch (error) {
    console.error('Error inspecting database:', error);
  }
}

inspectDatabase()
  .then(() => {
    console.log('Inspection complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Inspection failed:', error);
    process.exit(1);
  });
