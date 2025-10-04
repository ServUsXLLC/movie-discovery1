import MovieCard from "@/components/ui/MovieCard";
import { searchMovies } from "@/lib/tmdb";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = (searchParams.q || "").trim();
  const page = Number(searchParams.page || 1) || 1;

  let data: any = { results: [] };
  if (q) {
    try {
      data = await searchMovies(q, page);
    } catch (e) {
      // swallow error and show empty state
    }
  }

  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Search Results{q ? ` for "${q}"` : ""}</h1>
        <Link href="/" className="text-blue-600 hover:underline">← Back to Home</Link>
      </div>

      {!q && <p className="text-gray-600">Enter a search from the header to see results.</p>}

      {q && data.results?.length === 0 && (
        <p className="text-gray-600">No results found.</p>
      )}

      {q && data.results?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {data.results.map((movie: any) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </main>
  );
}


