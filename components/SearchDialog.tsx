"use client";

import { useState } from "react";
import { searchMovies } from "@/lib/tmdb";
import MovieCard from "@/components/ui/MovieCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchDialog() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Navigate to dedicated search page
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

  return (
    <Dialog>
      {/* Trigger button */}
      <DialogTrigger asChild>
        <Button variant="outline">🔍 Search</Button>
      </DialogTrigger>

      {/* Search modal */}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Movies</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="Search for a movie..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>

        {/* Results now render on /search */}
      </DialogContent>
    </Dialog>
  );
}
