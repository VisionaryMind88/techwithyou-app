import { Bell, Menu, MessageSquare } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
  onNotificationsClick?: () => void;
  unreadNotifications?: number;
  unreadMessages?: number;
  onMessagesClick?: () => void;
}

export function MobileHeader({
  title,
  onMenuClick,
  onNotificationsClick,
  unreadNotifications = 0,
  unreadMessages = 0,
  onMessagesClick
}: MobileHeaderProps) {
  return (
    <header className="bg-white shadow-sm z-10 sticky top-0 md:hidden">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <button 
            className="p-1 rounded-full hover:bg-gray-100"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          <Logo size="sm" className="ml-3" />
        </div>
        
        <h1 className="text-lg font-semibold text-gray-800 absolute left-1/2 transform -translate-x-1/2">
          {title}
        </h1>
        
        <div className="flex items-center space-x-4">
          {onMessagesClick && (
            <button 
              className="text-gray-500 hover:text-gray-700 focus:outline-none relative"
              onClick={onMessagesClick}
            >
              <MessageSquare className="h-5 w-5" />
              {unreadMessages > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                  {unreadMessages}
                </span>
              )}
            </button>
          )}
          
          {onNotificationsClick && (
            <button 
              className="text-gray-500 hover:text-gray-700 focus:outline-none relative"
              onClick={onNotificationsClick}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                  {unreadNotifications}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}