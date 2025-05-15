import bcrypt from 'bcrypt';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../shared/schema';
import { eq } from 'drizzle-orm';
import ws from 'ws';

async function createTestUsers() {
  console.log('Creating test users...');
  
  // Configure WebSocket for Neon DB
  (globalThis as any).WebSocket = ws;
  
  // Connect to database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const customerPassword = await bcrypt.hash('Customer@123', 10);
    
    // Check if admin already exists
    const adminExists = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, 'admin@techwithyou.com'));
    
    // Create admin if doesn't exist
    if (adminExists.length === 0) {
      await db.insert(schema.users).values({
        email: 'admin@techwithyou.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        provider: 'local',
        providerId: null
      });
      console.log('Created admin user');
    } else {
      console.log('Admin user already exists');
    }
    
    // Check if customer already exists
    const customerExists = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, 'customer@techwithyou.com'));
    
    // Create customer if doesn't exist
    if (customerExists.length === 0) {
      await db.insert(schema.users).values({
        email: 'customer@techwithyou.com',
        password: customerPassword,
        firstName: 'Customer',
        lastName: 'User',
        role: 'customer',
        provider: 'local',
        providerId: null
      });
      console.log('Created customer user');
    } else {
      console.log('Customer user already exists');
    }
    
    console.log('Test users created successfully');
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await pool.end();
  }
}

// Execute the function
createTestUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });