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
    // Check for user in session
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find user in the database
    const user = await storage.getUser(userId);
    
    if (!user) {
      // If user not found, clear the session
      req.session.destroy((err: Error) => {
        if (err) console.error('Error destroying session:', err);
      });
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
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
