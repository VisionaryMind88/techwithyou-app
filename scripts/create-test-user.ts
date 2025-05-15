import { db } from "../server/db";
import { users } from "../shared/schema";

async function main() {
  console.log("Creating test user...");

  // Check if the user already exists
  const [existingUser] = await db.select().from(users).where(eq(users.email, "test@techwithyou.com"));

  if (existingUser) {
    console.log("Test user already exists, skipping creation.");
    return;
  }

  // Create a test user
  const result = await db.insert(users).values({
    email: "test@techwithyou.com",
    password: "$2b$10$cGXu4qxeYgYl/iJ03HzI7.uAJF1oiuX8u7GYHF8cDsOB20G3cbXza", // hashed "password123"
    first_name: "Test",
    last_name: "User",
    role: "admin", // make this user an admin for testing
    provider: null,
    provider_id: null,
    created_at: new Date(),
  }).returning();

  console.log("Test user created:", result[0]);
}

main()
  .catch((e) => {
    console.error("Error creating test user:", e);
    process.exit(1);
  })
  .finally(() => {
    console.log("Exiting...");
    process.exit(0);
  });