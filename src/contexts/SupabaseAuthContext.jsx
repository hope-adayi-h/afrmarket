import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);


  // Crée le profil s'il n'existe pas encore (cas des comptes Google :
  // la personne n'est pas passée par le formulaire d'inscription).
  const ensureProfile = useCallback(async (authUser) => {
    const meta = authUser?.user_metadata || {};
    const newProfile = {
      id: authUser.id,
      full_name: meta.full_name || meta.name || (authUser.email ? authUser.email.split('@')[0] : null),
      avatar_url: meta.avatar_url || meta.picture || null,
    };
    const { data, error } = await supabase
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id', ignoreDuplicates: true })
      .select('*')
      .maybeSingle();
    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }
    if (data) return data;
    const { data: existing } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
    return existing;
  }, []);

  const refreshProfile = useCallback(async (userId, authUser) => {
    const id = userId || user?.id;
    if (id) {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (!profileData && authUser) {
        setProfile(await ensureProfile(authUser));
      } else {
        setProfile(profileData);
      }
    }
  }, [user?.id, ensureProfile]);

  const fetchSubscription = useCallback(async (userId) => {
    const id = userId || user?.id;
    if (!id) {
      setSubscription(null);
      return;
    }

    setLoadingSubscription(true);
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', id)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .eq('is_suspended', false)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  }, [user?.id]);

  const handleSession = useCallback(async (currentSession) => {
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);

    try {
      if (currentUser) {
        await Promise.all([
          refreshProfile(currentUser.id, currentUser),
          fetchSubscription(currentUser.id)
        ]);
      } else {
        setProfile(null);
        setSubscription(null);
      }
    } catch (err) {
      console.error('Error loading session data:', err);
    } finally {
      // Toujours arrêter le chargement, même en cas d'erreur.
      setLoading(false);
    }
  }, [refreshProfile, fetchSubscription]);


  // Si Supabase/Google renvoie une erreur dans l'adresse (#error=... ou ?error=...),
  // on l'affiche au lieu d'échouer en silence.
  useEffect(() => {
    try {
      const params = new URLSearchParams(
        (window.location.hash || '').replace(/^#/, '') + '&' + (window.location.search || '').replace(/^\?/, '')
      );
      const errDesc = params.get('error_description') || params.get('error');
      if (errDesc) {
        console.error('OAuth error:', params.get('error'), errDesc);
        toast({
          variant: 'destructive',
          title: 'Connexion Google échouée',
          description: decodeURIComponent(errDesc.replace(/\+/g, ' ')),
          duration: 15000,
        });
      }
    } catch (_) { /* ignore */ }
  }, [toast]);

  useEffect(() => {
    const getSession = async () => {
      try {
        // Retour de Google : la clé de connexion arrive dans l'adresse (#access_token=...).
        // On l'enregistre nous-mêmes si Supabase ne l'a pas fait, puis on nettoie l'adresse.
        const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          const { data: existing } = await supabase.auth.getSession();
          if (!existing?.session) {
            const { error: setErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setErr) console.error('Error setting session from URL:', setErr);
          }
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        await handleSession(currentSession);
      } catch (err) {
        console.error('Error getting session:', err);
        setLoading(false);
      }
    };

    getSession();

    // Important : ne pas appeler Supabase directement (await) dans ce callback.
    // Au retour de Google, Supabase est encore en train d'enregistrer la session ;
    // attendre une autre requête Supabase ici bloque tout (chargement infini).
    // On laisse donc le callback se terminer, puis on traite la session juste après.
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setTimeout(() => { handleSession(newSession); }, 0);
      }
    );

    // Filet de sécurité : jamais plus de 10 s d'écran de chargement.
    const safety = setTimeout(() => setLoading(false), 10000);

    return () => {
      clearTimeout(safety);
      authSubscription.unsubscribe();
    };
  }, [handleSession]);

  const signUp = useCallback(async (options) => {
    const { data, error } = await supabase.auth.signUp(options);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur d'inscription",
        description: error.message || "Quelque chose s'est mal passé",
      });
    }
    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (credentials) => {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: error.message || "Email/téléphone ou mot de passe incorrect.",
      });
    }
    return { data, error };
  }, [toast]);

  const verifyOtp = useCallback(async (options) => {
    const { data, error } = await supabase.auth.verifyOtp(options);
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur de vérification",
        description: error.message || "Code OTP invalide.",
      });
    }
    return { data, error };
  }, [toast]);


  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur de déconnexion",
        description: error.message || "Quelque chose s'est mal passé",
      });
    } else {
      setUser(null);
      setProfile(null);
      setSession(null);
      setSubscription(null);
    }

    return { error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    subscription,
    loading,
    loadingSubscription,
    signUp,
    signIn,
    signOut,
    verifyOtp,
    refreshProfile,
    fetchSubscription
  }), [user, session, profile, subscription, loading, loadingSubscription, signUp, signIn, signOut, verifyOtp, refreshProfile, fetchSubscription]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};