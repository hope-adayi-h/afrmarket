import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Bell, Loader2, Trash2, UserPlus, FilePlus, CheckCircle, XCircle, FileMinus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const NOTIFICATION_ICONS = {
  new_user: <UserPlus className="h-5 w-5 text-blue-500" />,
  new_listing: <FilePlus className="h-5 w-5 text-green-500" />,
  listing_approved: <CheckCircle className="h-5 w-5 text-green-500" />,
  listing_rejected: <XCircle className="h-5 w-5 text-red-500" />,
  listing_deleted: <FileMinus className="h-5 w-5 text-gray-500" />,
  new_user_message: <MessageSquare className="h-5 w-5 text-purple-500" />,
};

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data);
    } catch (error) {
      toast({
        title: "Erreur de chargement",
        description: "Impossible de récupérer les notifications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('public:notifications:admin-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, 
        (payload) => {
          fetchNotifications();
        }
      )
      .subscribe();
    
    // Mark all as read on page load
    const markAllAsRead = async () => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('is_read', false);
    };
    markAllAsRead();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const handleDelete = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la notification.",
        variant: "destructive",
      });
      fetchNotifications(); // Refetch to restore UI consistency
    }
  };
  
  const handleNavigate = async (notification) => {
    if (!notification.is_read) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
    }
    if (notification.target_url) {
      navigate(notification.target_url);
    }
  }

  const handleClearAll = async () => {
    const idsToDelete = notifications.map(n => n.id);
    setNotifications([]);
    const { error } = await supabase.from('notifications').delete().in('id', idsToDelete);
    if (error) {
        toast({ title: "Erreur", description: "Impossible de vider les notifications.", variant: "destructive" });
        fetchNotifications();
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin - Notifications</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            {notifications.length > 0 && (
                <Button variant="outline" onClick={handleClearAll}>
                    <Trash2 className="mr-2 h-4 w-4" /> Tout effacer
                </Button>
            )}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
        ) : notifications.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                <AnimatePresence>
                  {notifications.map((notification, index) => (
                    <motion.li
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`flex items-start gap-4 p-4 transition-colors ${!notification.is_read ? 'bg-primary/10' : ''} ${notification.target_url ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                      onClick={() => handleNavigate(notification)}
                    >
                      <div className="mt-1">
                        {NOTIFICATION_ICONS[notification.type] || <Bell className="h-5 w-5 text-gray-400" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                      </Button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-semibold">Aucune notification</h3>
            <p className="mt-1 text-sm text-muted-foreground">Les nouvelles notifications apparaîtront ici.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminNotificationsPage;