import { pgTable, text, serial, integer, boolean, timestamp, jsonb, foreignKey, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// USERS
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("customer"), // customer or admin
  provider: text("provider"), // local, google, github
  providerId: text("provider_id"),
  rememberToken: text("remember_token"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
  provider: true,
  providerId: true,
  rememberToken: true,
});

// Strong password validation schema
export const strongPasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Enhanced user schema with password validation
export const enhancedUserSchema = insertUserSchema.extend({
  password: strongPasswordSchema.nullable(),
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional().default(false),
  userRole: z.enum(['admin', 'customer']).optional().default('customer'),
});

// PROJECTS
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  budget: text("budget"),
  targetDate: text("target_date"),
  status: text("status").notNull().default("pending_approval"), // pending_approval, approved, in_progress, completed, rejected
  userId: integer("user_id").notNull(), // Reference to customer who created the project
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  type: true,
  budget: true,
  targetDate: true,
  userId: true,
});

// FILES
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  isLatestVersion: boolean("is_latest_version").notNull().default(true),
  versionNumber: integer("version_number").notNull().default(1),
  parentFileId: integer("parent_file_id"),  // For versions, refers to the original file
  versionNote: text("version_note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFileSchema = createInsertSchema(files).pick({
  filename: true,
  originalName: true,
  mimeType: true,
  size: true,
  path: true,
  projectId: true,
  userId: true,
  isLatestVersion: true,
  versionNumber: true,
  parentFileId: true,
  versionNote: true,
});

// MESSAGES
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  projectId: integer("project_id").notNull(),
  senderId: integer("sender_id").notNull(),
  recipientId: integer("recipient_id"), // For direct messages
  isRead: boolean("is_read").notNull().default(false),
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  projectId: true,
  senderId: true,
  recipientId: true,
  attachments: true,
});

// ACTIVITIES
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // message, file_upload, status_change, etc.
  description: text("description").notNull(),
  projectId: integer("project_id"),
  userId: integer("user_id").notNull(),
  referenceId: integer("reference_id"),  // ID of the related item (project, message, etc.)
  referenceType: text("reference_type"),  // Type of reference (project, message, etc.)
  isRead: boolean("is_read").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  description: true,
  projectId: true,
  userId: true,
  referenceId: true,
  referenceType: true,
  isRead: true,
  metadata: true,
});

// Define relationships between tables
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  files: many(files),
  messages: many(messages),
  activities: many(activities),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  files: many(files),
  messages: many(messages),
  activities: many(activities),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [files.userId],
    references: [users.id],
  }),
  parentFile: one(files, {
    fields: [files.parentFileId],
    references: [files.id],
  }),
  versions: many(files, {
    relationName: 'fileVersions',
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [activities.projectId],
    references: [projects.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// PAYMENTS
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull().default("pending"), // pending, completed, failed, canceled
  description: text("description"),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(), // customer who will make the payment
  createdById: integer("created_by_id").notNull(), // admin who created the payment request
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  messageId: integer("message_id"), // related message with payment request
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  amount: true,
  currency: true,
  description: true,
  projectId: true,
  userId: true,
  createdById: true,
  messageId: true,
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  project: one(projects, {
    fields: [payments.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [payments.createdById],
    references: [users.id],
  }),
  message: one(messages, {
    fields: [payments.messageId],
    references: [messages.id],
  }),
}));

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Tracking items schema
export const trackingItems = pgTable("tracking_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default("website"),
  key: varchar("key", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdById: integer("created_by_id").notNull().references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
});

export const insertTrackingItemSchema = createInsertSchema(trackingItems).pick({
  name: true,
  url: true,
  type: true,
  key: true,
  description: true,
  thumbnailUrl: true,
  createdById: true,
});

export const trackingItemsRelations = relations(trackingItems, ({ one }) => ({
  createdBy: one(users, {
    fields: [trackingItems.createdById],
    references: [users.id],
  }),
}));

export type TrackingItem = typeof trackingItems.$inferSelect;
export type InsertTrackingItem = z.infer<typeof insertTrackingItemSchema>;
