import { formatDistanceToNow } from "date-fns";
import { 
  RiUploadLine, 
  RiChatNewLine, 
  RiUserAddLine,
  RiFileChartLine
} from "react-icons/ri";
import { User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

// Extend the Activity type to match our database model
interface ActivityItem {
  id: number;
  type: string;
  description: string;
  projectId: number | null;
  userId: number;
  referenceId: number | null;
  referenceType: string | null;
  isRead: boolean;
  metadata: unknown;
  createdAt: string | Date | null;
  user: User;
}

interface ActivityListProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

export function ActivityList({ activities, isLoading = false, onViewAll }: ActivityListProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "file_upload":
        return <RiUploadLine className="text-primary-600" />;
      case "message":
        return <RiChatNewLine className="text-green-600" />;
      case "user_register":
        return <RiUserAddLine className="text-purple-600" />;
      case "status_change":
        return <RiFileChartLine className="text-orange-600" />;
      default:
        return <RiFileChartLine className="text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flow-root p-4">
          <ul role="list" className="-mb-8">
            {[...Array(3)].map((_, i) => (
              <li key={i} className={i < 2 ? "pb-8" : ""}>
                <div className="relative">
                  {i < 2 && (
                    <span 
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" 
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div>
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <Skeleton className="h-4 w-40 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="mt-2">
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm text-center">
        <p className="text-gray-500">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flow-root p-4">
        <ul role="list" className="-mb-8">
          {activities.map((activity, index) => (
            <li key={activity.id}>
              <div className="relative pb-8">
                {index < activities.length - 1 && (
                  <span 
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" 
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ring-8 ring-white">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {activity.user.firstName} {activity.user.lastName} {activity.description}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {activity.metadata && activity.metadata.details && (
                      <div className="mt-2 text-sm text-gray-700">
                        <p>{activity.metadata.details}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {onViewAll && (
        <div className="p-2 text-center border-t border-gray-100">
          <button 
            onClick={onViewAll}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all activity
          </button>
        </div>
      )}
    </div>
  );
}
