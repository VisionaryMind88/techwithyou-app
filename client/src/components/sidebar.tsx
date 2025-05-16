import { Home, FolderOpen, MessageSquare, Settings, LogOut, X, Users, Activity } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Logo } from "@/components/logo";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LiveTrackingSidebar } from "./sidebar/live-tracking-sidebar";
import { motion } from "framer-motion";
import { AnimatedIcon } from "./ui/animated-components";
import { staggerContainer, staggerItem } from "@/lib/animation";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "./language-switcher";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile = false, onClose, userRole }: SidebarProps & { userRole?: string }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [location] = useLocation();
  
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    <motion.div 
      className="w-64 h-full bg-blue-600 text-white shadow-lg"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.25, 0.1, 0.25, 1],
        staggerChildren: 0.1 
      }}
    >
      {/* Logo and Header */}
      <motion.div 
        className="h-20 flex items-center justify-center px-6 border-b border-blue-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Logo size="lg" textColor="text-white" className="py-2" />
        
        {isMobile && onClose && (
          <motion.button 
            className="ml-auto text-white hover:text-blue-100"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-6 w-6" />
          </motion.button>
        )}
      </motion.div>
      
      {/* User Profile */}
      <motion.div 
        className="p-4 border-b border-blue-500"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center">
          <Link to="/settings" className="cursor-pointer">
            <motion.div 
              className="w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center text-blue-800 font-semibold overflow-hidden"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.firstName?.[0] || 'U'
              )}
            </motion.div>
          </Link>
          <motion.div 
            className="ml-3"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="font-medium text-white">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-blue-200">{user?.email}</p>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Navigation Links */}
      <motion.nav 
        className="p-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.ul className="space-y-2">
          <motion.li variants={staggerItem}>
            <Link 
              to="/" 
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-blue-500 text-white",
                isActive("/") && "bg-blue-700 text-white font-medium"
              )}
            >
              <AnimatedIcon className="mr-3">
                <Home className={cn("h-5 w-5", isActive("/") && "text-blue-100")} />
              </AnimatedIcon>
              {t('nav.dashboard')}
            </Link>
          </motion.li>
          <motion.li variants={staggerItem}>
            <Link 
              to="/projects" 
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-blue-500 text-white",
                isActive("/projects") && "bg-blue-700 text-white font-medium"
              )}
            >
              <AnimatedIcon className="mr-3">
                <FolderOpen className={cn("h-5 w-5", isActive("/projects") && "text-blue-100")} />
              </AnimatedIcon>
              {t('nav.projects')}
            </Link>
          </motion.li>
          <motion.li variants={staggerItem}>
            <Link 
              to="/messages" 
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-blue-500 text-white",
                isActive("/messages") && "bg-blue-700 text-white font-medium"
              )}
            >
              <AnimatedIcon className="mr-3">
                <MessageSquare className={cn("h-5 w-5", isActive("/messages") && "text-blue-100")} />
              </AnimatedIcon>
              {t('nav.messages')}
            </Link>
          </motion.li>
          <motion.li variants={staggerItem}>
            <Link 
              to="/settings" 
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-blue-500 text-white",
                isActive("/settings") && "bg-blue-700 text-white font-medium"
              )}
            >
              <AnimatedIcon className="mr-3">
                <Settings className={cn("h-5 w-5", isActive("/settings") && "text-blue-100")} />
              </AnimatedIcon>
              {t('nav.settings')}
            </Link>
          </motion.li>
          
          {/* Users link - only visible for admin */}
          {(userRole === "admin" || user?.role === "admin") && (
            <motion.li variants={staggerItem}>
              <Link 
                to="/users" 
                className={cn(
                  "flex items-center p-2 rounded-md hover:bg-blue-500 text-white",
                  isActive("/users") && "bg-blue-700 text-white font-medium"
                )}
              >
                <AnimatedIcon className="mr-3">
                  <Users className={cn("h-5 w-5", isActive("/users") && "text-blue-100")} />
                </AnimatedIcon>
                {t('nav.users')}
              </Link>
            </motion.li>
          )}
          
          {/* Live Tracking Section */}
          <motion.li variants={staggerItem}>
            <Link 
              to="/tracking" 
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-blue-500 text-white",
                isActive("/tracking") && "bg-blue-700 text-white font-medium"
              )}
            >
              <AnimatedIcon className="mr-3">
                <Activity className={cn("h-5 w-5 text-green-400", isActive("/tracking") && "text-green-300")} />
              </AnimatedIcon>
              <span className={isActive("/tracking") ? "text-white" : "text-green-300"}>{t('tracking.title')}</span>
              
              {/* Badge showing active tracking items if any */}
              <LiveTrackingSidebar minimal={true} />
            </Link>
          </motion.li>
        </motion.ul>
      </motion.nav>
      
      {/* Footer - changed from absolute to sticky positioning */}
      <motion.div 
        className="sticky bottom-0 w-full p-4 border-t border-blue-500 bg-blue-600 mt-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {/* Language Switcher */}
        <div className="flex justify-center mb-4">
          <LanguageSwitcher className="bg-blue-700 hover:bg-blue-600" />
        </div>
      
        {/* Logout Button */}
        <motion.button 
          onClick={handleLogout}
          className="flex items-center p-2 w-full rounded-md hover:bg-blue-500 text-white"
          whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.8)", scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <AnimatedIcon className="mr-3" whileHover={{ rotate: 15 }}>
            <LogOut className="h-5 w-5" />
          </AnimatedIcon>
          {t('action.logout')}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}