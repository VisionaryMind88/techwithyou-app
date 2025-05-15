import { storage } from "../server/storage";

async function main() {
  try {
    console.log("Creating test activity...");
    
    // Create a test activity for the customer user (ID 2)
    const testActivity = await storage.createActivity({
      type: "project_update",
      description: "Your project status was updated to 'in_progress'",
      userId: 2, // Customer user ID
      projectId: 1, // Reference to an existing project
      referenceId: 1, // Same as projectId
      referenceType: "project",
      isRead: false,
      metadata: JSON.stringify({
        projectId: 1,
        projectName: "Website Redesign",
        oldStatus: "pending",
        newStatus: "in_progress",
        updatedBy: 1, // Admin user ID
        updatedByName: "Admin User"
      })
    });
    
    console.log("Test activity created successfully:", testActivity);
  } catch (error) {
    console.error("Error creating test activity:", error);
  }
}

main();