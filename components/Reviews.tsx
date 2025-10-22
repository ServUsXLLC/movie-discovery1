"use client";

import { useEffect, useState } from "react";
import { createReview, fetchMovieReviews } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Review = {
  id: number;
  user_id: number;
  movie_id: number;
  rating: number;
  comment?: string | null;
  created_at?: string | null;
};

export default function Reviews({ movieId }: { movieId: number }) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMovieReviews(movieId)
      .then(setReviews)
      .catch((e) => console.error(e));
  }, [movieId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await createReview({
        user_id: user.id,
        movie_id: movieId,
        rating,
        comment: comment.trim() || null,
      });
      const next = await fetchMovieReviews(movieId);
      setReviews(next);
      setComment("");
      setRating(5);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-3">User Reviews</h2>

      {isAuthenticated ? (
        <form onSubmit={onSubmit} className="mb-4 flex flex-col gap-2 max-w-md">
          <label className="text-sm">Rating (1-5)</label>
          <Input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          />
          <label className="text-sm">Comment</label>
          <Input
            type="text"
            placeholder="Share your thoughts..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-gray-600 mb-4">Log in to leave a review.</p>
      )}

      {reviews.length === 0 ? (
        <p className="text-gray-500">No reviews yet. Be the first to review!</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="border rounded p-3">
              <div className="text-sm text-gray-600">⭐ {r.rating}/5</div>
              {r.comment && <div className="mt-1">{r.comment}</div>}
              {r.created_at && (
                <div className="mt-1 text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}


