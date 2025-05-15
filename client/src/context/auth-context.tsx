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
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        console.log("Auth state changed:", firebaseUser ? "User logged in" : "No user");
        
        if (firebaseUser) {
          // For demo purposes, create a mock user while we debug
          const mockUser: User = {
            id: 1, 
            email: firebaseUser.email || 'demo@example.com',
            firstName: firebaseUser.displayName?.split(' ')[0] || 'Demo',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || 'User',
            password: null,
            role: 'customer',
            provider: 'firebase',
            providerId: firebaseUser.uid,
            rememberToken: null,
            createdAt: new Date()
          };
          
          setUser(mockUser);
          console.log("Set mock user:", mockUser);
          
          // We'll implement the API call later
          // Get the real user data from API
          try {
            const response = await fetch(`/api/auth/user?email=${encodeURIComponent(firebaseUser.email || '')}`);
            
            if (response.ok) {
              const userData = await response.json();
              setUser(userData);
              console.log("API user data:", userData);
            } else {
              // If we don't have the user in our DB yet, create them
              if (response.status === 404) {
                const newUser = {
                  email: firebaseUser.email,
                  firstName: firebaseUser.displayName?.split(' ')[0] || '',
                  lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
                  provider: firebaseUser.providerData[0]?.providerId || 'firebase',
                  providerId: firebaseUser.uid,
                  role: 'customer' // Default role
                };
                
                console.log("Creating new user in DB:", newUser);
                
                try {
                  const createResponse = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newUser),
                    credentials: 'include'
                  });
                  
                  if (createResponse.ok) {
                    const createdUser = await createResponse.json();
                    setUser(createdUser);
                    console.log("User created:", createdUser);
                  } else {
                    console.error('Failed to create user in database');
                    // Keep the mock user for now
                  }
                } catch (error) {
                  console.error('Error creating user:', error);
                  // Keep the mock user for now
                }
              }
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            // Keep the mock user for now
          }
        } else {
          // User is signed out
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, rememberMe: boolean = false, userRole: string = 'customer') => {
    try {
      setIsLoading(true);
      console.log("Signing in with email:", email, "Role:", userRole, "Remember me:", rememberMe);
      
      // First authenticate with Firebase
      await signInWithEmail(email, password);
      
      // Then make a request to our server to handle role-based auth and remember me
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
      
      // The user state will be updated by the onAuthStateChanged listener
      // but we can also update it directly here for faster UI feedback
      setUser(userData);
      
      console.log("Login successful:", userData);
    } catch (error: any) {
      console.error('Sign in error:', error);
      const errorMessage = error.code === 'auth/user-not-found' 
        ? 'User not found. Please check your email or register.'
        : error.code === 'auth/wrong-password'
          ? 'Incorrect password. Please try again.'
          : error.message || 'Failed to sign in. Please try again.';
      
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
      
      // Create the user in Firebase
      const userCredential = await firebaseCreateUser(email, password);
      
      // Update profile with name if provided
      if (firstName && userCredential.user) {
        await updateUserProfile(`${firstName} ${lastName || ''}`);
      }
      
      console.log("User created in Firebase, now registering with server");
      
      // Now register with our server for role-based auth and session management
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
          provider: 'firebase', // Indicate this is a Firebase-authenticated user
          providerId: userCredential.user.uid,
          rememberToken: null
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register with server');
      }
      
      const userData = await response.json();
      setUser(userData);
      
      console.log("Registration successful:", userData);
      
      // The user state will be updated by the onAuthStateChanged listener and the server response
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'Email is already in use. Please login instead.'
        : error.message || 'Failed to create account. Please try again.';
      
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
      await logOut();
      setUser(null);
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
