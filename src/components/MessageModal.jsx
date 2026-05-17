import React, { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MessageModal = ({ isOpen, onClose, currentUser, recipient }) => {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Guest State
  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setMessage('');
      if (!currentUser) {
        setGuestName('');
        setGuestContact('');
      }
    }
  }, [isOpen, currentUser]);

  const getOrCreateGuestId = () => {
    let id = localStorage.getItem('afrmarket_guest_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('afrmarket_guest_id', id);
    }
    return id;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    if (!currentUser && (!guestName.trim() || !guestContact.trim())) {
      toast({ title: "Champs requis", description: "Merci de renseigner votre nom et contact pour que le vendeur puisse vous répondre.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const messageData = {
        receiver_id: recipient.id,
        content: message,
        is_read: false,
        created_at: new Date().toISOString()
      };

      if (currentUser) {
        messageData.sender_id = currentUser.id;
      } else {
        // Handle Guest
        const guestId = getOrCreateGuestId();
        messageData.sender_guest_id = guestId;
        // Prepend guest info to message content for the seller
        messageData.content = `[VISITEUR: ${guestName} - ${guestContact}]\n\n${message}`;
      }

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;

      toast({ title: "Message envoyé ! 📨", description: "Le destinataire vous répondra bientôt." });
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: "Erreur", description: "Impossible d'envoyer le message.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !recipient) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-4 border-b flex justify-between items-center bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {recipient.avatarUrl ? <img src={recipient.avatarUrl} alt={recipient.name} className="w-full h-full object-cover rounded-full" /> : recipient.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-bold leading-none">{recipient.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">Répond généralement dans l'heure</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {!currentUser && (
              <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                <p className="font-semibold mb-2">Mode Visiteur</p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="guestName" className="text-blue-800">Votre Nom</Label>
                    <Input id="guestName" value={guestName} onChange={e => setGuestName(e.target.value)} className="bg-white border-blue-200" placeholder="Ex: Moussa Diop" />
                  </div>
                  <div>
                    <Label htmlFor="guestContact" className="text-blue-800">Contact (Tel/Email)</Label>
                    <Input id="guestContact" value={guestContact} onChange={e => setGuestContact(e.target.value)} className="bg-white border-blue-200" placeholder="Pour vous répondre" />
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full min-h-[150px] p-3 rounded-xl border border-input bg-background resize-none focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder={`Bonjour ${recipient.name}, je suis intéressé par...`}
                  required
                />
              </div>
              <Button type="submit" className="w-full py-6 text-lg font-semibold rounded-xl shadow-lg" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-5 w-5" />}
                Envoyer
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MessageModal;