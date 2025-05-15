import { db } from "../server/db";
import { users, projects, messages } from "../shared/schema";
import { hash } from "bcrypt";
import { eq } from "drizzle-orm";

async function resetAndSeedDatabase() {
  try {
    console.log("Starting database reset and seeding process...");

    // Drop tables if they exist (in reverse order of dependencies)
    console.log("Dropping existing tables if they exist...");
    await db.execute(/*sql*/`DROP TABLE IF EXISTS activities CASCADE`);
    await db.execute(/*sql*/`DROP TABLE IF EXISTS messages CASCADE`);
    await db.execute(/*sql*/`DROP TABLE IF EXISTS files CASCADE`);
    await db.execute(/*sql*/`DROP TABLE IF EXISTS projects CASCADE`);
    await db.execute(/*sql*/`DROP TABLE IF EXISTS users CASCADE`);
    
    // Create tables in correct order
    console.log("Creating tables...");
    await db.execute(/*sql*/`
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
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(/*sql*/`
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

    await db.execute(/*sql*/`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(/*sql*/`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        project_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        attachments JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(/*sql*/`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        project_id INTEGER,
        user_id INTEGER NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create test users
    console.log("Creating test users...");
    const adminHashedPassword = await hash("Admin@123", 10);
    const customerHashedPassword = await hash("Customer@123", 10);

    const [adminUser] = await db.insert(users).values({
      email: "admin@techwithyou.com",
      password: adminHashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      provider: "local",
      providerId: null,
      rememberToken: null,
      createdAt: new Date()
    }).returning();

    const [customerUser] = await db.insert(users).values({
      email: "customer@techwithyou.com",
      password: customerHashedPassword,
      firstName: "Customer",
      lastName: "User",
      role: "customer",
      provider: "local",
      providerId: null,
      rememberToken: null,
      createdAt: new Date()
    }).returning();

    console.log("Creating sample projects...");
    // Create sample projects for the customer
    const sampleProjects = [
      {
        name: "Website Redesign",
        description: "Complete overhaul of company website with modern design",
        type: "Web Development",
        budget: "5000",
        targetDate: "2025-06-30",
        status: "in_progress",
        userId: customerUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Mobile App Development",
        description: "New mobile app for customer engagement",
        type: "Mobile Development",
        budget: "8000",
        targetDate: "2025-07-15",
        status: "pending_approval",
        userId: customerUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Brand Identity Update",
        description: "Refresh company brand identity including logo and visual elements",
        type: "Design",
        budget: "3000",
        targetDate: "2025-05-10",
        status: "completed",
        userId: customerUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const project of sampleProjects) {
      const [insertedProject] = await db.insert(projects).values(project).returning();
      
      // Add sample messages for each project
      await db.insert(messages).values({
        content: `Initial message for project: ${insertedProject.name}`,
        projectId: insertedProject.id,
        senderId: adminUser.id,
        isRead: false,
        attachments: null,
        createdAt: new Date()
      });
    }

    // Display success info with login credentials
    console.log("\n✅ Database reset and seed completed successfully!");
    console.log("\nTest Account Credentials:");
    console.log("--------------------------------");
    console.log("Admin Login:");
    console.log("Email: admin@techwithyou.com");
    console.log("Password: Admin@123");
    console.log("--------------------------------");
    console.log("Customer Login:");
    console.log("Email: customer@techwithyou.com");
    console.log("Password: Customer@123");
    console.log("--------------------------------");

  } catch (error) {
    console.error("Error during database reset and seed:", error);
  } finally {
    process.exit(0);
  }
}

resetAndSeedDatabase();