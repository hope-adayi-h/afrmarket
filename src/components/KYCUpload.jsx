import React, { useState } from 'react';
import { UploadCloud, FileType, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

export default function KYCUpload({ user, onUploadSuccess }) {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(selectedFile.type)) {
      toast({ title: "Format invalide", description: "Seuls les fichiers PDF, JPG et PNG sont acceptés.", variant: "destructive" });
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "La taille du fichier ne doit pas dépasser 5 Mo.", variant: "destructive" });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL or path
      const documentUrl = filePath;

      // Check if existing KYC
      const { data: existingKyc } = await supabase
        .from('kyc')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingKyc) {
        const { error: updateError } = await supabase
          .from('kyc')
          .update({ document_url: documentUrl, status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', existingKyc.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('kyc')
          .insert({ user_id: user.id, document_url: documentUrl, status: 'pending' });
        if (insertError) throw insertError;
      }

      toast({ title: "Document envoyé", description: "Votre document a été soumis avec succès." });
      if (onUploadSuccess) onUploadSuccess();
      setFile(null);
    } catch (error) {
      console.error("KYC Upload Error:", error);
      toast({ title: "Erreur", description: "Une erreur est survenue lors de l'envoi du document.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <UploadCloud className="h-6 w-6 text-primary" />
          Vérification d'Identité (KYC)
        </CardTitle>
        <CardDescription>
          Veuillez soumettre une pièce d'identité valide (Carte Nationale, Passeport) pour continuer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/10 transition-colors">
          <input
            type="file"
            id="kyc-upload"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <label htmlFor="kyc-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <FileType className="h-6 w-6" />
            </div>
            <span className="font-medium text-sm">
              {file ? file.name : "Cliquez pour sélectionner un fichier"}
            </span>
            <span className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 5MB)</span>
          </label>
        </div>

        <Button 
          className="w-full" 
          onClick={handleUpload} 
          disabled={!file || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            "Soumettre le document"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}