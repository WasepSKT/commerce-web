export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: {
    full_name?: string | null;
  } | null;
}

export interface ProductRatingData {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  reviews: Review[];
}


