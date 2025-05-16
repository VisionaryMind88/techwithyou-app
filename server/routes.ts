import type { Express } from "express";
import { createServer, type Server } from "http";
import { authMiddleware } from "./middleware/auth";
import { WebSocketServer, WebSocket } from "ws";
import { registerAuthRoutes } from "./controllers/auth";
import { registerProjectRoutes } from "./controllers/projects";
import { registerMessageRoutes } from "./controllers/messages";
import { registerTrackingRoutes } from "./controllers/tracking";
import { registerHelpRoutes } from "./controllers/help";
import Stripe from "stripe";
import { storage } from "./storage";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing Stripe secret key. Stripe payment functionality will be disabled.');
}
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Client connections map to track connected users
  const clients = new Map<number, WebSocket>();
  
  // Set up a dedicated route for admin payments that comes before all other routes
  app.get("/api/payments/admin", authMiddleware, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      console.log("Admin payments endpoint called by:", req.user.email);
      const payments = await storage.getAllPayments();
      console.log("Returning payments:", payments.length);
      res.json({ payments });
    } catch (error: any) {
      console.error("Error getting payments:", error);
      res.status(500).json({ 
        message: "Error getting payments", 
        error: error.message 
      });
    }
  });

  // Clear old duplicate admin payments route to avoid conflicts
  app.get("/api/payments/admin", authMiddleware, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      console.log("Admin payments endpoint called by:", req.user.email);
      const payments = await storage.getAllPayments();
      console.log("Returning payments:", payments.length);
      res.json({ payments });
    } catch (error: any) {
      console.error("Error getting payments:", error);
      res.status(500).json({ 
        message: "Error getting payments", 
        error: error.message 
      });
    }
  });

  // Get pending payments - admin only
  app.get("/api/payments/admin/pending", authMiddleware, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      const payments = await storage.getPendingPayments();
      res.json({ payments });
    } catch (error: any) {
      console.error("Error getting pending payments:", error);
      res.status(500).json({ 
        message: "Error getting pending payments", 
        error: error.message 
      });
    }
  });
  
  // Payment routes
  if (stripe) {
    // Create a payment intent for one-time payments
    app.post("/api/create-payment-intent", authMiddleware, async (req, res) => {
      try {
        const { amount, projectId, description } = req.body;
        
        if (!req.user) {
          return res.status(401).json({ message: "Not authenticated" });
        }
        
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          currency: "usd",
          metadata: {
            projectId,
            userId: req.user.id,
            description
          }
        });
        
        // Save the payment request in our database
        const payment = await storage.createPayment({
          amount: parseFloat(amount),
          currency: "usd",
          description,
          projectId,
          userId: req.user.id,
          createdById: req.user.id,
          stripePaymentIntentId: paymentIntent.id,
          messageId: req.body.messageId // Optional: link to a message
        });
        
        res.json({ 
          clientSecret: paymentIntent.client_secret,
          paymentId: payment.id
        });
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ 
          message: "Error creating payment intent", 
          error: error.message 
        });
      }
    });
    
    // Admin endpoint to create payment request through messages
    app.post("/api/payment-requests", authMiddleware, async (req, res) => {
      try {
        const { amount, projectId, userId, description, messageContent } = req.body;
        
        if (!req.user) {
          return res.status(401).json({ message: "Not authenticated" });
        }
        
        if (req.user.role !== "admin") {
          return res.status(403).json({ message: "Forbidden: Admin access required" });
        }
        
        // First create a message with the payment request
        const message = await storage.createMessage({
          content: messageContent || `Payment Request: $${amount} - ${description}`,
          projectId,
          senderId: req.user.id,
          attachments: { 
            type: "payment_request",
            amount,
            description,
            status: "pending"
          }
        });
        
        // Create a payment record
        const payment = await storage.createPayment({
          amount: parseFloat(amount),
          currency: "usd",
          description,
          projectId,
          userId, // Customer who will pay
          createdById: req.user.id, // Admin who created the request
          messageId: message.id
        });
        
        res.json({ 
          success: true,
          message,
          payment
        });
      } catch (error: any) {
        console.error("Error creating payment request:", error);
        res.status(500).json({ 
          message: "Error creating payment request", 
          error: error.message 
        });
      }
    });
    
    // Endpoint to verify payment after Stripe redirect
    app.get("/api/payment-verify", async (req, res) => {
      try {
        const { payment_intent } = req.query;
        
        if (!payment_intent || typeof payment_intent !== 'string') {
          return res.status(400).json({ 
            success: false,
            message: "Missing payment intent ID" 
          });
        }
        
        // Verify the payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);
        
        if (!paymentIntent || paymentIntent.status !== 'succeeded') {
          return res.status(400).json({
            success: false,
            message: "Payment verification failed"
          });
        }
        
        // Find the payment in our database
        const payments = await storage.getAllPayments();
        const payment = payments.find(p => p.stripePaymentIntentId === payment_intent);
        
        if (!payment) {
          return res.status(404).json({
            success: false,
            message: "Payment record not found"
          });
        }
        
        // Update payment status if needed
        if (payment.status !== 'completed') {
          await storage.updatePaymentStatus(payment.id, 'completed');
          
          // Create activity record
          await storage.createActivity({
            type: "payment",
            description: `Payment of $${payment.amount} has been completed`,
            projectId: payment.projectId,
            userId: payment.userId,
            referenceId: payment.id,
            referenceType: "payment",
            isRead: false
          });
        }
        
        res.json({
          success: true,
          payment: {
            ...payment,
            status: 'completed'
          }
        });
      } catch (error: any) {
        console.error("Error verifying payment:", error);
        res.status(500).json({
          success: false,
          message: "Error verifying payment: " + error.message
        });
      }
    });
    
    // Endpoint to update payment status
    app.patch("/api/payments/:id/status", authMiddleware, async (req, res) => {
      try {
        const paymentId = parseInt(req.params.id);
        const { status } = req.body;
        
        // Validate status
        if (!["pending", "completed", "failed", "canceled"].includes(status)) {
          return res.status(400).json({ message: "Invalid status value" });
        }
        
        // Check permissions
        if (req.user?.role !== "admin") {
          return res.status(403).json({ message: "Forbidden: Admin access required" });
        }
        
        const updatedPayment = await storage.updatePaymentStatus(paymentId, status);
        
        if (!updatedPayment) {
          return res.status(404).json({ message: "Payment not found" });
        }
        
        res.json({ payment: updatedPayment });
      } catch (error: any) {
        console.error("Error updating payment status:", error);
        res.status(500).json({ 
          message: "Error updating payment status", 
          error: error.message 
        });
      }
    });
    
    // Move the admin routes before any wildcard routes
    
    // Admin endpoint to get all payments
    app.get("/api/payments/admin", authMiddleware, async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Not authenticated" });
        }

        if (req.user.role !== "admin") {
          return res.status(403).json({ message: "Forbidden: Admin access required" });
        }
        
        const payments = await storage.getAllPayments();
        res.json({ payments });
      } catch (error: any) {
        console.error("Error getting payments:", error);
        res.status(500).json({ 
          message: "Error getting payments", 
          error: error.message 
        });
      }
    });
    
    // Endpoint to get payment status
    app.get("/api/payments/:id", authMiddleware, async (req, res) => {
      try {
        const paymentId = parseInt(req.params.id);
        const payment = await storage.getPayment(paymentId);
        
        if (!payment) {
          return res.status(404).json({ message: "Payment not found" });
        }
        
        // Check if the user has access to this payment
        if (req.user?.role !== "admin" && req.user?.id !== payment.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        res.json({ payment });
      } catch (error: any) {
        console.error("Error getting payment:", error);
        res.status(500).json({ 
          message: "Error getting payment", 
          error: error.message 
        });
      }
    });
    
    // IMPORTANT: This route must come BEFORE the /api/payments/:id route
    // Endpoint for admin to get all payments
    app.get("/api/payments/admin", authMiddleware, async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Not authenticated" });
        }

        if (req.user.role !== "admin") {
          return res.status(403).json({ message: "Forbidden: Admin access required" });
        }
        
        const payments = await storage.getAllPayments();
        res.json({ payments });
      } catch (error: any) {
        console.error("Error getting payments:", error);
        res.status(500).json({ 
          message: "Error getting payments", 
          error: error.message 
        });
      }
    });
    
    // Endpoint to get project payments
    app.get("/api/projects/:projectId/payments", authMiddleware, async (req, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        
        const project = await storage.getProject(projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Check if the user has access to this project
        if (req.user?.role !== "admin" && req.user?.id !== project.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        const payments = await storage.getPaymentsByProject(projectId);
        res.json({ payments });
      } catch (error: any) {
        console.error("Error getting project payments:", error);
        res.status(500).json({ 
          message: "Error getting project payments", 
          error: error.message 
        });
      }
    });
    
    // Webhook for Stripe events
    app.post("/api/stripe-webhook", async (req, res) => {
      const signature = req.headers["stripe-signature"] as string;
      
      try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
          console.warn("Missing Stripe webhook secret");
          return res.status(400).send("Webhook secret not configured");
        }
        
        const event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        
        // Handle successful payments
        if (event.type === "payment_intent.succeeded") {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const { projectId, userId } = paymentIntent.metadata;
          
          // Update payment status in our database
          if (paymentIntent.id) {
            const payments = await storage.getAllPayments();
            const payment = payments.find(p => p.stripePaymentIntentId === paymentIntent.id);
            
            if (payment) {
              await storage.updatePaymentStatus(payment.id, "completed");
              
              // Create an activity record for this payment
              await storage.createActivity({
                type: "payment",
                description: `Payment of $${payment.amount} has been completed`,
                projectId: payment.projectId,
                userId: payment.userId,
                referenceId: payment.id,
                referenceType: "payment",
                isRead: false
              });
            }
          }
        }
        
        res.json({ received: true });
      } catch (error: any) {
        console.error("Error processing webhook:", error);
        return res.status(400).send(`Webhook Error: ${error.message}`);
      }
    });
  }

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    let userId: number | null = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Store user ID if it's provided for identification
        if (data.senderId && !userId) {
          userId = data.senderId;
          clients.set(userId, ws);
        }
        
        // Broadcast the message to all connected clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      // Remove client from tracking on disconnect
      if (userId) {
        clients.delete(userId);
      }
    });
  });

  // Live Tracking API endpoints
  app.get('/api/tracking', authMiddleware, async (req, res) => {
    try {
      const isAdmin = req.user?.role === 'admin';
      const trackingItems = isAdmin 
        ? await storage.getAllTrackingItems()
        : await storage.getActiveTrackingItems();
      
      res.json({ trackingItems });
    } catch (error: any) {
      console.error('Error fetching tracking items:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch tracking items' });
    }
  });
  
  app.get('/api/tracking/:id', authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid tracking item ID' });
      }
      
      const trackingItem = await storage.getTrackingItem(id);
      if (!trackingItem) {
        return res.status(404).json({ message: 'Tracking item not found' });
      }
      
      res.json({ trackingItem });
    } catch (error: any) {
      console.error('Error fetching tracking item:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch tracking item' });
    }
  });
  
  app.post('/api/tracking', authMiddleware, async (req, res) => {
    try {
      // Only admins can create tracking items
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized: Only admins can create tracking items' });
      }
      
      // Extract required data from request body
      const { name, url, type, description, key, thumbnailUrl } = req.body;
      
      if (!name || !url) {
        return res.status(400).json({ message: 'Name and URL are required' });
      }
      
      const trackingItemData = {
        name,
        url,
        type: type || 'website',
        description,
        key,
        thumbnailUrl,
        createdById: req.user.id
      };
      
      const trackingItem = await storage.createTrackingItem(trackingItemData);
      res.status(201).json({ trackingItem });
    } catch (error: any) {
      console.error('Error creating tracking item:', error);
      res.status(500).json({ message: error.message || 'Failed to create tracking item' });
    }
  });
  
  app.patch('/api/tracking/:id', authMiddleware, async (req, res) => {
    try {
      // Only admins can update tracking items
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized: Only admins can update tracking items' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid tracking item ID' });
      }
      
      const trackingItem = await storage.getTrackingItem(id);
      if (!trackingItem) {
        return res.status(404).json({ message: 'Tracking item not found' });
      }
      
      const updatedTrackingItem = await storage.updateTrackingItem(id, req.body);
      res.json({ trackingItem: updatedTrackingItem });
    } catch (error: any) {
      console.error('Error updating tracking item:', error);
      res.status(500).json({ message: error.message || 'Failed to update tracking item' });
    }
  });
  
  app.patch('/api/tracking/:id/toggle', authMiddleware, async (req, res) => {
    try {
      // Only admins can toggle tracking item status
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized: Only admins can toggle tracking item status' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid tracking item ID' });
      }
      
      const trackingItem = await storage.getTrackingItem(id);
      if (!trackingItem) {
        return res.status(404).json({ message: 'Tracking item not found' });
      }
      
      const updatedTrackingItem = await storage.toggleTrackingItemStatus(id);
      res.json({ trackingItem: updatedTrackingItem });
    } catch (error: any) {
      console.error('Error toggling tracking item status:', error);
      res.status(500).json({ message: error.message || 'Failed to toggle tracking item status' });
    }
  });
  
  app.delete('/api/tracking/:id', authMiddleware, async (req, res) => {
    try {
      // Only admins can delete tracking items
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized: Only admins can delete tracking items' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid tracking item ID' });
      }
      
      const trackingItem = await storage.getTrackingItem(id);
      if (!trackingItem) {
        return res.status(404).json({ message: 'Tracking item not found' });
      }
      
      const success = await storage.deleteTrackingItem(id);
      if (success) {
        res.json({ message: 'Tracking item deleted successfully' });
      } else {
        res.status(500).json({ message: 'Failed to delete tracking item' });
      }
    } catch (error: any) {
      console.error('Error deleting tracking item:', error);
      res.status(500).json({ message: error.message || 'Failed to delete tracking item' });
    }
  });

  // Register auth routes first (no auth required)
  registerAuthRoutes(app);
  
  // Apply auth middleware to all other API routes
  app.use('/api/projects', authMiddleware);
  app.use('/api/messages', authMiddleware);
  app.use('/api/files', authMiddleware);
  app.use('/api/activities', authMiddleware);
  
  // Apply help middleware
  app.use('/api/help', authMiddleware);
  
  // Register other route controllers
  registerProjectRoutes(app);
  registerMessageRoutes(app);
  registerTrackingRoutes(app);
  registerHelpRoutes(app);

  // Health check route (no auth needed)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return httpServer;
}
