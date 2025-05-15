import { Home, FolderOpen, MessageSquare, Settings, LogOut, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Logo } from "@/components/logo";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  
  const handleLogout = () => {
    logout();
    console.log("Logging out...");
    
    // If on mobile, close the sidebar
    if (isMobile && onClose) {
      onClose();
    }
  };
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
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
            <Link 
              to="/" 
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700",
                isActive("/") && "bg-blue-50 text-blue-700 font-medium"
              )}
            >
              <Home className={cn("h-5 w-5 mr-3", isActive("/") && "text-blue-700")} />
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/projects" 
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700",
                isActive("/projects") && "bg-blue-50 text-blue-700 font-medium"
              )}
            >
              <FolderOpen className={cn("h-5 w-5 mr-3", isActive("/projects") && "text-blue-700")} />
              Projects
            </Link>
          </li>
          <li>
            <Link 
              to="/messages" 
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700",
                isActive("/messages") && "bg-blue-50 text-blue-700 font-medium"
              )}
            >
              <MessageSquare className={cn("h-5 w-5 mr-3", isActive("/messages") && "text-blue-700")} />
              Messages
            </Link>
          </li>
          <li>
            <Link 
              to="/settings" 
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700",
                isActive("/settings") && "bg-blue-50 text-blue-700 font-medium"
              )}
            >
              <Settings className={cn("h-5 w-5 mr-3", isActive("/settings") && "text-blue-700")} />
              Settings
            </Link>
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