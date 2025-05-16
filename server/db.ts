import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from "@shared/schema";

// Configure WebSocket for Supabase/Neon pooled connections
neonConfig.webSocketConstructor = ws;

console.log("Connecting to database...");

// Check if DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL moet ingesteld zijn. Heb je vergeten om een database in te stellen?"
  );
}

// Connect to the Supabase PostgreSQL database using the connection pooling URL
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Enable SSL for production databases
  ssl: true
});

// Test the connection and create tables if needed
(async () => {
  try {
    // Verify connection
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()');
      console.log("Database connection successful!");
      
      // Check if tracking_items table exists
      const checkResult = await client.query(`
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
        await client.query(`
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
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database setup error:", error);
  }
})();

// Create a Drizzle ORM instance compatible with Supabase
export const db = drizzle({ client: pool, schema });