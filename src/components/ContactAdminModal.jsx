import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';

const ContactAdminModal = ({ isOpen, onClose, user }) => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez renseigner un sujet et un message.",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour envoyer un message.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.from('user_messages').insert({
        user_id: user.id,
        subject: subject,
        message_content: content,
      });

      if (error) throw error;

      toast({
        title: "Message envoyé ! 📬",
        description: "L'équipe administrative a bien reçu votre message et vous répondra bientôt.",
      });
      setSubject('');
      setContent('');
      onClose();
    } catch (error) {
      console.error('Error sending message to admin:', error);
      toast({
        title: "Erreur d'envoi",
        description: "Votre message n'a pas pu être envoyé. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Contacter l'Administration</DialogTitle>
          <DialogDescription>
            Posez une question ou signalez un problème. Notre équipe vous répondra dans les meilleurs délais.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSend}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Sujet
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="col-span-3"
                placeholder="Ex: Problème de connexion"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="content" className="text-right pt-2">
                Message
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="col-span-3 min-h-[120px]"
                placeholder="Décrivez votre demande en détail ici..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Envoyer le Message
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactAdminModal;