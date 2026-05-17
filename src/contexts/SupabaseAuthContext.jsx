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


  const refreshProfile = useCallback(async (userId) => {
    const id = userId || user?.id;
    if (id) {
       const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(profileData);
      }
    }
  }, [user?.id]);

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

    if (currentUser) {
      await Promise.all([
        refreshProfile(currentUser.id),
        fetchSubscription(currentUser.id)
      ]);
    } else {
      setProfile(null);
      setSubscription(null);
    }
    
    setLoading(false);
  }, [refreshProfile, fetchSubscription]);


  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      await handleSession(currentSession);
    };

    getSession();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        await handleSession(newSession);
      }
    );

    return () => authSubscription.unsubscribe();
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

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};