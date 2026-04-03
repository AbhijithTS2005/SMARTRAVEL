'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsService, type ReviewItem } from '@/services/reviews';
import { useAuth } from '@/context/AuthContext';
import StarRating from './StarRating';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react';

interface ReviewSectionProps {
  destinationId: number;
}

export default function ReviewSection({ destinationId }: ReviewSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', destinationId],
    queryFn: () => reviewsService.getForDestination(destinationId),
  });

  const submitMutation = useMutation({
    mutationFn: () => reviewsService.submit(destinationId, newRating, newComment || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', destinationId] });
      setNewRating(0);
      setNewComment('');
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => reviewsService.remove(destinationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', destinationId] });
    },
  });

  const reviews = data?.reviews || [];
  const hasOwnReview = reviews.some(r => r.is_own);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(200, 149, 108, 0.1)' }}>
            <MessageSquare className="w-6 h-6 text-[#c8956c]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1b3a2d]">Reviews & Ratings</h3>
            <div className="flex items-center gap-3 text-sm text-[#8a8a8a]">
              {data?.average_rating && (
                <span className="flex items-center gap-1">
                  <StarRating rating={data.average_rating} size={14} />
                  <span className="font-semibold text-[#1b3a2d] ml-1">{data.average_rating}</span>
                </span>
              )}
              <span>{data?.total_reviews || 0} review{(data?.total_reviews || 0) !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        {!hasOwnReview && user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#c8956c] text-white rounded-full text-sm font-semibold hover:bg-[#b5845e] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Send className="w-4 h-4" />
            Write Review
          </button>
        )}
      </div>

      {/* Write Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-[#e8e0d6] rounded-2xl p-6 mb-6" style={{ background: '#ffffff' }}>
              <h4 className="font-semibold text-[#1b3a2d] mb-4">Your Rating</h4>
              <StarRating rating={newRating} size={32} interactive onChange={setNewRating} />
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience... (optional)"
                rows={3}
                className="w-full mt-4 px-4 py-3 rounded-xl border border-[#e8e0d6] bg-white text-[#1b3a2d] placeholder-[#c4bdb3] focus:border-[#c8956c] focus:outline-none transition resize-none"
              />
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={newRating === 0 || submitMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#c8956c] text-white rounded-full text-sm font-semibold hover:bg-[#b5845e] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Review
                </button>
                <button
                  onClick={() => { setShowForm(false); setNewRating(0); setNewComment(''); }}
                  className="px-6 py-2.5 text-[#8a8a8a] text-sm font-medium hover:text-[#1b3a2d] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#c8956c]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 border border-[#e8e0d6] rounded-2xl" style={{ background: '#ffffff' }}>
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-[#e8e0d6]" />
          <p className="text-[#8a8a8a] text-sm">No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: ReviewItem, i: number) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-[#e8e0d6] rounded-2xl p-5" style={{ background: '#ffffff' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #c8956c, #dbb896)' }}>
                    {review.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1b3a2d] text-sm">{review.user.name}</span>
                      {review.is_own && (
                        <span className="bg-[#c8956c]/10 text-[#c8956c] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={review.rating} size={14} />
                      <span className="text-xs text-[#8a8a8a]">{formatDate(review.created_at)}</span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-[#5a5550] mt-3 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                </div>
                {review.is_own && (
                  <button
                    onClick={() => { if (confirm('Delete your review?')) deleteMutation.mutate(); }}
                    disabled={deleteMutation.isPending}
                    className="p-2 rounded-full text-[#c4bdb3] hover:text-red-400 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
