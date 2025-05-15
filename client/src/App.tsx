import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import CustomerDashboard from "@/pages/customer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ProjectDetail from "@/pages/project-detail";
import { useAuth, AuthProvider } from "./context/auth-context";
import { ThemeProvider } from "next-themes";
import { handleAuthRedirect } from "./lib/firebase";
import { useToast } from "./hooks/use-toast";

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

  console.log("Router: Auth state =", { user, isAuthenticated, isLoading });

  // If still loading, show nothing (could add a loading spinner here)
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Switch>
      {!isAuthenticated && <Route path="*" component={AuthPage} />}
      
      {isAuthenticated && user?.role === "customer" && (
        <>
          <Route path="/" component={CustomerDashboard} />
          <Route path="/project/:id" component={ProjectDetail} />
        </>
      )}
      
      {isAuthenticated && user?.role === "admin" && (
        <>
          <Route path="/" component={AdminDashboard} />
          <Route path="/project/:id" component={ProjectDetail} />
        </>
      )}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <AuthRedirectHandler />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
