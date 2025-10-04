"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMovieStorage } from "@/hooks/useMovieStorage";

export default function MovieCard({ movie }: { movie: any }) {
  const { data, toggleWatchlist, toggleFavorite } = useMovieStorage();

  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : "/placeholder.png";

  return (
    <div className="relative group rounded overflow-hidden shadow hover:scale-105 transition">
      {/* Poster with link to details */}
      <Link href={`/movie/${movie.id}`}>
        <Image
          src={poster}
          alt={movie.title}
          width={300}
          height={400}
          className="object-cover w-full h-80"
        />
      </Link>

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/70 text-white opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-3 pointer-events-none">
        {/* Rating */}
        <div className="text-sm font-semibold">
          ⭐ {movie.vote_average ? (Math.round(movie.vote_average * 10) / 10) : "N/A"}
        </div>

        {/* Title + Actions */}
        <div>
          <h3 className="font-bold text-sm mb-2">{movie.title}</h3>
          <div className="flex flex-wrap gap-2 pointer-events-auto">
            <Button
              variant={data.watchlist.includes(Number(movie.id)) ? "default" : "outline"}
              size="sm"
              onClick={(e) => {
                e.preventDefault(); // prevent link navigation
                toggleWatchlist(Number(movie.id));
              }}
            >
              🎬 Watchlist
            </Button>
            <Button
              variant={data.favorites.includes(Number(movie.id)) ? "default" : "outline"}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                toggleFavorite(Number(movie.id));
              }}
            >
              ❤️ Favorite
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
