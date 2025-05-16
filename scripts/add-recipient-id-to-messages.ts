import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/pg-pool';
import { messages } from '../shared/schema';
import { integer } from 'drizzle-orm/pg-core';

async function addRecipientIdColumn() {
  console.log("Adding recipient_id column to messages table...");
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // First check if the column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'recipient_id'
    `);

    if (checkResult.rows.length > 0) {
      console.log("recipient_id column already exists in messages table");
      return;
    }

    // Add the recipient_id column
    await pool.query(`
      ALTER TABLE messages
      ADD COLUMN recipient_id INTEGER
    `);

    console.log("Successfully added recipient_id column to messages table");
  } catch (error) {
    console.error("Error adding recipient_id column:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
addRecipientIdColumn()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });