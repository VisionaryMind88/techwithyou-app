import { pgTable, text, serial, integer, boolean, timestamp, jsonb, foreignKey } from "drizzle-orm/pg-core";
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
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
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
});

// MESSAGES
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  projectId: integer("project_id").notNull(),
  senderId: integer("sender_id").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  projectId: true,
  senderId: true,
  attachments: true,
});

// ACTIVITIES
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // message, file_upload, status_change, etc.
  description: text("description").notNull(),
  projectId: integer("project_id"),
  userId: integer("user_id").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  description: true,
  projectId: true,
  userId: true,
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

export const filesRelations = relations(files, ({ one }) => ({
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [files.userId],
    references: [users.id],
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

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
