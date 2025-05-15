import { db } from "../server/db";
import { users, insertUserSchema } from "../shared/schema";
import { hash } from "bcrypt";
import { eq } from "drizzle-orm";

async function createTestUsers() {
  try {
    // Create an admin user
    const adminHashedPassword = await hash("Admin@123", 10);
    const adminUser = {
      email: "admin@techwithyou.com",
      password: adminHashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      provider: "local",
      providerId: null,
      rememberToken: null,
      createdAt: new Date()
    };

    // Create a customer user
    const customerHashedPassword = await hash("Customer@123", 10);
    const customerUser = {
      email: "customer@techwithyou.com",
      password: customerHashedPassword,
      firstName: "Customer",
      lastName: "User",
      role: "customer",
      provider: "local",
      providerId: null,
      rememberToken: null,
      createdAt: new Date()
    };

    // Insert users, skipping if they already exist
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminUser.email));
    
    if (existingAdmin.length === 0) {
      console.log("Creating admin user...");
      await db.insert(users).values(adminUser);
      console.log("Admin user created successfully!");
    } else {
      console.log("Admin user already exists.");
    }

    const existingCustomer = await db.select().from(users).where(eq(users.email, customerUser.email));
    
    if (existingCustomer.length === 0) {
      console.log("Creating customer user...");
      await db.insert(users).values(customerUser);
      console.log("Customer user created successfully!");
    } else {
      console.log("Customer user already exists.");
    }

    // Fetch and display all users
    const allUsers = await db.select().from(users);
    console.log("All users in the database:");
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });

    console.log("\nYou can now log in with:");
    console.log("Admin: admin@techwithyou.com / Admin@123");
    console.log("Customer: customer@techwithyou.com / Customer@123");

  } catch (error) {
    console.error("Error creating test users:", error);
  } finally {
    process.exit(0);
  }
}

createTestUsers();