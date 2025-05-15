import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Project } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
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

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const statusStyle = getStatusStyle(project.status);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
          <Badge 
            variant="outline" 
            className={`${statusStyle.color} ${statusStyle.bg} border-0`}
          >
            {statusStyle.label}
          </Badge>
        </div>
        <p className="text-gray-600 text-sm mt-2 line-clamp-2">
          {project.description || "No description provided."}
        </p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Updated {formatDate(project.updatedAt)}
          </span>
          <Link href={`/project/${project.id}`}>
            <a className="text-sm text-primary-600 hover:text-primary-700 font-medium">View Details</a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
