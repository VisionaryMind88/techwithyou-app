import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Message, User, Project } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminMessageItem extends Message {
  sender: User;
  project: Project;
}

interface AdminMessagesListProps {
  messages: AdminMessageItem[];
  isLoading?: boolean;
  onReply?: (messageId: number) => void;
  onViewAll?: () => void;
}

export function AdminMessagesList({
  messages,
  isLoading = false,
  onReply,
  onViewAll
}: AdminMessagesListProps) {
  // Helper to determine project type badge color
  const getProjectTypeColor = (type: string | undefined): string => {
    if (!type) return "bg-gray-100 text-gray-600";
    
    switch (type.toLowerCase()) {
      case "website": case "website design":
        return "bg-blue-100 text-primary-600";
      case "mobile app": case "mobile app development":
        return "bg-green-100 text-success";
      case "seo": case "marketing":
        return "bg-purple-100 text-purple-600";
      case "e-commerce":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-100 animate-pulse">
            <div className="flex items-start">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <div className="flex items-center">
                    <Skeleton className="h-5 w-20 rounded-full mr-2" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mt-2" />
                <div className="mt-2">
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm text-center">
        <p className="text-gray-500">No messages available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {messages.map((message, index) => (
        <div 
          key={message.id} 
          className={`p-4 hover:bg-gray-50 ${
            index < messages.length - 1 ? "border-b border-gray-100" : ""
          }`}
        >
          <div className="flex items-start">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {message.sender.firstName?.[0] || message.sender.email?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="ml-3 flex-1">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-900">
                  {message.sender.firstName} {message.sender.lastName}
                </p>
                <div className="flex items-center">
                  {message.project ? (
                    <Badge 
                      variant="outline" 
                      className={`mr-2 ${getProjectTypeColor(message.project?.type)} border-0`}
                    >
                      {message.project.type}
                    </Badge>
                  ) : (
                    <Badge 
                      variant="outline" 
                      className="mr-2 bg-gray-100 text-gray-600 border-0"
                    >
                      Algemeen
                    </Badge>
                  )}
                  <p className="text-xs text-gray-500">
                    {message.createdAt 
                      ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
                      : 'Recent'
                    }
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-1">{message.content}</p>
              
              {onReply && (
                <div className="mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-primary-600 hover:text-primary-700 p-0 h-auto"
                    onClick={() => onReply(message.id)}
                  >
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 10H13C17.4183 10 21 13.5817 21 18V20M3 10L9 16M3 10L9 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Reply
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {onViewAll && (
        <div className="p-2 text-center border-t border-gray-100">
          <button 
            onClick={onViewAll}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all messages
          </button>
        </div>
      )}
    </div>
  );
}
