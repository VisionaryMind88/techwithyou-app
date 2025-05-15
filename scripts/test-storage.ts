import { storage } from "../server/storage";

async function main() {
  console.log("Testing storage functions...");
  
  // Test getting user by ID
  console.log("Testing getUser...");
  const userById = await storage.getUser(1);
  console.log("User by ID:", userById);
  
  // Test getting user by email
  console.log("\nTesting getUserByEmail...");
  const userByEmail = await storage.getUserByEmail("test@techwithyou.com");
  console.log("User by email:", userByEmail);
  
  // Test functions that should return empty results
  console.log("\nTesting getProject (should be undefined)...");
  const project = await storage.getProject(1);
  console.log("Project:", project);
  
  console.log("\nTesting getProjectsByUser (should be empty array)...");
  const projects = await storage.getProjectsByUser(1);
  console.log("Projects:", projects);
  
  console.log("\nAll storage functions tested successfully!");
}

main()
  .catch((e) => {
    console.error("Error testing storage functions:", e);
    process.exit(1);
  })
  .finally(() => {
    console.log("Exiting...");
    process.exit(0);
  });