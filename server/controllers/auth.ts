import { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { storage } from "../storage";
import { loginUserSchema, insertUserSchema } from "@shared/schema";
import { AuthRequest } from "../middleware/auth";

export function registerAuthRoutes(app: Express) {
  // Check if email exists
  app.get("/api/auth/check-email", async (req: Request, res: Response) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      const user = await storage.getUserByEmail(email);
      
      res.json({ exists: !!user });
    } catch (error) {
      console.error('Check email error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Register a new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = req.body;
      
      // Validate user data
      const validationResult = insertUserSchema.safeParse(userData);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid user data',
          errors: validationResult.error.errors 
        });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(409).json({ message: 'Email already exists' });
      }
      
      // Hash password if provided
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }
      
      // Create user
      const newUser = await storage.createUser(userData);
      
      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Login user
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Validate login data
      const validationResult = loginUserSchema.safeParse({ email, password });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid login data',
          errors: validationResult.error.errors 
        });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      // Check password (if using local auth)
      if (user.provider === 'local' && user.password) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get current user
  app.get("/api/auth/user", async (req: AuthRequest, res: Response) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Email parameter is required' });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}
