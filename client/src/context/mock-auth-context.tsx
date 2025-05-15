import React, { createContext, useContext, useState } from "react";
import { type User } from "@shared/schema";

// Create a simple mock user
const mockUser: User = {
  id: 1,
  email: "user@example.com",
  firstName: "Demo",
  lastName: "User",
  password: null,
  role: "customer",
  provider: "local",
  providerId: "mock-provider-id",
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

// Create the context with default values
const MockAuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  signIn: () => {},
  signUp: () => {},
  signInWithGoogle: () => {},
  signInWithGitHub: () => {},
  logout: () => {}
});

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = () => {
    setUser(mockUser);
  };

  const logout = () => {
    setUser(null);
  };

  // Create the context value
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn: login,
    signUp: login,
    signInWithGoogle: login,
    signInWithGitHub: login,
    logout
  };

  console.log("Mock Auth Context:", { user: user ? "Authenticated" : "Not authenticated" });

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => {
  return useContext(MockAuthContext);
};