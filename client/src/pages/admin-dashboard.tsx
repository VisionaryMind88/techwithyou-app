import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminDashboardStats } from "@/components/admin/dashboard-stats";
import { ProjectTable } from "@/components/admin/project-table";
import { ActivityList } from "@/components/admin/activity-list";
import { AdminMessagesList } from "@/components/admin/messages-list";
import { Sidebar } from "@/components/sidebar";
import { ChatModule } from "@/components/chat-module";
import { Button } from "@/components/ui/button";
import { Menu, Bell } from "lucide-react";
import { OnboardingTour, adminTourSteps } from "@/components/onboarding-tour";
import { useAuth } from "@/context/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project, User, Message, Activity } from "@shared/schema";

export default function AdminDashboard() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string>("");
  const [showTour, setShowTour] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if onboarding tour should be shown
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('onboarding-tour-completed-admin');
    if (!hasCompletedTour && user) {
      setShowTour(true);
    }
  }, [user]);
  
  // Project handlers
  const handleReviewProject = (projectId: number) => {
    // Find the project to get its name
    const project = projectsData.find(p => p.id === projectId);
    if (project) {
      setSelectedProjectId(projectId);
      setSelectedProjectName(project.name);
      setIsChatModalOpen(true);
    }
  };
  
  const handleApproveProject = (projectId: number) => {
    handleProjectStatusUpdate(projectId, 'in_progress');
  };
  
  const handleRejectProject = (projectId: number) => {
    handleProjectStatusUpdate(projectId, 'rejected');
  };

  // Fetch all projects
  const { 
    data: projectsData = [], 
    isLoading: isLoadingProjects,
    refetch: refetchProjects
  } = useQuery<Array<Project & { user: User }>>({
    queryKey: ['/api/projects/admin'],
    enabled: !!user?.id && user?.role === "admin"
  });
  
  // Handle project status updates
  const handleProjectStatusUpdate = async (projectId: number, status: string) => {
    try {
      const response = await apiRequest('PATCH', `/api/projects/${projectId}/status`, { status });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Project status updated to ${status.replace('_', ' ')}`,
        });
        
        // Refresh projects data
        refetchProjects();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update project status');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while updating project status",
        variant: "destructive"
      });
    }
  };

  // Fetch recent activities
  const { 
    data: activitiesData = [], 
    isLoading: isLoadingActivities 
  } = useQuery<Array<Activity & { user: User }>>({
    queryKey: ['/api/activities/recent'],
    enabled: !!user?.id && user?.role === "admin"
  });

  // Fetch unread messages
  const { 
    data: messagesData = [], 
    isLoading: isLoadingMessages 
  } = useQuery<Array<Message & { sender: User, project: Project }>>({
    queryKey: ['/api/messages/admin/unread'],
    enabled: !!user?.id && user?.role === "admin"
  });

  // Stats overview data
  const pendingProjects = projectsData.filter(p => p.status === 'pending_approval').length;
  const totalProjects = projectsData.length;
  const activeCustomers = [...new Set(projectsData.map(p => p.userId))].length;
  const unreadMessages = messagesData.length;

  const stats = {
    totalProjects: {
      label: "Total Projects",
      value: totalProjects,
      icon: "folder",
      color: "text-primary-600",
      bgColor: "bg-blue-100",
      change: {
        value: 12,
        isPositive: true,
        period: "from last month"
      }
    },
    pendingApprovals: {
      label: "Pending Approvals",
      value: pendingProjects,
      icon: "time",
      color: "text-warning",
      bgColor: "bg-yellow-100",
      change: {
        value: 5,
        isPositive: false,
        period: "from last week"
      }
    },
    activeCustomers: {
      label: "Active Customers",
      value: activeCustomers,
      icon: "user",
      color: "text-success",
      bgColor: "bg-green-100",
      change: {
        value: 8,
        isPositive: true,
        period: "from last month"
      }
    },
    unreadMessages: {
      label: "Unread Messages",
      value: unreadMessages,
      icon: "chat",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: {
        value: 15,
        isPositive: false,
        period: "from yesterday"
      }
    }
  };

  // Project action handlers
  const handleProjectReview = (projectId: number) => {
    const project = projectsData.find(p => p.id === projectId);
    if (project) {
      setSelectedProjectId(projectId);
      setSelectedProjectName(project.name);
      setIsChatModalOpen(true);
    }
  };

  const handleProjectApprove = async (projectId: number) => {
    try {
      await apiRequest('PATCH', `/api/projects/${projectId}/status`, { status: 'in_progress' });
      toast({
        title: "Project Approved",
        description: "The project has been approved and is now in progress"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/admin'] });
    } catch (error) {
      console.error('Error approving project:', error);
      toast({
        title: "Action Failed",
        description: "Failed to approve project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleProjectReject = async (projectId: number) => {
    try {
      await apiRequest('PATCH', `/api/projects/${projectId}/status`, { status: 'rejected' });
      toast({
        title: "Project Rejected",
        description: "The project has been rejected"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/admin'] });
    } catch (error) {
      console.error('Error rejecting project:', error);
      toast({
        title: "Action Failed",
        description: "Failed to reject project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleMessageReply = (messageId: number) => {
    const message = messagesData.find(m => m.id === messageId);
    if (message) {
      setSelectedProjectId(message.projectId);
      setSelectedProjectName(message.project.name);
      setIsChatModalOpen(true);
    }
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
              
              <h1 className="text-xl font-semibold text-gray-800 md:ml-2">Admin Dashboard</h1>
              
              {/* Right Nav Elements */}
              <div className="flex items-center space-x-4">
                <button className="text-gray-500 hover:text-gray-700 focus:outline-none relative">
                  <Bell className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                      {unreadMessages}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="px-4 py-6 md:px-6 pb-16">
            {/* Analytics Overview */}
            <div className="mb-6" id="analytics-section">
              <h2 className="text-xl font-semibold text-gray-800 mb-4" id="admin-dashboard-welcome">Analytics Overview</h2>
              <AdminDashboardStats 
                stats={stats} 
                isLoading={isLoadingProjects}
              />
            </div>

            {/* Recent Project Requests */}
            <div className="mb-6" id="project-requests-section">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Recent Project Requests</h2>
                <Button variant="link" className="text-primary-600 p-0 h-auto">View All</Button>
              </div>
              
              <ProjectTable 
                projects={projectsData.slice(0, 5)} 
                isLoading={isLoadingProjects}
                onReview={handleReviewProject}
                onApprove={handleApproveProject}
                onReject={handleRejectProject}
              />
            </div>

            {/* Customer Activity & Messages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Activity */}
              <div id="customers-section">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Customer Activity</h2>
                  <Button variant="link" className="text-primary-600 p-0 h-auto">View All</Button>
                </div>
                
                <ActivityList 
                  activities={activitiesData.slice(0, 3)} 
                  isLoading={isLoadingActivities}
                />
              </div>
              
              {/* Recent Messages */}
              <div id="admin-messages-section">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Recent Messages</h2>
                  <Button variant="link" className="text-primary-600 p-0 h-auto">View All</Button>
                </div>
                
                <AdminMessagesList 
                  messages={messagesData.slice(0, 4)} 
                  isLoading={isLoadingMessages}
                  onReply={handleMessageReply}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Chat Modal */}
      {isChatModalOpen && selectedProjectId && (
        <ChatModule 
          projectId={selectedProjectId}
          projectName={selectedProjectName}
          messages={[]}
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
        />
      )}
      
      {/* Onboarding Tour */}
      <OnboardingTour 
        steps={adminTourSteps}
        isOpen={showTour}
        onComplete={() => setShowTour(false)}
        userRole="admin"
      />
    </div>
  );
}
