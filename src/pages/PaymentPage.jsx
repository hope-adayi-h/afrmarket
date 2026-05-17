import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export default function PaymentPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const state = location.state || {};
  const amount = state.amount || 15000;
  const description = state.description || "Abonnement AfterMarket Premium";

  const handlePayment = async () => {
    setErrorMessage('');
    
    if (!user) {
      const msg = "Veuillez vous connecter pour procéder au paiement.";
      setErrorMessage(msg);
      toast({ title: "Connexion requise", description: msg, variant: "destructive" });
      navigate('/?action=login');
      return;
    }

    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error("Authentification invalide ou session expirée. Veuillez vous reconnecter.");
      }

      const endpoint = "https://fcllwzixxgishrdrfcee.supabase.co/functions/v1/process-payment";
      const payload = {
        amount: Number(amount),
        user_id: user.id,
        payment_method: "wave"
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status}): Impossible d'initialiser le paiement.`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error("Réponse invalide du serveur de paiement.");
      }

      const payment_url = data?.payment_url || data?.url || data?.data?.payment_url || data?.data?.checkout_url;

      if (!payment_url) {
        throw new Error("URL de paiement introuvable.");
      }

      window.location.assign(payment_url);
      return;

    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutMsg = "Le serveur met trop de temps à répondre. Veuillez réessayer.";
        setErrorMessage(timeoutMsg);
        toast({ title: "Délai d'attente dépassé", description: timeoutMsg, variant: "destructive" });
      } else {
        setErrorMessage(err.message || "Une erreur est survenue lors du traitement.");
        toast({ title: "Échec du paiement", description: err.message || "Impossible de traiter la demande.", variant: "destructive" });
      }
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Vérification de l'authentification...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-accent flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              AfterMarket
            </span>
          </div>
        </div>

        <Card className="border-0 shadow-2xl shadow-primary/5 bg-card/95 backdrop-blur-xl overflow-hidden rounded-3xl">
          <CardHeader className="text-center pb-8 pt-10 px-6">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-3">
              Montant à payer
            </CardTitle>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl md:text-6xl font-black tracking-tighter text-foreground">
                {Number(amount).toLocaleString('fr-FR')}
              </span>
              <span className="text-2xl font-bold text-muted-foreground">XOF</span>
            </div>
            <CardDescription className="text-base font-medium mt-4 text-foreground/80 px-4">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 px-6">
            <div className="rounded-2xl bg-secondary/5 p-5 border border-secondary/10">
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-muted-foreground font-medium">Méthode de paiement</span>
                <span className="font-semibold text-foreground flex items-center gap-2">
                  GeniusPay
                </span>
              </div>
              <div className="h-px bg-border/50 my-4"></div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Frais de service</span>
                <span className="font-semibold text-foreground">Inclus</span>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-5 pb-10 px-6">
            <Button 
              className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-300"
              size="lg"
              onClick={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Redirection...</span>
                </div>
              ) : (
                "Payer maintenant"
              )}
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-muted-foreground bg-muted/50 py-2 px-4 rounded-full w-max mx-auto">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium">Paiement sécurisé par GeniusPay</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}