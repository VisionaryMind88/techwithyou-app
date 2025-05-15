import { formatDistanceToNow } from "date-fns";
import { User, Message } from "@shared/schema";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageListProps {
  messages: Array<Message & { sender: User }>;
  isLoading?: boolean;
  onViewAll?: () => void;
}

export function MessageList({ messages, isLoading = false, onViewAll }: MessageListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-100 animate-pulse">
            <div className="flex items-start">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full mt-1" />
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
        <p className="text-gray-500">No messages yet.</p>
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
                  {message.sender.role === "admin" && " (Admin)"}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-1">{message.content}</p>
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
