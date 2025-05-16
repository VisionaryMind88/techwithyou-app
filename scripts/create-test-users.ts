import { db } from "../server/db";
import { users } from "../shared/schema";
import bcrypt from "bcrypt";

async function createTestUsers() {
  try {
    console.log("Creating test users...");
    
    // Create admin user
    const adminPassword = "Admin123!";
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    
    await db.insert(users).values({
      email: "admin@example.com",
      password: hashedAdminPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin"
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        password: hashedAdminPassword,
        firstName: "Admin",
        lastName: "User",
        role: "admin"
      }
    });
    
    // Create regular user
    const userPassword = "Customer123!";
    const hashedUserPassword = await bcrypt.hash(userPassword, 10);
    
    await db.insert(users).values({
      email: "user@example.com",
      password: hashedUserPassword,
      firstName: "Regular",
      lastName: "User",
      role: "customer"
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        password: hashedUserPassword,
        firstName: "Regular",
        lastName: "User",
        role: "customer"
      }
    });
    
    console.log("Test users created successfully!");
    console.log("Admin login: admin@example.com / Admin123!");
    console.log("User login: user@example.com / Customer123!");
  } catch (error) {
    console.error("Error creating test users:", error);
  } finally {
    process.exit(0);
  }
}

createTestUsers();