import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check for all required PG environment variables
if (!process.env.PGHOST || !process.env.PGPORT || !process.env.PGUSER || 
    !process.env.PGPASSWORD || !process.env.PGDATABASE) {
  throw new Error(
    "PostgreSQL environment variables must be set. Did you forget to provision a database?",
  );
}

// Construct connection string using PG environment variables
const connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });