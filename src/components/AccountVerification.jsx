import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Shield, UploadCloud, FileType, Loader2, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getVerificationStatus } from '@/lib/verificationUtils';

export default function AccountVerification({ user }) {
  const { toast } = useToast();
  const [status, setStatus] = useState('unverified');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user]);

  const loadStatus = async () => {
    const data = await getVerificationStatus(user.id);
    setStatus(data.status);
    if (data.admin_notes) setAdminNotes(data.admin_notes);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(selectedFile.type)) {
      toast({ title: "Format invalide", description: "Seuls PDF, JPG et PNG sont acceptés.", variant: "destructive" });
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "Max 5 Mo.", variant: "destructive" });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: existing } = await supabase
        .from('account_verification')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('account_verification')
          .update({ document_url: fileName, status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('account_verification')
          .insert({ user_id: user.id, document_url: fileName, status: 'pending' });
        if (error) throw error;
      }

      toast({ title: "Document uploadé", description: "En attente de validation..." });
      setStatus('pending');
      setIsModalOpen(false);
      setFile(null);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'envoyer le document.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = async () => {
    try {
      const { data: existing } = await supabase
        .from('account_verification')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('account_verification')
          .update({ verification_skipped: true })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('account_verification')
          .insert({ user_id: user.id, status: 'unverified', verification_skipped: true });
      }
      toast({ title: "Vérification reportée", description: "Vous pourrez vérifier votre compte plus tard." });
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'approved':
        return { icon: <CheckCircle className="h-5 w-5" />, text: "✔ Vérifié", className: "badge-verified px-3 py-1 rounded-full flex items-center gap-2 font-medium" };
      case 'pending':
        return { icon: <Clock className="h-5 w-5" />, text: "⏳ En attente", className: "badge-pending px-3 py-1 rounded-full flex items-center gap-2 font-medium" };
      case 'rejected':
        return { icon: <XCircle className="h-5 w-5" />, text: "✗ Rejeté", className: "badge-rejected px-3 py-1 rounded-full flex items-center gap-2 font-medium" };
      default:
        return { icon: <AlertCircle className="h-5 w-5" />, text: "○ Non vérifié", className: "badge-unverified px-3 py-1 rounded-full flex items-center gap-2 font-medium" };
    }
  };

  const display = getStatusDisplay();

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Vérification du compte
              </CardTitle>
              <CardDescription className="mt-1">
                Sécurisez votre compte et débloquez toutes les fonctionnalités.
              </CardDescription>
            </div>
            <div className={display.className}>
              {display.text}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {status === 'rejected' && adminNotes && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
              <strong>Motif du rejet:</strong> {adminNotes}
            </div>
          )}

          {status !== 'approved' && status !== 'pending' && (
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Button onClick={() => setIsModalOpen(true)}>Vérifier mon compte</Button>
              <Button variant="outline" onClick={handleSkip}>Faire plus tard</Button>
            </div>
          )}
          {status === 'pending' && (
            <p className="text-sm text-muted-foreground mt-2">Votre document est en cours d'analyse par notre équipe.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Soumettre un document d'identité</DialogTitle>
            <DialogDescription>
              Veuillez fournir une pièce d'identité valide (Carte nationale, passeport).
            </DialogDescription>
          </DialogHeader>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/10 transition-colors mt-4">
            <input
              type="file"
              id="verification-upload"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <label htmlFor="verification-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-3">
              <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <FileType className="h-7 w-7" />
              </div>
              <span className="font-medium">
                {file ? file.name : "Cliquez pour sélectionner un fichier"}
              </span>
              <span className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 5MB)</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</> : "Envoyer le document"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}