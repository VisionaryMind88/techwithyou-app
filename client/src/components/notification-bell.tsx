import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Notification {
  id: number;
  title: string;
  description: string;
  type: 'message' | 'project' | 'tracking';
  createdAt: string;
  isRead: boolean;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Polling interval for notifications in milliseconds (30 seconds)
  const POLLING_INTERVAL = 30 * 1000;

  // Query to get messages
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/messages/recent'],
    enabled: !!user,
  });

  // Query to get activities
  const { data: activities, refetch: refetchActivities } = useQuery({
    queryKey: ['/api/activities/user'],
    enabled: !!user,
  });

  // Query to get tracking items
  const { data: trackingItems, refetch: refetchTracking } = useQuery({ 
    queryKey: ['/api/tracking/items'],
    enabled: !!user,
  });
  
  // Check for unread items
  useEffect(() => {
    if (!user) return;
    
    const unreadMessages = messages?.filter((msg: any) => !msg.isRead) || [];
    const unreadActivities = activities?.filter((act: any) => !act.isRead) || [];
    const activeTrackingItems = trackingItems?.filter((item: any) => item.isActive) || [];
    
    const totalUnread = unreadMessages.length + unreadActivities.length + activeTrackingItems.length;
    
    // If there are new unread items, set the notification flag
    if (totalUnread > unreadCount) {
      setHasNewNotification(true);
      
      // Show toast notification
      if (unreadMessages.length > unreadCount) {
        toast({
          title: t('notifications.newMessage') || 'New Message',
          description: t('notifications.checkInbox') || 'You have a new message. Check your inbox.',
        });
      } else if (activeTrackingItems.length > 0) {
        toast({
          title: t('notifications.newTracking') || 'Live Tracking Update',
          description: t('notifications.trackingActive') || 'A tracking item has been activated.',
        });
      }
    }
    
    setUnreadCount(totalUnread);
    
    // Merge all notifications
    const allNotifications: Notification[] = [
      ...unreadMessages.map((msg: any) => ({
        id: msg.id,
        title: t('notifications.message') || 'Message',
        description: msg.subject || t('notifications.newMessage') || 'New message',
        type: 'message' as const,
        createdAt: msg.createdAt,
        isRead: msg.isRead
      })),
      ...unreadActivities.map((act: any) => ({
        id: act.id,
        title: t('notifications.activity') || 'Activity',
        description: act.description,
        type: 'project' as const,
        createdAt: act.createdAt,
        isRead: act.isRead
      })),
      ...activeTrackingItems.map((item: any) => ({
        id: item.id,
        title: t('notifications.tracking') || 'Tracking',
        description: item.name,
        type: 'tracking' as const,
        createdAt: item.updatedAt || item.createdAt,
        isRead: false
      }))
    ];
    
    // Sort by date, newest first
    allNotifications.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    setNotifications(allNotifications);
  }, [messages, activities, trackingItems, user, unreadCount, toast, t]);
  
  // Set up polling
  useEffect(() => {
    if (!user) return;
    
    const intervalId = setInterval(() => {
      refetchMessages();
      refetchActivities();
      refetchTracking();
    }, POLLING_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [user, refetchMessages, refetchActivities, refetchTracking]);
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    switch (notification.type) {
      case 'message':
        window.location.href = '/messages';
        break;
      case 'project':
        window.location.href = '/';  // Dashboard
        break;
      case 'tracking':
        window.location.href = '/tracking';
        break;
    }
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <motion.button
        className="text-gray-500 hover:text-gray-700 focus:outline-none relative"
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNewNotification(false);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <motion.span 
            className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            {unreadCount}
          </motion.span>
        )}
        {hasNewNotification && (
          <motion.span
            className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
        )}
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 max-h-96 overflow-y-auto overflow-x-hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">
                {t('notifications.title') || 'Notifications'}
              </h3>
            </div>
            
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {t('notifications.noNotifications') || 'No new notifications'}
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <motion.div
                    key={`${notification.type}-${notification.id}`}
                    className={`p-3 border-b border-gray-100 cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    whileHover={{ backgroundColor: '#f0f9ff' }}
                  >
                    <div className="flex items-start">
                      <div className={`mt-1 mr-3 rounded-full p-1 ${
                        notification.type === 'message' ? 'bg-blue-100' :
                        notification.type === 'project' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        {notification.type === 'message' && (
                          <Bell className="h-4 w-4 text-blue-500" />
                        )}
                        {notification.type === 'project' && (
                          <Bell className="h-4 w-4 text-green-500" />
                        )}
                        {notification.type === 'tracking' && (
                          <Bell className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {notification.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                <div className="p-2 text-center">
                  <button
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => setIsOpen(false)}
                  >
                    {t('action.close') || 'Close'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}