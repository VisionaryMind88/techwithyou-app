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

// Storage interface
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  createActivity(activity: InsertActivity): Promise<Activity>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private files: Map<number, File>;
  private messages: Map<number, Message>;
  private activities: Map<number, Activity>;
  
  private userIdCounter: number;
  private projectIdCounter: number;
  private fileIdCounter: number;
  private messageIdCounter: number;
  private activityIdCounter: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.files = new Map();
    this.messages = new Map();
    this.activities = new Map();
    
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.fileIdCounter = 1;
    this.messageIdCounter = 1;
    this.activityIdCounter = 1;
    
    // Initialize with an admin user
    this.createUser({
      email: "admin@example.com",
      password: "$2b$10$LMVHp5xAWvn8.XPiDPepN.lGnB4JQNJYVm4gJiAv0zPjSUJ4vKOyu", // password = "Admin123!"
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      provider: "local"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const newUser: User = { ...user, id, createdAt: now };
    this.users.set(id, newUser);
    
    // Create activity for new user registration
    if (user.role === 'customer') {
      this.createActivity({
        type: 'user_register',
        description: 'created a new account',
        userId: id,
        projectId: null,
        metadata: { email: user.email }
      });
    }
    
    return newUser;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.userId === userId
    );
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const now = new Date();
    const newProject: Project = { 
      ...project, 
      id, 
      status: 'pending_approval',
      createdAt: now, 
      updatedAt: now 
    };
    this.projects.set(id, newProject);
    
    // Create activity for new project
    this.createActivity({
      type: 'project_created',
      description: 'created a new project',
      userId: project.userId,
      projectId: id,
      metadata: { projectName: project.name }
    });
    
    return newProject;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { 
      ...project, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.projects.set(id, updatedProject);
    
    return updatedProject;
  }

  async updateProjectStatus(id: number, status: string): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const previousStatus = project.status;
    const updatedProject = await this.updateProject(id, { status });
    
    // Create activity for status change
    if (updatedProject) {
      this.createActivity({
        type: 'status_change',
        description: `changed project status from ${previousStatus} to ${status}`,
        userId: updatedProject.userId,
        projectId: id,
        metadata: { 
          projectName: updatedProject.name,
          previousStatus,
          newStatus: status
        }
      });
    }
    
    return updatedProject;
  }

  // File methods
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByProject(projectId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.projectId === projectId
    );
  }

  async createFile(file: InsertFile): Promise<File> {
    const id = this.fileIdCounter++;
    const now = new Date();
    const newFile: File = { ...file, id, createdAt: now };
    this.files.set(id, newFile);
    
    // Create activity for file upload
    this.createActivity({
      type: 'file_upload',
      description: 'uploaded a new file',
      userId: file.userId,
      projectId: file.projectId,
      metadata: { 
        fileName: file.originalName,
        fileSize: file.size
      }
    });
    
    return newFile;
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByProject(projectId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.projectId === projectId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getRecentMessages(userId: number, limit: number = 10): Promise<Message[]> {
    const userProjects = await this.getProjectsByUser(userId);
    const projectIds = userProjects.map(p => p.id);
    
    return Array.from(this.messages.values())
      .filter((message) => projectIds.includes(message.projectId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getUnreadMessages(isAdmin: boolean = false): Promise<Message[]> {
    let filteredMessages = Array.from(this.messages.values())
      .filter((message) => !message.isRead);
    
    if (isAdmin) {
      // For admins, get messages from customers
      const customerIds = Array.from(this.users.values())
        .filter(user => user.role === 'customer')
        .map(user => user.id);
      
      filteredMessages = filteredMessages.filter(
        message => customerIds.includes(message.senderId)
      );
    } else {
      // For customers, get messages from admins
      const adminIds = Array.from(this.users.values())
        .filter(user => user.role === 'admin')
        .map(user => user.id);
      
      filteredMessages = filteredMessages.filter(
        message => adminIds.includes(message.senderId)
      );
    }
    
    return filteredMessages.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const newMessage: Message = { 
      ...message, 
      id, 
      isRead: false,
      createdAt: now 
    };
    this.messages.set(id, newMessage);
    
    // Create activity for new message
    this.createActivity({
      type: 'message',
      description: 'sent a new message',
      userId: message.senderId,
      projectId: message.projectId,
      metadata: { messageId: id }
    });
    
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    
    return updatedMessage;
  }

  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const now = new Date();
    const newActivity: Activity = { ...activity, id, createdAt: now };
    this.activities.set(id, newActivity);
    
    return newActivity;
  }
}

export const storage = new MemStorage();
