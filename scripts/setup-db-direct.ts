import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

// Read SQL file
const sqlContent = fs.readFileSync(path.join(process.cwd(), 'scripts', 'create-db-tables.sql'), 'utf8');

// Get the local PostgreSQL database URL from environment
const dbUrl = process.env.DATABASE_URL;

// Create separate connection strings for the default and local database
const defaultConnectionString = dbUrl;

async function setupDatabase() {
  console.log('Setting up database...');
  
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable is not set. Please set it up.');
    process.exit(1);
  }
  
  // Connect to the database
  try {
    console.log('Connecting to database...');
    const pool = new Pool({
      connectionString: defaultConnectionString,
      ssl: {
        rejectUnauthorized: false // needed for some database providers
      }
    });

    console.log('Connected to database. Executing SQL...');
    
    // Execute the SQL statements
    await pool.query(sqlContent);
    
    console.log('Database setup completed successfully.');
    
    // Create test users manually
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const customerPassword = await bcrypt.hash('Customer@123', 10);
    
    const checkAdminQuery = {
      text: 'SELECT * FROM users WHERE email = $1',
      values: ['admin@techwithyou.com']
    };
    const adminResult = await pool.query(checkAdminQuery);
    
    if (adminResult.rowCount === 0) {
      console.log('Creating admin user...');
      await pool.query(`
        INSERT INTO users (email, password, first_name, last_name, role, provider)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['admin@techwithyou.com', adminPassword, 'Admin', 'User', 'admin', 'local']);
      console.log('Admin user created.');
    } else {
      console.log('Admin user already exists.');
    }
    
    const checkCustomerQuery = {
      text: 'SELECT * FROM users WHERE email = $1',
      values: ['customer@techwithyou.com']
    };
    const customerResult = await pool.query(checkCustomerQuery);
    
    if (customerResult.rowCount === 0) {
      console.log('Creating customer user...');
      await pool.query(`
        INSERT INTO users (email, password, first_name, last_name, role, provider)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['customer@techwithyou.com', customerPassword, 'Customer', 'User', 'customer', 'local']);
      console.log('Customer user created.');
    } else {
      console.log('Customer user already exists.');
    }
    
    // Close the database connection
    await pool.end();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('Database setup completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to set up database:', error);
    process.exit(1);
  });