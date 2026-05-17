import React, { useState } from 'react';
import { X, Star, MessageCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import StarRating from '@/components/StarRating';

const ReviewModal = ({ isOpen, onClose, order }) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Note manquante",
        description: "Veuillez sélectionner une note pour continuer.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // We upsert based on listing_id and user_id to avoid duplicates,
      // but now we link specific order_id to it.
      const { error } = await supabase
        .from('reviews')
        .upsert({
          listing_id: order.listing_id,
          user_id: order.buyer_id,
          order_id: order.id,
          rating: rating,
          comment: comment,
          created_at: new Date().toISOString()
        }, { onConflict: 'listing_id, user_id' });

      if (error) throw error;

      toast({
        title: "Avis publié ! ⭐",
        description: "Merci d'avoir partagé votre expérience.",
      });
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Erreur",
        description: "Impossible de publier l'avis.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border"
        >
          <div className="relative bg-primary p-6 text-primary-foreground text-center">
             <button 
               onClick={onClose}
               className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white"
             >
               <X size={18} />
             </button>
             <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
               <CheckCircle size={32} className="text-white" />
             </div>
             <h2 className="text-2xl font-bold">Commande reçue !</h2>
             <p className="text-primary-foreground/90 text-sm mt-1">
               Prenez un moment pour noter votre achat.
             </p>
          </div>

          <div className="p-6 space-y-6">
             <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
                <img 
                  src={order.listings?.images?.[0] || 'https://via.placeholder.com/50'} 
                  alt="Product" 
                  className="w-12 h-12 rounded-lg object-cover bg-muted"
                />
                <div>
                   <p className="font-semibold text-sm line-clamp-1">{order.listings?.title}</p>
                   <p className="text-xs text-muted-foreground">Vendu par {order.profiles?.full_name}</p>
                </div>
             </div>

             <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">Votre note globale</label>
                <StarRating 
                  rating={rating} 
                  onRatingChange={setRating} 
                  editable={true} 
                  size={36} 
                />
             </div>

             <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Votre commentaire (optionnel)</label>
                <Textarea 
                  placeholder="Qu'avez-vous pensé du produit ? La description était-elle fidèle ?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="bg-background min-h-[100px] resize-none"
                />
             </div>

             <Button 
               onClick={handleSubmit} 
               disabled={isSubmitting}
               className="w-full h-12 text-lg"
             >
               {isSubmitting ? "Publication..." : "Envoyer mon avis"}
             </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReviewModal;