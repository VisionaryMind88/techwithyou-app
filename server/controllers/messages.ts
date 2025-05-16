import { Express, Response } from "express";
import { storage } from "../storage";
import { insertMessageSchema, activities } from "@shared/schema";
import { AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { eq, desc, and, or } from "drizzle-orm";

export function registerMessageRoutes(app: Express) {
  // Get recent activities for the current user
  app.get("/api/activities/user", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get activities for the current user using the optimized method
      const userActivities = await storage.getUserActivities(req.user.id, 10);
      
      // Return the activities to the client
      res.json(userActivities);
    } catch (error) {
      console.error("Get user activities error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Mark an activity as read
  app.patch("/api/activities/:id/read", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }
      
      const activity = await storage.getActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      // Only allow the user who owns the activity to mark it as read
      if (activity.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update the activity to mark it as read
      const updatedActivity = await storage.updateActivity(activityId, { isRead: true });
      
      res.json(updatedActivity);
    } catch (error) {
      console.error("Mark activity as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // Get messages for a specific project
  app.get("/api/messages/project/:id", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const projectId = parseInt(req.params.id);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if user has access to this project
      if (req.user.role !== 'admin' && project.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const messages = await storage.getMessagesByProject(projectId);
      
      // Enrich messages with sender data
      const enrichedMessages = await Promise.all(messages.map(async (message) => {
        const sender = await storage.getUser(message.senderId);
        return {
          ...message,
          sender: sender ? {
            id: sender.id,
            email: sender.email,
            firstName: sender.firstName,
            lastName: sender.lastName,
            role: sender.role
          } : null
        };
      }));
      
      res.json(enrichedMessages);
    } catch (error) {
      console.error('Get project messages error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get recent messages for user
  app.get("/api/messages/recent", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const messages = await storage.getRecentMessages(req.user.id, limit);
      
      // Enrich messages with sender data
      const enrichedMessages = await Promise.all(messages.map(async (message) => {
        const sender = await storage.getUser(message.senderId);
        return {
          ...message,
          sender: sender ? {
            id: sender.id,
            email: sender.email,
            firstName: sender.firstName,
            lastName: sender.lastName,
            role: sender.role
          } : null
        };
      }));
      
      res.json(enrichedMessages);
    } catch (error) {
      console.error('Get recent messages error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get unread messages for admin
  app.get("/api/messages/admin/unread", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const unreadMessages = await storage.getUnreadMessages(true);
      
      // Enrich messages with sender and project data
      const enrichedMessages = await Promise.all(unreadMessages.map(async (message) => {
        const sender = await storage.getUser(message.senderId);
        const project = await storage.getProject(message.projectId);
        
        return {
          ...message,
          sender: sender ? {
            id: sender.id,
            email: sender.email,
            firstName: sender.firstName,
            lastName: sender.lastName,
            role: sender.role
          } : null,
          project: project || null
        };
      }));
      
      res.json(enrichedMessages);
    } catch (error) {
      console.error('Get unread admin messages error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get recent activities
  app.get("/api/activities/recent", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const activities = await storage.getRecentActivities(limit);
      
      // Enrich activities with user data
      const enrichedActivities = await Promise.all(activities.map(async (activity) => {
        const user = await storage.getUser(activity.userId);
        return {
          ...activity,
          user: user ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          } : null
        };
      }));
      
      res.json(enrichedActivities);
    } catch (error) {
      console.error('Get recent activities error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create a new message
  app.post("/api/messages", async (req: AuthRequest, res: Response) => {
    try {
      console.log('Message POST received, debug info:', {
        headers: req.headers,
        sessionId: req.sessionID,
        hasSession: !!req.session,
        hasUser: !!req.user,
        userId: req.session?.userId
      });
      
      // Special handling - check if we can get the user from session if not already on request
      if (!req.user && req.session?.userId) {
        console.log('No req.user but found userId in session, looking up user');
        try {
          const user = await storage.getUser(req.session.userId);
          if (user) {
            console.log('Found user via session userId:', user.email);
            req.user = user;
          }
        } catch (err) {
          console.error('Error looking up user from session userId:', err);
        }
      }
      
      if (!req.user) {
        console.log('User authentication failed for message creation');
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Mark that we need to preserve the session and touch cookie expiry
      const preserveSession = req.headers['x-preserve-session'] === 'true';
      if (preserveSession) {
        console.log('Message request with X-Preserve-Session header, extending session');
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }
      
      const messageData = {
        ...req.body,
        senderId: req.user.id
      };
      
      // Force save session before proceeding to ensure we don't lose the session
      if (preserveSession) {
        await new Promise<void>((resolve) => {
          req.session.touch(); // Mark session as active
          req.session.save((err) => {
            if (err) {
              console.error('Error saving session during message creation:', err);
            } else {
              console.log('Session saved successfully during message creation');
            }
            resolve();
          });
        });
      }
      
      // Validate message data
      const validationResult = insertMessageSchema.safeParse(messageData);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid message data',
          errors: validationResult.error.errors 
        });
      }
      
      // Check if project exists
      const project = await storage.getProject(messageData.projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if user has access to this project
      if (req.user.role !== 'admin' && project.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const newMessage = await storage.createMessage(messageData);
      
      // Add a timestamp of when the message was processed
      const processedTimestamp = new Date().toISOString();
      
      // Include sender info in response
      const sender = req.user;
      const messageWithSender = {
        ...newMessage,
        processedAt: processedTimestamp,
        sender: {
          id: sender.id,
          email: sender.email,
          firstName: sender.firstName,
          lastName: sender.lastName,
          role: sender.role
        }
      };
      
      // Create a notification activity for the recipient
      const recipientId = req.user.role === 'admin' ? project.userId : 1; // Admin id is 1
      try {
        await storage.createActivity({
          type: 'message_received',
          description: `New message from ${sender.firstName || sender.email}`,
          userId: recipientId,
          projectId: project.id,
          isRead: false,
          referenceId: newMessage.id,
          referenceType: 'message',
          metadata: { senderId: sender.id }
        });
      } catch (activityError) {
        console.error('Error creating message activity:', activityError);
        // Don't fail the whole request if activity creation fails
      }
      
      console.log('Message created successfully:', newMessage.id);
      
      // Save session one more time after successful operation
      if (preserveSession) {
        req.session.save((err) => {
          if (err) {
            console.error('Error saving session after message creation:', err);
          }
        });
      }
      
      res.status(201).json(messageWithSender);
    } catch (error) {
      console.error('Create message error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Mark activity as read
  app.patch("/api/activities/:id/read", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ message: 'Invalid activity ID' });
      }
      
      const activity = await storage.getActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }
      
      // Only allow the user who owns the activity to mark it as read
      if (activity.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Update the activity to mark it as read
      const updatedActivity = await storage.updateActivity(activityId, { isRead: true });
      
      res.json(updatedActivity);
    } catch (error) {
      console.error('Mark activity as read error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Mark message as read
  app.patch("/api/messages/:id/read", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const messageId = parseInt(req.params.id);
      
      if (isNaN(messageId)) {
        return res.status(400).json({ message: 'Invalid message ID' });
      }
      
      const message = await storage.getMessage(messageId);
      
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      // Check if user has access to this message's project
      const project = await storage.getProject(message.projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (req.user.role !== 'admin' && project.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const updatedMessage = await storage.markMessageAsRead(messageId);
      
      res.json(updatedMessage);
    } catch (error) {
      console.error('Mark message as read error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get direct messages between users
  app.get("/api/messages/direct/:userId", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const targetUserId = parseInt(req.params.userId);
      
      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Get target user to ensure they exist
      const targetUser = await storage.getUser(targetUserId);
      
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get direct messages from database
      // For direct messages, we use projectId=0 and check recipientId
      // We need messages in both directions (current user to target and target to current)
      const directMessages = await db.query.messages.findMany({
        where: or(
          and(
            eq(messages.senderId, req.user.id),
            eq(messages.recipientId, targetUserId),
            eq(messages.projectId, 0)
          ),
          and(
            eq(messages.senderId, targetUserId),
            eq(messages.recipientId, req.user.id),
            eq(messages.projectId, 0)
          )
        ),
        orderBy: [desc(messages.createdAt)]
      });
      
      // Enrich messages with sender data
      const enrichedMessages = await Promise.all(directMessages.map(async (message) => {
        const sender = await storage.getUser(message.senderId);
        return {
          ...message,
          sender: sender ? {
            id: sender.id,
            email: sender.email,
            firstName: sender.firstName,
            lastName: sender.lastName,
            role: sender.role
          } : null
        };
      }));
      
      // Sort messages by date (oldest first)
      const sortedMessages = enrichedMessages.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA.getTime() - dateB.getTime();
      });
      
      res.json(sortedMessages);
    } catch (error) {
      console.error('Get direct messages error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Send direct message to a user
  app.post("/api/messages/direct", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Validate message data - with recipientId instead of projectId validation
      const { content, recipientId } = req.body;
      
      if (!content || !recipientId) {
        return res.status(400).json({ message: 'Message content and recipient ID are required' });
      }
      
      // Check if recipient exists
      const recipient = await storage.getUser(recipientId);
      
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }
      
      // For direct messages, we use projectId=0
      const messageData = {
        content,
        projectId: 0, // 0 indicates a direct message
        senderId: req.user.id,
        recipientId, // Store the recipient ID
        attachments: null
      };
      
      // Create the message
      const newMessage = await storage.createMessage(messageData);
      
      // Create a notification activity for the recipient
      try {
        await storage.createActivity({
          type: 'direct_message_received',
          description: `New direct message from ${req.user.firstName || req.user.email}`,
          userId: recipientId,
          projectId: null,
          isRead: false,
          referenceId: newMessage.id,
          referenceType: 'message',
          metadata: { senderId: req.user.id }
        });
      } catch (activityError) {
        console.error('Error creating direct message activity:', activityError);
        // Don't fail the whole request if activity creation fails
      }
      
      // Include sender info in response
      const messageWithSender = {
        ...newMessage,
        sender: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role
        }
      };
      
      res.status(201).json(messageWithSender);
    } catch (error) {
      console.error('Create direct message error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}
