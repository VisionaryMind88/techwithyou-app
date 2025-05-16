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
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentCheckoutPage from "@/pages/payment-checkout";
import { useAuth, AuthProvider } from "./context/auth-context";
import { ThemeProvider } from "next-themes";
import { handleAuthRedirect } from "./lib/firebase";
import { useToast } from "./hooks/use-toast";
import { AccessibilityProvider } from "./components/accessibility/accessibility-provider";
import { AccessibilityPanel } from "./components/accessibility/accessibility-panel";

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

  // User is authenticated at this point
  if (user?.role === "customer") {
    return (
      <Switch>
        <Route path="/" component={CustomerDashboard} />
        <Route path="/projects" component={ProjectsPage} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/payment-checkout" component={PaymentCheckoutPage} />
        <Route path="/payment-success" component={PaymentSuccessPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  if (user?.role === "admin") {
    return (
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/projects" component={ProjectsPage} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/users" component={UsersPage} />
        <Route path="/payment-checkout" component={PaymentCheckoutPage} />
        <Route path="/payment-success" component={PaymentSuccessPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  // Fallback if authenticated but role is unknown
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Access Error</h1>
      <p className="text-gray-600">Your role ({user?.role || 'unknown'}) doesn't have access to this application.</p>
    </div>
  );
}

function App() {
  const [isAccessibilityPanelOpen, setIsAccessibilityPanelOpen] = useState(false);

  return (
    <AuthProvider>
      <AccessibilityProvider>
        <ThemeProvider attribute="class" defaultTheme="light">
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <AuthRedirectHandler />
              <Router />
              
              {/* Accessibility Panel */}
              <AccessibilityPanel 
                isOpen={isAccessibilityPanelOpen} 
                onClose={() => setIsAccessibilityPanelOpen(false)} 
              />
              
              {/* Accessibility Toggle Button */}
              <button
                aria-label="Open accessibility options"
                onClick={() => setIsAccessibilityPanelOpen(true)}
                className="fixed right-4 bottom-4 p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 z-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="16" cy="4" r="1" />
                  <path d="m18 19-5-7" />
                  <path d="m18 19-5-2" />
                  <path d="m18 19-2-7" />
                  <circle cx="12" cy="17" r="3" />
                  <path d="M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path d="M6 6h12" />
                  <path d="M6 12V9" />
                </svg>
              </button>
            </TooltipProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}

export default App;
