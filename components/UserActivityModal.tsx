"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";

interface UserActivityModalProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

interface UserActivity {
  user: {
    id: number;
    display_name: string;
    email: string;
    avatar?: string;
    bio?: string;
    created_at: string;
    is_active: boolean;
  };
  movie_activity: {
    watchlist: Array<{
      movie_id: number;
      title: string;
      added_at: string;
    }>;
    favorites: Array<{
      movie_id: number;
      title: string;
      added_at: string;
    }>;
    total_watchlist: number;
    total_favorites: number;
  };
  follow_activity: {
    followers: Array<{
      user_id: number;
      display_name: string;
      email: string;
      followed_at: string;
    }>;
    following: Array<{
      user_id: number;
      display_name: string;
      email: string;
      followed_at: string;
    }>;
    total_followers: number;
    total_following: number;
  };
  summary: {
    total_movies: number;
    total_connections: number;
    account_age_days: number;
  };
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

const fetcher = async (url: string) => {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error("Failed to fetch user activity");
  }
  return response.json();
};

export default function UserActivityModal({ userId, isOpen, onClose }: UserActivityModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "movies" | "follows">("overview");

  const { data: activity, error, isLoading } = useSWR<UserActivity>(
    userId && isOpen ? `${API_BASE}/user-activity/${userId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            User Activity: {activity?.user.display_name || "Loading..."}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Loading user activity...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">Failed to load user activity</p>
            </div>
          )}

          {activity && (
            <>
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-semibold">
                    {activity.user.display_name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{activity.user.display_name}</h3>
                    <p className="text-gray-600">{activity.user.email}</p>
                    <p className="text-sm text-gray-500">
                      Member since {formatDate(activity.user.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === "overview"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("movies")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === "movies"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Movies ({activity.summary.total_movies})
                </button>
                <button
                  onClick={() => setActiveTab("follows")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === "follows"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Follows ({activity.summary.total_connections})
                </button>
              </div>

              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Movie Activity</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Watchlist:</span>
                        <span className="font-medium">{activity.movie_activity.total_watchlist}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Favorites:</span>
                        <span className="font-medium">{activity.movie_activity.total_favorites}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Total:</span>
                        <span className="font-medium">{activity.summary.total_movies}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Follow Activity</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Followers:</span>
                        <span className="font-medium">{activity.follow_activity.total_followers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Following:</span>
                        <span className="font-medium">{activity.follow_activity.total_following}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Total:</span>
                        <span className="font-medium">{activity.summary.total_connections}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">Account Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-medium ${activity.user.is_active ? "text-green-600" : "text-red-600"}`}>
                          {activity.user.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Member since:</span>
                        <span className="font-medium">{formatDate(activity.user.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Movies Tab */}
              {activeTab === "movies" && (
                <div className="space-y-6">
                  {/* Watchlist */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-blue-900">
                      Watchlist ({activity.movie_activity.total_watchlist})
                    </h4>
                    {activity.movie_activity.watchlist.length === 0 ? (
                      <p className="text-gray-500 italic">No movies in watchlist</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activity.movie_activity.watchlist.map((movie, index) => (
                          <div key={index} className="bg-blue-50 rounded-lg p-3">
                            <h5 className="font-medium text-blue-900">{movie.title}</h5>
                            <p className="text-sm text-blue-700">Added: {formatDate(movie.added_at)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Favorites */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-red-900">
                      Favorites ({activity.movie_activity.total_favorites})
                    </h4>
                    {activity.movie_activity.favorites.length === 0 ? (
                      <p className="text-gray-500 italic">No favorite movies</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activity.movie_activity.favorites.map((movie, index) => (
                          <div key={index} className="bg-red-50 rounded-lg p-3">
                            <h5 className="font-medium text-red-900">{movie.title}</h5>
                            <p className="text-sm text-red-700">Added: {formatDate(movie.added_at)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Follows Tab */}
              {activeTab === "follows" && (
                <div className="space-y-6">
                  {/* Followers */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-green-900">
                      Followers ({activity.follow_activity.total_followers})
                    </h4>
                    {activity.follow_activity.followers.length === 0 ? (
                      <p className="text-gray-500 italic">No followers</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activity.follow_activity.followers.map((follower, index) => (
                          <div key={index} className="bg-green-50 rounded-lg p-3">
                            <h5 className="font-medium text-green-900">{follower.display_name}</h5>
                            <p className="text-sm text-green-700">{follower.email}</p>
                            <p className="text-xs text-green-600">Followed: {formatDate(follower.followed_at)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Following */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-purple-900">
                      Following ({activity.follow_activity.total_following})
                    </h4>
                    {activity.follow_activity.following.length === 0 ? (
                      <p className="text-gray-500 italic">Not following anyone</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activity.follow_activity.following.map((following, index) => (
                          <div key={index} className="bg-purple-50 rounded-lg p-3">
                            <h5 className="font-medium text-purple-900">{following.display_name}</h5>
                            <p className="text-sm text-purple-700">{following.email}</p>
                            <p className="text-xs text-purple-600">Followed: {formatDate(following.followed_at)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
