import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Menu, Bell } from "lucide-react";
import { Project, Message, User } from "@shared/schema";
import { useMockAuth } from "@/context/mock-auth-context";

// Mock data for development
const mockProjects: Project[] = [
  {
    id: 1,
    name: "Website Redesign",
    type: "Web Development",
    description: "Complete overhaul of company website with modern design",
    status: "in-progress",
    budget: "5000",
    targetDate: "2025-06-30",
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    name: "Mobile App Development",
    type: "Mobile Development",
    description: "New mobile app for customer engagement",
    status: "pending",
    budget: "8000",
    targetDate: "2025-07-15",
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    name: "Brand Identity Update",
    type: "Design",
    description: "Refresh company brand identity including logo and visual elements",
    status: "completed",
    budget: "3000",
    targetDate: "2025-05-10",
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockMessages: (Message & { sender: User })[] = [
  {
    id: 1,
    content: "The initial mockups for the website redesign are now available for review.",
    projectId: 1,
    senderId: 2,
    isRead: false,
    attachments: null,
    createdAt: new Date(),
    sender: {
      id: 2,
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      password: null,
      provider: "local",
      providerId: null,
      createdAt: new Date()
    }
  },
  {
    id: 2,
    content: "Please provide feedback on the mobile app wireframes by Friday.",
    projectId: 2,
    senderId: 2,
    isRead: false,
    attachments: null,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    sender: {
      id: 2,
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      password: null,
      provider: "local",
      providerId: null,
      createdAt: new Date()
    }
  }
];

export default function CustomerDashboard() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useMockAuth();
  
  console.log("CustomerDashboard: User =", user);

  // For demo purposes, using mock data
  const projects = mockProjects;
  const messages = mockMessages;

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
              
              <h1 className="text-xl font-semibold text-gray-800 md:ml-2">Dashboard</h1>
              
              {/* Right Nav Elements */}
              <div className="flex items-center space-x-4">
                <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                  <Bell className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="px-4 py-6 md:px-6 pb-16">
            {/* Welcome Banner */}
            <Card className="mb-6 p-6" id="customer-dashboard-welcome">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Welcome back, {user?.firstName || 'there'}!
              </h2>
              <p className="text-gray-600">
                Track your projects and communicate with our team all in one place.
              </p>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <h3 className="text-sm font-medium text-gray-500">Active Projects</h3>
                <p className="text-2xl font-bold">{projects.filter(p => p.status === 'in-progress').length}</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-medium text-gray-500">Completed Projects</h3>
                <p className="text-2xl font-bold">{projects.filter(p => p.status === 'completed').length}</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-medium text-gray-500">Unread Messages</h3>
                <p className="text-2xl font-bold">{messages.filter(m => !m.isRead).length}</p>
              </Card>
            </div>

            {/* Projects Section */}
            <div className="mb-6" id="projects-section">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Your Projects</h2>
                <Button
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" /> New Project
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                  <Card key={project.id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{project.name}</h3>
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                          {project.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Messages */}
            <div id="messages-section">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Recent Messages</h2>
                <Button variant="link" className="text-primary-600 p-0 h-auto">View All</Button>
              </div>
              
              <div className="space-y-4">
                {messages.map(message => (
                  <Card key={message.id} className={message.isRead ? "" : "border-blue-300 bg-blue-50"}>
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          {message.sender.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-medium">{message.sender.firstName} {message.sender.lastName}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(message.createdAt).toLocaleDateString()}
                          </div>
                          <p className="mt-2">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
