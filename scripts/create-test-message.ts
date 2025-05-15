import { storage } from "../server/storage";

async function main() {
  console.log("Creating test messages...");
  
  // Create a message from admin to customer
  const adminMessage = await storage.createMessage({
    content: "Hello! I've reviewed your website project. Can you provide more details about your design preferences?",
    senderId: 1, // Admin (test user)
    projectId: 1, // Test project
    isRead: false,
    attachments: null,
  });
  
  console.log("Admin message created:", adminMessage);
  
  // Create another message to simulate a conversation
  const followupMessage = await storage.createMessage({
    content: "I'd also like to discuss your timeline expectations. Is the target date of June 15 firm or flexible?",
    senderId: 1, // Admin (test user)
    projectId: 1, // Test project
    isRead: false,
    attachments: null,
  });
  
  console.log("\nFollow-up message created:", followupMessage);
  
  // Get messages by project
  const projectMessages = await storage.getMessagesByProject(1);
  console.log("\nMessages for project ID 1:", projectMessages);
  
  // Mark one message as read
  const updatedMessage = await storage.markMessageAsRead(adminMessage.id);
  console.log("\nMarked message as read:", updatedMessage);
  
  // Get unread messages
  const unreadMessages = await storage.getUnreadMessages();
  console.log("\nUnread messages:", unreadMessages);
}

main()
  .catch((e) => {
    console.error("Error creating test messages:", e);
    process.exit(1);
  })
  .finally(() => {
    console.log("Exiting...");
    process.exit(0);
  });