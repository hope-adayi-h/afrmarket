import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Inbox, Send, AlertTriangle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AnimatePresence, motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MessagesPage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const markMessagesAsRead = useCallback(async (messagesToMark) => {
    if (!user || messagesToMark.length === 0) return;

    try {
      const directMessages = messagesToMark.filter(m => !m.is_broadcast).map(m => m.id);
      const broadcastMessages = messagesToMark.filter(m => m.is_broadcast).map(m => ({ message_id: m.id, user_id: user.id }));

      const promises = [];

      if (directMessages.length > 0) {
        promises.push(
          supabase.from('admin_messages').update({ is_read: true }).in('id', directMessages)
        );
      }
      if (broadcastMessages.length > 0) {
        promises.push(
          supabase.from('admin_message_read_statuses').upsert(broadcastMessages, { onConflict: 'message_id,user_id' })
        );
      }

      const results = await Promise.all(promises);
      results.forEach(res => {
        if (res.error) throw res.error;
      });

    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_my_admin_messages');
      if (error) throw error;
      
      setMessages(data || []);

      const unreadMessages = data.filter(m => !m.is_read);
      if (unreadMessages.length > 0) {
        await markMessagesAsRead(unreadMessages);
      }

    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les messages.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast, markMessagesAsRead]);

  useEffect(() => {
    if (!user) {
        setTimeout(() => navigate('/'), 3000);
    } else {
        fetchMessages();
    }
  }, [user, navigate, fetchMessages]);
  
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('messages-page-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, 
        (payload) => {
           // Simple refetch on any new admin message
           fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMessages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Accès non autorisé</h1>
        <p className="mt-2 text-muted-foreground">Vous devez être connecté pour voir cette page. Redirection...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mes Messages - AFRMARKET</title>
        <meta name="description" content="Consultez les messages et notifications de l'équipe administrative d'AFRMARKET." />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div >
            <h1 className="text-3xl font-bold tracking-tight">Boîte de réception</h1>
            <p className="text-muted-foreground">Messages et notifications de l'équipe AFRMARKET.</p>
          </div>
          <Button onClick={() => navigate('/profile')}>Mon Profil</Button>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed rounded-lg">
            <Inbox className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-2xl font-semibold">Votre boîte de réception est vide</h3>
            <p className="mt-2 text-md text-muted-foreground">Les nouveaux messages des administrateurs apparaîtront ici.</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                <AnimatePresence initial={false}>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <AccordionItem value={msg.id}>
                        <AccordionTrigger className={cn("p-4 hover:no-underline transition-colors hover:bg-muted/50", !msg.is_read && "font-bold")}>
                          <div className="flex items-center gap-4 flex-1">
                            <div className={cn("h-2.5 w-2.5 rounded-full transition-all", msg.is_read ? 'bg-transparent' : 'bg-primary')}></div>
                            <div className="flex-shrink-0">
                              {msg.is_broadcast ? <Users className="h-5 w-5 text-purple-500" /> : <Send className="h-5 w-5 text-blue-500" />}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="truncate">{msg.subject}</p>
                              <p className={cn("text-xs text-muted-foreground font-normal truncate", !msg.is_read && "text-foreground/80")}>
                                De: {msg.admin_name || 'Administration'} {msg.is_broadcast && "(Annonce générale)"}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground font-normal ml-auto whitespace-nowrap hidden sm:block">
                              {formatDistanceToNow(new Date(msg.created_at), { locale: fr, addSuffix: true })}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 bg-muted/30 border-t">
                           <div className="prose prose-sm dark:prose-invert max-w-none">
                              <p className="text-xs text-muted-foreground mb-4">Reçu le {format(new Date(msg.created_at), 'd MMMM yyyy à HH:mm', { locale: fr })}</p>
                              <p>{msg.message_content}</p>
                           </div>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default MessagesPage;