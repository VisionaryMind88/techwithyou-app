import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function updateEnvironmentVariable(key: string, value: string) {
  try {
    console.log(`Setting ${key} to local database connection value...`);
    
    // Set environment variable for current process
    process.env[key] = value;
    console.log(`Environment variable ${key} updated in current process`);
    
    // Run drizzle-kit push
    console.log('Running db push...');
    const { stdout, stderr } = await execAsync('npx drizzle-kit push');
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('Database schema pushed successfully');
  } catch (error) {
    console.error('Error updating database connection:', error);
  }
}

// Main function
async function main() {
  // Build connection string from Replit-provided variables with SSL mode
  const connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`;
  
  console.log('Local connection string created');
  
  // Update DATABASE_URL
  await updateEnvironmentVariable('DATABASE_URL', connectionString);
}

// Run the main function
main()
  .then(() => console.log('Done!'))
  .catch(err => console.error(err));