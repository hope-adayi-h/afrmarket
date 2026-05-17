import React from 'react';
import { MapPin, Clock, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import StarRating from '@/components/StarRating';

const FeaturedListings = ({ listings, onListingClick, currentUser, onLikeToggle, likedListingIds }) => {
  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Aucune annonce trouvée pour le moment.</p>
      </div>
    );
  }

  const getTimeAgo = (date) => {
    const diffInSeconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (diffInSeconds < 60) return `à l'instant`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} h`;
    return `${Math.floor(diffInHours / 24)} j`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(price);
  };
  
  // Use the explicit prop if available, otherwise fall back to currentUser (legacy support)
  const isLiked = (id) => {
    if (likedListingIds) return likedListingIds.includes(id);
    return currentUser?.likes?.includes(id);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {listings.map((listing, index) => (
        <motion.div
          key={listing.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full"
          onClick={() => onListingClick(listing)}
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <img
              src={listing.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
              alt={listing.title}
              className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute top-3 right-3">
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-red-500 shadow-sm h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onLikeToggle(listing.id);
                }}
              >
                 <Heart 
                    size={16} 
                    className={isLiked(listing.id) ? "fill-red-500" : ""}
                 />
              </Button>
            </div>
            {listing.status === 'promoted' && (
              <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-950 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                Premium
              </div>
            )}
          </div>

          <div className="p-4 flex flex-col flex-grow">
            <div className="flex justify-between items-start mb-1">
               <h3 className="font-bold text-foreground line-clamp-1 flex-1 mr-2 group-hover:text-primary transition-colors">
                {listing.title}
               </h3>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
               <StarRating rating={listing.average_rating || 0} size={14} />
               <span className="text-xs text-muted-foreground">
                 ({listing.ratings_count || 0})
               </span>
            </div>

            <p className="text-lg font-black text-primary mb-3">
              {formatPrice(listing.price)}
            </p>

            <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span className="truncate max-w-[80px]">{listing.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{getTimeAgo(listing.created_at)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default FeaturedListings;