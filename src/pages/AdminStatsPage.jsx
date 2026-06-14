import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Users, List, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { subDays, format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

const AdminStatsPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    pendingListings: 0,
    approvedListings: 0,
    rejectedListings: 0,
    totalViews: 0,
    last7DaysUsers: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [usersResult, listingsResult] = await Promise.all([
        supabase.from('profiles').select('id, updated_at', { count: 'exact' }),
        supabase.from('listings').select('status, views, created_at', { count: 'exact' }),
      ]);

      const users = usersResult.data || [];
      const listings = listingsResult.data || [];

      // Last 7 days user registrations
      const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
      const last7DaysUsers = last7Days.map((date) => {
        const dayStart = startOfDay(date);
        return {
          date: format(date, 'dd MMM', { locale: fr }),
          count: users.filter((u) => {
            const userDate = startOfDay(new Date(u.updated_at));
            return userDate.getTime() === dayStart.getTime();
          }).length,
        };
      });

      setStats({
        totalUsers: usersResult.count || 0,
        totalListings: listingsResult.count || 0,
        pendingListings: listings.filter((l) => l.status === 'pending').length,
        approvedListings: listings.filter((l) => l.status === 'approved').length,
        rejectedListings: listings.filter((l) => l.status === 'rejected').length,
        totalViews: listings.reduce((sum, l) => sum + (l.views || 0), 0),
        last7DaysUsers,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchStats();
    
    const channel = supabase.channel('stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  const maxUserCount = Math.max(...stats.last7DaysUsers.map((d) => d.count), 1);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin - Statistiques</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistiques et Analyses</h1>
          <p className="text-muted-foreground">Vue détaillée de l'activité de la plateforme</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Tous les utilisateurs inscrits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Annonces</CardTitle>
              <List className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalListings}</div>
              <p className="text-xs text-muted-foreground">Toutes les annonces soumises</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vues Totales</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
              <p className="text-xs text-muted-foreground">Toutes les vues d'annonces</p>
            </CardContent>
          </Card>
        </div>

        {/* Listings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Annonces par Statut</CardTitle>
            <CardDescription>Distribution des annonces selon leur état de validation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium">En Attente</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-full md:w-64 bg-muted rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${stats.totalListings > 0 ? (stats.pendingListings / stats.totalListings) * 100 : 0}%`,
                      }}
                      transition={{ duration: 1 }}
                      className="bg-yellow-500 h-2 rounded-full"
                    />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">{stats.pendingListings}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Approuvées</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-full md:w-64 bg-muted rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${stats.totalListings > 0 ? (stats.approvedListings / stats.totalListings) * 100 : 0}%`,
                      }}
                      transition={{ duration: 1 }}
                      className="bg-green-500 h-2 rounded-full"
                    />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">{stats.approvedListings}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">Rejetées</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-full md:w-64 bg-muted rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${stats.totalListings > 0 ? (stats.rejectedListings / stats.totalListings) * 100 : 0}%`,
                      }}
                      transition={{ duration: 1 }}
                      className="bg-red-500 h-2 rounded-full"
                    />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">{stats.rejectedListings}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Users Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Nouveaux Utilisateurs (7 derniers jours)</CardTitle>
            <CardDescription>Évolution des inscriptions sur la dernière semaine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {stats.last7DaysUsers.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: `${(day.count / maxUserCount) * 100}%`, opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="w-3/4 bg-primary rounded-t-md min-h-[4px] relative group"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded px-2 py-1 text-xs font-bold whitespace-nowrap">
                      {day.count} inscription{day.count > 1 ? 's' : ''}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-muted-foreground">
              {stats.last7DaysUsers.map((day, index) => (
                <div key={index} className="flex-1 text-center">
                  {day.date}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminStatsPage;