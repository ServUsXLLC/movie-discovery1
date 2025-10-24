"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import UserCard from "@/components/UserCard";
import { useAuth } from "@/hooks/useAuth";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

const fetcher = async (url: string) => {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
};

export default function UsersPage() {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? `${API_BASE}/follows/users` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (data) {
      setUsers(data);
    }
  }, [data]);

  const handleFollowChange = (userId: number, isFollowing: boolean) => {
    setUsers(prevUsers =>
      prevUsers.map(u =>
        u.id === userId ? { ...u, is_following: isFollowing } : u
      )
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
          <p className="text-gray-600">You need to be logged in to view users.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">Failed to load users. Please try again.</p>
        </div>
      </div>
    );
  }

  // Filter out current user from the list
  const otherUsers = users.filter(u => u.id !== user?.id);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Users</h1>
          <p className="text-gray-600">Find and follow other movie enthusiasts</p>
        </div>

        {otherUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No other users found.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {otherUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                showFollowButton={true}
                onFollowChange={handleFollowChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
