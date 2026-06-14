import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Users, List, TrendingUp, Eye, Bell, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    pendingListings: 0,
    totalViews: 0,
    unreadNotifications: 0,
  });
  const [recentListings, setRecentListings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [usersResult, listingsResult, notificationsResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('listings').select('*, profiles:user_id(full_name)', { count: 'exact' }),
        supabase.from('admin_notifications').select('*', { count: 'exact' }).eq('is_read', false),
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalListings: listingsResult.count || 0,
        pendingListings: listingsResult.data?.filter(l => l.status === 'pending').length || 0,
        totalViews: listingsResult.data?.reduce((sum, l) => sum + (l.views || 0), 0) || 0,
        unreadNotifications: notificationsResult.count || 0,
      });

      setRecentListings(listingsResult.data?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5) || []);
      setRecentUsers(usersResult.data?.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 5) || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase.channel('dashboard-realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, fetchDashboardData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`cursor-pointer ${onClick ? 'hover:shadow-lg' : ''}`}
      onClick={onClick}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? '...' : value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - AFRMARKET</title>
      </Helmet>

      <div className="space-y-6">
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="bg-gradient-to-br from-primary/90 to-orange-500/90 text-primary-foreground overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between p-6">
                    <div className="space-y-2 mb-4 md:mb-0">
                        <h1 className="text-3xl font-bold tracking-tight">Bonjour, {profile?.full_name || 'Admin'} !</h1>
                        <p className="text-primary-foreground/80">Voici un aperçu de l'activité sur votre plateforme.</p>
                    </div>
                    <div className="flex gap-4">
                        <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center justify-center bg-black/10 p-4 rounded-lg cursor-pointer min-w-[120px]" onClick={() => navigate('/administrateur/annonces')}>
                             <Clock className="h-6 w-6 mb-1" />
                             <span className="text-2xl font-bold">{stats.pendingListings}</span>
                             <span className="text-xs font-medium">En attente</span>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center justify-center bg-black/10 p-4 rounded-lg cursor-pointer min-w-[120px]" onClick={() => navigate('/administrateur/notifications')}>
                             <Bell className="h-6 w-6 mb-1" />
                             <span className="text-2xl font-bold">{stats.unreadNotifications}</span>
                             <span className="text-xs font-medium">Non lues</span>
                        </motion.div>
                    </div>
                </div>
            </Card>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Utilisateurs" value={stats.totalUsers} icon={Users} color="bg-blue-500" onClick={() => navigate('/administrateur/utilisateurs')} />
          <StatCard title="Total Annonces" value={stats.totalListings} icon={List} color="bg-green-500" onClick={() => navigate('/administrateur/annonces')} />
          <StatCard title="Vues Totales" value={stats.totalViews} icon={Eye} color="bg-purple-500" />
          <StatCard title="En Attente" value={stats.pendingListings} icon={TrendingUp} color="bg-yellow-500" onClick={() => navigate('/administrateur/annonces')} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Annonces Récentes</CardTitle>
                <CardDescription>Les 5 dernières annonces soumises.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/administrateur/annonces')}>
                Voir tout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <AnimatePresence>
                  {loading ? <p className="text-sm text-muted-foreground">Chargement...</p> : 
                   recentListings.length === 0 ? <p className="text-sm text-muted-foreground">Aucune annonce récente.</p> :
                   recentListings.map((listing) => (
                    <motion.div
                      key={listing.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center justify-between border-b py-3 last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{listing.title}</p>
                        <p className="text-xs text-muted-foreground">Par {listing.profiles?.full_name || 'Inconnu'}</p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                         <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: fr })}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          <Card>
             <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Nouveaux Utilisateurs</CardTitle>
                <CardDescription>Les 5 derniers inscrits.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/administrateur/utilisateurs')}>
                Voir tout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <AnimatePresence>
                {loading ? <p className="text-sm text-muted-foreground">Chargement...</p> : 
                 recentUsers.length === 0 ? <p className="text-sm text-muted-foreground">Aucun utilisateur récent.</p> :
                 recentUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center space-x-3 border-b py-3 last:border-0 p-2"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.full_name || 'Utilisateur'}</p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(user.updated_at), { addSuffix: true, locale: fr })}</p>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;