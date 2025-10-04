"use client";

import { useEffect, useState } from "react";
import { useMovieStorage } from "@/hooks/useMovieStorage";
import { getMovieDetails } from "@/lib/tmdb";
import MovieCard from "@/components/ui/MovieCard";

export default function FavoritesSection() {
  const { data } = useMovieStorage();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!data.favorites.length) {
        setMovies([]);
        return;
      }
      setLoading(true);
      try {
        const results = await Promise.all(
          data.favorites.map((id) => getMovieDetails(String(id)))
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
  }, [data.favorites]);

  if (loading) return <p>Loading favorites...</p>;
  if (!loading && movies.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold mb-4">Your Favorites</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}


