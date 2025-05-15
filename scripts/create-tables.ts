import { db } from "../server/db";
import * as schema from "../shared/schema";

async function main() {
  console.log("Creating tables...");

  // Create the tables in the correct order to respect foreign key constraints
  console.log("Creating users table...");
  await db.execute(/* SQL */ `
    CREATE TABLE IF NOT EXISTS "users" (
      "id" SERIAL PRIMARY KEY,
      "email" TEXT NOT NULL UNIQUE,
      "password" TEXT,
      "first_name" TEXT,
      "last_name" TEXT,
      "role" TEXT NOT NULL DEFAULT 'customer',
      "provider" TEXT,
      "provider_id" TEXT,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Creating projects table...");
  await db.execute(/* SQL */ `
    CREATE TABLE IF NOT EXISTS "projects" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "description" TEXT,
      "budget" TEXT,
      "target_date" TEXT,
      "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Creating files table...");
  await db.execute(/* SQL */ `
    CREATE TABLE IF NOT EXISTS "files" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "original_name" TEXT NOT NULL,
      "size" INTEGER NOT NULL,
      "type" TEXT NOT NULL,
      "path" TEXT NOT NULL,
      "project_id" INTEGER NOT NULL REFERENCES "projects"("id"),
      "uploaded_by" INTEGER NOT NULL REFERENCES "users"("id"),
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Creating messages table...");
  await db.execute(/* SQL */ `
    CREATE TABLE IF NOT EXISTS "messages" (
      "id" SERIAL PRIMARY KEY,
      "content" TEXT NOT NULL,
      "sender_id" INTEGER NOT NULL REFERENCES "users"("id"),
      "project_id" INTEGER NOT NULL REFERENCES "projects"("id"),
      "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
      "attachments" JSONB,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Creating activities table...");
  await db.execute(/* SQL */ `
    CREATE TABLE IF NOT EXISTS "activities" (
      "id" SERIAL PRIMARY KEY,
      "type" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
      "project_id" INTEGER REFERENCES "projects"("id"),
      "metadata" JSONB,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("All tables created successfully!");
}

main()
  .catch((e) => {
    console.error("Error creating tables:", e);
    process.exit(1);
  })
  .finally(() => {
    console.log("Exiting...");
    process.exit(0);
  });