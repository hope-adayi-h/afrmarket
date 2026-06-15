import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Phone, Loader2, ArrowLeft, Smartphone, Eye, EyeOff, PlayCircle, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';

// Apple Icon SVG Component
const AppleIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 384 512"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
  </svg>
);

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [view, setView] = useState('login'); // 'login', 'signup', 'forgot'
  const [signupMethod, setSignupMethod] = useState('email'); // 'email', 'phone'
  const [loading, setLoading] = useState(false);

  // Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Terms acceptance state
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Promo Code Logic
  const [promoCode, setPromoCode] = useState('');
  const [validPromo, setValidPromo] = useState(null); // Stores validated promo object
  const [promoLoading, setPromoLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  });

  // Reset form when view or method changes
  useEffect(() => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      phone: ''
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setTermsAccepted(false);
    setPromoCode('');
    setValidPromo(null);
  }, [view, signupMethod, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setValidPromo(null);

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({ title: 'Code Invalide', description: "Ce code promo n'existe pas ou n'est plus valide.", variant: "destructive" });
      } else {
        // Check expiry
        if (data.expiration_date && new Date(data.expiration_date) < new Date()) {
          toast({ title: 'Code Expiré', description: "Ce code promo est expiré.", variant: "destructive" });
          return;
        }
        // Check usage limit
        if (data.max_usage && data.usage_count >= data.max_usage) {
          toast({ title: 'Limite atteinte', description: "Ce code promo a atteint sa limite d'utilisation.", variant: "destructive" });
          return;
        }

        setValidPromo(data);
        toast({
          title: 'Code Appliqué ! 🎉',
          description: `Réduction de ${data.discount_type === 'percentage' ? data.discount_value + '%' : data.discount_value + ' FCFA'} activée pour votre premier paiement.`
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPromoLoading(false);
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const identifier = formData.email;
    const password = formData.password;
    let result;

    if (identifier.includes('@')) {
      result = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password,
      });
    } else {
      result = await supabase.auth.signInWithPassword({
        phone: identifier,
        password: password,
      });
    }

    setLoading(false);

    if (result.error) {
      toast({ title: 'Erreur de connexion', description: result.error.message, variant: 'destructive' });
    } else {
      onLoginSuccess();
      onClose();
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Erreur de validation", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }

    if (!termsAccepted) {
      toast({ title: "Validation requise", description: "Veuillez accepter les conditions.", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Include promo code ID in metadata if valid
    const options = {
      data: {
        full_name: formData.fullName,
        promo_code_id: validPromo ? validPromo.id : null
      }
    };

    try {
      let result;
      if (signupMethod === 'email') {
        if (!formData.email) throw new Error("Email requis");
        result = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options
        });
      } else {
        if (!formData.phone) throw new Error("Numéro de téléphone requis");
        result = await supabase.auth.signUp({
          phone: formData.phone,
          password: formData.password,
          options
        });
      }

      if (result.error) throw result.error;

      // Si l'inscription ne renvoie pas de session active (confirmation email désactivée
      // mais session non créée automatiquement), on force la connexion
      if (!result.data?.session) {
        const loginCredentials = signupMethod === 'email'
          ? { email: formData.email, password: formData.password }
          : { phone: formData.phone, password: formData.password };

        const { error: signInError } = await supabase.auth.signInWithPassword(loginCredentials);

        if (signInError) {
          toast({
            title: 'Compte créé ✅',
            description: 'Veuillez vous connecter avec vos identifiants.'
          });
          onClose();
          setView('login');
          setLoading(false);
          return;
        }
      }

      toast({
        title: 'Inscription réussie ! 🎉',
        description: 'Bienvenue sur AFRMARKET ! Votre compte est prêt.'
      });
      onClose();
      navigate('/'); // Redirect to home after signup

      const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!formData.email) {
          toast({ title: "Email requis", variant: "destructive" });
          return;
        }
        setLoading(true);

        const redirectTo = window.location.origin + '/update-password';
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, { redirectTo });

        setLoading(false);
        if (error) {
          toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Email envoyé ! 📧', description: 'Vérifiez votre boîte de réception.', duration: 6000 });
        }
      };

      const handleVideoClick = () => {
        onClose();
        navigate('/video-inscription');
      };

      if (!isOpen) return null;

      return (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card text-card-foreground rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative max-h-[90vh] overflow-y-auto"
            >
              <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500 w-full absolute top-0 left-0" />

              <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent"><X size={20} /></button>

              <div className="p-8 pt-10">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold mb-2">
                    {view === 'login' && <span>Bon retour !</span>}
                    {view === 'signup' && <span>Créer un compte</span>}
                    {view === 'forgot' && <span>Mot de passe oublié ?</span>}
                  </h2>
                  <p className="text-muted-foreground">
                    {view === 'login' && <span>Connectez-vous pour gérer vos annonces</span>}
                    {view === 'signup' && <span>Rejoignez la communauté AFRMARKET</span>}
                    {view === 'forgot' && <span>Entrez votre email pour réinitialiser</span>}
                  </p>
                </div>

                {view === 'forgot' ? (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                          placeholder="votre@email.com"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-orange-500 text-white py-6 rounded-xl text-lg" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : "Envoyer le lien"}
                    </Button>
                    <div className="text-center mt-4">
                      <button type="button" onClick={() => setView('login')} className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mx-auto">
                        <ArrowLeft size={14} /> Retour à la connexion
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <form onSubmit={view === 'login' ? handleLogin : handleSignup} className="space-y-4">

                      {view === 'signup' && (
                        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-xl mb-4">
                          <button type="button" onClick={() => setSignupMethod('email')} className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${signupMethod === 'email' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Mail size={16} /> Email</button>
                          <button type="button" onClick={() => setSignupMethod('phone')} className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${signupMethod === 'phone' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Smartphone size={16} /> Téléphone</button>
                        </div>
                      )}

                      {view === 'signup' && (
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Nom complet</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                            <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="John Doe" />
                          </div>
                        </div>
                      )}

                      {view === 'signup' ? (
                        signupMethod === 'email' ? (
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Email</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="votre@email.com" />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Téléphone</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                              <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="+221 77 000 00 00" />
                            </div>
                          </div>
                        )
                      ) : (
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Email ou Téléphone</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                            <input type="text" name="email" required value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Email ou téléphone" />
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-sm font-medium">Mot de passe</label>
                          {view === 'login' && <button type="button" onClick={() => setView('forgot')} className="text-xs text-orange-500 font-medium">Oublié ?</button>}
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                          <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} className="w-full pl-10 pr-10 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="••••••••" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"><Eye size={18} /></button>
                        </div>
                      </div>

                      {view === 'signup' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Confirmer le mot de passe</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                              <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full pl-10 pr-10 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="••••••••" />
                              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"><Eye size={18} /></button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-sm font-medium mb-1.5">Code Promo (Optionnel)</label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                  type="text"
                                  value={promoCode}
                                  onChange={(e) => { setPromoCode(e.target.value); setValidPromo(null); }}
                                  className={`w-full pl-10 pr-4 py-3 bg-background border rounded-xl outline-none uppercase ${validPromo ? 'border-green-500 ring-1 ring-green-500' : 'border-input focus:ring-2 focus:ring-orange-500'}`}
                                  placeholder="CODE"
                                  disabled={!!validPromo}
                                />
                              </div>
                              {validPromo ? (
                                <Button type="button" variant="ghost" onClick={() => { setValidPromo(null); setPromoCode(''); }} className="text-red-500">
                                  <X size={18} />
                                </Button>
                              ) : (
                                <Button type="button" onClick={handleValidatePromo} disabled={!promoCode || promoLoading} variant="secondary">
                                  {promoLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Appliquer'}
                                </Button>
                              )}
                            </div>
                            {validPromo && <p className="text-xs text-green-600 font-medium">Code activé : -{validPromo.discount_type === 'percentage' ? validPromo.discount_value + '%' : validPromo.discount_value + ' FCFA'}</p>}
                          </div>

                          <div className="flex items-start space-x-2 py-2">
                            <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-input text-orange-600 focus:ring-orange-500" />
                            <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">J'accepte les <a href="/conditions" className="text-orange-500 hover:underline">Conditions d'utilisation</a></label>
                          </div>
                        </>
                      )}

                      <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 text-white py-6 rounded-xl text-lg font-semibold shadow-lg" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <span>{view === 'login' ? 'Se connecter' : "S'inscrire"}</span>}
                      </Button>
                    </form>

                    {view === 'signup' && (
                      <Button type="button" variant="outline" onClick={handleVideoClick} className="w-full border-primary/20 hover:bg-primary/5 text-primary">
                        <PlayCircle className="mr-2 h-4 w-4" /> Voir la vidéo d'inscription
                      </Button>
                    )}

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                      <div className="relative flex justify-center text-sm"><span className="px-2 bg-card text-muted-foreground">Ou continuez avec</span></div>
                    </div>

                    {/* Simplified Apple Login Mock */}
                    <Button type="button" disabled variant="outline" className="w-full h-12 rounded-xl font-medium flex items-center justify-center gap-3">
                      <AppleIcon className="h-5 w-5" /> Continuer avec Apple (Bientôt)
                    </Button>

                    <p className="text-center text-sm text-muted-foreground pt-2">
                      <span>{view === 'login' ? "Pas encore de compte ?" : "Déjà un compte ?"}</span>
                      <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="ml-1 text-orange-500 font-semibold hover:underline">
                        <span>{view === 'login' ? "S'inscrire gratuitement" : "Se connecter"}</span>
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      );
    };

    export default AuthModal;