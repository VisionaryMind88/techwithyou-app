import { RiFolderLine, RiTimeLine, RiUserLine, RiChat3Line } from "react-icons/ri";
import { ArrowUp } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animation";
import { useEffect, useRef, useState } from "react";

interface StatItem {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  change: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  description?: string; // Added for more detailed accessibility description
}

interface AdminDashboardStatsProps {
  stats: {
    totalProjects: StatItem;
    pendingApprovals: StatItem;
    activeCustomers: StatItem;
    unreadMessages: StatItem;
  };
  isLoading?: boolean;
  reducedMotion?: boolean; // For users who prefer reduced motion
}

export function AdminDashboardStats({ 
  stats, 
  isLoading = false,
  reducedMotion = false
}: AdminDashboardStatsProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Handle keyboard navigation between stat cards
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % cardRefs.current.length;
      cardRefs.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + cardRefs.current.length) % cardRefs.current.length;
      cardRefs.current[prevIndex]?.focus();
    }
  };

  // Loading skeleton with ARIA-live and proper role attributes
  if (isLoading) {
    return (
      <div 
        className="grid grid-cols-1 md:grid-cols-4 gap-6" 
        role="status" 
        aria-live="polite"
        aria-busy="true"
        aria-label="Loading dashboard statistics"
      >
        <div className="sr-only">Loading dashboard statistics</div>
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className="bg-white p-6 rounded-lg shadow-sm animate-pulse"
            aria-hidden="true"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="p-3 rounded-full bg-gray-200 h-10 w-10"></div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default stats if not provided
  const defaultStats: AdminDashboardStatsProps["stats"] = {
    totalProjects: {
      label: "Total Projects",
      value: 0,
      icon: RiFolderLine,
      color: "text-primary-600",
      bgColor: "bg-blue-100",
      change: {
        value: 0,
        isPositive: true,
        period: "from last month"
      },
      description: "Total number of projects in the system"
    },
    pendingApprovals: {
      label: "Pending Approvals",
      value: 0,
      icon: RiTimeLine,
      color: "text-warning",
      bgColor: "bg-yellow-100",
      change: {
        value: 0,
        isPositive: false,
        period: "from last week"
      },
      description: "Projects awaiting approval by administrators"
    },
    activeCustomers: {
      label: "Active Customers",
      value: 0,
      icon: RiUserLine,
      color: "text-success",
      bgColor: "bg-green-100",
      change: {
        value: 0,
        isPositive: true,
        period: "from last month"
      },
      description: "Number of customers who have logged in recently"
    },
    unreadMessages: {
      label: "Unread Messages",
      value: 0,
      icon: RiChat3Line,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: {
        value: 0,
        isPositive: false,
        period: "from yesterday"
      },
      description: "Messages that have not been read yet"
    }
  };

  // Merge provided stats with defaults
  const mergedStats = {
    totalProjects: { ...defaultStats.totalProjects, ...stats.totalProjects },
    pendingApprovals: { ...defaultStats.pendingApprovals, ...stats.pendingApprovals },
    activeCustomers: { ...defaultStats.activeCustomers, ...stats.activeCustomers },
    unreadMessages: { ...defaultStats.unreadMessages, ...stats.unreadMessages }
  };

  // Create array of stat items for rendering
  const statItems = Object.values(mergedStats);
  
  // Help screen readers announce changes to stats
  useEffect(() => {
    const statsDescription = statItems.map(stat => 
      `${stat.label}: ${stat.value} (${stat.change.isPositive ? 'up' : 'down'} ${stat.change.value}% ${stat.change.period})`
    ).join('. ');
    
    const announcement = document.getElementById('stats-announcement');
    if (announcement) {
      announcement.textContent = `Dashboard statistics: ${statsDescription}`;
    }
  }, [statItems]);

  return (
    <>
      {/* Visually hidden announcement for screen readers */}
      <div 
        id="stats-announcement" 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      ></div>
      
      {/* Instructions for keyboard users */}
      <div className="sr-only" id="stats-keyboard-instructions">
        Use arrow keys to navigate between statistics cards. Press Tab to move to the next interactive element.
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        variants={reducedMotion ? {} : staggerContainer}
        initial={reducedMotion ? "visible" : "hidden"}
        animate="visible"
        aria-labelledby="dashboard-stats-heading"
        role="region"
      >
        <h2 id="dashboard-stats-heading" className="sr-only">Dashboard Statistics</h2>
        {statItems.map((stat, index) => (
          <motion.div 
            key={index} 
            className={`bg-white p-6 rounded-lg shadow-sm transition-all relative overflow-hidden
              ${focusedIndex === index ? 'ring-2 ring-primary-500 ring-offset-2' : 'hover:shadow-md'}
              focus:outline-none`}
            variants={reducedMotion ? {} : staggerItem}
            whileHover={reducedMotion ? {} : { 
              y: -5,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              background: `linear-gradient(135deg, white 0%, ${stat.bgColor} 100%)`,
              transition: { type: "spring", stiffness: 300 }
            }}
            role="region"
            aria-labelledby={`stat-heading-${index}`}
            aria-describedby={`stat-desc-${index}`}
            tabIndex={0}
            ref={el => cardRefs.current[index] = el}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            <div className="flex items-center justify-between">
              <div>
                <motion.h3 
                  id={`stat-heading-${index}`}
                  className="text-sm font-medium text-gray-700"
                  initial={reducedMotion ? {} : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reducedMotion ? 0 : 0.2 + index * 0.1 }}
                >
                  {stat.label}
                </motion.h3>
                <motion.p 
                  className="text-2xl font-bold text-gray-800"
                  aria-label={`${stat.value} ${stat.label}`}
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reducedMotion ? {} : { 
                    delay: 0.3 + index * 0.1,
                    type: "spring",
                    stiffness: 300
                  }}
                >
                  <motion.span
                    key={stat.value}
                    initial={reducedMotion ? {} : { scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={reducedMotion ? {} : { scale: 0.8, opacity: 0 }}
                    transition={reducedMotion ? {} : {
                      type: "spring",
                      stiffness: 500,
                      damping: 15
                    }}
                  >
                    {stat.value}
                  </motion.span>
                </motion.p>
                
                {/* Hidden description for screen readers */}
                <div 
                  id={`stat-desc-${index}`} 
                  className="sr-only"
                >
                  {stat.description || stat.label}. Current value is {stat.value}, which is 
                  {stat.change.isPositive ? ' up ' : ' down '} 
                  {stat.change.value}% {stat.change.period}.
                </div>
              </div>
              <motion.div 
                className={`p-3 rounded-full ${stat.bgColor} ${stat.color} relative z-10 overflow-hidden`}
                whileHover={reducedMotion ? {} : { 
                  scale: 1.15,
                  rotate: 10,
                  boxShadow: "0 0 12px rgba(0, 0, 0, 0.1)",
                  transition: { 
                    type: "spring", 
                    stiffness: 400,
                    damping: 10
                  }
                }}
                initial={reducedMotion ? {} : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={reducedMotion ? {} : { delay: 0.3 + index * 0.1 }}
                aria-hidden="true"
              >
                <motion.div
                  className="relative"
                  animate={reducedMotion ? {} : { 
                    rotate: [0, 5, 0, -5, 0],
                    scale: [1, 1.1, 1, 0.95, 1] 
                  }}
                  transition={reducedMotion ? {} : { 
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                >
                  <stat.icon className="text-xl relative z-10" />
                  <motion.div 
                    className={`absolute inset-0 bg-${stat.color.split('-')[1]}-400 opacity-20 rounded-full blur-md`}
                    animate={reducedMotion ? {} : { 
                      scale: [1, 1.4, 1],
                      opacity: [0.2, 0.3, 0.2] 
                    }}
                    transition={reducedMotion ? {} : { 
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                </motion.div>
              </motion.div>
            </div>
            <motion.div 
              className="mt-2 flex items-center text-sm"
              initial={reducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={reducedMotion ? {} : { delay: 0.4 + index * 0.1 }}
            >
              <motion.span 
                className={`flex items-center ${
                  stat.change.isPositive ? "text-green-600" : "text-red-600"
                }`}
                whileHover={reducedMotion ? {} : { 
                  scale: 1.1,
                  transition: { duration: 0.2 }
                }}>
                <motion.div
                  className="relative"
                  animate={reducedMotion ? {} : { 
                    y: [0, stat.change.isPositive ? -3 : 3, 0],
                  }}
                  transition={reducedMotion ? {} : { 
                    repeat: Infinity, 
                    repeatType: "reverse", 
                    duration: 1.5,
                    repeatDelay: 2
                  }}
                  aria-hidden="true"
                >
                  <motion.div 
                    className={`absolute inset-0 ${
                      stat.change.isPositive ? "bg-green-400" : "bg-red-400"
                    } opacity-25 rounded-full -m-1 blur-sm`}
                    animate={reducedMotion ? {} : { 
                      scale: [1, 1.5, 1],
                      opacity: [0.2, 0.4, 0.2] 
                    }}
                    transition={reducedMotion ? {} : { 
                      duration: 2,
                      repeat: Infinity
                    }}
                  />
                  <ArrowUp
                    className={`h-3 w-3 mr-1 relative z-10 ${
                      !stat.change.isPositive ? "rotate-180" : ""
                    }`}
                  />
                </motion.div>
                <motion.span
                  key={stat.change.value}
                  initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                  animate={reducedMotion ? {} : { 
                    opacity: 1, 
                    scale: 1,
                    color: stat.change.isPositive 
                      ? ['#16a34a', '#22c55e', '#16a34a']  // green variations
                      : ['#dc2626', '#ef4444', '#dc2626']  // red variations
                  }}
                  transition={reducedMotion ? {} : { 
                    delay: 0.5 + index * 0.1,
                    color: { 
                      repeat: Infinity,
                      duration: 3,
                      repeatType: "reverse"
                    }
                  }}
                  aria-label={`${stat.change.isPositive ? 'Up' : 'Down'} ${stat.change.value} percent`}
                >
                  {stat.change.value}%
                </motion.span>
              </motion.span>
              <motion.span 
                className="text-gray-500 ml-2"
                initial={reducedMotion ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={reducedMotion ? {} : { delay: 0.6 + index * 0.1 }}
              >
                {stat.change.period}
              </motion.span>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}
