import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Helmet } from 'react-helmet';
import { Heart, Lock } from 'lucide-react';
import FeaturedListings from '@/components/FeaturedListings';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';

const FavoritesPage = ({ onListingClick, currentUser, onLikeToggle, likedListingIds, onLoginClick }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!currentUser || !likedListingIds || likedListingIds.length === 0) {
        setListings([]);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .in('id', likedListingIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setListings(data || []);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchFavorites();
    }
  }, [currentUser, likedListingIds]);

  if (!currentUser) {
    return (
      <>
        <Helmet>
          <title>Mes Favoris - AFRMARKET</title>
        </Helmet>
        <div className="min-h-screen bg-muted/30 py-20 px-4 flex items-center justify-center">
           <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-2xl shadow-sm border border-border">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                 <Lock size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">Connectez-vous pour voir vos favoris</h1>
                <p className="text-muted-foreground">
                   Vous avez aimé des annonces ? Connectez-vous pour retrouver votre liste et ne rien perdre !
                </p>
              </div>
              <Button onClick={onLoginClick} className="w-full h-12 text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white">
                 Se connecter / S'inscrire
              </Button>
           </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mes Favoris - AFRMARKET</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <BackButton />
          
          <div className="flex flex-col gap-6">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Heart className="fill-red-500 text-red-500" /> Mes Favoris
              </h1>
              <p className="text-muted-foreground mt-2">Retrouvez toutes les annonces que vous avez sauvegardées.</p>
            </div>

            {listings.length > 0 ? (
              <FeaturedListings 
                listings={listings} 
                onListingClick={onListingClick} 
                currentUser={currentUser}
                onLikeToggle={onLikeToggle}
                likedListingIds={likedListingIds}
              />
            ) : (
              <div className="bg-card rounded-xl p-12 text-center border border-dashed border-border">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Aucun favori pour le moment</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Explorez les annonces et cliquez sur le cœur pour les ajouter à votre liste de favoris.
                  </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FavoritesPage;