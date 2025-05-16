import { Express, Response } from "express";
import { storage } from "../storage";
import { insertTrackingItemSchema } from "@shared/schema";
import { AuthRequest } from "../middleware/auth";

export function registerTrackingRoutes(app: Express) {
  // Get all tracking items
  app.get("/api/tracking/items", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      let trackingItems;
      
      // Admins can see all tracking items, users see only their own
      if (req.user.role === 'admin') {
        trackingItems = await storage.getAllTrackingItems();
      } else {
        // For regular users, filter tracking items relevant to them
        const allItems = await storage.getAllTrackingItems();
        trackingItems = allItems.filter(item => {
          // Show tracking items created specifically for this user
          // or public tracking items without a specific userId
          return item.userId === req.user!.id || item.userId === 0;
        });
      }
      
      res.json(trackingItems);
    } catch (error) {
      console.error("Get tracking items error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get active tracking items
  app.get("/api/tracking/active", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const activeItems = await storage.getActiveTrackingItems();
      
      // Filter for regular users
      const userItems = req.user.role === 'admin' 
        ? activeItems
        : activeItems.filter(item => item.userId === req.user!.id || item.userId === 0);
      
      res.json(userItems);
    } catch (error) {
      console.error("Get active tracking items error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create a new tracking item
  app.post("/api/tracking/items", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Only admins can create tracking items
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const validationResult = insertTrackingItemSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid tracking item data",
          errors: validationResult.error.errors 
        });
      }
      
      const newTrackingItem = await storage.createTrackingItem(req.body);
      
      // Create an activity when a new tracking item is created
      try {
        await storage.createActivity({
          type: 'tracking_created',
          description: `New tracking item created: ${newTrackingItem.name}`,
          userId: newTrackingItem.userId || 0,  // The user this tracking is for
          projectId: newTrackingItem.projectId,
          isRead: false,
          referenceId: newTrackingItem.id,
          referenceType: 'tracking_item',
          metadata: {}
        });
      } catch (activityError) {
        console.error('Error creating tracking activity:', activityError);
        // Don't fail the whole request if activity creation fails
      }
      
      res.status(201).json(newTrackingItem);
    } catch (error) {
      console.error("Create tracking item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update a tracking item
  app.patch("/api/tracking/items/:id", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Only admins can update tracking items
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const trackingId = parseInt(req.params.id);
      
      if (isNaN(trackingId)) {
        return res.status(400).json({ message: "Invalid tracking item ID" });
      }
      
      const trackingItem = await storage.getTrackingItem(trackingId);
      
      if (!trackingItem) {
        return res.status(404).json({ message: "Tracking item not found" });
      }
      
      const updatedItem = await storage.updateTrackingItem(trackingId, req.body);
      
      // Create an activity when tracking item is updated
      if (trackingItem.isActive !== req.body.isActive && req.body.isActive === true) {
        try {
          await storage.createActivity({
            type: 'tracking_activated',
            description: `Tracking item activated: ${trackingItem.name}`,
            userId: trackingItem.userId || 0,
            projectId: trackingItem.projectId,
            isRead: false,
            referenceId: trackingItem.id,
            referenceType: 'tracking_item',
            metadata: {}
          });
        } catch (activityError) {
          console.error('Error creating tracking activity:', activityError);
        }
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Update tracking item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Toggle tracking item active status
  app.post("/api/tracking/items/:id/toggle", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Only admins can toggle tracking items
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const trackingId = parseInt(req.params.id);
      
      if (isNaN(trackingId)) {
        return res.status(400).json({ message: "Invalid tracking item ID" });
      }
      
      const trackingItem = await storage.getTrackingItem(trackingId);
      
      if (!trackingItem) {
        return res.status(404).json({ message: "Tracking item not found" });
      }
      
      const updatedItem = await storage.toggleTrackingItemStatus(trackingId);
      
      // Create an activity when tracking item is activated
      if (updatedItem && updatedItem.isActive) {
        try {
          await storage.createActivity({
            type: 'tracking_activated',
            description: `Tracking item activated: ${updatedItem.name}`,
            userId: updatedItem.userId || 0,
            projectId: updatedItem.projectId,
            isRead: false,
            referenceId: updatedItem.id,
            referenceType: 'tracking_item',
            metadata: {}
          });
        } catch (activityError) {
          console.error('Error creating tracking activity:', activityError);
        }
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Toggle tracking item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a tracking item
  app.delete("/api/tracking/items/:id", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Only admins can delete tracking items
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const trackingId = parseInt(req.params.id);
      
      if (isNaN(trackingId)) {
        return res.status(400).json({ message: "Invalid tracking item ID" });
      }
      
      const trackingItem = await storage.getTrackingItem(trackingId);
      
      if (!trackingItem) {
        return res.status(404).json({ message: "Tracking item not found" });
      }
      
      const success = await storage.deleteTrackingItem(trackingId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete tracking item" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete tracking item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}