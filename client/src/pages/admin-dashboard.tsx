import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminDashboardStats } from "@/components/admin/dashboard-stats";
import { ProjectTable } from "@/components/admin/animated-project-table";
import { ActivityList } from "@/components/admin/activity-list";
import { AdminMessagesList } from "@/components/admin/messages-list";
import { ProjectAnalytics } from "@/components/admin/project-analytics";
import { PerformanceMetrics } from "@/components/admin/performance-metrics";
import { UserAnalytics } from "@/components/admin/user-analytics";
import { PaymentTab } from "@/components/admin/payment-tab";
import { Sidebar } from "@/components/sidebar";
import { ChatModule } from "@/components/chat-module";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Menu, Bell, MessageSquare, BarChart, Plus, Settings, Users, FileText } from "lucide-react";
import { RiFolderLine, RiTimeLine, RiUserLine, RiChat3Line } from "react-icons/ri";
import { OnboardingTour, adminTourSteps } from "@/components/onboarding-tour";
import { useAuth } from "@/context/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project, User, Message, Activity as BaseActivity } from "@shared/schema";
import { FloatingActionMenu } from "@/components/mobile/floating-action-menu";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem, slideIn, buttonHover } from "@/lib/animation";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { BottomNavigation } from "@/components/mobile/bottom-navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/ui/page-transition";
import { AnimatedButton, AnimatedCard, AnimatedIcon } from "@/components/ui/animated-components";
import { NotificationsDropdown } from "@/components/notifications-dropdown";

// Enhanced Activity interface that matches our extended schema
interface Activity extends Omit<BaseActivity, 'referenceId' | 'referenceType' | 'isRead' | 'createdAt'> {
  referenceId: number | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string | Date | null;
  metadata?: unknown;
}

export default function AdminDashboard() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string>("");
  const [showTour, setShowTour] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check if onboarding tour should be shown
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('onboarding-tour-completed-admin');
    if (!hasCompletedTour && user) {
      setShowTour(true);
    }
  }, [user]);
  
  // Handle clicks outside notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Check if click is outside the notification dropdown
      if (isNotificationsOpen && !target.closest('.notifications-dropdown')) {
        setIsNotificationsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);
  
  // Function to mark an activity as read
  const markActivityAsRead = async (activityId: number) => {
    try {
      await apiRequest('PATCH', `/api/activities/${activityId}/read`);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
      toast({
        title: "Notification marked as read",
        variant: "default",
      });
    } catch (error) {
      console.error('Error marking activity as read:', error);
      toast({
        title: "Error",
        description: "Could not mark notification as read",
        variant: "destructive",
      });
    }
  };
  
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
  
  // Fetch all users for analytics
  const { 
    data: usersData = [], 
    isLoading: isLoadingUsers 
  } = useQuery<User[]>({
    queryKey: ['/api/users/admin'],
    enabled: !!user?.id && user?.role === "admin"
  });

  // Stats overview data
  const pendingProjects = projectsData.filter(p => p.status === 'pending_approval').length;
  const totalProjects = projectsData.length;
  // Calculate unique user IDs without using spread on Set
  const uniqueUserIds = Array.from(new Set(projectsData.map(p => p.userId)));
  const activeCustomers = uniqueUserIds.length;
  const unreadMessages = messagesData.length;

  // Use the icons for stats
  
  const stats = {
    totalProjects: {
      label: "Total Projects",
      value: totalProjects,
      icon: RiFolderLine,
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
      icon: RiTimeLine,
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
      icon: RiUserLine,
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
      icon: RiChat3Line,
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
        <main className="flex-1 md:ml-64" id="main-content" aria-label="Main dashboard content" tabIndex={-1}>
          {/* Top Navigation */}
          <header className="bg-white shadow-sm z-10">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
              <button 
                className="md:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              
              <h1 className="text-xl font-semibold text-gray-800 md:ml-2">{t('dashboard.adminTitle') || "Admin Dashboard"}</h1>
              
              {/* Right Nav Elements */}
              <div className="flex items-center space-x-4">
                {/* Notifications Button */}
                <div className="relative">
                  <button 
                    className="text-gray-500 hover:text-gray-700 focus:outline-none relative"
                    onClick={() => setIsNotificationsOpen(prev => !prev)}
                  >
                    <Bell className="h-5 w-5" />
                    {activitiesData.filter(a => !a.isRead).length > 0 && (
                      <motion.span 
                        className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        {activitiesData.filter(a => !a.isRead).length}
                      </motion.span>
                    )}
                  </button>
                  
                  {/* Using our new NotificationsDropdown component */}
                  <NotificationsDropdown 
                    activities={activitiesData}
                    isLoading={isLoadingActivities}
                    isOpen={isNotificationsOpen}
                    onClose={() => setIsNotificationsOpen(false)}
                  />
                </div>
                
                {/* Messages Button */}
                <motion.button 
                  className="text-gray-500 hover:text-gray-700 focus:outline-none relative"
                  onClick={() => setLocation('/messages')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <motion.span 
                      className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      {unreadMessages}
                    </motion.span>
                  )}
                </motion.button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="px-4 py-6 md:px-6 pb-16">
            {/* Analytics Overview */}
            <div className="mb-6" id="stats-section">
              <h2 className="text-xl font-semibold text-gray-800 mb-4" id="admin-dashboard-welcome">{t('dashboard.analyticsOverview') || "Analytics Overview"}</h2>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Customer Activity */}
              <div id="activity-section">
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
            
            {/* Advanced Analytics Section */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <BarChart className="h-5 w-5 mr-2 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-800">Advanced Analytics</h2>
              </div>
              
              <Tabs defaultValue="projects" className="w-full mb-8">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="projects">Project Analytics</TabsTrigger>
                  <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
                  <TabsTrigger value="users">User Analytics</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                </TabsList>
                
                <TabsContent value="projects">
                  <ProjectAnalytics 
                    projects={projectsData} 
                    isLoading={isLoadingProjects}
                  />
                </TabsContent>
                
                <TabsContent value="performance">
                  <PerformanceMetrics 
                    projects={projectsData}
                    messages={messagesData}
                    activities={activitiesData}
                    isLoading={isLoadingProjects || isLoadingMessages || isLoadingActivities}
                  />
                </TabsContent>
                
                <TabsContent value="users">
                  <UserAnalytics 
                    users={usersData}
                    projects={projectsData}
                    isLoading={isLoadingUsers || isLoadingProjects}
                  />
                </TabsContent>
                
                <TabsContent value="payments">
                  <PaymentTab />
                </TabsContent>
              </Tabs>
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
      
      {/* Quick Action Floating Menu */}
      <FloatingActionMenu 
        items={[
          {
            icon: <Plus size={20} />,
            label: "New Project",
            onClick: () => {
              window.location.href = '/projects/new';
            },
            color: "bg-blue-500 text-white"
          },
          {
            icon: <MessageSquare size={20} />,
            label: "Messages",
            onClick: () => {
              window.location.href = '/messages';
            },
            color: "bg-green-500 text-white"
          },
          {
            icon: <Users size={20} />,
            label: "Users",
            onClick: () => {
              window.location.href = '/users';
            },
            color: "bg-purple-500 text-white"
          },
          {
            icon: <Settings size={20} />,
            label: "Settings",
            onClick: () => {
              window.location.href = '/settings';
            },
            color: "bg-gray-700 text-white"
          }
        ]}
        position="bottom-right"
        userRole="admin"
      />
      
      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
