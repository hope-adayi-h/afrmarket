import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Eye, Share2, MessageCircle, ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import StarRating from '@/components/StarRating'; // Import reusable component

const ListingDetailModal = ({ listing, onClose, currentUser, onMessage, onLikeToggle, onRate }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    if (listing?.location) {
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(listing.location)}&format=json&limit=1`)
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const bbox = [
              parseFloat(data[0].boundingbox[0]),
              parseFloat(data[0].boundingbox[2]),
              parseFloat(data[0].boundingbox[1]),
              parseFloat(data[0].boundingbox[3]),
            ].join(',');
            
            setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`);
          }
        })
        .catch(error => console.error("Erreur de géocodage:", error));
    }
  }, [listing]);

  if (!listing) return null;

  const images = listing.images && listing.images.length > 0 ? listing.images : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'];
  
  const nextImage = () => { setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length); };
  const prevImage = () => { setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length); };

  const formatPrice = (price) => { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price); };

  const getTimeAgo = (date) => {
    const now = new Date();
    const created = new Date(date);
    const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return `Il y a ${Math.floor(diffInHours / 24)}j`;
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

  const handleShare = () => { toast({ title: "Lien copié ! 📋", description: "Le lien de l'annonce a été copié." }); };
  
  const handleMessage = () => {
    // Auth check removed to allow guest messaging
    const recipient = { id: listing.userId || listing.user_id, name: listing.userName || listing.full_name, avatarUrl: listing.userAvatarUrl || listing.avatar_url };
    onMessage(recipient);
  };

  const handleRate = (newRating) => {
      if (!currentUser) {
          toast({ title: "Connectez-vous", description: "Vous devez être connecté pour noter une annonce.", variant: "destructive" });
          return;
      }
      onRate(listing.id, newRating);
  };
  
  const isLiked = currentUser?.likes?.includes(listing.id);
  
  // Prioritize real-time DB fields, fallback to props if necessary
  const averageRating = listing.average_rating !== undefined ? listing.average_rating : (listing.averageRating || 0);
  const ratingsCount = listing.ratings_count !== undefined ? listing.ratings_count : (listing.ratingsCount || 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card text-card-foreground rounded-2xl shadow-2xl max-w-4xl w-full my-8">
          
          <div className="relative">
            <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-card/80 backdrop-blur-sm hover:bg-card rounded-full p-2 shadow-lg"><X size={24} /></button>
            <div className="h-64 md:h-96 overflow-hidden rounded-t-2xl relative bg-muted">
              <AnimatePresence initial={false}>
                <motion.img key={currentImageIndex} src={images[currentImageIndex]} alt={listing.title} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="w-full h-full object-cover absolute inset-0"/>
              </AnimatePresence>
              {images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-card/70 hover:bg-card p-2 rounded-full shadow-md"><ChevronLeft/></button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-card/70 hover:bg-card p-2 rounded-full shadow-md"><ChevronRight/></button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, index) => (<div key={index} className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`}></div>))}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-2">{listing.category} {listing.subcategory && `> ${listing.subcategory}`}</span>
                    <h2 className="text-2xl md:text-3xl font-bold">{listing.title}</h2>
                </div>
                <div className="text-left md:text-right flex-shrink-0">
                    <p className="text-3xl md:text-4xl font-bold text-primary">{formatPrice(listing.price)}</p>
                    <div className="flex flex-col items-start md:items-end mt-1">
                        <div className="flex items-center gap-2">
                            <StarRating 
                                rating={averageRating} 
                                onRatingChange={handleRate}
                                editable={!!currentUser}
                                size={24}
                            />
                            <span className="text-lg font-bold">{Number(averageRating).toFixed(1)}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            ({ratingsCount} avis)
                        </span>
                        {!currentUser && <span className="text-xs text-muted-foreground mt-1">Connectez-vous pour noter</span>}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground mb-6">
                <div className="flex items-center"><MapPin size={18} className="mr-1.5 text-primary" /><span>{listing.location}</span></div>
                <div className="flex items-center"><Clock size={18} className="mr-1.5 text-primary" /><span>{getTimeAgo(listing.createdAt || listing.created_at)}</span></div>
                <div className="flex items-center"><Eye size={18} className="mr-1.5 text-primary" /><span>{listing.views || 0} vues</span></div>
            </div>

            <div className="border-t pt-6 mb-6">
              <h3 className="text-xl font-bold mb-4">Description</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>

            {listing.attributes && Object.keys(listing.attributes).length > 0 && (
                <div className="border-t pt-6 mb-6">
                    <h3 className="text-xl font-bold mb-4">Caractéristiques</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(listing.attributes).map(([key, value]) => (<motion.div whileHover={{ scale: 1.05 }} key={key} className="bg-muted p-3 rounded-lg"><p className="text-sm text-muted-foreground">{key}</p><p className="font-semibold">{value}</p></motion.div>))}
                    </div>
                </div>
            )}
            
            {mapUrl && (
                <div className="border-t pt-6 mb-6">
                    <h3 className="text-xl font-bold mb-4">Localisation</h3>
                    <iframe width="100%" height="300" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src={mapUrl} className="rounded-lg"></iframe>
                </div>
            )}

            <div className="border-t pt-6 mb-6">
              <h3 className="text-xl font-bold mb-4">Vendeur</h3>
              <div className="flex items-center space-x-4">
                {listing.userAvatarUrl || listing.avatar_url ? (<img src={listing.userAvatarUrl || listing.avatar_url} alt={listing.userName || listing.full_name} className="w-14 h-14 rounded-full object-cover" />) : (<div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center text-white font-bold text-xl">{listing.userName?.charAt(0) || listing.full_name?.charAt(0) || 'U'}</div>)}
                <div>
                  <p className="font-semibold text-lg">{listing.userName || listing.full_name || 'Utilisateur'}</p>
                  <p className="text-sm text-muted-foreground">Membre depuis {new Date(listing.createdAt || listing.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>

             <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1"><Button onClick={handleWhatsAppContact} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold shadow-lg"><MessageCircle size={20} className="mr-2" /> Contacter par WhatsApp</Button></motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1"><Button onClick={handleMessage} variant="outline" className="w-full border-2 border-primary text-primary hover:bg-primary/10 py-3 rounded-xl font-semibold">Envoyer un message</Button></motion.div>
                </div>
                <div className="flex gap-3">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Button onClick={() => onLikeToggle(listing.id)} variant="outline" className={`border-2 py-3 px-5 rounded-xl ${isLiked ? 'border-red-500 text-red-500' : 'border-input'}`}><Heart size={20} className={`transition-colors ${isLiked ? 'fill-current' : ''}`} /></Button></motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Button onClick={handleShare} variant="outline" className="border-2 border-input py-3 px-5 rounded-xl"><Share2 size={20} /></Button></motion.div>
                </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ListingDetailModal;