import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AuthForm } from "@/components/auth-form";
import { EmailVerification } from "@/components/email-verification";
import { TwoFactorSetup } from "@/components/two-factor-setup";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

type AuthStep = 'login' | 'verify-email' | 'setup-2fa';

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading, user, isEmailVerified, is2FAEnabled, verifyEmail } = useAuth();
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const { toast } = useToast();
  
  console.log("AuthPage: Auth state =", { isAuthenticated, isLoading, authStep });
  
  // Check for verification query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oobCode = params.get('oobCode'); // Firebase action code
    const mode = params.get('mode');
    const verified = params.get('verified');
    
    if (mode === 'verifyEmail' && oobCode) {
      // Handle email verification
      verifyEmail(oobCode)
        .then(() => {
          toast({
            title: "Email Verified",
            description: "Your email has been successfully verified.",
          });
          // Proceed to 2FA setup or login
          setAuthStep('login');
        })
        .catch((error) => {
          console.error("Email verification error:", error);
          toast({
            title: "Verification Failed",
            description: "The verification link may have expired. Please request a new one.",
            variant: "destructive"
          });
        });
    } else if (verified === 'true') {
      toast({
        title: "Verification Status",
        description: "Please check your email for the verification link.",
      });
    }
  }, [verifyEmail, toast]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // If user is authenticated but email is not verified, show verification screen
      if (!isEmailVerified && authStep === 'login') {
        setAuthStep('verify-email');
      } 
      // If email is verified but 2FA is not set up yet and user wants to set up 2FA
      else if (isEmailVerified && !is2FAEnabled && authStep === 'setup-2fa') {
        // Stay on 2FA setup page
      } 
      // Otherwise, if fully authenticated, redirect to home
      else if (isEmailVerified && (is2FAEnabled || authStep === 'login')) {
        navigate("/");
      }
    }
  }, [isAuthenticated, isLoading, isEmailVerified, is2FAEnabled, authStep, navigate]);
  
  const handleSuccessfulAuth = () => {
    if (!isEmailVerified) {
      setAuthStep('verify-email');
    } else if (!is2FAEnabled) {
      // Optionally show a confirmation dialog to set up 2FA
      // For now, we'll just redirect to the dashboard
      navigate("/");
    } else {
      navigate("/");
    }
  };
  
  const handleEmailVerified = () => {
    // User claims they verified email, give them option to set up 2FA
    setAuthStep('setup-2fa');
  };
  
  const handle2FAComplete = () => {
    // Once 2FA is set up, redirect to dashboard
    navigate("/");
  };
  
  // Switch between authentication steps
  const renderAuthStep = () => {
    switch (authStep) {
      case 'verify-email':
        return (
          <EmailVerification 
            email={user?.email || ''} 
            onComplete={handleEmailVerified} 
          />
        );
      case 'setup-2fa':
        return (
          <TwoFactorSetup 
            onComplete={handle2FAComplete} 
          />
        );
      case 'login':
      default:
        return (
          <AuthForm onSuccessfulAuth={handleSuccessfulAuth} />
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {renderAuthStep()}
      </div>
    </div>
  );
}