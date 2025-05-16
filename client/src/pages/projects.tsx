import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Project, User } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { CalendarIcon, FolderIcon, ArrowRightIcon, PlusIcon } from "lucide-react";
import { format } from "date-fns";
import { ProjectForm } from "@/components/project-form";

export default function ProjectsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  // Fetch projects based on user role
  const { 
    data: projectsData = [], 
    isLoading: isLoadingProjects 
  } = useQuery<Array<Project & { user: User }>>({
    queryKey: [isAdmin ? '/api/projects/admin' : '/api/projects/user'],
    enabled: !!user?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'bg-amber-100 text-amber-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenProjectForm = () => {
    setIsProjectFormOpen(true);
  };

  const handleCloseProjectForm = () => {
    setIsProjectFormOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Fixed and always visible */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-50 h-full">
        <div className="h-full">
          <Sidebar />
        </div>
      </div>
      
      {/* Main Content - with left margin for sidebar */}
      <div className="flex-1 overflow-auto md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-700">
              {isAdmin ? 'All Projects' : 'My Projects'}
            </h2>
            {!isAdmin && (
              <Button className="flex items-center" onClick={handleOpenProjectForm}>
                <PlusIcon className="h-4 w-4 mr-2" />
                New Project
              </Button>
            )}
          </div>
          
          {isLoadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[220px] bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsData.map((project) => (
                <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>
                        {format(new Date(project.createdAt || Date.now()), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                      {isAdmin && project.user && (
                        <div className="text-sm text-gray-500">
                          By {project.user.firstName} {project.user.lastName}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 pb-4">
                    <Link to={`/projects/${project.id}`} className="flex items-center text-blue-600 hover:text-blue-800">
                      View Details
                      <ArrowRightIcon className="ml-1 h-4 w-4" />
                    </Link>
                  </CardFooter>
                </Card>
              ))}
              
              {projectsData.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <FolderIcon className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
                  <p className="text-gray-500 mb-4 text-center">
                    {isAdmin 
                      ? 'There are no projects in the system yet.' 
                      : 'You have not created any projects yet.'}
                  </p>
                  {!isAdmin && (
                    <Button onClick={handleOpenProjectForm}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create New Project
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Project Form Dialog */}
          <ProjectForm 
            isOpen={isProjectFormOpen} 
            onClose={handleCloseProjectForm} 
          />
        </main>
      </div>
    </div>
  );
}