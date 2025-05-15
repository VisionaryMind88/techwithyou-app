import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Menu, Bell, FileText, MessageSquare, Paperclip, ActivityIcon } from "lucide-react";
import { Project, Message, User, Activity } from "@shared/schema";
import { useAuth } from "@/context/auth-context";
import { OnboardingTour, customerTourSteps } from "@/components/onboarding-tour";
import { ProjectForm } from "@/components/project-form";
import { ChatModule } from "@/components/chat-module";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDashboard() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{id: number, name: string} | null>(null);
  const [showTour, setShowTour] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if onboarding tour should be shown
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('onboarding-tour-completed-customer');
    if (!hasCompletedTour && user) {
      setShowTour(true);
    }
  }, [user]);

  // Fetch user's projects
  const { 
    data: projects = [],
    isLoading: isLoadingProjects 
  } = useQuery<Project[]>({
    queryKey: ['/api/projects/user'],
    enabled: !!user?.id && user?.role === "customer"
  });

  // Fetch user's messages
  const { 
    data: messages = [],
    isLoading: isLoadingMessages 
  } = useQuery<Array<Message & { sender: User }>>({
    queryKey: ['/api/messages/recent'],
    enabled: !!user?.id && user?.role === "customer"
  });
  
  // Fetch user's activities/notifications
  const {
    data: activities = [],
    isLoading: isLoadingActivities
  } = useQuery<Activity[]>({
    queryKey: ['/api/activities/recent'],
    enabled: !!user?.id && user?.role === "customer"
  });

  // Project handling
  const handleOpenProjectForm = () => {
    setIsProjectFormOpen(true);
  };

  const handleOpenChat = (projectId: number, projectName: string) => {
    setSelectedProject({ id: projectId, name: projectName });
    setIsChatOpen(true);
  };

  // Project status styles
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

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
        <main className="flex-1 md:ml-64">
          {/* Top Navigation */}
          <header className="bg-white shadow-sm z-10">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
              <button 
                className="md:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              
              <h1 className="text-xl font-semibold text-gray-800 md:ml-2">Customer Dashboard</h1>
              
              {/* Right Nav Elements */}
              <div className="flex items-center space-x-4">
                <button className="text-gray-500 hover:text-gray-700 focus:outline-none relative">
                  <Bell className="h-5 w-5" />
                  {messages.filter(m => !m.isRead).length > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                      {messages.filter(m => !m.isRead).length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="px-4 py-6 md:px-6 pb-16">
            {/* Welcome Banner */}
            <Card className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100" id="customer-dashboard-welcome">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Welcome back, {user?.firstName || 'there'}!
              </h2>
              <p className="text-gray-600">
                Track your projects and communicate with our team all in one place.
              </p>
              <Button 
                className="mt-4" 
                onClick={handleOpenProjectForm}
              >
                <Plus className="h-4 w-4 mr-2" /> Request New Project
              </Button>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                {isLoadingProjects ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-500">Active Projects</h3>
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold mt-2">{projects.filter(p => p.status === 'in_progress' || p.status === 'in-progress').length}</p>
                  </>
                )}
              </Card>
              <Card className="p-4">
                {isLoadingProjects ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-500">Completed Projects</h3>
                      <FileText className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold mt-2">{projects.filter(p => p.status === 'completed').length}</p>
                  </>
                )}
              </Card>
              <Card className="p-4">
                {isLoadingMessages ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-500">Unread Messages</h3>
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold mt-2">{messages.filter(m => !m.isRead).length}</p>
                  </>
                )}
              </Card>
            </div>

            {/* Projects Section */}
            <div className="mb-6" id="projects-section">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Your Projects</h2>
                <Button
                  size="sm"
                  onClick={handleOpenProjectForm}
                >
                  <Plus className="h-4 w-4 mr-1" /> New Project
                </Button>
              </div>
              
              {isLoadingProjects ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="overflow-hidden p-4">
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <div className="flex justify-end">
                        <Skeleton className="h-9 w-24" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <Card className="p-6 text-center">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No projects yet</h3>
                  <p className="text-gray-500 mb-4">Get started by requesting your first project</p>
                  <Button onClick={handleOpenProjectForm}>
                    <Plus className="h-4 w-4 mr-2" /> Request New Project
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map(project => (
                    <Card key={project.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between">
                          <h3 className="font-medium">{project.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusStyles(project.status)}`}>
                            {formatStatus(project.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                        <div className="mt-4 flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenChat(project.id, project.name)}
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href = `/project/${project.id}`}
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Notifications */}
            <div className="mb-6" id="notifications-section">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Recent Notifications</h2>
              </div>
              
              {isLoadingActivities ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Card key={i} className="p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-36 mb-1" />
                          <Skeleton className="h-3 w-24 mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <Card className="p-6 text-center">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No notifications yet</h3>
                  <p className="text-gray-500">
                    You'll be notified about important changes to your projects
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activities.slice(0, 5).map(activity => {
                    // Try to parse metadata if it exists
                    let metadata = {};
                    try {
                      if (activity.metadata && typeof activity.metadata === 'string') {
                        metadata = JSON.parse(activity.metadata);
                      }
                    } catch (e) {
                      console.error("Failed to parse activity metadata:", e);
                    }
                    
                    return (
                      <Card key={activity.id} className={activity.isRead ? "" : "border-blue-300 bg-blue-50"}>
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                              <ActivityIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{activity.description}</div>
                              <div className="text-sm text-gray-500">
                                {activity.createdAt ? format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a") : 'Recent'}
                              </div>
                              {activity.type === 'project_update' && (
                                <div className="mt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      // Mark activity as read
                                      apiRequest('PATCH', `/api/activities/${activity.id}/read`);
                                      
                                      // Open project details or chat
                                      if (activity.referenceType === 'project' && activity.referenceId) {
                                        const project = projects.find(p => p.id === activity.referenceId);
                                        if (project) {
                                          handleOpenChat(project.id, project.name);
                                        }
                                      }
                                    }}
                                  >
                                    View Project
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Recent Messages */}
            <div id="messages-section">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Recent Messages</h2>
              </div>
              
              {isLoadingMessages ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Card key={i} className="p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-36 mb-1" />
                          <Skeleton className="h-3 w-24 mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <Card className="p-6 text-center">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No messages yet</h3>
                  <p className="text-gray-500">
                    Messages from our team will appear here
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {messages.map(message => (
                    <Card key={message.id} className={message.isRead ? "" : "border-blue-300 bg-blue-50"}>
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            {message.sender.firstName?.[0] || 'A'}
                          </div>
                          <div>
                            <div className="font-medium">{message.sender.firstName} {message.sender.lastName}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(message.createdAt || Date.now()).toLocaleDateString()} - Project: {
                                (projects.find(p => p.id === message.projectId)?.name) || 'Unknown'
                              }
                            </div>
                            <p className="mt-2">{message.content}</p>
                            {typeof message.attachments === 'string' && (
                              <div className="mt-2 flex items-center text-sm text-blue-600">
                                <Paperclip className="h-3.5 w-3.5 mr-1" />
                                <span>Attachment</span>
                              </div>
                            )}
                            <div className="mt-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const project = projects.find(p => p.id === message.projectId);
                                  if (project) {
                                    handleOpenChat(project.id, project.name);
                                  }
                                }}
                              >
                                Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Project Form Modal */}
      {isProjectFormOpen && (
        <ProjectForm 
          isOpen={isProjectFormOpen} 
          onClose={() => setIsProjectFormOpen(false)} 
        />
      )}

      {/* Chat Modal */}
      {isChatOpen && selectedProject && (
        <ChatModule 
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          messages={[]}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {/* Onboarding Tour */}
      <OnboardingTour 
        steps={customerTourSteps}
        isOpen={showTour}
        onComplete={() => {
          setShowTour(false);
          localStorage.setItem('onboarding-tour-completed-customer', 'true');
        }}
        userRole="customer"
      />
    </div>
  );
}
