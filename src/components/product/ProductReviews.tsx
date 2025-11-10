import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { StarRating, RatingDistribution } from '@/components/ui/StarRating';
import { maskName } from '@/lib/maskName';
import type { ProductRatingData, Review } from '@/types/review';

interface ProductReviewsProps {
  ratingData: ProductRatingData;
}

export const ProductReviews = ({ ratingData }: ProductReviewsProps) => {
  const { averageRating, totalReviews, ratingDistribution, reviews } = ratingData;

  // Convert Record to array for RatingDistribution component
  const distributionArray = [
    ratingDistribution[5] || 0,
    ratingDistribution[4] || 0,
    ratingDistribution[3] || 0,
    ratingDistribution[2] || 0,
    ratingDistribution[1] || 0,
  ];

  return (
    <>
      {totalReviews > 0 ? (
        <div className="space-y-6">
          {/* Rating Summary */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-primary mb-2">
                  {averageRating.toFixed(1)}
                </div>
                <StarRating rating={averageRating} size="lg" />
                <p className="text-sm text-muted-foreground mt-2">
                  Berdasarkan {totalReviews} ulasan
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Distribusi Rating</h4>
              <RatingDistribution
                distribution={distributionArray}
                totalReviews={totalReviews}
              />
            </div>
          </div>

          {/* Individual Reviews */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Ulasan Pelanggan</h4>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyReviews />
      )}
    </>
  );
};

const ReviewItem = ({ review }: { review: Review }) => (
  <div className="border rounded-lg p-4">
    <div className="flex items-start justify-between mb-2">
      <div>
        <p className="font-medium text-sm">
          {maskName(review.profiles?.full_name, 1)}
        </p>
        <StarRating rating={review.rating} size="sm" />
      </div>
      <span className="text-xs text-muted-foreground">
        {new Date(review.created_at).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </span>
    </div>
    {review.comment && (
      <p className="text-sm text-muted-foreground">
        {review.comment}
      </p>
    )}
  </div>
);

const EmptyReviews = () => (
  <div className="text-center py-8">
    <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
    <p className="text-muted-foreground">Belum ada ulasan untuk produk ini</p>
    <p className="text-sm text-muted-foreground mt-1">
      Jadilah yang pertama memberikan ulasan setelah membeli produk ini
    </p>
  </div>
);


