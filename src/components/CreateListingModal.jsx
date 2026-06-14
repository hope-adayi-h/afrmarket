import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, ChevronLeft, ChevronRight, Trash2, Info, Lock, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { categories } from '@/data/categories';
import { cn } from '@/lib/utils';

const CreateListingModal = ({ isOpen, onClose, currentUser, listingToEdit }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    location: '',
    phone: '',
    address: '',
  });

  const [images, setImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  // Promo Code logic for Listings
  const [promoCode, setPromoCode] = useState('');
  const [validPromo, setValidPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    if (listingToEdit) {
      const locked = listingToEdit.status === 'approved' || listingToEdit.status === 'rejected';
      setIsLocked(locked);

      setFormData({
        title: listingToEdit.title || '',
        description: listingToEdit.description || '',
        price: listingToEdit.price || '',
        category: listingToEdit.category || '',
        location: listingToEdit.location || '',
        phone: listingToEdit.phone || currentUser?.phone || '',
        address: listingToEdit.address || '',
      });

      if (listingToEdit.images && Array.isArray(listingToEdit.images)) {
        setImages(listingToEdit.images.map((url, index) => ({
          id: `existing-${index}`,
          url,
          file: null
        })));
      } else {
        setImages([]);
      }
    } else {
      setIsLocked(false);
      setFormData({
        title: '',
        description: '',
        price: '',
        category: '',
        location: currentUser?.location || '',
        phone: currentUser?.phone || '',
        address: '',
      });
      setImages([]);
      setPromoCode('');
      setValidPromo(null);
    }
  }, [listingToEdit, currentUser, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFiles = (files) => {
    if (isLocked) return;
    const newImages = Array.from(files).map(file => ({
      id: `new-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file: file
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const handleImageChange = (e) => {
    if (isLocked) return;
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLocked) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLocked) return;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (id) => {
    if (isLocked) return;
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const moveImage = (index, direction) => {
    if (isLocked) return;
    const newImages = [...images];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newImages.length) {
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;
      setImages(newImages);
    }
  };
  
  const handleValidatePromo = async () => {
      if (!promoCode.trim()) return;
      setPromoLoading(true);
      setValidPromo(null);
      
      try {
          const { data, error } = await supabase
              .from('promo_codes')
              .select('*')
              .eq('code', promoCode.toUpperCase())
              .eq('is_active', true)
              .single();
              
          if (error || !data) {
               toast({ title: 'Invalide', description: "Code promo inconnu.", variant: "destructive" });
          } else {
              if (data.expiration_date && new Date(data.expiration_date) < new Date()) {
                  toast({ title: 'Expiré', description: "Code expiré.", variant: "destructive" });
                  return;
              }
              if (data.max_usage && data.usage_count >= data.max_usage) {
                  toast({ title: 'Limite atteinte', description: "Limite d'usage atteinte.", variant: "destructive" });
                  return;
              }
              
              setValidPromo(data);
              toast({ title: 'Validé !', description: `Le code ${data.code} est actif.` });
          }
      } catch (e) {
          console.error(e);
      } finally {
          setPromoLoading(false);
      }
  }

  const uploadImagesToSupabase = async () => {
    const uploadedUrls = [];
    for (const img of images) {
      if (img.file) {
        const fileExt = img.file.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('listings').upload(fileName, img.file);
        if (uploadError) throw new Error(`Erreur upload ${img.file.name}`);
        const { data: { publicUrl } } = supabase.storage.from('listings').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      } else {
        uploadedUrls.push(img.url);
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) {
      toast({ title: "Verrouillé", description: "Annonce non modifiable.", variant: "destructive" });
      return;
    }
    if (!formData.title || !formData.price || !formData.category) {
      toast({ title: "Champs manquants", description: "Remplissez les champs obligatoires (*)", variant: "destructive" });
      return;
    }
    if (images.length === 0) {
      toast({ title: "Image requise", description: "Ajoutez au moins une photo.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const imageUrls = await uploadImagesToSupabase();

      const listingData = {
        user_id: currentUser.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        location: formData.location,
        phone: formData.phone,
        address: formData.address,
        images: imageUrls,
        status: 'pending', 
        updated_at: new Date().toISOString(),
        promo_code_id: validPromo ? validPromo.id : null // Store promo code if valid
      };

      let error;
      if (listingToEdit) {
        const { error: updateError } = await supabase.from('listings').update(listingData).eq('id', listingToEdit.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('listings').insert(listingData);
        error = insertError;
      }

      if (error) throw error;
      toast({ title: "Succès !", description: "Annonce soumise pour approbation." });
      onClose();
    } catch (error) {
      console.error('Error saving listing:', error);
      toast({ title: "Erreur", description: "Impossible d'enregistrer l'annonce.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && onClose(open)}>
      <DialogContent className="w-[100vw] h-[100dvh] max-w-none m-0 rounded-none sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-3xl sm:rounded-xl p-0 overflow-hidden flex flex-col bg-background">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background z-10 flex flex-row items-center justify-between sm:block">
          <div className="flex-1 text-left sm:text-center">
            <DialogTitle className="text-xl font-bold">{listingToEdit ? "Modifier l'annonce" : "Nouvelle annonce"}</DialogTitle>
            <DialogDescription className="text-sm mt-1 hidden sm:block">Remplissez les détails pour mettre votre article en vente.</DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form id="listing-form" onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-safe">
            
            {isLocked && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg flex gap-4 items-center text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                <Lock className="w-8 h-8 shrink-0" />
                <div><h3 className="font-bold">Annonce verrouillée</h3><p className="text-sm">Cette annonce ne peut plus être modifiée.</p></div>
              </div>
            )}
            
            {!isLocked && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-3 items-start text-sm text-blue-700 dark:text-blue-300 sm:hidden">
                 <Info className="w-5 h-5 shrink-0 mt-0.5" />
                 <p>Les annonces avec photo et description détaillée se vendent 3x plus vite !</p>
              </div>
            )}

            <fieldset disabled={isLocked} className="space-y-3">
              <Label className="text-base font-semibold">Photos <span className="text-red-500">*</span></Label>
              <div 
                className={cn("border-2 border-dashed rounded-xl p-6 transition-all text-center", !isLocked && "cursor-pointer active:scale-[0.99]", dragActive ? "border-primary bg-primary/5" : "border-border", !isLocked && "hover:border-primary/50 hover:bg-muted/50", images.length > 0 ? "py-4" : "py-10", isLocked && "bg-muted/50 cursor-not-allowed")}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => !isLocked && fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} disabled={isLocked} />
                <div className="flex flex-col items-center gap-3">
                  <div className={cn("p-3 rounded-full", isLocked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}><Upload className="h-6 w-6" /></div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground"><span className="hidden sm:inline">Cliquez ou glissez</span><span className="sm:hidden">Appuyez pour ajouter</span> des photos</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG (max 5MB)</p>
                  </div>
                </div>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                  {images.map((img, index) => (
                    <div key={img.id} className="relative group aspect-square bg-muted rounded-lg overflow-hidden border border-border shadow-sm">
                      <img src={img.url} alt={`Aperçu ${index + 1}`} className="w-full h-full object-cover" />
                      {!isLocked && (
                        <>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                             <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }} className="self-end p-1.5 bg-red-500/90 text-white rounded-full hover:bg-red-600 backdrop-blur-sm"><Trash2 size={12} /></button>
                             <div className="flex justify-between w-full px-1">
                               {index > 0 && <button type="button" onClick={(e) => { e.stopPropagation(); moveImage(index, -1); }} className="text-white hover:scale-110"><ChevronLeft size={14}/></button>}
                               {index < images.length - 1 && <button type="button" onClick={(e) => { e.stopPropagation(); moveImage(index, 1); }} className="text-white hover:scale-110 ml-auto"><ChevronRight size={14}/></button>}
                             </div>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full sm:hidden shadow-sm"><X size={12} /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </fieldset>

            <fieldset disabled={isLocked} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base">Titre <span className="text-red-500">*</span></Label>
                <Input id="title" name="title" placeholder="Ex: iPhone 13 Pro" value={formData.title} onChange={handleChange} required className="h-12 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-base">Prix (FCFA) <span className="text-red-500">*</span></Label>
                <Input id="price" name="price" type="number" placeholder="Ex: 450000" value={formData.price} onChange={handleChange} required className="h-12 text-base" />
              </div>
            </fieldset>

            <fieldset disabled={isLocked} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-base">Catégorie <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <select id="category" name="category" className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base" value={formData.category} onChange={handleChange} required>
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-base">Localisation</Label>
                <Input id="location" name="location" placeholder="Ex: Dakar, Plateau" value={formData.location} onChange={handleChange} className="h-12 text-base" />
              </div>
            </fieldset>

            <fieldset disabled={isLocked} className="space-y-2">
              <Label htmlFor="phone" className="text-base">Contact</Label>
              <Input id="phone" name="phone" type="tel" placeholder="Ex: 77 000 00 00" value={formData.phone} onChange={handleChange} className="h-12 text-base" />
            </fieldset>
            
            {/* Promo Code Field */}
            <fieldset disabled={isLocked} className="space-y-2">
                <Label className="text-base">Code Promo (Optionnel)</Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                           value={promoCode}
                           onChange={(e) => { setPromoCode(e.target.value); setValidPromo(null); }}
                           placeholder="CODE" 
                           className={`pl-9 uppercase ${validPromo ? 'border-green-500' : ''}`}
                           disabled={!!validPromo}
                        />
                    </div>
                    {validPromo ? (
                         <Button type="button" variant="outline" onClick={() => { setValidPromo(null); setPromoCode(''); }} className="text-red-500 border-red-200"><X className="h-4 w-4"/></Button>
                    ) : (
                        <Button type="button" variant="secondary" onClick={handleValidatePromo} disabled={!promoCode || promoLoading}>
                            {promoLoading ? <Loader2 className="animate-spin h-4 w-4"/> : 'Vérifier'}
                        </Button>
                    )}
                </div>
                {validPromo && <p className="text-xs text-green-600 font-medium">Code appliqué : {validPromo.code}</p>}
            </fieldset>

            <fieldset disabled={isLocked} className="space-y-2">
              <Label htmlFor="description" className="text-base">Description</Label>
              <Textarea id="description" name="description" placeholder="Détails sur le produit..." className="min-h-[150px] text-base resize-none p-4" value={formData.description} onChange={handleChange} />
            </fieldset>
          </form>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-background sm:space-x-2 flex-col-reverse sm:flex-row gap-3 sm:gap-0">
          <Button variant="outline" onClick={() => onClose()} disabled={loading} className="h-12 text-base w-full sm:w-auto" type="button">{isLocked ? "Fermer" : "Annuler"}</Button>
          {!isLocked && (
            <Button onClick={handleSubmit} disabled={loading || images.length === 0} className="h-12 text-base w-full sm:w-auto bg-primary hover:bg-primary/90" type="submit" form="listing-form">
              {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Soumission...</> : (listingToEdit ? 'Mettre à jour' : 'Soumettre')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateListingModal;