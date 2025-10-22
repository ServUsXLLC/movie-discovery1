"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import MovieCard from "@/components/ui/MovieCard"; // adjust path if needed
import Image from "next/image";

/**
 * User Dashboard page
 *
 * - Tabs: Watchlist | Favorites | Profile
 * - Fetches user profile, then lists based on user id
 */

/* --- helper: API base and fetcher --- */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

async function authFetch(url: string, opts: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(text || `HTTP ${res.status}`);
    // attach status for caller
    (err as any).status = res.status;
    throw err;
  }
  return res.json();
}

const fetcher = (url: string) => authFetch(url);

/* --- Types --- */
type User = {
  id: number;
  email: string;
  display_name?: string;
  avatar?: string | null;
  bio?: string | null;
  created_at?: string | null;
};

type Movie = {
  id: number;
  title: string;
  poster_path?: string | null;
  release_date?: string | null;
  vote_average?: number | null;
  overview?: string | null;
};

/* --- Component --- */
export default function UserDashboardPage() {
  const [tab, setTab] = useState<"watchlist" | "favorites" | "profile">("watchlist");

  // Load current user profile
  const { data: user, error: userError, isValidating: userLoading } = useSWR<User>(
    `${API_BASE}/users/me`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // When user is available, fetch lists
  const userId = user?.id;

  const { data: watchlistItems, error: watchlistError, isValidating: watchlistLoading } = useSWR<any[]>(
    userId ? `${API_BASE}/lists/${userId}/watchlist` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: favoritesItems, error: favoritesError, isValidating: favoritesLoading } = useSWR<any[]>(
    userId ? `${API_BASE}/lists/${userId}/favorites` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Convert movie IDs to full movie objects
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [favorites, setFavorites] = useState<Movie[]>([]);

  useEffect(() => {
    const fetchMovieDetails = async (movieIds: number[]) => {
      if (movieIds.length === 0) return [];
      
      try {
        const promises = movieIds.map(async (movieId) => {
          const response = await fetch(`${API_BASE}/tmdb/movie/${movieId}`);
          if (response.ok) {
            return await response.json();
          }
          return null;
        });
        
        const movies = await Promise.all(promises);
        return movies.filter(movie => movie !== null);
      } catch (error) {
        console.error("Failed to fetch movie details:", error);
        return [];
      }
    };

    if (watchlistItems) {
      const movieIds = watchlistItems.map(item => item.movie_id);
      fetchMovieDetails(movieIds).then(setWatchlist);
    }

    if (favoritesItems) {
      const movieIds = favoritesItems.map(item => item.movie_id);
      fetchMovieDetails(movieIds).then(setFavorites);
    }
  }, [watchlistItems, favoritesItems]);

  // UI helpers
  const loading = userLoading || watchlistLoading || favoritesLoading;

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Your Dashboard</h1>
            <p className="text-sm text-gray-500">A personal view of your movies, favorites, and profile.</p>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border">
                  {user.avatar ? (
                    // if avatar is an external URL or path
                    // If avatar is a TMDB path, you may want to call posterUrl() utility
                    // For simplicity we treat it as full URL here
                    <Image src={user.avatar} alt={user.display_name || user.email} fill style={{ objectFit: "cover" }} />
                  ) : (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                      {(user.display_name || user.email || "U").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Welcome,</div>
                  <div className="font-semibold">{user.display_name || user.email}</div>
                </div>
              </div>
            ) : (
              <div className="text-right">
                <div className="text-sm text-gray-500">Not signed in</div>
                <div className="font-semibold">Guest</div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <button
                onClick={() => setTab("watchlist")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${tab === "watchlist" ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
              >
                Your Watchlist
              </button>
              <button
                onClick={() => setTab("favorites")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${tab === "favorites" ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
              >
                Your Favorites
              </button>
              <button
                onClick={() => setTab("profile")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${tab === "profile" ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
              >
                Profile
              </button>
            </div>

            <div>
              <button
                onClick={() => {
                  // refresh all data
                  (window as any).__NEXT_SW_RERENDER && (window as any).__NEXT_SW_RERENDER();
                  // better: mutate SWR keys; but simplest is reloading
                  window.location.reload();
                }}
                className="px-3 py-2 bg-gray-100 rounded-md text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="space-y-6">
          {/* Loading / error */}
          {userError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
              Failed to load user. Please make sure you are signed in and your token is valid.
            </div>
          )}

          {tab === "watchlist" && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Your Watchlist</h2>

              {loading && !watchlist && <div className="text-gray-500">Loading...</div>}

              {!watchlist?.length && !watchlistLoading ? (
                <div className="p-6 bg-white rounded shadow text-gray-500">No movies in your watchlist yet.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {watchlist?.map((m: Movie) => (
                    <MovieCard key={m.id} movie={m} />
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "favorites" && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Your Favorites</h2>

              {loading && !favorites && <div className="text-gray-500">Loading...</div>}

              {!favorites?.length && !favoritesLoading ? (
                <div className="p-6 bg-white rounded shadow text-gray-500">No favorites yet.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {favorites?.map((m: Movie) => (
                    <div key={m.id}>
                      <MovieCard movie={m} />
                      {/* If your API returns rating/comment with each favorite, show here */}
                      {/* Example:
                          <div className="mt-2 text-sm text-gray-600">Rating: 4/5 — "Great movie!"</div>
                       */}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "profile" && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Profile</h2>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start gap-6">
                  <div className="w-28 h-28 rounded-full overflow-hidden border">
                    {user?.avatar ? (
                      <Image src={user.avatar} alt={user.display_name || user.email} width={112} height={112} style={{ objectFit: "cover" }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-2xl font-semibold">
                        {(user?.display_name || user?.email || "U").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{user?.display_name || user?.email}</h3>
                    <p className="text-sm text-gray-500 mb-4">{user?.email}</p>

                    <div className="text-gray-700 mb-2">
                      <strong>Bio:</strong>
                      <div className="mt-1 text-sm">{user?.bio || "No bio yet."}</div>
                    </div>

                    <div className="text-gray-700">
                      <strong>Member since:</strong>{" "}
                      <span className="text-sm text-gray-600">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md">Edit Profile</button>
                  <button
                    className="px-4 py-2 border rounded-md"
                    onClick={() => {
                      // log out locally
                      localStorage.removeItem("access_token");
                      localStorage.removeItem("refresh_token");
                      localStorage.removeItem("user");
                      window.location.href = "/";
                    }}
                  >
                    Log out
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
