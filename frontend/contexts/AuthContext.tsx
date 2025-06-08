"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { apiService } from "@/services/api";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  balance: number;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: any) => Promise<any>;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
  updateUser: (userData: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const route = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decoded: any = jwtDecode(storedToken);
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken);
          // Wait for fetchUserProfile to finish before setting loading to false
          fetchUserProfile(storedToken).finally(() => setLoading(false));
          return; // Don't setLoading(false) here
        } else {
          localStorage.removeItem("token");
        }
      } catch (error) {
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && !user) {
      setToken(storedToken);
      fetchUserProfile(storedToken);
    }
    // eslint-disable-next-line
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await apiService.get("/user/profile", authToken);
      console.log("User profile response:", response.data);
      setUser(response.user);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUser(null);
      logout();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.post("/user/signin", {
        username: email,
        password,
      });
      const { token: newToken } = response;

      setToken(newToken);
      localStorage.setItem("token", newToken);
      await fetchUserProfile(newToken);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  const signup = async (userData: any) => {
    try {
      const response = await apiService.post("/user/signup", userData);
      const { token: newToken } = response;
      setToken(newToken);
      localStorage.setItem("token", newToken);
      await fetchUserProfile(newToken);
      // Return the whole response so the page can check message/token
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Signup failed");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  const updateBalance = (newBalance: number) => {
    if (user) {
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
    }
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    updateBalance,
    updateUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
