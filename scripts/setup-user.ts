import { db } from "../server/db";
import { users } from "../shared/schema";
import bcrypt from "bcrypt";

async function main() {
  try {
    console.log("Creating test users...");
    
    // Create admin user
    const hashedAdminPassword = await bcrypt.hash("Admin123!", 10);
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
    
    // Create customer user
    const hashedCustomerPassword = await bcrypt.hash("Customer123!", 10);
    await db.insert(users).values({
      email: "customer@example.com",
      password: hashedCustomerPassword,
      firstName: "Customer",
      lastName: "User",
      role: "customer"
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        password: hashedCustomerPassword,
        firstName: "Customer",
        lastName: "User",
        role: "customer"
      }
    });
    
    console.log("Test users created successfully!");
  } catch (error) {
    console.error("Error creating test users:", error);
  } finally {
    process.exit(0);
  }
}

main();