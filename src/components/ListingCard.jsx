import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MapPin, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/StarRating';

const ListingCard = ({ listing, onListingClick, isLiked, onLikeToggle, className = '' }) => {

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    onLikeToggle(listing.id);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={() => onListingClick(listing)}
      className={cn("bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col", className)}
    >
      <div className="relative aspect-video overflow-hidden group">
        <img
          src={listing.images && listing.images[0] ? listing.images[0] : "https://via.placeholder.com/300"}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          onClick={handleLikeClick}
          className="absolute top-3 right-3 h-9 w-9 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all z-10"
        >
          <Heart size={20} className={cn("transition-all", isLiked && "fill-red-500 text-red-500")} />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-bold text-lg leading-tight truncate drop-shadow-md">{listing.title}</h3>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xl font-black text-primary">
            {formatPrice(listing.price)}
          </div>
          <div className="flex items-center gap-1 cursor-pointer" onClick={(e) => {e.stopPropagation(); onListingClick(listing)}}>
             <StarRating rating={listing.average_rating || 0} size={14} />
             <span className="text-xs text-muted-foreground font-medium">({listing.ratings_count || 0})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin size={14} className="text-primary/70 shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>

        <div className="mt-auto pt-4 border-t border-border/50">
           <Badge variant="secondary" className="font-normal">{listing.category}</Badge>
        </div>
      </div>
    </motion.div>
  );
};

export default ListingCard;