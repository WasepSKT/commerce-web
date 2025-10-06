import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Review {
  id: string;
  user_id: string;
  order_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

interface ProductRatingData {
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
  ratingDistribution: { [key: number]: number };
}

export const useProductRating = (productId: string) => {
  const [ratingData, setRatingData] = useState<ProductRatingData>({
    averageRating: 0,
    totalReviews: 0,
    reviews: [],
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    const fetchProductRating = async () => {
      try {
        setLoading(true);
        
        // Fetch reviews dengan join ke profiles untuk nama user
        const { data: reviews, error: reviewsError } = await supabase
          .from('product_reviews')
          .select(`
            id,
            user_id,
            order_id,
            product_id,
            rating,
            comment,
            created_at
          `)
          .eq('product_id', productId)
          .order('created_at', { ascending: false });

        // Fetch profiles separately untuk setiap review
        let reviewsWithProfiles: Review[] = [];
        if (reviews && reviews.length > 0) {
          const userIds = reviews.map(review => review.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);

          reviewsWithProfiles = reviews.map(review => ({
            ...review,
            profiles: (profiles || []).find(profile => profile.user_id === review.user_id) || null
          }));
        }

        if (reviewsError) {
          throw reviewsError;
        }

        // prefer the enriched list (with profiles) when available
        const reviewList: Review[] = reviewsWithProfiles.length > 0 ? reviewsWithProfiles : (reviews || []);

        // Calculate statistics
        const totalReviews = reviewList.length;
        const averageRating = totalReviews > 0
          ? reviewList.reduce((sum, review) => sum + review.rating, 0) / totalReviews
          : 0;

        // Calculate rating distribution
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviewList.forEach(review => {
          ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
        });

        setRatingData({
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          totalReviews,
          reviews: reviewList,
          ratingDistribution
        });

        setError(null);
      } catch (err) {
        console.error('Error fetching product rating:', err);
        setError('Failed to fetch product rating');
      } finally {
        setLoading(false);
      }
    };

    fetchProductRating();
  }, [productId]);

  const refetch = () => {
    if (productId) {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          const { data: reviews, error: reviewsError } = await supabase
            .from('product_reviews')
            .select(`
              id,
              user_id,
              order_id,
              product_id,
              rating,
              comment,
              created_at
            `)
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

          // Fetch profiles separately
          let reviewsWithProfiles = [];
          if (reviews && reviews.length > 0) {
            const userIds = reviews.map(review => review.user_id);
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, full_name')
              .in('user_id', userIds);

            reviewsWithProfiles = reviews.map(review => ({
              ...review,
              profiles: profiles?.find(profile => profile.user_id === review.user_id) || null
            }));
          }

          if (reviewsError) {
            throw reviewsError;
          }

          const reviewList = reviewsWithProfiles || [];
          
          const totalReviews = reviewList.length;
          const averageRating = totalReviews > 0 
            ? reviewList.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;

          const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          reviewList.forEach(review => {
            ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
          });

          setRatingData({
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews,
            reviews: reviewList,
            ratingDistribution
          });

          setError(null);
        } catch (err) {
          console.error('Error refetching product rating:', err);
          setError('Failed to refetch product rating');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  };

  return {
    ratingData,
    loading,
    error,
    refetch
  };
};