import { pool } from './db';
import * as schema from '@shared/schema';

async function checkMissingColumns() {
  try {
    // First get a list of all tables
    console.log("Getting list of all tables...");
    const tables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    
    // For each table in database
    for (const tableRow of tables.rows) {
      const tableName = tableRow.table_name;
      console.log(`\nChecking table: ${tableName}`);
      
      // Get the actual columns in the database
      const columnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [tableName]);
      
      const dbColumns = columnsResult.rows.map(row => row.column_name);
      console.log(`Database columns: ${dbColumns.join(', ')}`);
    }
    
  } catch (error) {
    console.error("Error checking schema:", error);
  }
}

async function addMissingMetadataColumn() {
  try {
    // Check if metadata column exists in activities table
    const check = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'activities' AND column_name = 'metadata'
    `);
    
    if (check.rows.length === 0) {
      console.log("Adding 'metadata' column to activities table...");
      await pool.query(`ALTER TABLE activities ADD COLUMN metadata JSONB`);
      console.log("Column added successfully!");
    } else {
      console.log("'metadata' column already exists in activities table");
    }
  } catch (error) {
    console.error("Error adding column:", error);
  }
}

async function main() {
  try {
    await checkMissingColumns();
    await addMissingMetadataColumn();
    
    // Add more functions to check/fix specific tables here
  } catch (error) {
    console.error("Error in main:", error);
  } finally {
    process.exit(0);
  }
}

main();
