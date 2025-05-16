import { Home, FolderOpen, MessageSquare, Settings, LogOut, X, Users, Activity } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Logo } from "@/components/logo";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LiveTrackingSidebar } from "./sidebar/live-tracking-sidebar";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile = false, onClose, userRole }: SidebarProps & { userRole?: string }) {
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
    <div className="w-64 h-full bg-blue-600 text-white shadow-lg">
      {/* Logo and Header */}
      <div className="h-16 flex items-center px-6 border-b border-blue-500">
        <Logo size="md" textColor="text-white" />
        
        {isMobile && onClose && (
          <button 
            className="ml-auto text-white hover:text-blue-100"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      
      {/* User Profile */}
      <div className="p-4 border-b border-blue-500">
        <div className="flex items-center">
          <Link to="/settings" className="cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center text-blue-800 font-semibold overflow-hidden">
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.firstName?.[0] || 'U'
              )}
            </div>
          </Link>
          <div className="ml-3">
            <p className="font-medium text-white">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-blue-200">{user?.email}</p>
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
                "flex items-center p-2 rounded-md hover:bg-blue-500 text-white",
                isActive("/") && "bg-blue-700 text-white font-medium"
              )}
            >
              <Home className={cn("h-5 w-5 mr-3", isActive("/") && "text-blue-100")} />
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/projects" 
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-blue-500 text-white",
                isActive("/projects") && "bg-blue-700 text-white font-medium"
              )}
            >
              <FolderOpen className={cn("h-5 w-5 mr-3", isActive("/projects") && "text-blue-100")} />
              Projects
            </Link>
          </li>
          <li>
            <Link 
              to="/messages" 
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-blue-500 text-white",
                isActive("/messages") && "bg-blue-700 text-white font-medium"
              )}
            >
              <MessageSquare className={cn("h-5 w-5 mr-3", isActive("/messages") && "text-blue-100")} />
              Messages
            </Link>
          </li>
          <li>
            <Link 
              to="/settings" 
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-blue-500 text-white",
                isActive("/settings") && "bg-blue-700 text-white font-medium"
              )}
            >
              <Settings className={cn("h-5 w-5 mr-3", isActive("/settings") && "text-blue-100")} />
              Settings
            </Link>
          </li>
          
          {/* Users link - only visible for admin */}
          {(userRole === "admin" || user?.role === "admin") && (
            <li>
              <Link 
                to="/users" 
                className={cn(
                  "flex items-center p-2 rounded-md hover:bg-blue-500 text-white",
                  isActive("/users") && "bg-blue-700 text-white font-medium"
                )}
              >
                <Users className={cn("h-5 w-5 mr-3", isActive("/users") && "text-blue-100")} />
                Users
              </Link>
            </li>
          )}
          
          {/* Live Tracking Section */}
          <li className="mt-4">
            <div className="px-2">
              <LiveTrackingSidebar />
            </div>
          </li>
        </ul>
      </nav>
      
      {/* Logout Button */}
      <div className="absolute bottom-0 w-full p-4 border-t border-blue-500">
        <button 
          onClick={handleLogout}
          className="flex items-center p-2 w-full rounded-md hover:bg-blue-500 text-white"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}