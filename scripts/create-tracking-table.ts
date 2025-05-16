import { db } from "../server/db";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

async function createTrackingTable() {
  console.log("Creating tracking_items table...");
  
  try {
    // Check if the table already exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'tracking_items'
      );
    `);
    
    console.log("Table check result:", tableExists);
    
    if (tableExists.rows && tableExists.rows[0] && tableExists.rows[0].exists === false) {
      console.log("Table does not exist. Creating tracking_items table...");
      
      // Create the table directly with SQL
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tracking_items (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          url VARCHAR(500) NOT NULL,
          type VARCHAR(20) NOT NULL DEFAULT 'website',
          key VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by_id INTEGER NOT NULL REFERENCES users(id),
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
  }
}

createTrackingTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to create tracking table:", error);
    process.exit(1);
  });