import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface RatingModalProps {
  orderId: string;
  productId: string;
  productName: string;
  onSuccess?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  orderId,
  productId,
  productName,
  onSuccess
}) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Rating diperlukan',
        description: 'Silakan berikan rating untuk produk ini.',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Anda harus login untuk memberikan rating.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          user_id: user.id,
          order_id: orderId,
          product_id: productId,
          rating,
          comment: comment.trim() || null,
        });

      if (error) throw error;

      toast({
        title: 'Review berhasil disimpan',
        description: 'Terima kasih atas review Anda!'
      });

      setOpen(false);
      setRating(0);
      setComment('');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Gagal menyimpan review',
        description: 'Terjadi kesalahan saat menyimpan review.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-primary text-primary hover:bg-primary hover:text-white"
        >
          <Star className="h-4 w-4 mr-1" />
          Beri Rating
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Beri Rating & Review</DialogTitle>
          <DialogDescription>
            Bagaimana pengalaman Anda dengan <strong>{productName}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rating Stars */}
          <div>
            <Label>Rating</Label>
            <div className="flex items-center space-x-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${star <= rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                      }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment">Komentar (Opsional)</Label>
            <Textarea
              id="comment"
              placeholder="Bagikan pengalaman Anda dengan produk ini..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
            {submitting ? 'Menyimpan...' : 'Simpan Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};