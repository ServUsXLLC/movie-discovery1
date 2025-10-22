"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { migrateLocalData } from "@/services/api";

interface User {
  id: number;
  display_name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("access_token");

    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    }

    setIsLoading(false);
  }, []);

  // -------------------
  // LOGIN FUNCTION
  // -------------------
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("🛰️ Sending login request:", { email, password }); // 👈 Debugging line

    try {
      const url =
        (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "") + "/login";

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Debug full response
      console.log("📩 Response:", response.status, await response.clone().text());

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);

        // Try migrating local movie data if exists
        try {
          const saved = localStorage.getItem("movieAppData");
          if (saved) {
            const parsed = JSON.parse(saved);
            await migrateLocalData({ user_id: data.user.id, localData: parsed });
          }
        } catch (e) {
          console.warn("Local data migration failed:", e);
        }

        return true;
      } else {
        console.warn("Login failed:", response.status, data);
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  // -------------------
  // LOGOUT FUNCTION
  // -------------------
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // -------------------
  // REFRESH TOKEN FUNCTION
  // -------------------
  const refreshToken = async (): Promise<boolean> => {
    const refreshTokenValue = localStorage.getItem("refresh_token");

    if (!refreshTokenValue) {
      logout();
      return false;
    }

    try {
      console.log("🔄 Refreshing token...");
      const refreshUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "") + "/refresh";
      const response = await fetch(refreshUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
      });

      console.log("📩 Refresh response:", response.status, await response.clone().text());
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access_token", data.access_token);
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// -------------------
// HOOK EXPORT
// -------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
