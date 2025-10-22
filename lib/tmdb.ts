// lib/tmdb.ts
//const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
//const BASE = "https://api.themoviedb.org/3";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const BASE = `${API_URL}/tmdb`;


// Debug log to confirm if env variable is loaded
console.log("TMDB API KEY from env:", API_URL);

async function tmdbFetch(
  path: string,
  params: Record<string, string | number> = {}
) {
  if (!API_URL) {
    throw new Error(
      "TMDB API key is missing. Please check your .env.local file."
    );
  }

  const url = new URL(`${BASE}${path}`);

  Object.entries(params).forEach(([k, v]) =>
    url.searchParams.set(k, String(v))
  );

  const res = await fetch(url.toString(), {
    // Always use GET for TMDB
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store", // important in Next.js to avoid stale data
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("TMDB fetch error:", res.status, errorText);
    throw new Error(`TMDB error: ${res.status}`);
  }

  return res.json();
}

// 🔍 Search movies
export async function searchMovies(query: string, page = 1) {
  return tmdbFetch("/search/movie", { query, page, include_adult: "false" });
}

// 🔥 Popular movies
export async function getPopular(page = 1) {
  return tmdbFetch("/movie/popular", { page });
}

// 🎬 Movie details (with videos, cast, and recommendations)
export async function getMovieDetails(id: string) {
  return tmdbFetch(`/movie/${id}`, {
    append_to_response: "videos,credits,recommendations",
  });
}

// 🖼️ Poster helper
export function posterUrl(path: string | null, size = "w342") {
  if (!path) return "/placeholder_poster.png";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
