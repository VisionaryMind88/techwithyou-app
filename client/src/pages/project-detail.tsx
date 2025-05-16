import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { ChatModule } from "@/components/chat-module";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar, MessageCircle, Upload, Clock, ArrowLeft, Menu, History, ListOrdered, ChevronDown, ChevronUp, Tag } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Project, User, Message, File } from "@shared/schema";

interface ProjectWithDetails extends Project {
  user: User;
  files: File[];
}

export default function ProjectDetail() {
  const [, params] = useRoute<{ id: string }>("/project/:id");
  const [, navigate] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isVersionUploadOpen, setIsVersionUploadOpen] = useState(false);
  const versionFileInputRef = useRef<HTMLInputElement>(null);
  const [versionNote, setVersionNote] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const projectId = params?.id ? parseInt(params.id) : null;

  // Fetch project details
  const { 
    data: project, 
    isLoading: isLoadingProject,
    error: projectError
  } = useQuery<ProjectWithDetails>({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId,
  });

  // Fetch project messages
  const {
    data: messages = [],
    isLoading: isLoadingMessages
  } = useQuery<Array<Message & { sender: User }>>({
    queryKey: ['/api/messages/project', projectId],
    enabled: !!projectId,
  });
  
  // Fetch file versions when a file is selected
  const {
    data: fileVersions = [],
    isLoading: isLoadingVersions,
    refetch: refetchVersions
  } = useQuery<File[]>({
    queryKey: ['/api/files/versions', selectedFileId],
    enabled: !!selectedFileId && showVersionHistory,
  });

  // Handle uploading files to a project
  const fileUploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!projectId || !user?.id) throw new Error("Missing project or user ID");
      
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('projectId', projectId.toString());
      formData.append('userId', user.id.toString());
      
      return fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
    },
    onSuccess: () => {
      toast({
        title: "Files Uploaded",
        description: "Your files have been uploaded successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
    },
    onError: (error) => {
      console.error("File upload error:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your files. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle project status update
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!projectId) throw new Error("Missing project ID");
      return apiRequest('PATCH', `/api/projects/${projectId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Project status has been updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
    },
    onError: (error) => {
      console.error("Status update error:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the project status. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Handle uploading a new version of a file
  const fileVersionUploadMutation = useMutation({
    mutationFn: async ({ fileId, file, versionNote }: { fileId: number, file: File, versionNote?: string }) => {
      if (!user?.id) throw new Error("Missing user ID");
      
      const formData = new FormData();
      formData.append('files', file);
      if (versionNote) formData.append('versionNote', versionNote);
      
      return fetch(`/api/files/${fileId}/versions`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
    },
    onSuccess: () => {
      toast({
        title: "Version Uploaded",
        description: "New file version has been uploaded successfully"
      });
      // Close the upload dialog
      setIsVersionUploadOpen(false);
      setVersionNote('');
      
      // Refresh file versions and project data
      refetchVersions();
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
    },
    onError: (error) => {
      console.error("Version upload error:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading the file version. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Helper to determine status badge styles
  const getStatusStyle = (status: string): { color: string, bg: string, label: string } => {
    switch (status) {
      case "in_progress":
        return { color: "text-primary-600", bg: "bg-blue-100", label: "In Progress" };
      case "pending_approval":
        return { color: "text-warning", bg: "bg-yellow-100", label: "Pending Approval" };
      case "completed":
        return { color: "text-success", bg: "bg-green-100", label: "Completed" };
      case "rejected":
        return { color: "text-destructive", bg: "bg-red-100", label: "Rejected" };
      default:
        return { color: "text-gray-600", bg: "bg-gray-100", label: status };
    }
  };

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      fileUploadMutation.mutate(files);
    }
  };

  const handleCompleteProject = () => {
    updateStatusMutation.mutate('completed');
  };
  
  // Handle showing file version history
  const handleShowVersionHistory = (fileId: number) => {
    setSelectedFileId(fileId);
    setShowVersionHistory(true);
  };
  
  // Handle uploading a new version
  const handleNewVersionUpload = (fileId: number) => {
    setSelectedFileId(fileId);
    setIsVersionUploadOpen(true);
  };
  
  // Handle file selection for version upload
  const handleVersionFileSelect = () => {
    versionFileInputRef.current?.click();
  };
  
  // Handle file input change for version upload
  const handleVersionFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && selectedFileId) {
      fileVersionUploadMutation.mutate({
        fileId: selectedFileId,
        file: files[0],
        versionNote: versionNote || undefined
      });
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Redirect if project doesn't exist
  useEffect(() => {
    if (projectError) {
      toast({
        title: "Project Not Found",
        description: "The requested project does not exist or you don't have permission to view it.",
        variant: "destructive"
      });
      navigate("/");
    }
  }, [projectError, navigate, toast]);

  if (isLoadingProject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <div className="hidden md:block fixed inset-y-0 left-0 z-10">
            <Sidebar />
          </div>
          <main className="flex-1 md:ml-64 p-6">
            <div className="mb-6">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
              <div>
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!project) {
    return null; // Will redirect via the useEffect
  }

  const statusStyle = getStatusStyle(project.status);
  const isAdmin = user?.role === 'admin';
  const isCustomerProject = user?.id === project.userId;
  const canAccessProject = isAdmin || isCustomerProject;

  if (!canAccessProject) {
    // Will redirect if not authorized
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar - Desktop */}
        <div className="hidden md:block fixed inset-y-0 left-0 z-10">
          <Sidebar />
        </div>

        {/* Sidebar - Mobile */}
        {isMobileSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-30">
              <Sidebar isMobile onClose={() => setIsMobileSidebarOpen(false)} />
            </div>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 md:ml-64" id="main-content">
          {/* Top Navigation */}
          <header className="bg-white shadow-sm z-10">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
              <div className="flex items-center">
                <button 
                  className="md:hidden mr-2"
                  onClick={() => setIsMobileSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6 text-gray-600" />
                </button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center text-gray-600"
                  onClick={() => navigate("/")}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </header>

          {/* Project Details */}
          <div className="px-4 py-6 md:px-6 pb-16" id="project-details">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <div className="flex items-center mt-2">
                  <Badge className={`${statusStyle.color} ${statusStyle.bg}`}>
                    {statusStyle.label}
                  </Badge>
                  <span className="ml-4 text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Created {format(new Date(project.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-3" id="messages-section">
                <Button 
                  variant="outline" 
                  className="flex items-center"
                  onClick={() => setIsChatModalOpen(true)}
                  aria-label="Open project messages"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Messages
                  {messages.filter(m => !m.isRead && m.senderId !== user?.id).length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-primary-500 text-white rounded-full">
                      {messages.filter(m => !m.isRead && m.senderId !== user?.id).length}
                    </span>
                  )}
                </Button>
                
                {isAdmin && project.status === 'pending_approval' && (
                  <>
                    <Button 
                      variant="default" 
                      onClick={() => updateStatusMutation.mutate('in_progress')}
                      disabled={updateStatusMutation.isPending}
                    >
                      Approve Project
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => updateStatusMutation.mutate('rejected')}
                      disabled={updateStatusMutation.isPending}
                    >
                      Reject
                    </Button>
                  </>
                )}
                
                {project.status === 'in_progress' && isCustomerProject && (
                  <Button 
                    variant="default" 
                    onClick={handleCompleteProject}
                    disabled={updateStatusMutation.isPending}
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Information */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="details">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="files" id="file-section-trigger">Files</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Project Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Description</h3>
                          <p className="mt-1 text-gray-900">{project.description || "No description provided."}</p>
                        </div>
                        
                        <Separator />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Project Type</h3>
                            <p className="mt-1 text-gray-900">{project.type}</p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Budget Range</h3>
                            <p className="mt-1 text-gray-900">{project.budget || "Not specified"}</p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Target Completion Date</h3>
                            <p className="mt-1 text-gray-900 flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {project.targetDate ? format(new Date(project.targetDate), "MMMM d, yyyy") : "Not specified"}
                            </p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                            <p className="mt-1 text-gray-900">
                              {format(new Date(project.updatedAt), "MMMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        
                        {isAdmin && (
                          <>
                            <Separator />
                            
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Customer Information</h3>
                              <div className="mt-2 flex items-center">
                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                                  {project.user.firstName?.[0] || project.user.email?.[0] || '?'}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">
                                    {project.user.firstName} {project.user.lastName}
                                  </p>
                                  <p className="text-sm text-gray-500">{project.user.email}</p>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="files" className="mt-6" id="file-section">
                    <Card>
                      <CardHeader>
                        <CardTitle>Project Files</CardTitle>
                        <CardDescription>
                          Upload and manage files related to this project
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-6" id="file-upload-section">
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Upload New Files</h3>
                          <FileUpload
                            onFilesAdded={handleFilesAdded}
                            maxSize={2 * 1024 * 1024 * 1024} // 2GB
                          />
                        </div>
                        
                        <Separator className="my-6" />
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-4">Uploaded Files</h3>
                          
                          {project.files && project.files.length > 0 ? (
                            <div className="space-y-3">
                              {project.files.filter(file => !file.parentFileId).map((file) => (
                                <div key={file.id} className="flex flex-col border border-gray-200 rounded-md">
                                  <div className="flex items-center p-3">
                                    <div className="p-2 bg-gray-100 rounded-md">
                                      <Upload className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
                                      <p className="text-xs text-gray-500">
                                        {formatFileSize(file.size)} • Uploaded on {format(new Date(file.createdAt || new Date()), "MMM d, yyyy")}
                                        {file.isLatestVersion && <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Latest</span>}
                                        {file.versionNumber > 1 && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">v{file.versionNumber}</span>}
                                      </p>
                                    </div>
                                    <div className="flex space-x-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-primary-600"
                                        onClick={() => window.open(`/api/files/${file.id}`, '_blank')}
                                      >
                                        Download
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-primary-600"
                                        onClick={() => handleShowVersionHistory(file.id)}
                                      >
                                        <History className="h-4 w-4 mr-1" />
                                        History
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-primary-600"
                                        onClick={() => handleNewVersionUpload(file.id)}
                                      >
                                        <Tag className="h-4 w-4 mr-1" />
                                        New Version
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Upload className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                              <p>No files have been uploaded yet</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Activity Timeline */}
              <div id="activity-section">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.slice(0, 5).map((message) => (
                          <div key={message.id} className="flex">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                                {message.sender.firstName?.[0] || message.sender.email?.[0] || '?'}
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {message.sender.firstName} {message.sender.lastName}
                              </p>
                              <p className="text-sm text-gray-500 line-clamp-1">{message.content}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {format(new Date(message.createdAt), "MMM d, h:mm a")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                        <p>No messages yet</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="ghost" 
                      className="w-full text-primary-600"
                      onClick={() => setIsChatModalOpen(true)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Open Messages
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Chat Modal */}
      {isChatModalOpen && (
        <ChatModule 
          projectId={project.id}
          projectName={project.name}
          messages={messages}
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
        />
      )}
      
      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>File Version History</DialogTitle>
            <DialogDescription>
              View and manage all versions of this file
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingVersions ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {fileVersions.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto p-1">
                  {fileVersions.map((version) => (
                    <div key={version.id} className="flex items-start p-3 border border-gray-200 rounded-md">
                      <div className="p-2 bg-gray-100 rounded-md">
                        <Upload className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{version.originalName}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Version {version.versionNumber} • {formatFileSize(version.size)} • 
                              Uploaded on {format(new Date(version.createdAt || new Date()), "MMM d, yyyy")}
                            </p>
                          </div>
                          {version.isLatestVersion && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Latest Version
                            </span>
                          )}
                        </div>
                        
                        {version.versionNote && (
                          <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            <span className="font-medium">Note:</span> {version.versionNote}
                          </div>
                        )}
                        
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`/api/files/${version.id}`, '_blank')}
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ListOrdered className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  <p>No version history available</p>
                </div>
              )}
            </>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersionHistory(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowVersionHistory(false);
              setIsVersionUploadOpen(true);
            }}>
              <Tag className="h-4 w-4 mr-1" />
              Upload New Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Version Upload Dialog */}
      <Dialog open={isVersionUploadOpen} onOpenChange={setIsVersionUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload New Version</DialogTitle>
            <DialogDescription>
              Upload a new version of this file
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="version-note" className="block text-sm font-medium text-gray-700 mb-1">
                  Version Note
                </label>
                <textarea
                  id="version-note"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe what changed in this version..."
                  rows={3}
                  value={versionNote}
                  onChange={(e) => setVersionNote(e.target.value)}
                />
              </div>
              
              <div>
                <button
                  className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  onClick={handleVersionFileSelect}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Select File to Upload
                </button>
                <input
                  type="file"
                  ref={versionFileInputRef}
                  className="hidden"
                  onChange={handleVersionFileChange}
                />
                <p className="mt-1 text-xs text-gray-500">
                  File should be a newer version of the same document
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVersionUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleVersionFileSelect}
              disabled={fileVersionUploadMutation.isPending}
            >
              {fileVersionUploadMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-gray-300 border-t-white rounded-full"></div>
                  Uploading...
                </>
              ) : "Upload Version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
