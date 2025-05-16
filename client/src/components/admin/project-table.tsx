import { useState } from "react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { Project, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, fadeIn } from "@/lib/animation";

interface ProjectTableProps {
  projects: Array<Project & { user: User }>;
  isLoading?: boolean;
  onReview?: (projectId: number) => void;
  onApprove?: (projectId: number) => void;
  onReject?: (projectId: number) => void;
  onView?: (projectId: number) => void;
  onEdit?: (projectId: number) => void;
  onDelete?: (projectId: number) => void;
}

export function ProjectTable({
  projects,
  isLoading = false,
  onReview,
  onApprove,
  onReject,
  onView,
  onEdit,
  onDelete
}: ProjectTableProps) {
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full mr-3" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-24 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm text-center">
        <p className="text-gray-500">No projects available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const statusStyle = getStatusStyle(project.status);
              
              return (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarFallback>
                          {project.user.firstName?.[0] || project.user.email?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {project.user.firstName} {project.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{project.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>{project.type}</TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${statusStyle.color} ${statusStyle.bg} border-0`}
                    >
                      {statusStyle.label}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {project.createdAt ? format(new Date(project.createdAt), "MMM d, yyyy") : "N/A"}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    {project.status === "pending_approval" ? (
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="link"
                          className="text-primary-600 hover:text-primary-900"
                          onClick={() => onReview?.(project.id)}
                        >
                          Review
                        </Button>
                        <Button
                          size="sm"
                          variant="link"
                          className="text-success hover:text-green-900"
                          onClick={() => onApprove?.(project.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="link"
                          className="text-destructive hover:text-red-900"
                          onClick={() => onReject?.(project.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView?.(project.id)}>
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit?.(project.id)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete?.(project.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
