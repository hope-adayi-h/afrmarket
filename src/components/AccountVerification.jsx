import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, UploadCloud, FileType, Loader2, CheckCircle, Clock, XCircle, AlertCircle, Camera, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getVerificationStatus } from '@/lib/verificationUtils';

export default function AccountVerification({ user }) {
  const { toast } = useToast();
  const [status, setStatus] = useState('unverified');
  const [adminNotes, setAdminNotes] = useState('');
  
  // Wizard state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [documentType, setDocumentType] = useState('cni');
  const [documentTypeLabel, setDocumentTypeLabel] = useState('');
  
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  
  const [frontFile, setFrontFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  
  const [backFile, setBackFile] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user]);

  const loadStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('kyc')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setStatus(data.status);
        if (data.admin_notes) setAdminNotes(data.admin_notes);
      } else {
        setStatus('unverified');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileCapture = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "Max 15 Mo.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      
      // Client-side compression
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            setFile(compressedFile);
          } else {
            setFile(file); // fallback
          }
        }, 'image/jpeg', 0.8);
      };
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setStep(0);
    setDocumentType('cni');
    setDocumentTypeLabel('');
    setSelfieFile(null);
    setSelfiePreview(null);
    setFrontFile(null);
    setFrontPreview(null);
    setBackFile(null);
    setBackPreview(null);
  };

  const openWizard = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleNext = () => {
    if (step === 2 && documentType === 'passeport') {
      setStep(4);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 4 && documentType === 'passeport') {
      setStep(2);
    } else {
      setStep(step - 1);
    }
  };

  const uploadFileToSupabase = async (file, prefix) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${prefix}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage
      .from('kyc-documents')
      .upload(fileName, file, { upsert: true });
    
    if (error) throw error;
    return fileName;
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    try {
      const selfie_url = await uploadFileToSupabase(selfieFile, 'selfie');
      const id_front_url = await uploadFileToSupabase(frontFile, 'front');
      const id_back_url = documentType !== 'passeport' ? await uploadFileToSupabase(backFile, 'back') : null;

      const { error } = await supabase
        .from('kyc')
        .insert({
          user_id: user.id,
          document_type: documentType,
          document_type_label: documentType === 'autre' ? documentTypeLabel : null,
          selfie_url,
          id_front_url,
          id_back_url,
          status: 'pending'
        });

      if (error) throw error;

      toast({ title: "Demande envoyée", description: "Votre vérification est en cours de traitement." });
      setStatus('pending');
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur", description: "Impossible d'envoyer les documents.", variant: "destructive" });
    } finally {
      setIsUploading(false);
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

  const renderStepContent = () => {
    switch(step) {
      case 0:
        return (
          <div className="space-y-4 py-4">
            <h3 className="text-lg font-medium">Type de document</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { id: 'cni', label: 'Carte Nationale', desc: 'Carte d\'identité classique' },
                { id: 'passeport', label: 'Passeport', desc: 'Passeport international' },
                { id: 'autre', label: 'Autre', desc: 'Permis, carte de résident...' }
              ].map(doc => (
                <Card 
                  key={doc.id} 
                  className={`cursor-pointer transition-all hover:border-primary ${documentType === doc.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : ''}`}
                  onClick={() => setDocumentType(doc.id)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{doc.label}</CardTitle>
                    <CardDescription>{doc.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
            {documentType === 'autre' && (
              <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-4">
                <Label htmlFor="doc-label">Précisez le type de document</Label>
                <Input 
                  id="doc-label" 
                  placeholder="Ex: Permis de conduire" 
                  value={documentTypeLabel} 
                  onChange={(e) => setDocumentTypeLabel(e.target.value)} 
                />
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button onClick={handleNext} disabled={documentType === 'autre' && !documentTypeLabel.trim()}>Continuer <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4 py-4">
            <h3 className="text-lg font-medium">Prenez un selfie</h3>
            <p className="text-sm text-muted-foreground">Prenez un selfie net de votre visage, bien éclairé, sans lunettes de soleil.</p>
            
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 bg-muted/20">
              {selfiePreview ? (
                <div className="relative w-full max-w-sm mx-auto">
                  <img src={selfiePreview} alt="Selfie" className="rounded-lg object-cover w-full h-64 shadow-sm" />
                  <label className="absolute bottom-2 right-2 cursor-pointer bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors">
                    <Camera className="h-5 w-5" />
                    <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileCapture(e, setSelfieFile, setSelfiePreview)} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer w-full h-64 hover:bg-muted/30 transition-colors rounded-lg">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                    <Camera className="h-8 w-8" />
                  </div>
                  <span className="font-medium text-lg">Ouvrir l'appareil photo</span>
                  <span className="text-sm text-muted-foreground mt-2 text-center max-w-xs">Appuyez ici pour prendre un selfie (ou choisir un fichier)</span>
                  <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileCapture(e, setSelfieFile, setSelfiePreview)} />
                </label>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}><ChevronLeft className="mr-2 h-4 w-4" /> Retour</Button>
              <Button onClick={handleNext} disabled={!selfieFile}>Continuer <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 py-4">
            <h3 className="text-lg font-medium">Recto du document</h3>
            <p className="text-sm text-muted-foreground">
              {documentType === 'passeport' 
                ? "Prenez en photo la page principale de votre passeport avec votre photo, bien lisible et sans reflet."
                : `Prenez en photo le RECTO de votre ${documentType === 'autre' ? documentTypeLabel : (documentType === 'cni' ? 'Carte d\'identité' : 'document')}, bien lisible, sans reflet.`}
            </p>
            
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 bg-muted/20">
              {frontPreview ? (
                <div className="relative w-full max-w-sm mx-auto">
                  <img src={frontPreview} alt="Recto" className="rounded-lg object-cover w-full h-48 shadow-sm" />
                  <label className="absolute bottom-2 right-2 cursor-pointer bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors">
                    <Camera className="h-5 w-5" />
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileCapture(e, setFrontFile, setFrontPreview)} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer w-full h-48 hover:bg-muted/30 transition-colors rounded-lg">
                  <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                    <FileType className="h-7 w-7" />
                  </div>
                  <span className="font-medium text-lg">Prendre une photo</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileCapture(e, setFrontFile, setFrontPreview)} />
                </label>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}><ChevronLeft className="mr-2 h-4 w-4" /> Retour</Button>
              <Button onClick={handleNext} disabled={!frontFile}>Continuer <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 py-4">
            <h3 className="text-lg font-medium">Verso du document</h3>
            <p className="text-sm text-muted-foreground">
              Prenez en photo le VERSO de votre {documentType === 'autre' ? documentTypeLabel : 'Carte d\'identité'}, bien lisible.
            </p>
            
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 bg-muted/20">
              {backPreview ? (
                <div className="relative w-full max-w-sm mx-auto">
                  <img src={backPreview} alt="Verso" className="rounded-lg object-cover w-full h-48 shadow-sm" />
                  <label className="absolute bottom-2 right-2 cursor-pointer bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors">
                    <Camera className="h-5 w-5" />
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileCapture(e, setBackFile, setBackPreview)} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer w-full h-48 hover:bg-muted/30 transition-colors rounded-lg">
                  <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                    <FileType className="h-7 w-7" />
                  </div>
                  <span className="font-medium text-lg">Prendre une photo</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileCapture(e, setBackFile, setBackPreview)} />
                </label>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}><ChevronLeft className="mr-2 h-4 w-4" /> Retour</Button>
              <Button onClick={handleNext} disabled={!backFile}>Continuer <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 py-4">
            <h3 className="text-lg font-medium">Récapitulatif</h3>
            <p className="text-sm text-muted-foreground">Veuillez vérifier que les photos sont nettes avant d'envoyer.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">Selfie</span>
                <div className="relative">
                  <img src={selfiePreview} alt="Selfie" className="rounded-lg h-32 w-full object-cover border" />
                  <Button size="icon" variant="secondary" className="absolute top-1 right-1 h-7 w-7 opacity-80" onClick={() => setStep(1)}><Camera className="h-3 w-3" /></Button>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Document ({documentType === 'passeport' ? 'Passeport' : 'Recto'})</span>
                <div className="relative">
                  <img src={frontPreview} alt="Recto" className="rounded-lg h-32 w-full object-cover border" />
                  <Button size="icon" variant="secondary" className="absolute top-1 right-1 h-7 w-7 opacity-80" onClick={() => setStep(2)}><Camera className="h-3 w-3" /></Button>
                </div>
              </div>
              {documentType !== 'passeport' && (
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <span className="text-sm font-medium">Verso</span>
                  <div className="relative">
                    <img src={backPreview} alt="Verso" className="rounded-lg h-32 w-full object-cover border" />
                    <Button size="icon" variant="secondary" className="absolute top-1 right-1 h-7 w-7 opacity-80" onClick={() => setStep(3)}><Camera className="h-3 w-3" /></Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack} disabled={isUploading}><ChevronLeft className="mr-2 h-4 w-4" /> Retour</Button>
              <Button onClick={handleSubmit} disabled={isUploading}>
                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</> : "Envoyer ma demande"}
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

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

          {status === 'unverified' || status === 'rejected' ? (
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Button onClick={openWizard}>{status === 'rejected' ? "Soumettre une nouvelle demande" : "Vérifier mon compte"}</Button>
            </div>
          ) : status === 'pending' ? (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-2">
              <p className="text-sm font-medium">Votre demande a été envoyée avec succès.</p>
              <p className="text-sm text-muted-foreground mt-1">
                La vérification de votre identité peut prendre jusqu'à 72 heures. Vous recevrez une notification dès que votre compte sera vérifié.
              </p>
            </div>
          ) : (
             <p className="text-sm text-muted-foreground mt-2">Votre identité a été vérifiée avec succès. Merci !</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(open) => !isUploading && setIsModalOpen(open)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vérification d'identité</DialogTitle>
            <DialogDescription>
              Étape {step + 1} sur {documentType === 'passeport' ? 3 : (step > 0 && documentType !== 'passeport' ? 4 : '...')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-2">
             <div className="w-full bg-muted rounded-full h-2.5 mb-4">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${((step + 1) / (documentType === 'passeport' && step > 0 ? 3 : 4)) * 100}%` }}
                ></div>
             </div>
             {renderStepContent()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
