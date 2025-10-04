"use client";

import { useEffect, useState } from "react";
import { useMovieStorage } from "@/hooks/useMovieStorage";
import { getMovieDetails } from "@/lib/tmdb";
import MovieCard from "@/components/ui/MovieCard";
import Link from "next/link";

export default function WatchlistPage() {
  const { data } = useMovieStorage();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!data.watchlist.length) {
        setMovies([]);
        return;
      }
      setLoading(true);
      try {
        const results = await Promise.all(
          data.watchlist.map((id) => getMovieDetails(String(id)))
        );
        if (!cancelled) setMovies(results);
      } catch {
        if (!cancelled) setMovies([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [data.watchlist]);

  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Your Watchlist</h1>
        <Link href="/" className="text-blue-600 hover:underline">← Back to Home</Link>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && data.watchlist.length === 0 && (
        <p className="text-gray-600">Your watchlist is empty.</p>
      )}

      {!loading && movies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </main>
  );
}


