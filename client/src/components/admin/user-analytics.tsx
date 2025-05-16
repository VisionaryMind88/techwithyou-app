import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { format } from 'date-fns';
import { User, Project } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface UserAnalyticsProps {
  users: User[];
  projects: Array<Project & { user: User }>;
  isLoading?: boolean;
}

export function UserAnalytics({ users, projects, isLoading = false }: UserAnalyticsProps) {
  const [timeframe, setTimeframe] = useState('allTime');
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Process data for charts
  const usersByRole = getUsersByRole(users);
  const projectsPerUser = getProjectsPerUser(projects);
  const userEngagement = getUserEngagement(projects);
  const userActivity = getUserActivity(projects);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Analytics</CardTitle>
          <CardDescription>
            User demographics and engagement metrics
          </CardDescription>
        </div>
        <Select 
          value={timeframe} 
          onValueChange={setTimeframe}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Past Week</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
            <SelectItem value="quarter">Past Quarter</SelectItem>
            <SelectItem value="allTime">All Time</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="demographics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demographics">User Demographics</TabsTrigger>
            <TabsTrigger value="projects">Projects Per User</TabsTrigger>
            <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          </TabsList>
          
          <TabsContent value="demographics" className="mt-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usersByRole}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {usersByRole.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getRoleColor(entry.name)}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} Users`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="projects" className="mt-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectsPerUser.slice(0, 7)} // Show top 7 users
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
                    dataKey="projects"
                    fill="#8884d8"
                    name="Projects"
                  />
                  <Bar
                    dataKey="completed"
                    fill="#82ca9d"
                    name="Completed"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="engagement" className="mt-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userEngagement}
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
                  <Bar
                    dataKey="activeUsers"
                    fill="#3b82f6"
                    name="Active Users"
                  />
                  <Bar
                    dataKey="newUsers"
                    fill="#10b981"
                    name="New Users"
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
function getUsersByRole(users: User[]) {
  const roleCounts: Record<string, number> = {};
  
  users.forEach(user => {
    const role = user.role || 'unknown';
    roleCounts[formatRole(role)] = (roleCounts[formatRole(role)] || 0) + 1;
  });
  
  return Object.entries(roleCounts).map(([name, value]) => ({
    name,
    value
  }));
}

function getProjectsPerUser(projects: Array<Project & { user: User }>) {
  const userProjects: Record<string, { projects: number, completed: number }> = {};
  
  projects.forEach(project => {
    if (project.user) {
      const userName = `${project.user.firstName || ''} ${project.user.lastName || ''}`.trim() || project.user.email;
      
      if (!userProjects[userName]) {
        userProjects[userName] = { projects: 0, completed: 0 };
      }
      
      userProjects[userName].projects += 1;
      
      if (project.status === 'completed') {
        userProjects[userName].completed += 1;
      }
    }
  });
  
  // Sort by project count and convert to array
  return Object.entries(userProjects)
    .sort((a, b) => b[1].projects - a[1].projects)
    .map(([name, stats]) => ({
      name,
      projects: stats.projects,
      completed: stats.completed
    }));
}

function getUserEngagement(projects: Project[]) {
  // This would ideally be calculated from login/activity logs
  // For now, we'll generate some placeholder data
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    const dateStr = date.toISOString().split('T')[0];
    
    return {
      date: dateStr,
      activeUsers: 5 + Math.floor(Math.random() * 10),
      newUsers: Math.floor(Math.random() * 3)
    };
  });
  
  return last7Days;
}

function getUserActivity(projects: Project[]) {
  // This would be calculated from actual user activity data
  // For now, just return a placeholder
  return [];
}

function formatRole(role: string) {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getRoleColor(role: string) {
  const colorMap: Record<string, string> = {
    'Admin': '#3b82f6',     // Blue
    'Customer': '#10b981',  // Green
    'Manager': '#a855f7',   // Purple
    'Developer': '#f59e0b'  // Amber
  };
  
  return colorMap[role] || '#64748b'; // Default slate color
}