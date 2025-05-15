import { storage } from "../server/storage";

async function main() {
  console.log("Creating test project...");
  
  // Create a test project for our test user
  const testProject = await storage.createProject({
    name: "Test Website Project",
    description: "A simple website project for testing purposes",
    type: "website",
    budget: "$5,000",
    targetDate: "2025-06-15",
    status: "pending_approval",
    userId: 1, // This should be the ID of our test user
  });
  
  console.log("Test project created:", testProject);
  
  // Verify we can fetch it by ID
  const fetchedProject = await storage.getProject(testProject.id);
  console.log("\nFetched project by ID:", fetchedProject);
  
  // Verify we can fetch it by user ID
  const projectsByUser = await storage.getProjectsByUser(1);
  console.log("\nFetched projects by user ID:", projectsByUser);
  
  // Create an activity for this project
  const activity = await storage.createActivity({
    type: "project_created",
    description: "Project was created",
    userId: 1,
    projectId: testProject.id,
    metadata: { source: "test script" },
  });
  
  console.log("\nActivity created:", activity);
  
  // Fetch recent activities
  const recentActivities = await storage.getRecentActivities(5);
  console.log("\nRecent activities:", recentActivities);
}

main()
  .catch((e) => {
    console.error("Error creating test project:", e);
    process.exit(1);
  })
  .finally(() => {
    console.log("Exiting...");
    process.exit(0);
  });