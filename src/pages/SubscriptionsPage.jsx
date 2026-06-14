import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabaseClient';
import { Check, Crown, Loader2, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PaymentModal from '@/components/PaymentModal';

const SubscriptionsPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
    
    // Realtime subscription for plans
    const channel = supabase
      .channel('public:subscription_plans')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_plans' }, (payload) => {
         fetchPlans();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan) => {
    if (!user) {
      // If not logged in, redirect to login modal via query param
      navigate('/?action=login'); 
    } else {
      setSelectedPlan(plan);
      setIsPaymentModalOpen(true);
    }
  };

  const getDurationLabel = (val) => {
    const map = { 'month': 'mois', 'quarter': 'trimestre', 'year': 'an' };
    return map[val] || val;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <>
      <Helmet>
        <title>Nos Offres d'Abonnement - AFRMARKET</title>
        <meta name="description" content="Découvrez nos plans d'abonnement pour booster vos ventes sur AFRMARKET." />
      </Helmet>
      
      <div className="min-h-screen bg-background py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Boostez vos ventes avec nos offres <span className="text-primary">Premium</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Choisissez le plan adapté à vos besoins pour maximiser votre visibilité et accélérer vos transactions.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
              <Crown className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold">Aucun plan disponible pour le moment</h3>
              <p className="text-muted-foreground">Revenez plus tard pour découvrir nos nouvelles offres.</p>
            </div>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
            >
              {plans.map((plan, index) => {
                const isPopular = index === 1; // Assuming the second plan is "popular" for UI variety
                return (
                  <motion.div key={plan.id} variants={item} className="flex">
                     <Card className={`flex flex-col w-full relative overflow-hidden transition-all duration-300 hover:shadow-xl ${isPopular ? 'border-primary shadow-lg scale-105 z-10' : 'hover:-translate-y-1'}`}>
                        {isPopular && (
                          <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-20">
                            POPULAIRE
                          </div>
                        )}
                        <CardHeader className="pb-8">
                           <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                              {index === 0 ? <Star className="w-6 h-6" /> : <Crown className="w-6 h-6" />}
                           </div>
                           <CardTitle className="text-2xl">{plan.name}</CardTitle>
                           <CardDescription className="flex items-baseline gap-1 mt-2">
                              <span className="text-3xl font-bold text-foreground">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(plan.price)}
                              </span>
                              <span className="text-muted-foreground">/ {getDurationLabel(plan.duration_interval)}</span>
                           </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                           <ul className="space-y-3">
                              {Array.isArray(plan.features) && plan.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm">
                                   <div className="mt-0.5 rounded-full bg-green-100 text-green-600 p-0.5 shrink-0">
                                      <Check className="h-3 w-3" />
                                   </div>
                                   <span className="text-muted-foreground">{feature}</span>
                                </li>
                              ))}
                           </ul>
                        </CardContent>
                        <CardFooter className="pt-8">
                           <Button 
                             onClick={() => handleSubscribe(plan)} 
                             className={`w-full h-12 text-base ${isPopular ? 'bg-primary hover:bg-primary/90' : ''}`} 
                             variant={isPopular ? 'default' : 'outline'}
                           >
                             {user ? "Choisir ce plan" : "S'inscrire pour choisir"}
                             <ArrowRight className="ml-2 h-4 w-4" />
                           </Button>
                        </CardFooter>
                     </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
        
        <PaymentModal 
          isOpen={isPaymentModalOpen} 
          onClose={() => { setIsPaymentModalOpen(false); setSelectedPlan(null); }} 
          plan={selectedPlan}
          user={user}
        />
      </div>
    </>
  );
};

export default SubscriptionsPage;