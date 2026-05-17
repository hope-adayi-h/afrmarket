import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const StarRating = ({ 
  rating = 0, 
  maxRating = 5, 
  onRatingChange, 
  editable = false, 
  size = 20,
  className
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = (index) => {
    if (editable) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (editable) {
      setHoverRating(0);
    }
  };

  const handleClick = (index) => {
    if (editable && onRatingChange) {
      onRatingChange(index);
    }
  };

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[...Array(maxRating)].map((_, i) => {
        const index = i + 1;
        const filled = index <= (hoverRating || rating);
        const isHalf = !Number.isInteger(rating) && index === Math.ceil(rating) && !hoverRating;

        return (
          <Star
            key={i}
            size={size}
            className={cn(
              "transition-colors",
              editable ? "cursor-pointer" : "cursor-default",
              filled 
                ? "fill-yellow-400 text-yellow-400" 
                : isHalf 
                  ? "fill-yellow-400 text-yellow-400 opacity-50" // Simple approximation for half star if needed
                  : "text-gray-300 fill-gray-100"
            )}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(index)}
          />
        );
      })}
    </div>
  );
};

export default StarRating;