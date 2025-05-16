import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  auth, 
  onAuthStateChanged, 
  signInWithEmail, 
  createUser as firebaseCreateUser,
  signInWithGoogle as fbSignInWithGoogle,
  signInWithGitHub as fbSignInWithGitHub,
  logOut,
  updateUserProfile,
  resendVerificationEmail as fbResendVerificationEmail,
  verifyEmail as fbVerifyEmail,
  isEmailVerified as fbIsEmailVerified,
  initializePhoneAuth,
  enrollIn2FA,
  complete2FAEnrollment
} from "@/lib/firebase";
import { type User } from "@shared/schema";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  is2FAEnabled: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean, userRole?: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string, role?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  setupTwoFactorAuth: (phoneNumber: string) => Promise<string>;
  completeTwoFactorSetup: (verificationId: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{
    verificationId: string;
    recaptchaVerifier: any;
  } | null>(null);

  useEffect(() => {
    console.log("Setting up auth state change listener");
    let intervalId: number;
    
    const checkAuthStatus = async () => {
      try {
        console.log("Checking authentication status from server session");
        
        const response = await fetch('/api/auth/user', {
          credentials: 'include', // Important for sending cookies
          cache: 'no-cache', // Don't cache this request
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          console.log("User authenticated from session:", userData);
          setIsEmailVerified(true); // For now, assume email is verified
        } else {
          // Check if we're already logged in but server returned 401
          if (user && response.status === 401) {
            console.log("Session expired or invalid, still have user data:", user);
            // Keep user data for a seamless experience but try to refresh the session
            // You might want to automatically redirect to login after a timeout
          } else {
            // Not authenticated
            setUser(null);
            console.log("No authenticated user from session");
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Only clear user if we get a network error, not on auth errors (keep local state)
        if (!navigator.onLine) {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Check authentication status immediately
    checkAuthStatus();
    
    // Set up periodic check (every 5 minutes)
    intervalId = window.setInterval(checkAuthStatus, 5 * 60 * 1000);
    
    // Route change listener
    const handleRouteChange = () => {
      console.log('Route changed, checking auth status');
      checkAuthStatus();
    };
    
    // Listen for navigation events
    window.addEventListener('popstate', handleRouteChange);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      clearInterval(intervalId);
    };
  }, [user]);

  const signIn = async (email: string, password: string, rememberMe: boolean = false, userRole: string = 'customer') => {
    try {
      setIsLoading(true);
      console.log("Signing in with email:", email, "Role:", userRole, "Remember me:", rememberMe);
      
      // Make a request to our server to handle authentication
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
          userRole
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sign in');
      }
      
      const userData = await response.json();
      setUser(userData);
      
      console.log("Login successful:", userData);
      
      // Make sure to redirect to the Dashboard after successful login
      window.location.href = '/';
    } catch (error: any) {
      console.error('Sign in error:', error);
      const errorMessage = error.message || 'Failed to sign in. Please try again.';
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string, role: string = 'customer') => {
    try {
      setIsLoading(true);
      console.log("Signing up with email:", email, "Role:", role);
      
      // Register directly with our server for local authentication
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password, // Will be hashed by the server
          firstName: firstName || null,
          lastName: lastName || null,
          role, // Use the provided role or default to customer
          provider: 'local', // Use local authentication
          providerId: null,
          rememberToken: null
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register with server');
      }
      
      const userData = await response.json();
      
      // After successful registration, log the user in
      await signIn(email, password, false, role);
      
      console.log("Registration successful:", userData);
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      const errorMessage = error.message || 'Failed to create account. Please try again.';
      
      toast({
        title: "Registration Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      console.log("Signing in with Google");
      await fbSignInWithGoogle();
      // User state will be updated by the onAuthStateChanged listener
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast({
        title: "Authentication Error",
        description: error.message || 'Failed to sign in with Google. Please try again.',
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGitHub = async () => {
    try {
      setIsLoading(true);
      console.log("Signing in with GitHub");
      await fbSignInWithGitHub();
      // User state will be updated by the onAuthStateChanged listener
    } catch (error: any) {
      console.error('GitHub sign in error:', error);
      toast({
        title: "Authentication Error",
        description: error.message || 'Failed to sign in with GitHub. Please try again.',
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      console.log("Logging out");
      
      // Call our API endpoint to logout (destroys session)
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to logout from server');
      }
      
      // Clear user state
      setUser(null);
      setIsEmailVerified(false);
      setIs2FAEnabled(false);
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: error.message || 'Failed to log out. Please try again.',
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Email verification function
  const resendVerificationEmail = async () => {
    try {
      setIsLoading(true);
      await fbResendVerificationEmail();
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the verification link.",
      });
    } catch (error: any) {
      console.error("Resend verification email error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify email with action code
  const verifyEmail = async (code: string) => {
    try {
      setIsLoading(true);
      await fbVerifyEmail(code);
      setIsEmailVerified(true);
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified.",
      });
    } catch (error: any) {
      console.error("Email verification error:", error);
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify email. The link may have expired.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Setup 2FA with phone number
  const setupTwoFactorAuth = async (phoneNumber: string) => {
    try {
      setIsLoading(true);
      
      // Create reCAPTCHA verifier
      const recaptchaVerifier = initializePhoneAuth('recaptcha-container');
      
      // Send verification code to phone
      const verificationId = await enrollIn2FA(phoneNumber, recaptchaVerifier);
      
      // Store verification ID for later use
      setTwoFactorSetupData({ verificationId, recaptchaVerifier });
      
      toast({
        title: "Verification Code Sent",
        description: `We've sent a verification code to ${phoneNumber}. Please enter it to complete 2FA setup.`,
      });
      
      return verificationId;
    } catch (error: any) {
      console.error("2FA setup error:", error);
      toast({
        title: "2FA Setup Error",
        description: error.message || "Failed to set up two-factor authentication. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Complete 2FA setup
  const completeTwoFactorSetup = async (verificationId: string, code: string) => {
    try {
      setIsLoading(true);
      
      // Verify code and enroll the second factor
      await complete2FAEnrollment(verificationId, code);
      setIs2FAEnabled(true);
      
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled for your account.",
      });
    } catch (error: any) {
      console.error("Complete 2FA setup error:", error);
      toast({
        title: "2FA Setup Error",
        description: error.message || "Failed to complete two-factor authentication setup. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
      setTwoFactorSetupData(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isEmailVerified,
    is2FAEnabled,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    logout,
    resendVerificationEmail,
    verifyEmail,
    setupTwoFactorAuth,
    completeTwoFactorSetup
  };

  console.log("Auth context value:", { 
    user: user ? `User: ${user.email}` : "No user", 
    isAuthenticated: !!user,
    isLoading 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
