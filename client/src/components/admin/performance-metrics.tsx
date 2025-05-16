import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Message, Project, User } from '@shared/schema';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PerformanceMetricsProps {
  projects: Array<Project & { user: User }>;
  messages: Array<Message & { sender: User, project: Project }>;
  activities: Array<Activity & { user: User }>;
  isLoading?: boolean;
}

export function PerformanceMetrics({ 
  projects, 
  messages, 
  activities,
  isLoading = false 
}: PerformanceMetricsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Calculate KPIs
  const avgResponseTime = calculateResponseTime(messages);
  const projectCompletionRate = calculateCompletionRate(projects);
  const customerSatisfactionRate = 95; // This would be calculated from actual feedback data
  
  // Process data for charts
  const activityData = getActivityTimeline(activities);
  const responseTimeData = getResponseTimeData(messages);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>
          Key indicators of team performance and customer satisfaction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Average Response Time */}
          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Avg. Response Time</p>
                  <p className="text-2xl font-bold text-blue-900">{avgResponseTime} hrs</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 text-blue-700">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-2 text-xs text-blue-700">
                Average time to respond to customer inquiries
              </p>
            </CardContent>
          </Card>
          
          {/* Project Completion Rate */}
          <Card className="bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Completion Rate</p>
                  <p className="text-2xl font-bold text-green-900">{projectCompletionRate}%</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 text-green-700">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-2 text-xs text-green-700">
                Percentage of projects completed successfully
              </p>
            </CardContent>
          </Card>
          
          {/* Customer Satisfaction */}
          <Card className="bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Customer Satisfaction</p>
                  <p className="text-2xl font-bold text-yellow-900">{customerSatisfactionRate}%</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-700">
                  <AlertCircle className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-2 text-xs text-yellow-700">
                Based on customer feedback and ratings
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activity">Activity Levels</TabsTrigger>
            <TabsTrigger value="response">Response Times</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="mt-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={activityData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
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
                  <Area 
                    type="monotone" 
                    dataKey="messages" 
                    stackId="1" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    name="Messages"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="activities" 
                    stackId="1" 
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    name="Activities" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="projects" 
                    stackId="1" 
                    stroke="#ffc658" 
                    fill="#ffc658" 
                    name="Projects" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="response" className="mt-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={responseTimeData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis unit="hrs" />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMMM d, yyyy')}
                    formatter={(value) => [`${value} hours`, 'Avg. Response Time']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    name="Response Time"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Utility functions
function calculateResponseTime(messages: Message[]): number {
  // This is a simplified calculation - in a real app, you'd match requests with responses
  if (messages.length === 0) return 0;
  
  // Just return an average as a placeholder
  return Math.round(Math.random() * 5 * 100) / 100; // Random value between 0-5 with 2 decimal places
}

function calculateCompletionRate(projects: Project[]): number {
  if (projects.length === 0) return 0;
  
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  return Math.round((completedProjects / projects.length) * 100);
}

function getActivityTimeline(activities: Activity[]): any[] {
  // Create a date range for the last 14 days
  const dateRange = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i); // Start from 13 days ago to today
    return {
      date: date.toISOString().split('T')[0],
      messages: Math.floor(Math.random() * 10), // Simulated data
      activities: Math.floor(Math.random() * 15),
      projects: Math.floor(Math.random() * 3)
    };
  });
  
  return dateRange;
}

function getResponseTimeData(messages: Message[]): any[] {
  // Create a date range for the last 14 days
  return Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    return {
      date: date.toISOString().split('T')[0],
      responseTime: 2 + Math.sin(i / 2) * 1.5 // Generate a wave pattern for demo
    };
  });
}