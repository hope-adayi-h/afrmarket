import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Helmet } from 'react-helmet';
import { MapPin, Eye, Share2, MessageCircle, ChevronLeft, ChevronRight, Heart, ShieldCheck, Calendar, Trash2, User, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import BackButton from '@/components/BackButton';
import StarRating from '@/components/StarRating';
import OrderModal from '@/components/OrderModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';

const ListingDetailPage = ({ currentUser, onMessage, onLikeToggle }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Listing State
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Image Gallery State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mapUrl, setMapUrl] = useState('');
  const autoScrollTimerRef = useRef(null);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [guestName, setGuestName] = useState(''); // For guest reviews
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  
  // Order Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchListing(id);
      fetchReviews(id);
    }
    return () => stopAutoScroll();
  }, [id]);

  const stopAutoScroll = () => {
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  };

  const startAutoScroll = () => {
    stopAutoScroll();
    autoScrollTimerRef.current = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1));
    }, 5000);
  };

  useEffect(() => {
    if (listing?.images?.length > 1) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
    return () => stopAutoScroll();
  }, [listing]);

  useEffect(() => {
    if (listing?.images?.length) {
      if (currentImageIndex >= listing.images.length) {
        setCurrentImageIndex(0);
      }
    }
  }, [currentImageIndex, listing]);

  const fetchListing = async (listingId) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            phone,
            kyc_status
          )
        `)
        .eq('id', listingId)
        .single();

      if (error) throw error;

      const formattedListing = {
        ...data,
        userName: data.profiles?.full_name,
        userAvatarUrl: data.profiles?.avatar_url,
        userPhone: data.profiles?.phone,
        userKycStatus: data.profiles?.kyc_status,
        userJoinedAt: data.created_at 
      };

      setListing(formattedListing);
      setLoading(false);
      
      if (loading) { 
         await supabase.rpc('increment_listing_views', { listing_id: listingId });
      }

      if (data.location && !mapUrl) {
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.location)}&format=json&limit=1`)
          .then(res => res.json())
          .then(geoData => {
            if (geoData && geoData.length > 0) {
              const { lat, lon } = geoData[0];
              const bbox = [
                parseFloat(geoData[0].boundingbox[0]),
                parseFloat(geoData[0].boundingbox[2]),
                parseFloat(geoData[0].boundingbox[1]),
                parseFloat(geoData[0].boundingbox[3]),
              ].join(',');
              setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`);
            }
          });
      }

    } catch (error) {
      console.error('Error fetching listing:', error);
      toast({ title: "Erreur", description: "Impossible de charger l'annonce.", variant: "destructive" });
      navigate('/');
    }
  };

  const fetchReviews = async (listingId) => {
    try {
      setReviewsLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          guest_id,
          order_id,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleRate = (newRating) => { setUserRating(newRating); };

  const getOrCreateGuestId = () => {
    let id = localStorage.getItem('afrmarket_guest_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('afrmarket_guest_id', id);
    }
    return id;
  };

  const handleSubmitReview = async () => {
    if (userRating === 0) {
      toast({ title: "Note manquante", description: "Veuillez sélectionner une note (étoiles).", variant: "destructive" });
      return;
    }
    
    if (!currentUser && !guestName.trim()) {
        toast({ title: "Nom requis", description: "Veuillez entrer votre nom pour poster l'avis.", variant: "destructive" });
        return;
    }

    setSubmittingReview(true);
    try {
      const reviewData = {
        listing_id: listing.id,
        rating: userRating,
        comment: currentUser ? userComment : `[${guestName}] ${userComment}`
      };

      if (currentUser) {
        reviewData.user_id = currentUser.id;
        // Upsert logic for registered users to prevent duplicates
        const { error } = await supabase
            .from('reviews')
            .upsert(reviewData, { onConflict: 'listing_id, user_id' });
        if (error) throw error;
      } else {
        reviewData.guest_id = getOrCreateGuestId();
        // Insert for guests (duplicates allowed or handled by DB constraint if unique on guest_id+listing_id)
        const { error } = await supabase
            .from('reviews')
            .insert(reviewData);
        if (error) throw error;
      }
      
      toast({ title: "Merci ! ⭐", description: "Votre avis a été publié avec succès." });
      setUserRating(0);
      setUserComment('');
      setGuestName('');
      await Promise.all([fetchReviews(listing.id), fetchListing(listing.id)]);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({ title: "Erreur", description: "Impossible d'enregistrer votre avis.", variant: "destructive" });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet avis ?")) return;
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      toast({ title: "Avis supprimé", description: "Votre avis a été retiré." });
      await Promise.all([fetchReviews(listing.id), fetchListing(listing.id)]);
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({ title: "Erreur", description: "Impossible de supprimer l'avis.", variant: "destructive" });
    }
  };

  const handleWhatsAppContact = () => {
    const phone = listing.phone || listing.userPhone;
    if (phone) {
      const message = encodeURIComponent(`Bonjour, je suis intéressé par votre annonce sur AFRMARKET: ${listing.title}`);
      window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    } else {
      toast({ title: "Contact indisponible", description: "Le vendeur n'a pas fourni de numéro WhatsApp." });
    }
  };

  const handleMessage = () => {
    const recipient = { id: listing.user_id, name: listing.userName, avatarUrl: listing.userAvatarUrl };
    onMessage(recipient);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Lien copié ! 📋", description: "Le lien de l'annonce a été copié." });
  };

  const nextImage = (e) => {
    e?.stopPropagation();
    stopAutoScroll();
    setCurrentImageIndex((prev) => (prev + 1) % (listing.images?.length || 1));
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    stopAutoScroll();
    setCurrentImageIndex((prev) => (prev - 1 + (listing.images?.length || 1)) % (listing.images?.length || 1));
  };

  const selectImage = (index) => {
    stopAutoScroll();
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary/20 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const images = listing.images && listing.images.length > 0 ? listing.images : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'];
  const isLiked = currentUser?.likes?.includes(listing.id);
  const averageRating = listing.average_rating || 0;
  const ratingsCount = listing.ratings_count || 0;

  return (
    <>
      <Helmet>
        <title>{listing.title} - AFRMARKET</title>
        <meta name="description" content={listing.description?.substring(0, 160)} />
      </Helmet>

      <div className="min-h-screen bg-background pb-20 pt-4">
        <div className="container mx-auto px-4 max-w-5xl">
          <BackButton />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mt-4">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Gallery */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="relative aspect-[4/3] sm:aspect-video bg-black/5 group">
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={currentImageIndex}
                      src={images[currentImageIndex]} 
                      alt={`${listing.title} - view ${currentImageIndex + 1}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full object-contain bg-gray-900/90 backdrop-blur-sm"
                    />
                  </AnimatePresence>
                  
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium tracking-wide z-10">
                    {currentImageIndex + 1} / {images.length}
                  </div>

                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 z-10"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 z-10"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="p-4 flex gap-3 overflow-x-auto pb-4 bg-card border-t border-border custom-scrollbar">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectImage(idx)}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === currentImageIndex 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">Description</h3>
                <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-line text-sm md:text-base">
                  {listing.description}
                </div>

                {listing.attributes && Object.keys(listing.attributes).length > 0 && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Caractéristiques</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {Object.entries(listing.attributes).map(([key, value]) => (
                        <div key={key} className="bg-muted/50 p-3 rounded-lg border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1 capitalize">{key}</p>
                          <p className="font-medium text-sm truncate" title={value}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Map */}
              {mapUrl && (
                <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm overflow-hidden">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">Localisation</h3>
                  <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-muted relative z-0">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      marginHeight="0" 
                      marginWidth="0" 
                      src={mapUrl} 
                      className="absolute inset-0"
                    />
                  </div>
                  <div className="mt-3 flex items-start gap-2 text-muted-foreground text-sm">
                     <MapPin size={16} className="mt-0.5 text-primary shrink-0" />
                     <p>{listing.location} {listing.address && `• ${listing.address}`}</p>
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm" id="reviews">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                     <h3 className="text-xl font-bold flex items-center gap-2">Avis et Évaluations</h3>
                    <p className="text-sm text-muted-foreground mt-1">Ce que les utilisateurs pensent de cette annonce</p>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-lg border border-border/50">
                    <div className="text-3xl font-bold text-primary">{Number(averageRating).toFixed(1)}</div>
                    <div className="flex flex-col text-xs">
                      <StarRating rating={averageRating} size={16} />
                      <span className="text-muted-foreground mt-0.5">{ratingsCount} avis au total</span>
                    </div>
                  </div>
                </div>

                {/* Review Form - Available for Guests too */}
                <div className="mb-10 p-5 bg-muted/30 rounded-xl border border-border/50">
                  <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
                    {currentUser ? "Laisser un avis" : "Laisser un avis (Invité)"}
                  </h4>
                  <div className="space-y-4">
                    {!currentUser && (
                        <div>
                            <label className="text-sm font-medium mb-1 block">Votre Nom</label>
                            <Input placeholder="Ex: Amadou" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Votre note</label>
                      <StarRating rating={userRating} onRatingChange={handleRate} editable={true} size={28} className="mb-2" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Votre commentaire</label>
                      <Textarea 
                          placeholder="Partagez votre expérience..." 
                          value={userComment}
                          onChange={(e) => setUserComment(e.target.value)}
                          className="bg-background min-h-[100px] resize-y"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSubmitReview} disabled={submittingReview || userRating === 0}>
                        {submittingReview ? 'Envoi en cours...' : 'Publier mon avis'}
                      </Button>
                    </div>
                  </div>
                </div>

                {reviewsLoading ? (
                  <div className="py-8 text-center text-muted-foreground animate-pulse">Chargement des avis...</div>
                ) : (
                  <div className="space-y-6">
                      {reviews.length > 0 ? reviews.map((review) => (
                          <div key={review.id} className="group border-b border-border last:border-0 pb-6 last:pb-0">
                              <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border shrink-0 flex items-center justify-center">
                                          {review.profiles?.avatar_url ? (
                                              <img src={review.profiles.avatar_url} alt={review.profiles.full_name} className="w-full h-full object-cover" />
                                          ) : (
                                              <User size={20} className="text-muted-foreground" />
                                          )}
                                      </div>
                                      <div>
                                          <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm">
                                                {review.profiles?.full_name || (review.comment.startsWith('[') ? review.comment.split(']')[0].replace('[', '') : 'Visiteur')}
                                            </p>
                                            {review.order_id && (
                                                <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full border border-green-200 dark:border-green-800">
                                                    <ShieldCheck size={10} /> Achat vérifié
                                                </span>
                                            )}
                                            {review.guest_id && (
                                                <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full border">
                                                    Invité
                                                </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString('fr-FR')}</p>
                                      </div>
                                  </div>
                                  {currentUser?.id === review.user_id && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDeleteReview(review.id)}
                                        title="Supprimer votre avis"
                                      >
                                          <Trash2 size={16} />
                                      </Button>
                                  )}
                              </div>
                              <div className="pl-[52px]">
                                <StarRating rating={review.rating} size={14} className="mb-2" />
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {review.comment.startsWith('[') && review.comment.includes(']') 
                                        ? review.comment.split(']').slice(1).join(']').trim() 
                                        : review.comment}
                                </p>
                              </div>
                          </div>
                      )) : (
                          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                            <MessageCircle className="text-muted-foreground mx-auto mb-2" size={24} />
                            <h3 className="text-lg font-medium mb-1">Aucun avis pour le moment</h3>
                            <p className="text-muted-foreground text-sm">Soyez le premier à donner votre avis sur cette annonce !</p>
                          </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Info Card */}
              <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm sticky top-24">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 rounded-md bg-orange-900/30 text-orange-500 text-xs font-bold uppercase tracking-wider">
                    {listing.category}
                  </span>
                  <div className="flex gap-2">
                     <Button size="icon" variant="ghost" onClick={handleShare} className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground"><Share2 size={18} /></Button>
                     <Button size="icon" variant="ghost" onClick={() => onLikeToggle(listing.id)} className={`h-8 w-8 rounded-full hover:bg-muted ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}><Heart size={18} className={isLiked ? 'fill-current' : ''} /></Button>
                  </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{listing.title}</h1>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-1.5"><MapPin size={14} className="text-orange-500" /><span>{listing.location}</span></div>
                  <div className="flex items-center gap-1.5"><Calendar size={14} className="text-orange-500" /><span>{new Date(listing.created_at).toLocaleDateString()}</span></div>
                  <div className="flex items-center gap-1.5"><Eye size={14} className="text-orange-500" /><span>{listing.views || 0} vues</span></div>
                </div>

                <div className="mb-6 pb-6 border-b border-border">
                  <div className="text-3xl md:text-4xl font-black text-orange-500 mb-2">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(listing.price)}
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}>
                    <StarRating rating={averageRating} size={18} />
                    <span className="text-sm font-medium text-muted-foreground">{ratingsCount} avis</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-6 bg-muted/30 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/vendeur/${listing.user_id}`)}>
                  <div className="w-12 h-12 rounded-full bg-muted overflow-hidden border border-border shrink-0">
                    {listing.userAvatarUrl ? (
                      <img src={listing.userAvatarUrl} alt={listing.userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground bg-muted">
                        {listing.userName?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold flex items-center gap-1 truncate">
                      {listing.userName || 'Utilisateur'}
                      {listing.userKycStatus === 'verified' && <ShieldCheck size={14} className="text-green-500 shrink-0" />}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      Membre depuis {new Date(listing.userJoinedAt || listing.created_at).getFullYear()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button onClick={() => setIsOrderModalOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-md transition-all hover:-translate-y-0.5 text-base">
                    <ShoppingBag className="mr-2" size={20} /> Commander cet article
                  </Button>

                  <Button onClick={handleWhatsAppContact} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-12 rounded-xl shadow-md transition-all hover:-translate-y-0.5 text-base">
                    <MessageCircle className="mr-2" size={20} /> Contacter par WhatsApp
                  </Button>
                  
                  <Button onClick={handleMessage} variant="outline" className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-500/10 font-bold h-12 rounded-xl text-base">
                    Envoyer un message
                  </Button>
                </div>
              </div>

              {/* Security Tips */}
              <div className="bg-card border border-orange-500/20 rounded-2xl p-5 shadow-sm">
                 <h5 className="font-bold text-orange-500 mb-3 flex items-center gap-2">
                   <ShieldCheck size={18} /> Conseils de sécurité
                 </h5>
                 <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                   <li>Ne payez jamais avant d'avoir vu le produit.</li>
                   <li>Privilégiez les rencontres dans des lieux publics.</li>
                   <li>Méfiez-vous des offres trop alléchantes.</li>
                 </ul>
              </div>

            </div>
          </div>
        </div>
        
        <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} listing={listing} currentUser={currentUser} />
      </div>
    </>
  );
};

export default ListingDetailPage;