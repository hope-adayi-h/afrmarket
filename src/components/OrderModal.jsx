import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, MapPin, Phone, User, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const OrderModal = ({ isOpen, onClose, listing, currentUser }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    quantity: 1
  });

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.full_name || '',
        phone: currentUser.phone || '',
        location: currentUser.location || ''
      }));
    }
  }, [currentUser, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.location) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          listing_id: listing.id,
          seller_id: listing.user_id,
          buyer_id: currentUser?.id || null,
          buyer_name: formData.name,
          buyer_phone: formData.phone,
          buyer_location: formData.location,
          quantity: parseInt(formData.quantity) || 1,
          status: 'pending'
        });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Commande envoyée ! 🎉",
        description: "Le vendeur a été notifié de votre commande.",
      });
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de passer la commande. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewOrders = () => {
      onClose();
      navigate('/orders');
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative bg-primary p-6 text-primary-foreground shrink-0">
             <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12 scale-150 pointer-events-none">
               <ShoppingBag size={120} />
             </div>
             <button 
               onClick={onClose}
               className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white z-10"
             >
               <X size={18} />
             </button>
             <h2 className="text-xl md:text-2xl font-bold relative z-10 flex items-center gap-2">
               <ShoppingBag size={24} />
               Commander
             </h2>
             <p className="text-primary-foreground/80 relative z-10 text-xs md:text-sm mt-1">
               Remplissez ce formulaire pour commander cet article.
             </p>
          </div>

          {/* Body - Scrollable */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {success ? (
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2 animate-bounce">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-green-600">Commande Reçue !</h3>
                <p className="text-muted-foreground text-sm">
                  Votre demande a été envoyée au vendeur.<br/>
                  Il vous contactera bientôt pour la livraison.
                </p>
                <div className="flex flex-col w-full gap-3 mt-4">
                    <Button onClick={handleViewOrders} className="w-full bg-primary text-primary-foreground py-6 text-base">
                        Voir mes commandes <ArrowRight size={18} className="ml-2"/>
                    </Button>
                    <Button onClick={onClose} variant="outline" className="w-full py-6">
                        Fermer
                    </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 flex gap-3 bg-muted/50 p-3 rounded-xl border border-border">
                   <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                     <img 
                       src={listing.images?.[0] || 'https://via.placeholder.com/150'} 
                       alt={listing.title}
                       className="w-full h-full object-cover"
                     />
                   </div>
                   <div className="flex-1 overflow-hidden flex flex-col justify-center">
                     <h4 className="font-bold text-sm truncate">{listing.title}</h4>
                     <p className="text-primary font-bold text-base">
                       {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(listing.price)}
                     </p>
                   </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-sm">
                      <User size={14} className="text-muted-foreground"/> Nom complet
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Votre nom et prénom"
                      required
                      className="bg-background h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-muted-foreground"/> Téléphone (WhatsApp préféré)
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Ex: 77 123 45 67"
                      required
                      className="bg-background h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-muted-foreground"/> Lieu de livraison
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Quartier, Ville..."
                      required
                      className="bg-background h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm">Quantité</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                      className="bg-background h-11"
                    />
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-semibold shadow-md" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Envoi...
                        </div>
                      ) : (
                        'Confirmer la commande'
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OrderModal;