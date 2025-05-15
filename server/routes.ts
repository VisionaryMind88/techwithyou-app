import type { Express } from "express";
import { createServer, type Server } from "http";
import { authMiddleware } from "./middleware/auth";
import { WebSocketServer, WebSocket } from "ws";
import { registerAuthRoutes } from "./controllers/auth";
import { registerProjectRoutes } from "./controllers/projects";
import { registerMessageRoutes } from "./controllers/messages";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Client connections map to track connected users
  const clients = new Map<number, WebSocket>();

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    let userId: number | null = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Store user ID if it's provided for identification
        if (data.senderId && !userId) {
          userId = data.senderId;
          clients.set(userId, ws);
        }
        
        // Broadcast the message to all connected clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      // Remove client from tracking on disconnect
      if (userId) {
        clients.delete(userId);
      }
    });
  });

  // Register auth routes first (no auth required)
  registerAuthRoutes(app);
  
  // Apply auth middleware to all other API routes
  app.use('/api/projects', authMiddleware);
  app.use('/api/messages', authMiddleware);
  app.use('/api/files', authMiddleware);
  app.use('/api/activities', authMiddleware);
  
  // Register other route controllers
  registerProjectRoutes(app);
  registerMessageRoutes(app);

  // Health check route (no auth needed)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return httpServer;
}
