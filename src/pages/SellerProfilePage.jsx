import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Helmet } from 'react-helmet';
import { MapPin, Calendar, Star, ShoppingBag, MessageCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import StarRating from '@/components/StarRating';
import { motion } from 'framer-motion';
import FeaturedListings from '@/components/FeaturedListings';
import BackButton from '@/components/BackButton';

const SellerProfilePage = ({ currentUser, onLikeToggle, onListingClick, likedListingIds }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalListings: 0, averageRating: 0, totalReviews: 0, salesCount: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');

  useEffect(() => {
    if (id) fetchSellerData();
  }, [id]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (profileError) throw profileError;

      // Only fetch 'approved' listings for a public seller profile.
      const { data: listingsData, error: listingsError } = await supabase.from('listings').select('*').eq('user_id', id).eq('status', 'approved').order('created_at', { ascending: false });
      if (listingsError) throw listingsError;

      const listingIds = listingsData.map(l => l.id);
      let reviewsData = [];
      if (listingIds.length > 0) {
        const { data: reviewsResult, error: reviewsError } = await supabase.from('reviews').select(`*, profiles:user_id (full_name, avatar_url), listings:listing_id (title)`).in('listing_id', listingIds).order('created_at', { ascending: false });
        if (reviewsError) throw reviewsError;
        reviewsData = reviewsResult;
      }

      const totalRating = reviewsData.reduce((acc, curr) => acc + curr.rating, 0);
      const avgRating = reviewsData.length > 0 ? totalRating / reviewsData.length : 0;

      setProfile(profileData);
      setListings(listingsData);
      setReviews(reviewsData);
      setStats({
        totalListings: listingsData.length,
        averageRating: avgRating,
        totalReviews: reviewsData.length,
        salesCount: profileData.sales_count || 0
      });

    } catch (error) {
      console.error('Error fetching seller profile:', error);
      navigate('/404'); 
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-24 w-24 bg-muted rounded-full"></div>
          <div className="h-6 w-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <>
      <Helmet><title>{profile.full_name} - Profil Vendeur | AFRMARKET</title></Helmet>
      <div className="min-h-screen bg-background pb-20 pt-4">
        <div className="container mx-auto px-4 max-w-6xl">
          <BackButton />
          <div className="bg-card border border-border rounded-2xl mt-4 shadow-sm relative overflow-hidden">
            <div className="h-32 md:h-48 bg-gradient-to-r from-orange-500/20 to-primary/20 w-full absolute top-0 left-0 z-0"></div>
            <div className="relative z-10 px-4 pb-6 pt-16 md:pt-24 md:px-8">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
                <div className="relative shrink-0">
                  <Avatar className="w-28 h-28 md:w-40 md:h-40 border-4 border-card shadow-xl"><AvatarImage src={profile.avatar_url} alt={profile.full_name} className="object-cover" /><AvatarFallback className="text-4xl bg-muted">{profile.full_name?.charAt(0)}</AvatarFallback></Avatar>
                  {profile.kyc_status === 'verified' && <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-background rounded-full p-1 shadow-md" title="Vendeur Vérifié"><ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-green-500 fill-green-50/20" /></div>}
                </div>
                <div className="flex-1 text-center md:text-left space-y-2 w-full">
                  <h1 className="text-2xl md:text-4xl font-bold truncate px-2 md:px-0">{profile.full_name}</h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-muted-foreground">
                    {profile.location && <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md"><MapPin size={14} /> {profile.location}</div>}
                    <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md"><Calendar size={14} /> Membre depuis {new Date(profile.created_at).getFullYear()}</div>
                  </div>
                  {profile.bio && <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto md:mx-0 py-2 line-clamp-3 md:line-clamp-none">{profile.bio}</p>}
                </div>
                <div className="flex gap-2 md:gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar justify-center md:justify-end">
                  <div className="bg-background/80 backdrop-blur-sm border border-border rounded-xl p-3 text-center min-w-[90px] flex-1 md:flex-none shadow-sm"><div className="text-xl md:text-2xl font-bold text-primary">{stats.totalListings}</div><div className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide">Annonces</div></div>
                  <div className="bg-background/80 backdrop-blur-sm border border-border rounded-xl p-3 text-center min-w-[90px] flex-1 md:flex-none shadow-sm"><div className="text-xl md:text-2xl font-bold text-green-600">{stats.salesCount}</div><div className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide">Ventes</div></div>
                  <div className="bg-background/80 backdrop-blur-sm border border-border rounded-xl p-3 text-center min-w-[90px] flex-1 md:flex-none shadow-sm"><div className="text-xl md:text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">{stats.averageRating.toFixed(1)} <Star size={14} className="fill-yellow-500" /></div><div className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide">{stats.totalReviews} Avis</div></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <div className="flex border-b border-border mb-6 overflow-x-auto scrollbar-hide">
              <button onClick={() => setActiveTab('listings')} className={`px-4 md:px-6 py-3 font-semibold text-sm flex items-center gap-2 whitespace-nowrap transition-all border-b-2 ${activeTab === 'listings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}><ShoppingBag size={18} />Annonces ({stats.totalListings})</button>
              <button onClick={() => setActiveTab('reviews')} className={`px-4 md:px-6 py-3 font-semibold text-sm flex items-center gap-2 whitespace-nowrap transition-all border-b-2 ${activeTab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}><MessageCircle size={18} />Avis Clients ({stats.totalReviews})</button>
            </div>
            <div className="min-h-[400px]">
              {activeTab === 'listings' && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>{listings.length > 0 ? <FeaturedListings listings={listings} onListingClick={onListingClick} currentUser={currentUser} onLikeToggle={onLikeToggle} likedListingIds={likedListingIds} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" /> : <div className="text-center py-12 text-muted-foreground">Aucune annonce active.</div>}</motion.div>}
              {activeTab === 'reviews' && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4 max-w-3xl mx-auto md:mx-0">{reviews.length > 0 ? reviews.map((review) => <div key={review.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow"><div className="flex gap-3 md:gap-4"><Avatar className="h-10 w-10 shrink-0"><AvatarImage src={review.profiles?.avatar_url} /><AvatarFallback>{review.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback></Avatar><div className="flex-1 min-w-0"><div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1"><div><h4 className="font-semibold text-sm truncate">{review.profiles?.full_name || 'Utilisateur'}</h4><p className="text-xs text-muted-foreground truncate">Sur : <span className="font-medium text-foreground">{review.listings?.title}</span></p></div><span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(review.created_at).toLocaleDateString()}</span></div><div className="mt-2 flex items-center gap-2"><StarRating rating={review.rating} size={14} /></div>{review.comment && <p className="mt-2 text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg">{review.comment}</p>}</div></div></div>) : <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl"><MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" /><h3 className="text-lg font-medium">Aucun avis pour le moment</h3><p className="text-muted-foreground text-sm">Ce vendeur n'a pas encore reçu d'évaluation.</p></div>}</motion.div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SellerProfilePage;