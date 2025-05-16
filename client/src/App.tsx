import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import DirectLoginPage from "@/pages/direct-login";
import CustomerDashboard from "@/pages/customer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ProjectDetail from "@/pages/project-detail";
import ProjectsPage from "@/pages/projects";
import MessagesPage from "@/pages/messages";
import SettingsPage from "@/pages/settings";
import UsersPage from "@/pages/users";
import TrackingPage from "@/pages/tracking-page";
import TrackingViewPage from "@/pages/tracking-view-page";
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentCheckoutPage from "@/pages/payment-checkout";
import { useAuth, AuthProvider } from "./context/auth-context";
import { ThemeProvider } from "next-themes";
import { handleAuthRedirect } from "./lib/firebase";
import { useToast } from "./hooks/use-toast";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { AccessibilitySettings } from "./components/accessibility/AccessibilitySettings";
import { LanguageProvider } from "./contexts/LanguageContext";

// Component to handle auth redirects
function AuthRedirectHandler() {
  const { toast } = useToast();
  
  useEffect(() => {
    async function handleRedirect() {
      try {
        const user = await handleAuthRedirect();
        
        if (user) {
          toast({
            title: "Authentication Successful",
            description: `Welcome${user.firstName ? `, ${user.firstName}` : ''}!`,
          });
        }
      } catch (error) {
        console.error("Auth redirect error:", error);
        toast({
          title: "Authentication Failed",
          description: "There was an error signing you in. Please try again.",
          variant: "destructive"
        });
      }
    }
    
    handleRedirect();
  }, [toast]);
  
  return null; // This component doesn't render anything
}

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  console.log("Router: Auth state =", { user, isAuthenticated, isLoading, currentPath: location });

  // If still loading, show skeleton/loading screen
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading your session...</p>
      </div>
    );
  }

  // Direct login is always accessible
  if (location === '/direct-login') {
    return <DirectLoginPage />;
  }

  // If not authenticated, redirect to auth page
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="*" component={AuthPage} />
      </Switch>
    );
  }

  // Debug user role
  console.log("User authenticated with role:", user?.role);
  
  // Determine which dashboard to use based on role
  const DashboardComponent = user?.role === "admin" ? AdminDashboard : CustomerDashboard;

  // This approach uses more direct component rendering based on paths
  // instead of relying on complex route matching
  
  // Handle root path explicitly
  if (location === '/') {
    return <DashboardComponent />;
  } 
  
  // Handle projects with ID parameter
  else if (location.startsWith('/projects/')) {
    const projectId = location.split('/')[2];
    return <ProjectDetail params={{ id: projectId }} />;
  } 
  
  // Handle other specific paths
  else if (location === '/projects') {
    return <ProjectsPage />;
  } 
  else if (location === '/messages') {
    return <MessagesPage />;
  } 
  else if (location === '/tracking/view') {
    return <TrackingViewPage />;
  } 
  else if (location === '/tracking') {
    return <TrackingPage />;
  } 
  else if (location === '/settings') {
    return <SettingsPage />;
  } 
  else if (location === '/payment-checkout') {
    return <PaymentCheckoutPage />;
  } 
  else if (location === '/payment-success') {
    return <PaymentSuccessPage />;
  } 
  
  // Admin-only routes
  else if (location === '/users' && user?.role === 'admin') {
    return <UsersPage />;
  } 
  
  // Not found for anything else
  else {
    return <NotFound />;
  }
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AccessibilityProvider>
          <ThemeProvider attribute="class" defaultTheme="light">
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <Toaster />
                <AuthRedirectHandler />
                <Router />
                <AccessibilitySettings />
              </TooltipProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
