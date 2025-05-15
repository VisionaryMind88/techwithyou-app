import React, { createContext, useState, useContext, useCallback } from "react";
import { User } from "@shared/schema";

const mockUser: User = {
  id: 1,
  email: "user@example.com",
  firstName: "Demo",
  lastName: "User",
  role: "customer",
  password: null,
  provider: null,
  providerId: null,
  createdAt: new Date()
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => void;
  signUp: () => void;
  signInWithGoogle: () => void;
  signInWithGitHub: () => void;
  logout: () => void;
}

const MockAuthContext = createContext<AuthContextType | undefined>(undefined);

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const signIn = useCallback(() => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setUser(mockUser);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  const signUp = useCallback(() => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setUser(mockUser);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  const signInWithGoogle = useCallback(() => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setUser(mockUser);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  const signInWithGitHub = useCallback(() => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setUser(mockUser);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  const logout = useCallback(() => {
    setUser(null);
  }, []);
  
  console.log("Mock Auth Context:", user ? user : "Not authenticated");
  
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    logout
  };
  
  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  
  if (context === undefined) {
    throw new Error("useMockAuth must be used within a MockAuthProvider");
  }
  
  return context;
};