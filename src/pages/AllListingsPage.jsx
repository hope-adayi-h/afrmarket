import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Helmet } from 'react-helmet';
import { Loader2 } from 'lucide-react';
import FeaturedListings from '@/components/FeaturedListings';
import BackButton from '@/components/BackButton';

const AllListingsPage = ({ onListingClick, currentUser, onLikeToggle, likedListingIds }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        // Ensures only approved listings are shown on the public "all listings" page.
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setListings(data || []);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  return (
    <>
      <Helmet>
        <title>Toutes les annonces - AFRMARKET</title>
        <meta name="description" content="Parcourez toutes les annonces disponibles sur AFRMARKET." />
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <BackButton />
          
          <div className="flex flex-col gap-6">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-foreground">Toutes les annonces</h1>
              <p className="text-muted-foreground mt-2">Découvrez toutes les opportunités d'achat et de vente.</p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : (
              <FeaturedListings 
                listings={listings} 
                onListingClick={onListingClick} 
                currentUser={currentUser}
                onLikeToggle={onLikeToggle}
                likedListingIds={likedListingIds}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AllListingsPage;