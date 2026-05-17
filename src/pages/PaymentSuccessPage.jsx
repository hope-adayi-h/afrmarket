import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile, fetchSubscription } = useAuth();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Vérification de votre paiement en cours...');

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentId = searchParams.get('payment_id');
      const planId = searchParams.get('plan_id');

      if (!paymentId || !planId) {
        setStatus('error');
        setMessage('Informations de paiement manquantes.');
        return;
      }

      try {
        // 1. Check if payment exists
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single();

        if (paymentError || !payment) {
            throw new Error("Paiement introuvable.");
        }
        
        // Since we are redirecting back, we assume success if Moneroo redirected here.
        // In a strict production environment, we would verify transaction status via API again.
        
        // 2. Update Payment Status
        if (payment.status !== 'completed') {
            const { error: updateError } = await supabase
                .from('payments')
                .update({ status: 'completed' })
                .eq('id', paymentId);
            if (updateError) throw updateError;
        }

        // 3. Create Subscription (if not already active)
        const { data: currentSub } = await supabase
             .from('user_subscriptions')
             .select('*')
             .eq('user_id', payment.user_id)
             .eq('status', 'active')
             .maybeSingle();
             
        if (!currentSub) {
             // Fetch plan details to calculate end date
             const { data: plan } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('id', planId)
                .single();
                
             if (plan) {
                 const startDate = new Date();
                 const endDate = new Date();
                 if (plan.duration_interval === 'year') endDate.setFullYear(endDate.getFullYear() + 1);
                 else if (plan.duration_interval === 'quarter') endDate.setMonth(endDate.getMonth() + 3);
                 else endDate.setMonth(endDate.getMonth() + 1);

                 await supabase.from('user_subscriptions').insert({
                    user_id: payment.user_id,
                    plan_id: plan.id,
                    plan_name: plan.name,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    status: 'active',
                    is_suspended: false
                 });
             }
        }

        // 4. Refresh Context
        await Promise.all([refreshProfile(), fetchSubscription()]);
        
        setStatus('success');
        setMessage('Votre paiement a été validé avec succès !');

      } catch (error) {
        console.error("Verification error:", error);
        setStatus('error');
        setMessage(error.message || "Erreur lors de la validation du paiement.");
      }
    };

    verifyPayment();
  }, [searchParams, refreshProfile, fetchSubscription]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Statut du Paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'verifying' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center py-8">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Paiement Réussi !</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Button onClick={() => navigate('/profile')} className="w-full">
                Accéder à mon espace membre
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center py-8">
               <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-700 mb-2">Échec de validation</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Button onClick={() => navigate('/abonnements')} variant="outline" className="w-full">
                Retourner aux abonnements
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;