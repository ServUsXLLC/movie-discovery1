"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

type Review = {
  movieId: number;
  rating: number;
  text: string;
};

type MovieState = {
  watchlist: number[];
  favorites: number[];
  watched: number[];
  reviews: Review[];
};

const STORAGE_KEY = "movieAppData";
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

export function useMovieStorage() {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<MovieState>({
    watchlist: [],
    favorites: [],
    watched: [],
    reviews: [],
  });

  // Load from localStorage (fallback for non-authenticated users)
  useEffect(() => {
    if (!isAuthenticated) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setData(JSON.parse(saved));
      }
    }
  }, [isAuthenticated]);

  // Load from database when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserData(user.id);
    }
  }, [isAuthenticated, user?.id]);

  // Save to localStorage for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isAuthenticated]);

  const loadUserData = async (userId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Load watchlist
      const watchlistRes = await fetch(`${API_BASE}/lists/${userId}/watchlist`, { headers });
      const watchlistData = watchlistRes.ok ? await watchlistRes.json() : [];
      
      // Load favorites
      const favoritesRes = await fetch(`${API_BASE}/lists/${userId}/favorites`, { headers });
      const favoritesData = favoritesRes.ok ? await favoritesRes.json() : [];

      setData(prev => ({
        ...prev,
        watchlist: watchlistData.map((item: any) => item.movie_id),
        favorites: favoritesData.map((item: any) => item.movie_id),
      }));
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  // --- Actions ---
  const toggleWatchlist = async (movieId: number) => {
    const isInWatchlist = data.watchlist.includes(movieId);
    
    // Update local state immediately for responsive UI
    setData((prev) => ({
      ...prev,
      watchlist: isInWatchlist
        ? prev.watchlist.filter((id) => id !== movieId)
        : [...prev.watchlist, movieId],
    }));

    // Save to database if authenticated
    if (isAuthenticated && user?.id) {
      try {
        const token = localStorage.getItem("access_token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        if (isInWatchlist) {
          // Remove from watchlist
          await fetch(`${API_BASE}/lists/?user_id=${user.id}&movie_id=${movieId}&kind=watchlist`, {
            method: "DELETE",
            headers,
          });
        } else {
          // Add to watchlist
          await fetch(`${API_BASE}/lists/`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              user_id: user.id,
              movie_id: movieId,
              kind: "watchlist",
            }),
          });
        }
      } catch (error) {
        console.error("Failed to update watchlist:", error);
        // Revert local state on error
        setData((prev) => ({
          ...prev,
          watchlist: isInWatchlist
            ? [...prev.watchlist, movieId]
            : prev.watchlist.filter((id) => id !== movieId),
        }));
      }
    }
  };

  const toggleFavorite = async (movieId: number) => {
    const isInFavorites = data.favorites.includes(movieId);
    
    // Update local state immediately for responsive UI
    setData((prev) => ({
      ...prev,
      favorites: isInFavorites
        ? prev.favorites.filter((id) => id !== movieId)
        : [...prev.favorites, movieId],
    }));

    // Save to database if authenticated
    if (isAuthenticated && user?.id) {
      try {
        const token = localStorage.getItem("access_token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        if (isInFavorites) {
          // Remove from favorites
          await fetch(`${API_BASE}/lists/?user_id=${user.id}&movie_id=${movieId}&kind=favorites`, {
            method: "DELETE",
            headers,
          });
        } else {
          // Add to favorites
          await fetch(`${API_BASE}/lists/`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              user_id: user.id,
              movie_id: movieId,
              kind: "favorites",
            }),
          });
        }
      } catch (error) {
        console.error("Failed to update favorites:", error);
        // Revert local state on error
        setData((prev) => ({
          ...prev,
          favorites: isInFavorites
            ? [...prev.favorites, movieId]
            : prev.favorites.filter((id) => id !== movieId),
        }));
      }
    }
  };

  const toggleWatched = (movieId: number) => {
    setData((prev) => ({
      ...prev,
      watched: prev.watched.includes(movieId)
        ? prev.watched.filter((id) => id !== movieId)
        : [...prev.watched, movieId],
    }));
  };

  const addReview = (movieId: number, rating: number, text: string) => {
    setData((prev) => {
      // Replace review if already exists
      const filtered = prev.reviews.filter((r) => r.movieId !== movieId);
      return {
        ...prev,
        reviews: [...filtered, { movieId, rating, text }],
      };
    });
  };

  return {
    data,
    toggleWatchlist,
    toggleFavorite,
    toggleWatched,
    addReview,
  };
}
