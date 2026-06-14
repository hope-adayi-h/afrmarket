import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, Tag, Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const PaymentModal = ({ isOpen, onClose, plan, user }) => {
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);

  const [promoCode, setPromoCode] = useState('');
  const [validPromo, setValidPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPromoCode('');
      setValidPromo(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;

    setPromoLoading(true);
    setPromoError('');

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        setPromoError("Code invalide");
      } else {
        setValidPromo(data);
        toast({ title: "OK", description: "Code promo appliqué" });
      }
    } catch {
      setPromoError("Erreur validation");
    } finally {
      setPromoLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!plan) return 0;

    let total = plan.price;

    if (validPromo) {
      if (validPromo.discount_type === 'percentage') {
        total -= total * (validPromo.discount_value / 100);
      } else {
        total -= validPromo.discount_value;
      }
    }

    return Math.max(0, total);
  };

  const handleInitiatePayment = async () => {
    if (!user?.id) return;

    setIsProcessing(true);

    try {
      const finalAmount = calculateTotal();

      console.log("SENDING:", {
        amount: finalAmount,
        user_id: user.id,
      });

      const res = await fetch(
  "https://vnvhahkfqlnodbnbtjam.supabase.co/functions/v1/process-payment",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudmhhaGtmcWxub2RibmJ0amFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTgxODYsImV4cCI6MjA5MjUzNDE4Nn0.5BplOK5gSqDQTpsIHsEukVyVr7z42Thjo-jhN47-VIM",
      Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudmhhaGtmcWxub2RibmJ0amFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTgxODYsImV4cCI6MjA5MjUzNDE4Nn0.5BplOK5gSqDQTpsIHsEukVyVr7z42Thjo-jhN47-VIM",
    },
    body: JSON.stringify({
      amount: finalAmount,
      user_id: user.id,
    }),
  }
);

const data = await res.json();
console.log("RESPONSE:", data);

      if (!data?.checkout_url) {
        throw new Error("Lien de paiement introuvable");
      }

      window.location.href = data.checkout_url;

    } catch (err) {
      console.log("ERROR:", err);

      setIsProcessing(false);

      toast({
        title: "Paiement échoué",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">

        <DialogHeader>
          <DialogTitle>Abonnement Premium</DialogTitle>
          <DialogDescription>
            Vérifiez et confirmez votre paiement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">

          {/* PLAN */}
          <div className="p-4 rounded-xl border flex justify-between">
            <div>
              <p className="font-bold">{plan.name}</p>
              <p className="text-sm text-gray-500">
                {plan.duration_interval === 'month' ? 'Mensuel' : 'Annuel'}
              </p>
            </div>

            <p className="font-bold text-xl text-primary">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF'
              }).format(calculateTotal())}
            </p>
          </div>

          {/* PROMO */}
          <div className="space-y-2">
            <Label>Code promo</Label>

            <div className="flex gap-2">
              <Input
                placeholder="CODE"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={isProcessing}
              />

              <Button
                onClick={handleValidatePromo}
                disabled={!promoCode || promoLoading}
              >
                {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "OK"}
              </Button>
            </div>

            {validPromo && (
              <p className="text-green-600 text-xs flex items-center gap-1">
                <CheckCircle size={12} /> Code appliqué
              </p>
            )}

            {promoError && (
              <p className="text-red-500 text-xs">{promoError}</p>
            )}
          </div>

          {/* BUTTON PAY */}
          <Button
            onClick={handleInitiatePayment}
            disabled={isProcessing}
            className="w-full py-6 text-lg font-bold"
          >
            {isProcessing ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <>
                Payer{' '}
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF'
                }).format(calculateTotal())}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500 flex justify-center gap-1">
            <Lock size={10} /> Paiement sécurisé
          </p>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;