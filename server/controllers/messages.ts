import { Express, Response } from "express";
import { storage } from "../storage";
import { insertMessageSchema } from "@shared/schema";
import { AuthRequest } from "../middleware/auth";

export function registerMessageRoutes(app: Express) {
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
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const messageData = {
        ...req.body,
        senderId: req.user.id
      };
      
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
      
      // Include sender info in response
      const sender = req.user;
      const messageWithSender = {
        ...newMessage,
        sender: {
          id: sender.id,
          email: sender.email,
          firstName: sender.firstName,
          lastName: sender.lastName,
          role: sender.role
        }
      };
      
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
}
