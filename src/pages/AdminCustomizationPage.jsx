import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Save, Upload, Image as ImageIcon, Type, User, Lock, Loader2, LayoutTemplate, AlertCircle, Video, PlayCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AdminCustomizationPage = () => {
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Settings State
  const [settings, setSettings] = useState({
    site_name: '',
    site_tagline: '',
    site_description: '',
    site_logo_url: '',
    site_hero_image_url: '',
    registration_video_url: ''
  });

  // Profile State
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const logoInputRef = useRef(null);
  const heroInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    fetchSettings();
    if (user && profile) {
      setProfileData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        email: user.email || ''
      }));
    }
  }, [user, profile]);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase.from('site_settings').select('*');
      
      if (error) throw error;
      
      if (data) {
        const newSettings = { ...settings };
        data.forEach(item => {
          if (newSettings.hasOwnProperty(item.key)) {
            newSettings[item.key] = item.value;
          }
        });
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les paramètres.', variant: 'destructive' });
    } finally {
      setFetching(false);
    }
  };

  const handleSettingChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const saveSettings = async (keysToSave) => {
    setLoading(true);
    try {
      const updates = keysToSave.map(key => ({
        key,
        value: settings[key],
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('site_settings').upsert(updates);

      if (error) throw error;

      toast({ title: 'Succès', description: 'Paramètres mis à jour avec succès.' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder les modifications.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    setLoading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      let settingKey;
      if (type === 'logo') settingKey = 'site_logo_url';
      else if (type === 'hero') settingKey = 'site_hero_image_url';
      else if (type === 'video') settingKey = 'registration_video_url';
      
      // Update local state
      setSettings(prev => ({ ...prev, [settingKey]: publicUrl }));
      
      // Update DB immediately
      await supabase.from('site_settings').upsert({
        key: settingKey,
        value: publicUrl,
        updated_at: new Date().toISOString()
      });

      toast({ title: 'Fichier téléchargé', description: 'Le fichier a été mis à jour avec succès.' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Erreur', description: 'Échec du téléchargement.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Update Password if provided
      if (profileData.new_password) {
        if (profileData.new_password !== profileData.confirm_password) {
          throw new Error("Les mots de passe ne correspondent pas.");
        }
        const { error: pwError } = await supabase.auth.updateUser({
          password: profileData.new_password
        });
        if (pwError) throw pwError;
      }

      // 2. Update Email if changed
      if (profileData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileData.email
        });
        if (emailError) throw emailError;
        toast({ title: 'Email mis à jour', description: 'Veuillez vérifier votre nouvelle adresse email.' });
      }

      // 3. Update Profile Info
      if (profileData.full_name !== profile.full_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: profileData.full_name })
          .eq('id', user.id);
        if (profileError) throw profileError;
        await refreshProfile();
      }

      // Clear sensitive fields
      setProfileData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));

      toast({ title: 'Profil mis à jour', description: 'Vos informations ont été enregistrées.' });
    } catch (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Helmet>
        <title>Admin - Personnalisation</title>
      </Helmet>

      <div className="space-y-6 pb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personnalisation</h1>
          <p className="text-muted-foreground">Gérez l'apparence du site et vos informations personnelles.</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general" className="flex gap-2"><Type size={16} /> Informations Générales</TabsTrigger>
            <TabsTrigger value="visuals" className="flex gap-2"><ImageIcon size={16} /> Visuels</TabsTrigger>
            <TabsTrigger value="tutorials" className="flex gap-2"><Video size={16} /> Tutoriels</TabsTrigger>
            <TabsTrigger value="profile" className="flex gap-2"><User size={16} /> Mon Profil</TabsTrigger>
          </TabsList>

          {/* GENERAL TAB */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Informations du Site</CardTitle>
                <CardDescription>Ces informations apparaissent sur la page d'accueil et dans les méta-données.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Nom du Site</Label>
                  <Input 
                    id="site_name" 
                    name="site_name" 
                    value={settings.site_name} 
                    onChange={handleSettingChange} 
                    placeholder="Ex: AFRMARKET" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_tagline">Slogan (Tagline)</Label>
                  <Input 
                    id="site_tagline" 
                    name="site_tagline" 
                    value={settings.site_tagline} 
                    onChange={handleSettingChange} 
                    placeholder="Ex: Le marché en ligne de confiance" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_description">Description</Label>
                  <Textarea 
                    id="site_description" 
                    name="site_description" 
                    value={settings.site_description} 
                    onChange={handleSettingChange} 
                    placeholder="Description courte pour le référencement..." 
                    rows={4}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => saveSettings(['site_name', 'site_tagline', 'site_description'])} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" /> Enregistrer
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* VISUALS TAB */}
          <TabsContent value="visuals" className="space-y-6">
            {/* Logo Section */}
            <Card>
              <CardHeader>
                <CardTitle>Logo du Site</CardTitle>
                <CardDescription>Le logo principal affiché dans l'en-tête.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-6 items-start">
                <div className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center min-w-[200px] min-h-[100px] bg-muted/20">
                  {settings.site_logo_url ? (
                    <img src={settings.site_logo_url} alt="Logo actuel" className="max-h-24 object-contain" />
                  ) : (
                    <div className="text-muted-foreground text-sm flex flex-col items-center">
                      <LayoutTemplate className="h-8 w-8 mb-2 opacity-50" />
                      Aucun logo
                    </div>
                  )}
                </div>
                <div className="space-y-4 flex-1">
                   <p className="text-sm text-muted-foreground">Format recommandé : PNG ou SVG avec fond transparent. Taille max : 2MB.</p>
                   <input 
                     type="file" 
                     ref={logoInputRef} 
                     className="hidden" 
                     accept="image/*" 
                     onChange={(e) => handleFileUpload(e.target.files[0], 'logo')} 
                   />
                   <div className="flex gap-2">
                     <Button variant="outline" onClick={() => logoInputRef.current?.click()} disabled={loading}>
                       <Upload className="mr-2 h-4 w-4" /> {settings.site_logo_url ? "Changer le logo" : "Télécharger un logo"}
                     </Button>
                     {settings.site_logo_url && (
                       <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => {
                         setSettings(prev => ({ ...prev, site_logo_url: '' }));
                         saveSettings(['site_logo_url']); // This will save empty string effectively removing it visually
                       }}>
                         Supprimer
                       </Button>
                     )}
                   </div>
                </div>
              </CardContent>
            </Card>

            {/* Hero Image Section */}
            <Card>
              <CardHeader>
                <CardTitle>Image Hero (Accueil)</CardTitle>
                <CardDescription>La grande image de fond sur la page d'accueil.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden border bg-muted">
                  {settings.site_hero_image_url ? (
                    <img src={settings.site_hero_image_url} alt="Hero actuel" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/10" />
                </div>
                
                <div className="flex items-center gap-4">
                   <input 
                     type="file" 
                     ref={heroInputRef} 
                     className="hidden" 
                     accept="image/*" 
                     onChange={(e) => handleFileUpload(e.target.files[0], 'hero')} 
                   />
                   <Button onClick={() => heroInputRef.current?.click()} disabled={loading}>
                     <Upload className="mr-2 h-4 w-4" /> {settings.site_hero_image_url ? "Changer l'image" : "Ajouter une image"}
                   </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TUTORIALS TAB */}
          <TabsContent value="tutorials">
            <Card>
              <CardHeader>
                <CardTitle>Vidéo d'inscription</CardTitle>
                <CardDescription>Configurez le tutoriel vidéo qui aide les utilisateurs à s'inscrire.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>URL de la vidéo (YouTube ou fichier direct)</Label>
                    <div className="flex gap-2">
                        <Input 
                            name="registration_video_url"
                            value={settings.registration_video_url} 
                            onChange={handleSettingChange}
                            placeholder="https://www.youtube.com/watch?v=..."
                        />
                        <Button onClick={() => saveSettings(['registration_video_url'])} disabled={loading}>
                            <Save className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Collez un lien YouTube ou utilisez le bouton ci-dessous pour télécharger un fichier vidéo.</p>
                </div>

                <div className="border-t pt-6">
                    <h4 className="text-sm font-medium mb-3">Ou télécharger un fichier vidéo</h4>
                    <div className="flex items-center gap-4">
                        <input 
                            type="file" 
                            ref={videoInputRef} 
                            className="hidden" 
                            accept="video/mp4,video/webm" 
                            onChange={(e) => handleFileUpload(e.target.files[0], 'video')} 
                        />
                        <Button variant="outline" onClick={() => videoInputRef.current?.click()} disabled={loading}>
                            <Upload className="mr-2 h-4 w-4" /> Télécharger une vidéo (MP4)
                        </Button>
                        {settings.registration_video_url && !settings.registration_video_url.includes('youtube') && (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                                <PlayCircle size={14} /> Fichier actuel actif
                            </span>
                        )}
                    </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADMIN PROFILE TAB */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Mon Profil Administrateur</CardTitle>
                <CardDescription>Mettez à jour vos informations de connexion.</CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdateProfile}>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nom complet</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="full_name" 
                          name="full_name" 
                          className="pl-9"
                          value={profileData.full_name} 
                          onChange={handleProfileChange} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={profileData.email} 
                        onChange={handleProfileChange} 
                      />
                      <p className="text-[10px] text-muted-foreground flex gap-1 items-center"><AlertCircle size={10}/> Changer l'email nécessitera une nouvelle validation.</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium mb-4">Sécurité (Laisser vide pour ne pas changer)</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new_password">Nouveau mot de passe</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="new_password" 
                            name="new_password" 
                            type="password" 
                            className="pl-9"
                            value={profileData.new_password} 
                            onChange={handleProfileChange} 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
                        <Input 
                          id="confirm_password" 
                          name="confirm_password" 
                          type="password" 
                          value={profileData.confirm_password} 
                          onChange={handleProfileChange} 
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Mettre à jour le profil
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AdminCustomizationPage;