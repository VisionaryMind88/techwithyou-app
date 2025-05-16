import { RiFolderLine, RiTimeLine, RiUserLine, RiChat3Line } from "react-icons/ri";
import { ArrowUp } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animation";

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
}

interface AdminDashboardStatsProps {
  stats: {
    totalProjects: StatItem;
    pendingApprovals: StatItem;
    activeCustomers: StatItem;
    unreadMessages: StatItem;
  };
  isLoading?: boolean;
}

export function AdminDashboardStats({ stats, isLoading = false }: AdminDashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
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
      }
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
      }
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
      }
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
      }
    }
  };

  // Merge provided stats with defaults
  const mergedStats = {
    totalProjects: { ...defaultStats.totalProjects, ...stats.totalProjects },
    pendingApprovals: { ...defaultStats.pendingApprovals, ...stats.pendingApprovals },
    activeCustomers: { ...defaultStats.activeCustomers, ...stats.activeCustomers },
    unreadMessages: { ...defaultStats.unreadMessages, ...stats.unreadMessages }
  };

  const statItems = Object.values(mergedStats);

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-4 gap-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {statItems.map((stat, index) => (
        <motion.div 
          key={index} 
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all relative overflow-hidden"
          variants={staggerItem}
          whileHover={{ 
            y: -5,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            background: `linear-gradient(135deg, white 0%, ${stat.bgColor} 100%)`,
            transition: { type: "spring", stiffness: 300 }
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <motion.p 
                className="text-sm font-medium text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                {stat.label}
              </motion.p>
              <motion.p 
                className="text-2xl font-bold text-gray-800"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.3 + index * 0.1,
                  type: "spring",
                  stiffness: 300
                }}
              >
                {stat.value}
              </motion.p>
            </div>
            <motion.div 
              className={`p-3 rounded-full ${stat.bgColor} ${stat.color} relative z-10`}
              whileHover={{ 
                scale: 1.15,
                rotate: 10,
                boxShadow: "0 0 12px rgba(0, 0, 0, 0.1)",
                transition: { 
                  type: "spring", 
                  stiffness: 400,
                  damping: 10
                }
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ 
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                <stat.icon className="text-xl" />
              </motion.div>
            </motion.div>
          </div>
          <motion.div 
            className="mt-2 flex items-center text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <span className={`flex items-center ${
              stat.change.isPositive ? "text-green-600" : "text-red-600"
            }`}>
              <motion.div
                animate={{ 
                  y: [0, stat.change.isPositive ? -3 : 3, 0],
                }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  duration: 1.5,
                  repeatDelay: 2
                }}
              >
                <ArrowUp
                  className={`h-3 w-3 mr-1 ${
                    !stat.change.isPositive ? "rotate-180" : ""
                  }`}
                />
              </motion.div>
              {stat.change.value}%
            </span>
            <span className="text-gray-500 ml-2">{stat.change.period}</span>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}
