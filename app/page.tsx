import React from "react";
import { getPopular } from "@/lib/tmdb";
import MovieCard from "@/components/ui/MovieCard"; // 👈 make sure you use the correct path
import SearchDialog from "@/components/SearchDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import WatchlistSection from "@/components/WatchlistSection";
import FavoritesSection from "@/components/FavoritesSection";
import UserAvatar from "@/components/UserAvatar";


export default async function HomePage() {
  let data;
  try {
    data = await getPopular(1); // fetch popular movies
  } catch (error) {
    console.error("Error fetching movies:", error);
    return (
      <main className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Movie Discovery</h1>
          <div className="flex gap-2">
            <SearchDialog />
            <ThemeToggle />
          </div>
        </header>
        
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">API Key Required</h2>
          <p className="text-gray-600 mb-4">To view movies, you need to set up a TMDB API key.</p>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-2xl mx-auto">
            <p className="font-semibold">Setup Instructions:</p>
            <ol className="text-left mt-2 space-y-1">
              <li>1. Go to <a href="https://www.themoviedb.org/settings/api" target="_blank" className="text-blue-600 underline">TMDB API Settings</a></li>
              <li>2. Create a free account and get your API key</li>
              <li>3. Create a file called <code>.env.local</code> in your project root</li>
              <li>4. Add: <code>NEXT_PUBLIC_TMDB_API_KEY=your_api_key_here</code></li>
              <li>5. Restart the development server</li>
            </ol>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4">
      {/* Header with title + search */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Movie Discovery</h1>
        <div className="flex items-center gap-3">
          <UserAvatar />
          <SearchDialog />   {/* 🔍 Search button */}
          <ThemeToggle />    {/* 🌞/🌙 Theme toggle */}
        </div>
      </header>

      {/* Popular / Trending Movies */}
      <h2 className="text-xl font-semibold mb-4">Popular Movies</h2>

      {/* ✅ Responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {data.results.slice(0, 18).map((movie: any) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>

      {/* Your lists */}
      <WatchlistSection />
      <FavoritesSection />
    </main>
  );
}
