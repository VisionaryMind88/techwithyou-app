import { db } from "../server/db";
import { activities, files, messages, payments, projects, users } from "../shared/schema";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Creating database tables...");
    
    // Drop tables in reverse order to avoid foreign key constraints
    await db.execute(sql`DROP TABLE IF EXISTS payments CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS activities CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS messages CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS files CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS projects CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
    
    // Create tables in order
    await db.execute(sql`
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
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
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
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        is_latest_version BOOLEAN NOT NULL DEFAULT true,
        version_number INTEGER NOT NULL DEFAULT 1,
        parent_file_id INTEGER,
        version_note TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        project_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        attachments JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        project_id INTEGER,
        user_id INTEGER NOT NULL,
        reference_id INTEGER,
        reference_type TEXT,
        is_read BOOLEAN NOT NULL DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
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
      )
    `);
    
    console.log("All tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    process.exit(0);
  }
}

main();