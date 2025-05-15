import { Express, Response } from "express";
import { storage } from "../storage";
import { insertProjectSchema } from "@shared/schema";
import { AuthRequest } from "../middleware/auth";
import { fileUploadMiddleware, handleFileUploadErrors } from "../middleware/file-upload";
import path from "path";
import fs from "fs";

export function registerProjectRoutes(app: Express) {
  // Get projects for authenticated user
  app.get("/api/projects/user", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const projects = await storage.getProjectsByUser(req.user.id);
      
      res.json(projects);
    } catch (error) {
      console.error('Get user projects error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get all projects (admin only)
  app.get("/api/projects/admin", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const projects = await storage.getAllProjects();
      
      // Enrich projects with user data
      const enrichedProjects = await Promise.all(projects.map(async (project) => {
        const user = await storage.getUser(project.userId);
        return {
          ...project,
          user: user ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          } : null
        };
      }));
      
      res.json(enrichedProjects);
    } catch (error) {
      console.error('Get all projects error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get a specific project
  app.get("/api/projects/:id", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const projectId = parseInt(req.params.id);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if user has access to this project
      if (req.user.role !== 'admin' && project.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get files for this project
      const files = await storage.getFilesByProject(projectId);
      
      // Get user who created the project
      const user = await storage.getUser(project.userId);
      
      res.json({
        ...project,
        files,
        user: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        } : null
      });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create a new project
  app.post("/api/projects", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const projectData = {
        ...req.body,
        userId: req.user.id
      };
      
      // Validate project data
      const validationResult = insertProjectSchema.safeParse(projectData);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid project data',
          errors: validationResult.error.errors 
        });
      }
      
      const newProject = await storage.createProject(projectData);
      
      res.status(201).json(newProject);
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update project status
  app.patch("/api/projects/:id/status", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const projectId = parseInt(req.params.id);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const { status } = req.body;
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      // Validate status value
      const validStatuses = ['pending_approval', 'in_progress', 'completed', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if user has access to update this project
      if (req.user.role !== 'admin' && project.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Customers can only mark projects as completed
      if (req.user.role !== 'admin' && status !== 'completed') {
        return res.status(403).json({ message: 'Only admins can change project status' });
      }
      
      const updatedProject = await storage.updateProjectStatus(projectId, status);
      
      res.json(updatedProject);
    } catch (error) {
      console.error('Update project status error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Upload files to a project
  app.post("/api/files/upload", fileUploadMiddleware, handleFileUploadErrors, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const { projectId } = req.body;
      
      if (!projectId || isNaN(parseInt(projectId))) {
        return res.status(400).json({ message: 'Valid project ID is required' });
      }
      
      const projectIdNum = parseInt(projectId);
      const project = await storage.getProject(projectIdNum);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if user has access to this project
      if (req.user.role !== 'admin' && project.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      // Store file information in database
      const savedFiles = await Promise.all(req.files.map(async (file) => {
        return storage.createFile({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          projectId: projectIdNum,
          userId: req.user.id
        });
      }));
      
      res.status(201).json(savedFiles);
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get a specific file
  app.get("/api/files/:id", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const fileId = parseInt(req.params.id);
      
      if (isNaN(fileId)) {
        return res.status(400).json({ message: 'Invalid file ID' });
      }
      
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Check if user has access to this file's project
      const project = await storage.getProject(file.projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (req.user.role !== 'admin' && project.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Check if file exists on disk
      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ message: 'File not found on server' });
      }
      
      // Set content disposition header
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
      
      // Stream file to client
      const fileStream = fs.createReadStream(file.path);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Get file error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}
