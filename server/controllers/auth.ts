import { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { storage } from "../storage";
import { loginUserSchema, insertUserSchema } from "@shared/schema";
import { AuthRequest } from "../middleware/auth";

// Extend express-session
import "express-session";

// Helper function to find or create user from OAuth profile
async function findOrCreateUserFromOAuth(profile: {
  email: string;
  firstName?: string;
  lastName?: string;
  provider: string;
  providerId: string;
}) {
  // Check if user exists with this email
  let user = await storage.getUserByEmail(profile.email);
  
  if (user) {
    // Update provider info if the user exists but hasn't used this provider before
    if (user.provider !== profile.provider || user.providerId !== profile.providerId) {
      user = await storage.updateUser(user.id, {
        provider: profile.provider,
        providerId: profile.providerId
      });
    }
  } else {
    // Create new user
    user = await storage.createUser({
      email: profile.email,
      firstName: profile.firstName || null,
      lastName: profile.lastName || null,
      password: null, // No password for OAuth users
      role: 'customer', // Default role for new users
      provider: profile.provider,
      providerId: profile.providerId,
    });
    
    // Create activity for new user registration
    await storage.createActivity({
      type: 'user_registered',
      description: `User registered via ${profile.provider}`,
      userId: user.id,
      projectId: null,
      metadata: null
    });
  }
  
  return user;
}

export function registerAuthRoutes(app: Express) {
  // Check if email exists and return user role for login form
  app.get("/api/auth/check-email", async (req: Request, res: Response) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (user) {
        res.json({ 
          exists: true, 
          role: user.role 
        });
      } else {
        res.json({ exists: false });
      }
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
  app.post("/api/auth/login", async (req: AuthRequest, res: Response) => {
    try {
      const { email, password, rememberMe = false, userRole } = req.body;
      
      // Validate login data
      const validationResult = loginUserSchema.safeParse({ 
        email, 
        password, 
        rememberMe, 
        userRole 
      });
      
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
      
      // Check if user role matches requested role
      if (userRole && user.role !== userRole) {
        return res.status(403).json({ 
          message: `This account is registered as a ${user.role}, not as a ${userRole}.` 
        });
      }
      
      // Check password (if using local auth)
      if (user.provider === 'local' && user.password) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }
      }
      
      // Generate remember token if requested
      let rememberToken = null;
      if (rememberMe) {
        // Generate a secure random token
        const crypto = require('crypto');
        rememberToken = crypto.randomBytes(64).toString('hex');
        
        // Save token to user record
        await storage.updateUser(user.id, { rememberToken });
        
        // Set cookie for remember me (30 days)
        res.cookie('remember_token', rememberToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', 
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          sameSite: 'lax'
        });
        
        // Set longer session expiration (30 days)
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Create activity record for login
      await storage.createActivity({
        type: 'login',
        description: `User logged in (${user.role})`,
        userId: user.id,
        projectId: null,
        metadata: { rememberMe, role: user.role },
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      // Add remember token to response if generated
      const responseData = { ...userWithoutPassword };
      if (rememberToken) {
        responseData.rememberToken = rememberToken;
      }
      
      res.json(responseData);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get current user
  app.get("/api/auth/user", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = await storage.getUser(req.user.id);
      
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
  
  // Logout user
  app.post("/api/auth/logout", async (req: AuthRequest, res: Response) => {
    try {
      // Create activity record for logout if user is logged in
      if (req.user && req.user.id) {
        await storage.createActivity({
          type: 'logout',
          description: `User logged out (${req.user.role})`,
          userId: req.user.id,
          projectId: null,
          metadata: null,
        });
      }
      
      // Destroy session
      req.session.destroy((err: Error) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }
        
        res.json({ message: 'Logged out successfully' });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Endpoint to handle Google OAuth callback
  app.post("/api/auth/google-callback", async (req: AuthRequest, res: Response) => {
    try {
      const { email, firstName, lastName, providerId } = req.body;
      
      if (!email || !providerId) {
        return res.status(400).json({ message: 'Missing required OAuth data' });
      }
      
      // Find or create user with Google profile
      const user = await findOrCreateUserFromOAuth({
        email,
        firstName,
        lastName,
        provider: 'google',
        providerId
      });
      
      if (!user) {
        return res.status(500).json({ message: 'Failed to create or retrieve user' });
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Create activity record for login
      await storage.createActivity({
        type: 'login',
        description: `User logged in with Google (${user.role})`,
        userId: user.id,
        projectId: null,
        metadata: null,
      });
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Endpoint to handle GitHub OAuth callback
  app.post("/api/auth/github-callback", async (req: AuthRequest, res: Response) => {
    try {
      const { email, firstName, lastName, providerId } = req.body;
      
      if (!email || !providerId) {
        return res.status(400).json({ message: 'Missing required OAuth data' });
      }
      
      // Find or create user with GitHub profile
      const user = await findOrCreateUserFromOAuth({
        email,
        firstName,
        lastName,
        provider: 'github',
        providerId
      });
      
      if (!user) {
        return res.status(500).json({ message: 'Failed to create or retrieve user' });
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Create activity record for login
      await storage.createActivity({
        type: 'login',
        description: `User logged in with GitHub (${user.role})`,
        userId: user.id,
        projectId: null,
        metadata: null,
      });
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}
