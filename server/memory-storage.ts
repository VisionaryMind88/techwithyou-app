import { 
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
import { IStorage } from "./storage";

// In-memory storage implementation
export class MemoryStorage implements IStorage {
  private users: User[] = [
    {
      id: 1,
      email: 'admin@techwithyou.com',
      password: '$2b$10$36gEJ1fGXMadVgxCH7KNp.7MF.hFxgAuOjYyLCsTsCJu9p72ZJrUu', // Admin@123
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      provider: 'local',
      providerId: null,
      rememberToken: null,
      createdAt: new Date()
    },
    {
      id: 2,
      email: 'customer@techwithyou.com',
      password: '$2b$10$C2iQOGkLuQHKOjHwTVnrO.5Obw0sV6yMYXLutVTiLRU7wC3qP5d/q', // Customer@123
      firstName: 'Customer',
      lastName: 'User',
      role: 'customer',
      provider: 'local',
      providerId: null,
      rememberToken: null,
      createdAt: new Date()
    }
  ];
  
  private projects: Project[] = [
    {
      id: 1,
      name: 'Website Redesign',
      description: 'Need a complete redesign of our company website using modern technologies',
      type: 'Web Development',
      budget: '$5,000 - $10,000',
      targetDate: '2025-08-01',
      status: 'in_progress',
      userId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  private messages: Message[] = [
    {
      id: 1,
      content: 'Welcome to your project! We\'ll be starting work on this shortly.',
      projectId: 1,
      senderId: 1,
      recipientId: 2,
      isRead: false,
      createdAt: new Date()
    }
  ];
  
  private files: File[] = [];
  private activities: Activity[] = [];
  private nextId = {
    users: 3,
    projects: 2,
    files: 1,
    messages: 2,
    activities: 1
  };

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async getUserByRememberToken(token: string): Promise<User[]> {
    return this.users.filter(user => user.rememberToken === token);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = {
      ...user,
      id: this.nextId.users++,
      createdAt: new Date()
    } as User;
    
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    
    if (index === -1) return undefined;
    
    this.users[index] = { ...this.users[index], ...updates };
    return this.users[index];
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.find(project => project.id === id);
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    return this.projects.filter(project => project.userId === userId);
  }

  async getAllProjects(): Promise<Project[]> {
    return [...this.projects];
  }

  async createProject(project: InsertProject): Promise<Project> {
    const newProject = {
      ...project,
      id: this.nextId.projects++,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: project.status || 'pending_approval'
    } as Project;
    
    this.projects.push(newProject);
    return newProject;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const index = this.projects.findIndex(project => project.id === id);
    
    if (index === -1) return undefined;
    
    this.projects[index] = { 
      ...this.projects[index], 
      ...updates,
      updatedAt: new Date() 
    };
    
    return this.projects[index];
  }

  async updateProjectStatus(id: number, status: string): Promise<Project | undefined> {
    return this.updateProject(id, { status });
  }

  // File methods
  async getFile(id: number): Promise<File | undefined> {
    return this.files.find(file => file.id === id);
  }

  async getFilesByProject(projectId: number): Promise<File[]> {
    return this.files.filter(file => file.projectId === projectId);
  }

  async createFile(file: InsertFile): Promise<File> {
    const newFile = {
      ...file,
      id: this.nextId.files++,
      createdAt: new Date()
    } as File;
    
    this.files.push(newFile);
    return newFile;
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.find(message => message.id === id);
  }

  async getMessagesByProject(projectId: number): Promise<Message[]> {
    return this.messages
      .filter(message => message.projectId === projectId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getRecentMessages(userId: number, limit: number = 10): Promise<Message[]> {
    return this.messages
      .filter(message => message.senderId === userId || message.recipientId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getUnreadMessages(isAdmin: boolean = false): Promise<Message[]> {
    if (isAdmin) {
      return this.messages.filter(message => !message.isRead && message.recipientId === null);
    } else {
      return this.messages.filter(message => !message.isRead);
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage = {
      ...message,
      id: this.nextId.messages++,
      isRead: false,
      createdAt: new Date()
    } as Message;
    
    this.messages.push(newMessage);
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const index = this.messages.findIndex(message => message.id === id);
    
    if (index === -1) return undefined;
    
    this.messages[index] = { ...this.messages[index], isRead: true };
    return this.messages[index];
  }

  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.find(activity => activity.id === id);
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return this.activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const newActivity = {
      ...activity,
      id: this.nextId.activities++,
      createdAt: new Date()
    } as Activity;
    
    this.activities.push(newActivity);
    return newActivity;
  }
}