function getApiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  const trimmed = raw.replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export async function register(email, password, display_name) {
    const url = `${getApiBase()}/register`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, display_name })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Register failed: HTTP ${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
  }
  
// Reviews API
export async function createReview({ tmdb_id, rating, comment }) {
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${getApiBase()}/reviews/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tmdb_id, rating, comment })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to create review" }));
    throw new Error(errorData.detail || "Failed to create review");
  }
  return res.json();
}

export async function updateReview({ review_id, rating, comment }) {
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${getApiBase()}/reviews/${review_id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ rating, comment })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to update review" }));
    throw new Error(errorData.detail || "Failed to update review");
  }
  return res.json();
}

export async function deleteReview(review_id) {
  const token = localStorage.getItem("access_token");
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${getApiBase()}/reviews/${review_id}`, {
    method: "DELETE",
    headers
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to delete review" }));
    throw new Error(errorData.detail || "Failed to delete review");
  }
  return res.json();
}

export async function fetchMovieReviews(tmdb_id) {
  const url = `${getApiBase()}/reviews/movie/${tmdb_id}`;
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new Error(`Failed to fetch reviews: network error (${e})\nURL: ${url}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "<no body>");
    throw new Error(`Failed to fetch reviews: HTTP ${res.status} ${res.statusText}\nURL: ${url}\nBody: ${text}`);
  }
  return res.json();
}

export async function fetchMovieRatingStats(tmdb_id) {
  const url = `${getApiBase()}/reviews/movie/${tmdb_id}/stats`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch movie rating stats");
  }
  return res.json();
}

export async function fetchUserReviews(user_id) {
  const url = `${getApiBase()}/reviews/user/${user_id}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch user reviews");
  }
  return res.json();
}

export async function fetchRecentReviews(limit = 20) {
  const url = `${getApiBase()}/reviews/recent?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch recent reviews");
  }
  return res.json();
}

// Lists API
export async function addToList({ user_id, movie_id, kind }) {
  const res = await fetch(`${getApiBase()}/lists/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, movie_id, kind })
  });
  if (!res.ok) throw new Error("Failed to add to list");
  return res.json();
}

export async function removeFromList({ user_id, movie_id, kind }) {
  const params = new URLSearchParams({ user_id: String(user_id), movie_id: String(movie_id), kind });
  const res = await fetch(`${getApiBase()}/lists/?${params.toString()}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove from list");
  return res.json();
}

export async function fetchUserList({ user_id, kind }) {
  const res = await fetch(`${getApiBase()}/lists/${user_id}/${kind}`);
  if (!res.ok) throw new Error("Failed to fetch list");
  return res.json();
}

// Migration API
export async function migrateLocalData({ user_id, localData }) {
  const res = await fetch(`${getApiBase()}/migrate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, ...localData })
  });
  if (!res.ok) throw new Error("Failed to migrate local data");
  return res.json();
}
  