import { pool } from './db';

async function addRecipientIdColumn() {
  try {
    // Check if column exists first
    const checkResult = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'recipient_id'"
    );
    
    if (checkResult.rows.length === 0) {
      console.log('Adding recipient_id column to messages table...');
      await pool.query('ALTER TABLE messages ADD COLUMN recipient_id INTEGER');
      console.log('Column added successfully!');
    } else {
      console.log('recipient_id column already exists');
    }
  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  }
}

addRecipientIdColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
