import { createContext, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  rewardPoints: number;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  login: async () => {},
  adminLogin: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if user is already authenticated when the app loads
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/login", { email, password });
      const userData = await response.json();
      setUser(userData);
      
      // Invalidate any user-related queries
      queryClient.invalidateQueries();
      
      return userData;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (userData: any) => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/register", userData);
      const user = await response.json();
      setUser(user);
      
      // Invalidate any user-related queries
      queryClient.invalidateQueries();
      
      return user;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await apiRequest("POST", "/api/logout");
      setUser(null);
      
      // Clear all queries
      queryClient.clear();
      
      toast({
        title: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const adminLogin = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      console.log("Attempting admin login with:", email);
      const response = await apiRequest("POST", "/api/admin-login", { email, password });
      const userData = await response.json();
      setUser(userData);
      
      // Invalidate any user-related queries
      queryClient.invalidateQueries();
      
      toast({
        title: "Admin login successful",
        description: `Welcome back, ${userData.firstName || userData.username}!`,
      });
      
      return userData;
    } catch (error) {
      console.error("Admin Login error:", error);
      toast({
        title: "Admin login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      const response = await apiRequest("PATCH", `/api/users/${user.id}`, userData);
      const updatedUser = await response.json();
      setUser(updatedUser);
      
      toast({
        title: "Profile updated successfully",
      });
      
      return updatedUser;
    } catch (error) {
      console.error("Update user error:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, adminLogin, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
