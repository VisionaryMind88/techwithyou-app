import { RiFolderLine, RiCheckLine, RiChat3Line } from "react-icons/ri";

interface DashboardStatsProps {
  stats: {
    activeProjects: number;
    completedProjects: number;
    newMessages: number;
  };
  isLoading?: boolean;
}

export function DashboardStats({ stats, isLoading = false }: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="ml-4">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-7 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Active Projects */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-primary-600">
            <RiFolderLine className="text-xl" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">Active Projects</h3>
            <p className="text-2xl font-bold text-primary-600">{stats.activeProjects}</p>
          </div>
        </div>
      </div>
      
      {/* Completed Projects */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-success">
            <RiCheckLine className="text-xl" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">Completed</h3>
            <p className="text-2xl font-bold text-success">{stats.completedProjects}</p>
          </div>
        </div>
      </div>
      
      {/* New Messages */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-yellow-100 text-warning">
            <RiChat3Line className="text-xl" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">New Messages</h3>
            <p className="text-2xl font-bold text-warning">{stats.newMessages}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
