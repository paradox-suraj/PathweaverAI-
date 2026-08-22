"use client";

import { useState } from "react";
import { Star, Loader2, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface Review {
  id: string;
  rating: number;
  review: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
  };
}

export function CourseReviewSection({
  courseId,
  reviews,
  canReview,
}: {
  courseId: string;
  reviews: Review[];
  canReview: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/courses/${courseId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, reviewText }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit review");
      }
      
      router.refresh();
      setRating(0);
      setReviewText("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 mt-12">
      <h2 className="text-2xl font-headline-md text-text-primary">Reviews</h2>
      
      {canReview && (
        <div className="glass-panel p-6">
          <h3 className="font-headline-md text-lg text-text-primary mb-4">Leave a Review</h3>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    (hoverRating || rating) >= star
                      ? "fill-accent-amber text-accent-amber"
                      : "text-text-muted hover:text-accent-amber/50"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Tell others what you thought about this course... (optional)"
            className="w-full bg-surface-2 border border-white/10 rounded-xl p-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 resize-none h-24"
          />
          {error && <p className="text-destructive text-sm mb-4">{error}</p>}
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || rating === 0}
            className="bg-primary-gradient text-white"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Review
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-text-muted text-center py-8 bg-surface-1/30 rounded-xl border border-white/5">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="glass-panel p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {review.user.image ? (
                    <Image src={review.user.image} alt={review.user.name || "User"} width={40} height={40} className="w-10 h-10 rounded-full" loading="lazy" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-text-muted" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-text-primary">{review.user.name || "Anonymous User"}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        review.rating >= star ? "fill-accent-amber text-accent-amber" : "text-surface-3"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.review && (
                <p className="text-text-secondary whitespace-pre-wrap">{review.review}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
