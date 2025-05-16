import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use environment variables from Replit's PostgreSQL database
const connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
console.log("Connecting to database...");

// Create a connection pool with SSL enabled for Neon database
export const pool = new pg.Pool({
  connectionString,
  ssl: process.env.PGHOST?.includes('.aws.neon.tech') ? { rejectUnauthorized: false } : false
});

// Test the connection and create tables if needed
(async () => {
  try {
    // Verify connection
    await pool.query('SELECT NOW()');
    console.log("Database connection successful!");
    
    // Check if tracking_items table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'tracking_items'
      );
    `);
    
    const tableExists = checkResult.rows[0].exists;
    console.log("Tracking items table exists:", tableExists);
    
    if (!tableExists) {
      console.log("Creating tracking_items table...");
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
      console.log("Tracking items table created successfully!");
    }
  } catch (error) {
    console.error("Database setup error:", error);
  }
})();

// Create a Drizzle ORM instance
export const db = drizzle(pool, { schema });