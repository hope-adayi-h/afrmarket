import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Clock, Heart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';

const SearchResults = ({ searchQuery, selectedCategory, onListingClick, onBack, currentUser, onLikeToggle }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, [searchQuery, selectedCategory]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('listings')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'en ligne');

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching listings:', error);
        // Fallback
        if (error.code === 'PGRST200') {
           let fallbackQuery = supabase
            .from('listings')
            .select('*')
            .eq('status', 'en ligne');
            
           if (selectedCategory) fallbackQuery = fallbackQuery.eq('category', selectedCategory);
           if (searchQuery) fallbackQuery = fallbackQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
           
           const { data: fallbackData } = await fallbackQuery.order('created_at', { ascending: false });
           if (fallbackData) {
             setListings(fallbackData.map(l => ({...l, userName: 'Utilisateur', userAvatarUrl: null})));
           }
        }
      } else {
        const formattedListings = data.map(listing => ({
          ...listing,
          userName: listing.profiles?.full_name || 'Utilisateur',
          userAvatarUrl: listing.profiles?.avatar_url
        }));
        setListings(formattedListings);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const created = new Date(date);
    const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return `Il y a ${Math.floor(diffInHours / 24)}j`;
  };

  const isLiked = (listingId) => currentUser?.likes?.includes(listingId);

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="container mx-auto px-4">
        <Button onClick={onBack} variant="ghost" className="mb-6 hover:bg-accent">
          <ArrowLeft size={20} className="mr-2" />Retour
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {selectedCategory ? `Catégorie: ${selectedCategory}` : 'Résultats de recherche'}
          </h1>
          {searchQuery && <p className="text-muted-foreground text-lg">Recherche: "{searchQuery}"</p>}
          <p className="text-muted-foreground mt-2">{listings.length} annonce{listings.length !== 1 ? 's' : ''} trouvée{listings.length !== 1 ? 's' : ''}</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-xl">Chargement des résultats...</p>
          </div>
        ) : (
          <>
            {listings.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-xl">Aucune annonce ne correspond à votre recherche.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {listings.map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="listing-card bg-card rounded-2xl overflow-hidden shadow-lg group flex flex-col"
                  >
                    <div className="relative h-48 overflow-hidden" onClick={() => onListingClick(listing)}>
                      <img src={listing.images && listing.images.length > 0 ? listing.images[0] : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500'} alt={listing.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 cursor-pointer"/>
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold shadow-lg">{listing.category}</div>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onLikeToggle(listing.id); }} className="absolute bottom-3 right-3 bg-card/80 backdrop-blur-sm rounded-full p-2">
                        <Heart size={20} className={`transition-colors ${isLiked(listing.id) ? 'text-red-500 fill-current' : 'text-foreground/70'}`} />
                      </motion.button>
                    </div>
                    <div className="p-4 flex flex-col flex-grow" onClick={() => onListingClick(listing)}>
                      <h3 className="font-bold text-lg text-card-foreground mb-2 line-clamp-2 h-14">{listing.title}</h3>
                      <p className="text-2xl font-bold text-primary mb-3">{formatPrice(listing.price)}</p>
                      <div className="flex items-center text-muted-foreground text-sm mb-3">
                        <MapPin size={16} className="mr-1" /><span className="line-clamp-1">{listing.location}</span>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="flex items-center justify-between text-xs text-muted-foreground/80">
                          <div className="flex items-center">
                            <Clock size={14} className="mr-1" /><span>{getTimeAgo(listing.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-400 fill-current" />
                            <span>{listing.average_rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center mt-3 pt-3 border-t">
                          {listing.userAvatarUrl ? (<img src={listing.userAvatarUrl} alt={listing.userName} className="w-8 h-8 rounded-full object-cover mr-2" />) : (<div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center text-white text-sm font-bold mr-2">{listing.userName?.charAt(0) || 'U'}</div>)}
                          <span className="text-sm font-medium text-foreground truncate">{listing.userName}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;