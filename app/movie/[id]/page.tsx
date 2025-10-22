import Image from "next/image";
import { getMovieDetails } from "@/lib/tmdb";
import MovieCard from "@/components/ui/MovieCard";
import Link from "next/link";
import Reviews from "@/components/Reviews";

export default async function MoviePage({ params }: { params: { id: string } }) {
  let movie;
  try {
    movie = await getMovieDetails(params.id);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return (
      <main className="container mx-auto p-4">
        <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
          ← Back to Home
        </Link>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">API Key Required</h1>
          <p className="text-gray-600 mb-4">To view movie details, you need to set up a TMDB API key.</p>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
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

  // Debug log for movie data
  console.log("Movie data:", movie);
  console.log("Videos:", movie.videos?.results);
  console.log("Credits:", movie.credits);
  console.log("Recommendations:", movie.recommendations);

  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder.png";

  const director = movie.credits?.crew?.find((p: any) => p.job === "Director")?.name;
  const leadActor = movie.credits?.cast?.[0]?.name;

  return (
    <main className="container mx-auto p-4">
      {/* Back button */}
      <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
        ← Back to Home
      </Link>

      {/* Poster + Info */}
      <div className="flex flex-col md:flex-row gap-6">
        <Image
          src={poster}
          alt={movie.title}
          width={300}
          height={400}
          className="rounded shadow"
        />
        <div>
          <h1 className="text-3xl font-bold mb-4">{movie.title}</h1>
          <p className="text-gray-600 mb-4">{movie.overview}</p>
          
          {/* Movie details */}
          <div className="space-y-2 mb-6">
            <p><span className="font-semibold">Release Date:</span> {movie.release_date}</p>
            <p><span className="font-semibold">Rating:</span> ⭐ {Math.round(movie.vote_average * 10) / 10}/10</p>
            <p><span className="font-semibold">Runtime:</span> {movie.runtime} minutes</p>
            {director && (
              <p><span className="font-semibold">Director:</span> {director}</p>
            )}
            {leadActor && (
              <p><span className="font-semibold">Lead Cast:</span> {leadActor}</p>
            )}
            <div>
              <span className="font-semibold">Genres:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {movie.genres?.map((g: any) => (
                  <span key={g.id} className="px-2 py-1 text-xs rounded-full bg-gray-100">{g.name}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Cast section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Cast</h2>
            {movie.credits?.cast && movie.credits.cast.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {movie.credits.cast.slice(0, 10).map((actor: any) => (
                  <span key={actor.id} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {actor.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Cast information not available.</p>
            )}
          </div>

          {/* Recommendations section */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Recommended Movies</h2>
            {movie.recommendations?.results && movie.recommendations.results.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {movie.recommendations.results.slice(0, 8).map((rec: any) => (
                  <MovieCard key={rec.id} movie={rec} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recommendations available.</p>
            )}
          </div>
        </div>
      </div>

      {/* User Reviews */}
      <Reviews movieId={Number(params.id)} />
    </main>
  );
}
