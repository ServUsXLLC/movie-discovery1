"use client";

import { useEffect, useState } from "react";

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

export function useMovieStorage() {
  const [data, setData] = useState<MovieState>({
    watchlist: [],
    favorites: [],
    watched: [],
    reviews: [],
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setData(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // --- Actions ---
  const toggleWatchlist = (movieId: number) => {
    setData((prev) => ({
      ...prev,
      watchlist: prev.watchlist.includes(movieId)
        ? prev.watchlist.filter((id) => id !== movieId)
        : [...prev.watchlist, movieId],
    }));
  };

  const toggleFavorite = (movieId: number) => {
    setData((prev) => ({
      ...prev,
      favorites: prev.favorites.includes(movieId)
        ? prev.favorites.filter((id) => id !== movieId)
        : [...prev.favorites, movieId],
    }));
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
