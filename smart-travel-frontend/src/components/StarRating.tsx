'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({ rating, maxRating = 5, size = 20, interactive = false, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= rating;
        const isHalf = !isFilled && starValue - 0.5 <= rating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starValue)}
            className={`${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'} transition-transform`}
          >
            <Star
              size={size}
              className={`transition-colors ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : isHalf
                  ? 'fill-amber-400/50 text-amber-400'
                  : 'fill-transparent text-[#d4ccc2]'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
