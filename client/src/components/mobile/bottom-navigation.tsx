import { Link, useLocation } from "wouter";
import { Home, FolderOpen, MessageSquare, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around h-16 md:hidden z-40">
      <Link 
        to="/" 
        className={cn(
          "flex flex-col items-center justify-center w-full h-full text-xs text-gray-600",
          isActive("/") && "text-primary-600"
        )}
      >
        <Home className={cn("h-5 w-5 mb-1", isActive("/") && "text-primary-600")} />
        <span>Home</span>
      </Link>
      
      <Link 
        to="/projects" 
        className={cn(
          "flex flex-col items-center justify-center w-full h-full text-xs text-gray-600",
          isActive("/projects") && "text-primary-600"
        )}
      >
        <FolderOpen className={cn("h-5 w-5 mb-1", isActive("/projects") && "text-primary-600")} />
        <span>Projects</span>
      </Link>
      
      <Link 
        to="/messages" 
        className={cn(
          "flex flex-col items-center justify-center w-full h-full text-xs text-gray-600",
          isActive("/messages") && "text-primary-600"
        )}
      >
        <MessageSquare className={cn("h-5 w-5 mb-1", isActive("/messages") && "text-primary-600")} />
        <span>Messages</span>
      </Link>
      
      <Link 
        to="/settings" 
        className={cn(
          "flex flex-col items-center justify-center w-full h-full text-xs text-gray-600",
          isActive("/settings") && "text-primary-600"
        )}
      >
        <Settings className={cn("h-5 w-5 mb-1", isActive("/settings") && "text-primary-600")} />
        <span>Settings</span>
      </Link>
    </div>
  );
}