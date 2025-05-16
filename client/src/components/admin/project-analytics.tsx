import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, TooltipProps
} from 'recharts';
import { Project, User } from '@shared/schema';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface ProjectAnalyticsProps {
  projects: Array<Project & { user: User }>;
  isLoading?: boolean;
}

export function ProjectAnalytics({ projects, isLoading = false }: ProjectAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Process data for charts
  const projectsByStatus = getProjectsByStatus(projects);
  const projectsOverTime = getProjectsOverTime(projects);
  const projectsByCustomer = getProjectsByCustomer(projects);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Analytics</CardTitle>
        <CardDescription>
          Detailed insights into project performance and distribution
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status Distribution</TabsTrigger>
            <TabsTrigger value="timeline">Timeline Trends</TabsTrigger>
            <TabsTrigger value="customers">Customer Distribution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="mt-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {projectsByStatus.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getStatusColor(entry.name)}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} Projects`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="timeline" className="mt-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={projectsOverTime}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMMM d, yyyy')}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    activeDot={{ r: 8 }}
                    name="Projects"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="customers" className="mt-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectsByCustomer.slice(0, 7)} // Show top 7 customers
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="value"
                    fill="#10b981"
                    name="Projects"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Utility functions to process data for charts
function getProjectsByStatus(projects: Project[]) {
  const statusCounts: Record<string, number> = {};
  
  projects.forEach(project => {
    const status = formatStatus(project.status);
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  return Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value
  }));
}

function getProjectsOverTime(projects: Project[]) {
  // Group projects by date
  const projectsByDate: Record<string, number> = {};
  
  projects.forEach(project => {
    if (project.createdAt) {
      const date = new Date(project.createdAt).toISOString().split('T')[0];
      projectsByDate[date] = (projectsByDate[date] || 0) + 1;
    }
  });
  
  // Convert to array and sort by date
  const sortedDates = Object.keys(projectsByDate).sort();
  
  // Create cumulative count
  let cumulativeCount = 0;
  return sortedDates.map(date => {
    cumulativeCount += projectsByDate[date];
    return {
      date,
      count: cumulativeCount
    };
  });
}

function getProjectsByCustomer(projects: Array<Project & { user: User }>) {
  const customerCounts: Record<string, number> = {};
  
  projects.forEach(project => {
    if (project.user) {
      const customerName = `${project.user.firstName || ''} ${project.user.lastName || ''}`.trim() || project.user.email;
      customerCounts[customerName] = (customerCounts[customerName] || 0) + 1;
    }
  });
  
  // Sort by count (descending) and convert to array
  return Object.entries(customerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getStatusColor(status: string) {
  const colorMap: Record<string, string> = {
    'Pending Approval': '#f59e0b', // Amber
    'In Progress': '#3b82f6',      // Blue
    'Completed': '#10b981',        // Green
    'Cancelled': '#ef4444',        // Red
    'On Hold': '#a855f7'           // Purple
  };
  
  return colorMap[status] || '#64748b'; // Default slate color
}