import pg from 'pg';
const { Pool } = pg;

async function createTrackingTable() {
  console.log("Creating tracking_items table...");
  
  // Create a new pool directly for this script
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });
  
  try {
    // Check if the table already exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'tracking_items'
      );
    `);
    
    const tableExists = checkResult.rows[0].exists;
    console.log("Table exists check result:", tableExists);
    
    if (!tableExists) {
      console.log("Table does not exist. Creating tracking_items table...");
      
      // Create the table directly with SQL
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tracking_items (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          url VARCHAR(500) NOT NULL,
          type VARCHAR(20) NOT NULL DEFAULT 'website',
          key VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by_id INTEGER NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          description TEXT,
          thumbnail_url VARCHAR(500)
        );
      `);
      
      console.log("Successfully created tracking_items table");
    } else {
      console.log("Table already exists. Skipping creation.");
    }
    
    console.log("Done!");
  } catch (error) {
    console.error("Error creating tracking table:", error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

createTrackingTable()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to create tracking table:", error);
    process.exit(1);
  });