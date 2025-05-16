import { 
  users, 
  projects, 
  files, 
  messages, 
  activities,
  payments,
  trackingItems,
  helpQuestions,
  helpFeedback,
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type File,
  type InsertFile,
  type Message,
  type InsertMessage,
  type Activity,
  type InsertActivity,
  type Payment,
  type InsertPayment,
  type TrackingItem,
  type InsertTrackingItem,
  type HelpQuestion,
  type InsertHelpQuestion,
  type HelpFeedback,
  type InsertHelpFeedback
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, isNull, isNotNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByRememberToken(token: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User>;
  
  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined>;
  updateProjectStatus(id: number, status: string): Promise<Project | undefined>;
  
  // Files
  getFile(id: number): Promise<File | undefined>;
  getFilesByProject(projectId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  getFileVersions(fileId: number): Promise<File[]>;
  createFileVersion(file: InsertFile, parentFileId: number, versionNote?: string): Promise<File>;
  getLatestFileVersion(fileId: number): Promise<File | undefined>;
  
  // Messages
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByProject(projectId: number): Promise<Message[]>;
  getRecentMessages(userId: number, limit?: number): Promise<Message[]>;
  getUnreadMessages(adminId?: boolean): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  
  // Activities
  getActivity(id: number): Promise<Activity | undefined>;
  getRecentActivities(limit?: number): Promise<Activity[]>;
  getUserActivities(userId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, updates: Partial<Activity>): Promise<Activity | undefined>;
  
  // Payments
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  getPaymentsByProject(projectId: number): Promise<Payment[]>;
  getAllPayments(limit?: number): Promise<Payment[]>;
  getPendingPayments(): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, updates: Partial<Payment>): Promise<Payment | undefined>;
  updatePaymentStatus(id: number, status: string, stripePaymentIntentId?: string): Promise<Payment | undefined>;
  
  // Live Tracking
  getTrackingItem(id: number): Promise<TrackingItem | undefined>;
  getAllTrackingItems(): Promise<TrackingItem[]>;
  getActiveTrackingItems(): Promise<TrackingItem[]>;
  createTrackingItem(item: InsertTrackingItem): Promise<TrackingItem>;
  updateTrackingItem(id: number, updates: Partial<TrackingItem>): Promise<TrackingItem | undefined>;
  toggleTrackingItemStatus(id: number): Promise<TrackingItem | undefined>;
  deleteTrackingItem(id: number): Promise<boolean>;
  
  // Help System
  getHelpQuestion(id: number): Promise<HelpQuestion | undefined>;
  getHelpQuestionsByUser(userId: number): Promise<HelpQuestion[]>;
  logHelpQuestion(question: InsertHelpQuestion): Promise<HelpQuestion>;
  resolveHelpQuestion(id: number): Promise<HelpQuestion | undefined>;
  saveHelpFeedback(feedback: InsertHelpFeedback): Promise<HelpFeedback>;
}

export class DatabaseStorage implements IStorage {
  
  // Live Tracking methods
  async getTrackingItem(id: number): Promise<TrackingItem | undefined> {
    const [trackingItem] = await db
      .select()
      .from(trackingItems)
      .where(eq(trackingItems.id, id));
    return trackingItem;
  }
  
  async getAllTrackingItems(): Promise<TrackingItem[]> {
    return await db
      .select()
      .from(trackingItems)
      .orderBy(desc(trackingItems.createdAt));
  }
  
  async getActiveTrackingItems(): Promise<TrackingItem[]> {
    return await db
      .select()
      .from(trackingItems)
      .where(eq(trackingItems.isActive, true))
      .orderBy(desc(trackingItems.createdAt));
  }
  
  async createTrackingItem(item: InsertTrackingItem): Promise<TrackingItem> {
    const [trackingItem] = await db
      .insert(trackingItems)
      .values(item)
      .returning();
    return trackingItem;
  }
  
  async updateTrackingItem(id: number, updates: Partial<TrackingItem>): Promise<TrackingItem | undefined> {
    // Update updatedAt timestamp
    const updatedValues = {
      ...updates,
      updatedAt: new Date(),
    };
    
    const [trackingItem] = await db
      .update(trackingItems)
      .set(updatedValues)
      .where(eq(trackingItems.id, id))
      .returning();
    return trackingItem;
  }
  
  async toggleTrackingItemStatus(id: number): Promise<TrackingItem | undefined> {
    // First get the current status
    const trackingItem = await this.getTrackingItem(id);
    if (!trackingItem) return undefined;
    
    // Toggle the status
    const [updatedItem] = await db
      .update(trackingItems)
      .set({
        isActive: !trackingItem.isActive,
        updatedAt: new Date(),
      })
      .where(eq(trackingItems.id, id))
      .returning();
    return updatedItem;
  }
  
  async deleteTrackingItem(id: number): Promise<boolean> {
    const result = await db
      .delete(trackingItems)
      .where(eq(trackingItems.id, id));
    return !!result;
  }
  
  // Payment-related methods
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }
  
  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }
  
  async getPaymentsByProject(projectId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.projectId, projectId));
  }
  
  async getAllPayments(limit: number = 100): Promise<Payment[]> {
    return await db.select().from(payments).limit(limit);
  }
  
  async getPendingPayments(): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.status, "pending"));
  }
  
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }
  
  async updatePayment(id: number, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }
  
  async updatePaymentStatus(id: number, status: string, stripePaymentIntentId?: string): Promise<Payment | undefined> {
    const updates: Partial<Payment> = {
      status,
      updatedAt: new Date(),
    };
    
    if (stripePaymentIntentId) {
      updates.stripePaymentIntentId = stripePaymentIntentId;
    }
    
    const [updatedPayment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  // Users
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Select specific columns to avoid profile_picture issue
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          password: users.password,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          provider: users.provider,
          providerId: users.providerId,
          rememberToken: users.rememberToken,
          stripeCustomerId: users.stripeCustomerId,
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.id, id));
      
      if (!user) return undefined;
      
      // Add profilePicture property manually
      return {
        ...user,
        profilePicture: null
      };
    } catch (error) {
      console.error("Error in getUser:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      // Select specific columns to avoid profile_picture issue
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          password: users.password,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          provider: users.provider,
          providerId: users.providerId,
          rememberToken: users.rememberToken,
          stripeCustomerId: users.stripeCustomerId,
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.email, email));
      
      if (!user) return undefined;
      
      // Add profilePicture property manually
      return {
        ...user,
        profilePicture: null
      };
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      return undefined;
    }
  }
  
  async getUserByRememberToken(token: string): Promise<User[]> {
    try {
      const foundUsers = await db.select({
        id: users.id,
        email: users.email,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        provider: users.provider,
        providerId: users.providerId,
        rememberToken: users.rememberToken,
        stripeCustomerId: users.stripeCustomerId,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.rememberToken, token));
      
      // Add profilePicture property to each user
      return foundUsers.map(user => ({ ...user, profilePicture: null }));
    } catch (error) {
      console.error("Error in getUserByRememberToken:", error);
      return [];
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        provider: users.provider,
        providerId: users.providerId,
        rememberToken: users.rememberToken,
        stripeCustomerId: users.stripeCustomerId,
        createdAt: users.createdAt
      }).from(users);
      
      // Add profilePicture property to each user
      return allUsers.map(user => ({ ...user, profilePicture: null }));
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      return [];
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      console.log('Storage: updateUser called with id:', id, 'and updates:', updates);
      
      // Create a safe update object that doesn't include any undefined values
      const safeUpdates: Record<string, any> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          safeUpdates[key] = value;
        }
      });
      
      console.log('Storage: filtered updates:', safeUpdates);
      
      // Only proceed if there are actual updates to make
      if (Object.keys(safeUpdates).length === 0) {
        console.log('Storage: No valid updates provided, fetching current user');
        const currentUser = await this.getUser(id);
        return currentUser;
      }
      
      const [updatedUser] = await db
        .update(users)
        .set(safeUpdates)
        .where(eq(users.id, id))
        .returning();
      
      console.log('Storage: User updated successfully:', updatedUser?.email);
      return updatedUser || undefined;
    } catch (error) {
      console.error('Storage: Error in updateUser:', error);
      throw error;
    }
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject || undefined;
  }

  async updateProjectStatus(id: number, status: string): Promise<Project | undefined> {
    return this.updateProject(id, { status });
  }

  // Files
  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async getFilesByProject(projectId: number): Promise<File[]> {
    // Only return the latest versions of files by default
    return await db.select().from(files)
      .where(and(
        eq(files.projectId, projectId),
        eq(files.isLatestVersion, true)
      ));
  }

  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values({
      ...file,
      versionNumber: 1,
      isLatestVersion: true
    }).returning();
    return newFile;
  }
  
  async getFileVersions(fileId: number): Promise<File[]> {
    // Get the root file (the original upload)
    const rootFile = await this.getFile(fileId);
    if (!rootFile) return [];
    
    // If this is a version, get its parent
    const parentId = rootFile.parentFileId || rootFile.id;
    
    // Get all versions of this file (including the original)
    return await db.select().from(files).where(
      or(
        eq(files.id, parentId),
        eq(files.parentFileId, parentId)
      )
    ).orderBy(desc(files.versionNumber));
  }
  
  async createFileVersion(file: InsertFile, parentFileId: number, versionNote?: string): Promise<File> {
    // Get the parent file
    const parentFile = await this.getFile(parentFileId);
    if (!parentFile) {
      throw new Error("Parent file not found");
    }
    
    // Get the root file ID (might be parent or parent's parent)
    const rootFileId = parentFile.parentFileId || parentFile.id;
    
    // Get the highest version number using SQL aggregate
    const [highestVersion] = await db.select({ 
      maxVersion: sql`MAX(${files.versionNumber})` 
    }).from(files).where(
      or(
        eq(files.id, rootFileId),
        eq(files.parentFileId, rootFileId)
      )
    );
    
    const nextVersion = (highestVersion?.maxVersion || 0) + 1;
    
    // Mark all existing versions as not latest
    await db.update(files)
      .set({ isLatestVersion: false })
      .where(
        or(
          eq(files.id, rootFileId),
          eq(files.parentFileId, rootFileId)
        )
      );
    
    // Create the new version
    const [newVersion] = await db.insert(files).values({
      ...file,
      parentFileId: rootFileId,
      versionNumber: nextVersion,
      isLatestVersion: true,
      versionNote: versionNote || `Version ${nextVersion}`
    }).returning();
    
    return newVersion;
  }
  
  async getLatestFileVersion(fileId: number): Promise<File | undefined> {
    // Get the root file (the original upload)
    const rootFile = await this.getFile(fileId);
    if (!rootFile) return undefined;
    
    // If this is a version, get its parent
    const parentId = rootFile.parentFileId || rootFile.id;
    
    // Get the latest version
    const [latestVersion] = await db.select().from(files).where(
      and(
        or(
          eq(files.id, parentId),
          eq(files.parentFileId, parentId)
        ),
        eq(files.isLatestVersion, true)
      )
    );
    
    return latestVersion;
  }

  // Messages
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async getMessagesByProject(projectId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.projectId, projectId))
      .orderBy(desc(messages.createdAt));
  }

  async getRecentMessages(userId: number, limit: number = 10): Promise<Message[]> {
    // This is a simplified implementation - in a real app, you would join with projects
    // to find messages for projects where this user is a participant
    return await db
      .select()
      .from(messages)
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async getUnreadMessages(isAdmin: boolean = false): Promise<Message[]> {
    try {
      // If we're an admin, we want to see all unread messages
      if (isAdmin) {
        return await db
          .select()
          .from(messages)
          .where(eq(messages.isRead, false))
          .orderBy(desc(messages.createdAt));
      } else {
        // For regular users, we'd filter by recipient but we'll implement this later
        return await db
          .select()
          .from(messages)
          .where(eq(messages.isRead, false))
          .orderBy(desc(messages.createdAt));
      }
    } catch (error) {
      console.error("Error fetching unread messages:", error);
      // Return empty array if there's a database error to prevent crashes
      return [];
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({ ...message, isRead: false })
      .returning();
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage || undefined;
  }

  // Activities
  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }
  
  async getUserActivities(userId: number, limit: number = 10): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }
  
  async updateActivity(id: number, updates: Partial<Activity>): Promise<Activity | undefined> {
    const [updatedActivity] = await db
      .update(activities)
      .set(updates)
      .where(eq(activities.id, id))
      .returning();
    return updatedActivity || undefined;
  }
  
  // Delete a user
  async deleteUser(id: number): Promise<boolean> {
    try {
      // First, delete related data for this user
      // Note: In a production environment, you might want to soft-delete or archive these instead
      
      // Delete user's activities
      await db.delete(activities).where(eq(activities.userId, id));
      
      // Delete user's messages
      await db.delete(messages).where(eq(messages.senderId, id));
      
      // Delete user's files
      await db.delete(files).where(eq(files.userId, id));
      
      // Delete user's projects
      await db.delete(projects).where(eq(projects.userId, id));
      
      // Finally, delete the user
      const deletedUser = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();
      
      return deletedUser.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  
  // Help System methods
  async getHelpQuestion(id: number): Promise<HelpQuestion | undefined> {
    try {
      const [question] = await db.select().from(helpQuestions).where(eq(helpQuestions.id, id));
      return question;
    } catch (error) {
      console.error("Error getting help question:", error);
      return undefined;
    }
  }
  
  async getHelpQuestionsByUser(userId: number): Promise<HelpQuestion[]> {
    try {
      return await db.select().from(helpQuestions).where(eq(helpQuestions.userId, userId));
    } catch (error) {
      console.error("Error getting help questions by user:", error);
      return [];
    }
  }
  
  async logHelpQuestion(question: InsertHelpQuestion): Promise<HelpQuestion> {
    try {
      const [newQuestion] = await db.insert(helpQuestions).values(question).returning();
      return newQuestion;
    } catch (error) {
      console.error("Error logging help question:", error);
      throw error;
    }
  }
  
  async resolveHelpQuestion(id: number): Promise<HelpQuestion | undefined> {
    try {
      const [updatedQuestion] = await db
        .update(helpQuestions)
        .set({ isResolved: true })
        .where(eq(helpQuestions.id, id))
        .returning();
      return updatedQuestion;
    } catch (error) {
      console.error("Error resolving help question:", error);
      return undefined;
    }
  }
  
  async saveHelpFeedback(feedback: InsertHelpFeedback): Promise<HelpFeedback> {
    try {
      const [newFeedback] = await db.insert(helpFeedback).values(feedback).returning();
      return newFeedback;
    } catch (error) {
      console.error("Error saving help feedback:", error);
      throw error;
    }
  }
}

// Use DatabaseStorage for data persistence
export const storage = new DatabaseStorage();