import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Helmet } from 'react-helmet';
import { Package, MapPin, Clock, CheckCircle, ArrowRight, ShoppingBag, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import BackButton from '@/components/BackButton';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { motion } from 'framer-motion';
import ReviewModal from '@/components/ReviewModal';

const OrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [orderToReview, setOrderToReview] = useState(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          listings:listing_id (
            id,
            title,
            price,
            images,
            location
          ),
          profiles:seller_id (
            full_name,
            avatar_url,
            phone
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos commandes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (order) => {
    if (!window.confirm("Avez-vous bien reçu cet article ? Cette action confirmera la vente.")) return;
    
    setProcessingId(order.id);
    try {
      const { error } = await supabase.rpc('confirm_order_receipt', { order_uuid: order.id });
      
      if (error) {
        console.error("RPC Error details:", error);
        throw error;
      }

      toast({
        title: "Réception confirmée ! 🎉",
        description: "Merci pour votre achat. La vente a été validée.",
        duration: 5000,
      });

      // Optimistically update local state
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === order.id ? { ...o, status: 'completed' } : o
        )
      );

      // Open review modal
      setOrderToReview(order);
      setIsReviewModalOpen(true);

    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        title: "Erreur de confirmation",
        description: error.message || "Impossible de valider la réception. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Connectez-vous</h2>
        <p className="text-muted-foreground mb-6">Vous devez être connecté pour voir vos commandes.</p>
        <Button onClick={() => navigate('/')} className="w-full sm:w-auto">Retour à l'accueil</Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mes Commandes - AFRMARKET</title>
      </Helmet>

      <div className="min-h-screen bg-background pb-20 pt-4">
        <div className="container mx-auto px-4 max-w-3xl">
          <BackButton />
          
          <div className="flex items-center gap-3 mt-4 mb-6 md:mt-6 md:mb-8">
            <Package className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Mes Commandes</h1>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-48 bg-card animate-pulse rounded-xl border border-border"></div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-card border border-dashed border-border rounded-2xl px-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Aucune commande</h3>
              <p className="text-muted-foreground mb-6 text-sm md:text-base">Vous n'avez pas encore passé de commande.</p>
              <Button onClick={() => navigate('/')} className="w-full sm:w-auto">Découvrir les annonces</Button>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {orders.map((order) => (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Status Header */}
                  <div className="bg-muted/30 px-4 py-3 border-b border-border flex justify-between items-center text-xs md:text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock size={14} />
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span className={`px-2 py-1 rounded-full font-medium border ${
                      order.status === 'completed' 
                        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                        : 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                    }`}>
                      {order.status === 'completed' ? 'Terminée' : 'En attente'}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <div className="w-full sm:w-24 h-48 sm:h-24 bg-muted rounded-lg overflow-hidden shrink-0 border border-border">
                        <img 
                          src={order.listings?.images?.[0] || 'https://via.placeholder.com/150'} 
                          alt={order.listings?.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Order Details */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="font-bold text-base md:text-lg truncate">{order.listings?.title || 'Annonce supprimée'}</h3>
                        <p className="text-primary font-bold text-lg">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(order.listings?.price || 0)}
                        </p>
                        
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground pt-1">
                          <div className="flex items-center gap-1">
                            <MapPin size={14} /> {order.listings?.location}
                          </div>
                          <div>Vendeur: {order.profiles?.full_name || 'Inconnu'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-4 border-t border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      {order.status === 'completed' ? (
                        <div className="text-sm text-green-600 flex items-center gap-2 py-2 font-medium">
                           <CheckCircle size={18} /> Commande validée
                           {(!orderToReview || orderToReview.id !== order.id) && (
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="ml-2 h-8 text-xs"
                               onClick={() => {
                                 setOrderToReview(order);
                                 setIsReviewModalOpen(true);
                               }}
                             >
                               Laisser un avis
                             </Button>
                           )}
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleConfirmReceipt(order)} 
                          disabled={processingId === order.id}
                          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white h-10 shadow-sm"
                        >
                          {processingId === order.id ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Validation...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <CheckCircle size={16} /> Confirmer réception
                            </span>
                          )}
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(`/listing/${order.listing_id}`)}
                        className="w-full sm:w-auto h-10"
                      >
                        Voir l'annonce <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        <ReviewModal 
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          order={orderToReview}
        />
      </div>
    </>
  );
};

export default OrdersPage;