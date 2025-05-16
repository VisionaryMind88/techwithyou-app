import { RiFolderLine, RiTimeLine, RiUserLine, RiChat3Line } from "react-icons/ri";
import { ArrowUp } from "lucide-react";
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface StatItem {
  label: string;
  translationKey?: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  change: {
    value: number;
    isPositive: boolean;
    period: string;
    periodTranslationKey?: string;
  };
  description?: string;
}

interface AdminDashboardStatsProps {
  stats: {
    totalProjects: StatItem;
    pendingApprovals: StatItem;
    activeCustomers: StatItem;
    unreadMessages: StatItem;
  };
  isLoading?: boolean;
  reducedMotion?: boolean;
}

// Simple loading skeleton
function StatsSkeleton() {
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
          <div className="mt-2 flex items-center">
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Simplified dashboard stats component without complex animations
export function AdminDashboardStats({ 
  stats, 
  isLoading = false
}: AdminDashboardStatsProps) {
  const { t } = useLanguage();
  
  // Handle loading state
  if (isLoading) {
    return <StatsSkeleton />;
  }

  // Default stats if not provided
  const defaultStats = {
    totalProjects: {
      label: "Total Projects",
      translationKey: "stats.totalProjects",
      value: 0,
      icon: RiFolderLine,
      color: "text-primary-600",
      bgColor: "bg-blue-100",
      change: {
        value: 0,
        isPositive: true,
        period: "from last month",
        periodTranslationKey: "stats.fromLastMonth"
      }
    },
    pendingApprovals: {
      label: "Pending Approvals",
      translationKey: "stats.pendingApprovals",
      value: 0,
      icon: RiTimeLine,
      color: "text-warning",
      bgColor: "bg-yellow-100",
      change: {
        value: 0,
        isPositive: false,
        period: "from last week",
        periodTranslationKey: "stats.fromLastWeek"
      }
    },
    activeCustomers: {
      label: "Active Customers",
      translationKey: "stats.activeCustomers",
      value: 0,
      icon: RiUserLine,
      color: "text-success",
      bgColor: "bg-green-100",
      change: {
        value: 0,
        isPositive: true,
        period: "from last month",
        periodTranslationKey: "stats.fromLastMonth"
      }
    },
    unreadMessages: {
      label: "Unread Messages",
      translationKey: "stats.unreadMessages",
      value: 0,
      icon: RiChat3Line,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: {
        value: 0,
        isPositive: false,
        period: "from yesterday",
        periodTranslationKey: "stats.fromYesterday"
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

  // Create array of stat items for rendering
  const statItems = Object.values(mergedStats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statItems.map((stat, index) => (
        <div 
          key={index} 
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">
                {stat.translationKey ? t(stat.translationKey) : stat.label}
              </h3>
              <p className="text-2xl font-bold text-gray-800">
                {stat.value}
              </p>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor} ${stat.color}`}>
              <stat.icon className="text-xl" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className={`flex items-center ${
              stat.change.isPositive ? "text-green-600" : "text-red-600"
            }`}>
              <ArrowUp
                className={`h-3 w-3 mr-1 ${
                  !stat.change.isPositive ? "rotate-180" : ""
                }`}
              />
              <span>
                {stat.change.value}%
              </span>
            </span>
            <span className="text-gray-500 ml-2">
              {stat.change.periodTranslationKey ? t(stat.change.periodTranslationKey) : stat.change.period}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
