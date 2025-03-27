import React, { createContext, useContext } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-expo";

interface AuthContextType {
  userId: string | null;
  isLoaded: boolean;
  isSignedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  isLoaded: false,
  isSignedIn: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded, isSignedIn } = useClerkAuth();

  const contextValue: AuthContextType = {
    userId: userId ?? null,
    isLoaded: isLoaded ?? false,
    isSignedIn: isSignedIn ?? false,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
