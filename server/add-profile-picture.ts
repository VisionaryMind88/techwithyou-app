import { pool } from './db';

async function addProfilePictureColumn() {
  try {
    // Check if column exists first
    const checkResult = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_picture'"
    );
    
    if (checkResult.rows.length === 0) {
      console.log('Adding profile_picture column to users table...');
      await pool.query('ALTER TABLE users ADD COLUMN profile_picture TEXT');
      console.log('Column added successfully!');
    } else {
      console.log('profile_picture column already exists');
    }
  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  }
}

addProfilePictureColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
