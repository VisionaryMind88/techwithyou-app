import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui/card";
import { useMockAuth } from "@/context/mock-auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading, signIn } = useMockAuth();
  
  console.log("AuthPage: Auth state =", { isAuthenticated, isLoading });
  
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Simple mock login form for testing
  const handleMockLogin = () => {
    console.log("Logging in with mock auth");
    signIn();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Logo Container */}
        <div className="bg-primary-600 p-6 flex justify-center">
          <Logo size="lg" />
        </div>

        {isLoading ? (
          <div className="p-8 space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
              <p className="mt-2 text-sm text-gray-600">
                Welcome to our secure project management platform
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                className="w-full"
                onClick={handleMockLogin}
              >
                Sign In (Mock Auth)
              </Button>
              
              <div className="text-center text-sm text-gray-500">
                For demonstration purposes only
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
