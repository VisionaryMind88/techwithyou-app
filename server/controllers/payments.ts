import { Request, Response } from "express";
import { Express } from "express";
import { z } from "zod";
import Stripe from "stripe";
import { AuthRequest } from "./auth";
import { storage } from "../storage";
import { insertPaymentSchema } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

// Schema for creating a payment intent
const paymentIntentSchema = z.object({
  amount: z.number().positive(),
  description: z.string(),
  projectId: z.number().positive(),
  messageId: z.number().positive(),
  paymentId: z.number().positive().optional(),
});

// Schema for updating payment status
const paymentStatusSchema = z.object({
  status: z.enum(["pending", "completed", "failed", "canceled"]),
  stripePaymentIntentId: z.string().optional(),
});

export function registerPaymentRoutes(app: Express) {
  // Create a payment intent
  app.post("/api/payment-intent", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validation = paymentIntentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }

      const { amount, description, projectId, messageId, paymentId } = validation.data;

      // If paymentId is provided, get the existing payment
      let payment;
      if (paymentId) {
        payment = await storage.getPayment(paymentId);
        if (!payment) {
          return res.status(404).json({ message: "Payment not found" });
        }
        
        // Verify the payment belongs to the current user
        if (payment.userId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        // Check if payment is already processed
        if (payment.status !== "pending") {
          return res.status(400).json({ message: `Cannot process payment with status: ${payment.status}` });
        }
      } else {
        // Create a new payment record if paymentId is not provided
        payment = await storage.createPayment({
          amount,
          description,
          status: "pending",
          userId: req.user.id,
          projectId,
          messageId,
        });
      }

      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          paymentId: payment.id.toString(),
          projectId: projectId.toString(),
          messageId: messageId.toString(),
          userId: req.user.id.toString(),
        },
      });

      // Update the payment with the Stripe payment intent ID
      await storage.updatePayment(payment.id, {
        stripePaymentIntentId: paymentIntent.id,
      });

      // Create an activity for the payment
      await storage.createActivity({
        type: "payment_intent_created",
        description: `Payment intent created for $${amount}`,
        userId: req.user.id,
        projectId,
        isRead: false,
        metadata: {
          paymentId: payment.id,
          amount,
          description,
        },
      });

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      return res.status(500).json({ message: "Failed to create payment intent", error: error.message });
    }
  });

  // Update payment status
  app.patch("/api/payments/:id/status", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }

      const validation = paymentStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }

      const { status, stripePaymentIntentId } = validation.data;

      // Get the payment
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Check if user is authorized to update the payment
      // Allow both the payment owner and admin users to update
      if (payment.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Update payment status
      const updatedPayment = await storage.updatePaymentStatus(paymentId, status, stripePaymentIntentId);

      if (!updatedPayment) {
        return res.status(500).json({ message: "Failed to update payment status" });
      }

      // Create an activity for the payment status update
      await storage.createActivity({
        type: "payment_status_updated",
        description: `Payment status updated to ${status}`,
        userId: req.user.id,
        projectId: payment.projectId,
        isRead: false,
        metadata: {
          paymentId,
          status,
          previousStatus: payment.status,
        },
      });

      return res.status(200).json(updatedPayment);
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      return res.status(500).json({ message: "Failed to update payment status", error: error.message });
    }
  });

  // Get payment by ID
  app.get("/api/payments/:id", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }

      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Check if user is authorized to view the payment
      // Allow both the payment owner and admin users to view
      if (payment.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      return res.status(200).json(payment);
    } catch (error: any) {
      console.error("Error getting payment:", error);
      return res.status(500).json({ message: "Failed to get payment", error: error.message });
    }
  });

  // Get payments by project
  app.get("/api/payments/project/:id", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Get the project to check authorization
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is authorized to view the project's payments
      // Allow both the project owner and admin users to view
      if (project.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payments = await storage.getPaymentsByProject(projectId);
      return res.status(200).json({ payments });
    } catch (error: any) {
      console.error("Error getting project payments:", error);
      return res.status(500).json({ message: "Failed to get project payments", error: error.message });
    }
  });

  // Get payments for the current user
  app.get("/api/payments/user", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const payments = await storage.getPaymentsByUser(req.user.id);
      return res.status(200).json({ payments });
    } catch (error: any) {
      console.error("Error getting user payments:", error);
      return res.status(500).json({ message: "Failed to get user payments", error: error.message });
    }
  });

  // Admin: Get all payments
  app.get("/api/payments/admin", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payments = await storage.getAllPayments();
      return res.status(200).json({ payments });
    } catch (error: any) {
      console.error("Error getting all payments:", error);
      return res.status(500).json({ message: "Failed to get all payments", error: error.message });
    }
  });

  // Admin: Get pending payments
  app.get("/api/payments/admin/pending", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payments = await storage.getPendingPayments();
      return res.status(200).json({ payments });
    } catch (error: any) {
      console.error("Error getting pending payments:", error);
      return res.status(500).json({ message: "Failed to get pending payments", error: error.message });
    }
  });

  // Create payment request as admin
  app.post("/api/payments/request", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validation = insertPaymentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
      }

      // Create the payment
      const payment = await storage.createPayment(validation.data);

      // Create a message with payment request
      const message = await storage.createMessage({
        content: `Payment request: ${validation.data.description}`,
        projectId: validation.data.projectId,
        senderId: req.user.id,
        isRead: false,
        attachments: {
          type: "payment_request",
          paymentId: payment.id,
          amount: validation.data.amount,
          description: validation.data.description,
          status: validation.data.status || "pending",
        },
      });

      // Update the payment with the message ID
      await storage.updatePayment(payment.id, {
        messageId: message.id,
      });

      // Create an activity for the payment request
      await storage.createActivity({
        type: "payment_request_created",
        description: `Payment request created for $${validation.data.amount}`,
        userId: validation.data.userId,
        projectId: validation.data.projectId,
        isRead: false,
        metadata: {
          paymentId: payment.id,
          messageId: message.id,
          amount: validation.data.amount,
          description: validation.data.description,
        },
      });

      return res.status(201).json({ payment, message });
    } catch (error: any) {
      console.error("Error creating payment request:", error);
      return res.status(500).json({ message: "Failed to create payment request", error: error.message });
    }
  });
}