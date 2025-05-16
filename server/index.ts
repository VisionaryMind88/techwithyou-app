import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cookieParser from "cookie-parser";
import { pool } from "./db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Create PostgreSQL session store
const PgSession = connectPgSimple(session);

// Configure session middleware with more robust settings
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
      pruneSessionInterval: 60 // Prune expired sessions every 60 seconds
    }),
    secret: process.env.SESSION_SECRET || 'tech-with-you-secret-more-secure-key',
    resave: true, // Always save on requests to ensure we don't lose the session
    rolling: true, // Reset expiration on activity
    saveUninitialized: true, // Create session immediately to track even non-authenticated
    name: 'techwithyou.sid', // Custom cookie name
    cookie: { 
      secure: false, // Set to false even in production for testing
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    }
  })
);

// Session maintenance middleware - always touch the session to prevent expiration
app.use((req: any, res, next) => {
  if (req.session) {
    req.session.touch(); // Force touch session on every request
    
    // For API requests, also ensure the session is saved
    if (req.path.startsWith('/api/')) {
      req.session.save();
    }
  }
  
  // Debug middleware for critical paths
  if (req.path === '/api/auth/user' || req.path === '/api/auth/login' || 
      req.path === '/api/messages' || req.path === '/api/logout') {
    console.log('Session check:', {
      path: req.path,
      method: req.method,
      sessionId: req.sessionID,
      hasSession: !!req.session,
      userId: req.session?.userId,
      cookie: req.session?.cookie
    });
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
