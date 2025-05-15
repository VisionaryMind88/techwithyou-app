import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";

export default function DirectLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"admin" | "customer">("customer");
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  const handleLogin = async (role: string) => {
    setIsLoading(true);
    
    try {
      // Get values from input fields
      const emailField = document.getElementById(role === 'admin' ? 'admin-email' : 'customer-email') as HTMLInputElement;
      const passwordField = document.getElementById(role === 'admin' ? 'admin-password' : 'customer-password') as HTMLInputElement;
      
      const credentials = {
        email: emailField?.value || (role === 'admin' ? 'admin@techwithyou.com' : 'customer@techwithyou.com'),
        password: passwordField?.value || (role === 'admin' ? 'Admin@123' : 'Customer@123'),
        rememberMe: true,
        userRole: role
      };
      
      // Make the login request directly to our backend
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const userData = await response.json();
      
      toast({
        title: 'Login Successful',
        description: `Welcome, ${userData.firstName || 'User'}!`,
      });
      
      // Navigate to home
      setLocation('/');
      
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'There was an error logging in',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl">Welcome to TechWithYou</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Tabs
            defaultValue="customer"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "admin" | "customer")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
            
            <TabsContent value="customer">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  Login as a customer to manage your projects and communicate with administrators.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    defaultValue="customer@techwithyou.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customer-password">Password</Label>
                  <Input
                    id="customer-password"
                    type="password"
                    defaultValue="Customer@123"
                  />
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={() => handleLogin('customer')}
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login as Customer"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="admin">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  Login as an administrator to manage customer projects and oversee the platform.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    defaultValue="admin@techwithyou.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    defaultValue="Admin@123"
                  />
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={() => handleLogin('admin')}
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login as Admin"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}