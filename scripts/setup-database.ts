import { db } from "../server/db";
import * as schema from "../shared/schema";

async function setupDatabase() {
  console.log("Starting database setup...");
  
  try {
    // Create the sessions table first (required for authentication)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid varchar PRIMARY KEY,
        sess json NOT NULL,
        expire timestamp(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);
    `);
    console.log("Sessions table created or already exists");

    // Create the users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT,
        first_name TEXT,
        last_name TEXT,
        role TEXT NOT NULL DEFAULT 'customer',
        provider TEXT,
        provider_id TEXT,
        remember_token TEXT,
        stripe_customer_id TEXT,
        profile_picture TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Users table created or already exists");

    // Create the projects table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        budget TEXT,
        target_date TEXT,
        status TEXT NOT NULL DEFAULT 'pending_approval',
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Projects table created or already exists");

    // Create the files table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        is_latest_version BOOLEAN NOT NULL DEFAULT TRUE,
        version_number INTEGER NOT NULL DEFAULT 1,
        parent_file_id INTEGER,
        version_note TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Files table created or already exists");

    // Create the messages table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        project_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        recipient_id INTEGER,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        attachments JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Messages table created or already exists");

    // Create the activities table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        project_id INTEGER,
        user_id INTEGER NOT NULL,
        reference_id INTEGER,
        reference_type TEXT,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Activities table created or already exists");

    // Create the payments table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        amount DECIMAL(10, 2) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'usd',
        status TEXT NOT NULL DEFAULT 'pending',
        description TEXT,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_by_id INTEGER NOT NULL,
        stripe_payment_intent_id TEXT,
        message_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );
    `);
    console.log("Payments table created or already exists");

    // Create the tracking_items table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tracking_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        url VARCHAR(500) NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'website',
        key VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by_id INTEGER NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        description TEXT,
        thumbnail_url VARCHAR(500)
      );
    `);
    console.log("Tracking items table created or already exists");

    // Create test admin user
    await db.execute(`
      INSERT INTO users (email, password, first_name, last_name, role)
      VALUES ('admin@example.com', '$2b$10$mLZMsUmMxRE9RKuBRpAF7OzfZM0h8PF4qWVHdFMJeXQP0y.J8QXLu', 'Admin', 'User', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log("Test admin user created or already exists");

    // Create test customer user
    await db.execute(`
      INSERT INTO users (email, password, first_name, last_name, role)
      VALUES ('customer@example.com', '$2b$10$mLZMsUmMxRE9RKuBRpAF7OzfZM0h8PF4qWVHdFMJeXQP0y.J8QXLu', 'Customer', 'User', 'customer')
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log("Test customer user created or already exists");

    console.log("Database setup completed successfully!");
  } catch (error) {
    console.error("Error during database setup:", error);
    throw error;
  }
}

// Execute the function
setupDatabase()
  .then(() => {
    console.log("Setup completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });