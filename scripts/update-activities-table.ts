import { pool } from '../server/db';

async function updateActivitiesTable() {
  try {
    console.log('Updating activities table with new fields...');
    
    // Add new columns to the activities table
    await pool.query(`
      ALTER TABLE activities
      ADD COLUMN IF NOT EXISTS reference_id INTEGER,
      ADD COLUMN IF NOT EXISTS reference_type TEXT,
      ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE
    `);
    
    console.log('Activities table updated successfully.');
  } catch (error) {
    console.error('Error updating activities table:', error);
  } finally {
    await pool.end();
  }
}

// Execute the function
updateActivitiesTable();