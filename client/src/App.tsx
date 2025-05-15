import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import CustomerDashboard from "@/pages/customer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ProjectDetail from "@/pages/project-detail";
import { useMockAuth, MockAuthProvider } from "./context/mock-auth-context";
import { ThemeProvider } from "next-themes";

function Router() {
  const { user, isAuthenticated, isLoading } = useMockAuth();

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
    <MockAuthProvider>
      <ThemeProvider attribute="class" defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </MockAuthProvider>
  );
}

export default App;
