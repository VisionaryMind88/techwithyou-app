import { useEffect } from "react";
import { useLocation } from "wouter";
import { AuthForm } from "@/components/auth-form";
import { useAuth } from "@/context/auth-context";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  console.log("AuthPage: Auth state =", { isAuthenticated, isLoading });
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  const handleSuccessfulAuth = () => {
    navigate("/");
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <AuthForm onSuccessfulAuth={handleSuccessfulAuth} />
      </div>
    </div>
  );
}