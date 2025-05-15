import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Extended Request interface to include user property
export interface AuthRequest extends Request {
  user?: any;
}

// Middleware to attach user to request if authenticated
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // Skip authentication for certain routes
  const noAuthRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/check-email',
    '/api/health'
  ];
  
  if (noAuthRoutes.includes(req.path)) {
    return next();
  }

  try {
    // In a real app, we would validate JWT or session
    // For this demo, we'll check if there's a user ID in the headers
    const userEmail = req.headers['x-user-email'] as string;
    
    if (!userEmail) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find user in the database
    const user = await storage.getUserByEmail(userEmail);
    
    if (!user) {
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
