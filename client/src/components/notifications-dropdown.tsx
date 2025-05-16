import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ActivityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animation";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  id: number;
  type: string;
  description: string;
  projectId: number | null;
  userId: number;
  referenceId: number | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string | Date | null;
  metadata?: unknown;
  user?: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
  };
}

interface NotificationsDropdownProps {
  activities: Activity[];
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsDropdown({
  activities,
  isLoading,
  isOpen,
  onClose
}: NotificationsDropdownProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const markActivityAsRead = async (activityId: number) => {
    try {
      await apiRequest('PATCH', `/api/activities/${activityId}/read`);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
      toast({
        title: "Notification marked as read",
        variant: "default",
      });
    } catch (error) {
      console.error('Error marking activity as read:', error);
      toast({
        title: "Error",
        description: "Could not mark notification as read",
        variant: "destructive",
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 max-h-96 overflow-auto notifications-dropdown"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <motion.div 
            className="px-4 py-2 border-b border-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
          </motion.div>
          
          {isLoading ? (
            <motion.div 
              className="px-4 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </motion.div>
          ) : activities.length === 0 ? (
            <motion.div 
              className="px-4 py-3 text-sm text-gray-500 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              No notifications
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {activities.map((activity, index) => (
                <motion.div 
                  key={activity.id} 
                  className={`px-4 py-3 hover:bg-gray-50 border-l-4 cursor-pointer ${activity.isRead ? 'border-transparent' : 'border-blue-500'}`}
                  onClick={() => markActivityAsRead(activity.id)}
                  variants={staggerItem}
                  custom={index}
                  whileHover={{ 
                    x: 5,
                    backgroundColor: "rgba(243, 244, 246, 0.8)",
                    transition: { duration: 0.1 }
                  }}
                >
                  <div className="flex items-start">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      <ActivityIcon className="h-5 w-5 mr-3 text-blue-500 mt-0.5" />
                    </motion.div>
                    <div>
                      <motion.p 
                        className="text-sm text-gray-800"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                      >
                        {activity.description}
                      </motion.p>
                      <motion.p 
                        className="text-xs text-gray-500 mt-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        {activity.createdAt && format(new Date(activity.createdAt), 'MMM d, yyyy · h:mm a')}
                      </motion.p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          <motion.div 
            className="px-4 py-2 border-t border-gray-100 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              variant="link" 
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              onClick={() => {
                setLocation("/activities");
                onClose();
              }}
            >
              View all notifications
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}