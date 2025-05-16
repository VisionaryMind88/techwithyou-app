import type { Express } from "express";
import { createServer, type Server } from "http";
import { authMiddleware } from "./middleware/auth";
import { WebSocketServer, WebSocket } from "ws";
import { registerAuthRoutes } from "./controllers/auth";
import { registerProjectRoutes } from "./controllers/projects";
import { registerMessageRoutes } from "./controllers/messages";
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
    
    // Endpoint for admin to get all payments
    app.get("/api/payments/admin", authMiddleware, async (req, res) => {
      try {
        if (req.user?.role !== "admin") {
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

  // Register auth routes first (no auth required)
  registerAuthRoutes(app);
  
  // Apply auth middleware to all other API routes
  app.use('/api/projects', authMiddleware);
  app.use('/api/messages', authMiddleware);
  app.use('/api/files', authMiddleware);
  app.use('/api/activities', authMiddleware);
  
  // Register other route controllers
  registerProjectRoutes(app);
  registerMessageRoutes(app);

  // Health check route (no auth needed)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return httpServer;
}
