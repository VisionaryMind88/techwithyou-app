import { 
  users, 
  projects, 
  files, 
  messages, 
  activities,
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type File,
  type InsertFile,
  type Message,
  type InsertMessage,
  type Activity,
  type InsertActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, isNotNull } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByRememberToken(token: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
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
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
  
  async getUserByRememberToken(token: string): Promise<User[]> {
    const foundUsers = await db.select()
      .from(users)
      .where(eq(users.rememberToken, token));
    return foundUsers;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
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
    return await db.select().from(files).where(eq(files.projectId, projectId));
  }

  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values(file).returning();
    return newFile;
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
    return await db
      .select()
      .from(messages)
      .where(eq(messages.isRead, false))
      .orderBy(desc(messages.createdAt));
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
}

// Use DatabaseStorage for data persistence
export const storage = new DatabaseStorage();