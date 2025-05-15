import { Home, FolderOpen, MessageSquare, Settings, LogOut, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Logo } from "@/components/logo";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    console.log("Logging out...");
    
    // If on mobile, close the sidebar
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div className="w-64 h-full bg-white shadow-lg">
      {/* Logo and Header */}
      <div className="h-16 flex items-center px-6 border-b">
        <Logo size="md" />
        
        {isMobile && onClose && (
          <button 
            className="ml-auto text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      
      {/* User Profile */}
      <div className="p-4 border-b">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div className="ml-3">
            <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <a 
              href="/" 
              className="flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700"
            >
              <Home className="h-5 w-5 mr-3" />
              Dashboard
            </a>
          </li>
          <li>
            <a 
              href="/projects" 
              className="flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700"
            >
              <FolderOpen className="h-5 w-5 mr-3" />
              Projects
            </a>
          </li>
          <li>
            <a 
              href="/messages" 
              className="flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700"
            >
              <MessageSquare className="h-5 w-5 mr-3" />
              Messages
            </a>
          </li>
          <li>
            <a 
              href="/settings" 
              className="flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700"
            >
              <Settings className="h-5 w-5 mr-3" />
              Settings
            </a>
          </li>
        </ul>
      </nav>
      
      {/* Logout Button */}
      <div className="absolute bottom-0 w-full p-4 border-t">
        <button 
          onClick={handleLogout}
          className="flex items-center p-2 w-full rounded-md hover:bg-gray-100 text-gray-700"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}