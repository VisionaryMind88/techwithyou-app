import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { Session } from "express-session";
import { User } from "@shared/schema";

// Extend express-session to include our custom properties
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// Extended Request interface to include user property and session data
export interface AuthRequest extends Request {
  user?: User;
  session: Session & {
    userId?: number;
    destroy(callback: (err: Error) => void): void;
  };
}

// Middleware to attach user to request if authenticated
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // Skip authentication for certain routes
  const noAuthRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/check-email',
    '/api/auth/google-callback',
    '/api/auth/github-callback',
    '/api/health'
  ];
  
  // Allow these routes without authentication
  if (noAuthRoutes.includes(req.path)) {
    return next();
  }

  try {
    // Debug auth info
    console.log('Auth middleware debug:', {
      path: req.path,
      sessionId: req.sessionID,
      sessionExists: !!req.session,
      userId: req.session?.userId,
      reqUser: !!req.user
    });
    
    // First check for user in session
    const userId = req.session?.userId;
    
    if (userId) {
      console.log(`Found userId ${userId} in session, fetching user...`);
      
      // Find user in the database
      const user = await storage.getUser(userId);
      console.log('Database lookup result:', user ? `Found user ${user.email}` : 'User not found');
      
      if (user) {
        // Attach user to request
        req.user = user;
        console.log('User attached to request');
        next();
        return;
      } else {
        // If user not found, clear the session
        console.log('User not found in database despite having userId in session');
        req.session.destroy((err: Error) => {
          if (err) console.error('Error destroying session:', err);
        });
      }
    }
    
    // If no valid session, check for remember me token in cookies
    const rememberToken = req.cookies?.remember_token;
    
    if (rememberToken) {
      // Find user with this remember token
      const users = await storage.getUserByRememberToken(rememberToken);
      
      if (users && users.length > 0) {
        const user = users[0];
        
        // Create a new session for the user
        req.session.userId = user.id;
        
        // Set a long expiration (30 days)
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
        
        // Attach user to request
        req.user = user;
        
        // Log this auto-login activity
        await storage.createActivity({
          type: 'auto_login',
          description: `User auto-logged in via remember token (${user.role})`,
          userId: user.id,
          projectId: null,
          metadata: { method: 'remember_token' },
        });
        
        next();
        return;
      }
    }
    
    // No session and no valid remember token
    return res.status(401).json({ message: 'Authentication required' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Middleware to check if user has admin role
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
}
