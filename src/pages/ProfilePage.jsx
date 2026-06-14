import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, User, ShoppingBag, Edit, Trash2, Camera, Star, Verified, HelpCircle, Shield } from 'lucide-react';
import ListingCard from '@/components/ListingCard';
import AccountVerification from '@/components/AccountVerification';

const ProfilePage = ({ onListingClick, onEditListing, onContactAdmin }) => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [userListings, setUserListings] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    location: '',
    phone: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const fetchUserListings = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUserListings(data);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger vos annonces.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user && profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        phone: profile.phone || '',
      });
      fetchUserListings();
    } else if (!user) {
      navigate('/');
    }
  }, [user, profile, navigate, fetchUserListings]);
  
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    let avatarUrl = profile.avatar_url;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) {
        toast({ title: 'Erreur de téléversement', description: uploadError.message, variant: 'destructive' });
        setLoading(false);
        return;
      }
      
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
      avatarUrl = publicUrlData.publicUrl;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({
        ...formData,
        avatar_url: avatarUrl,
      })
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le profil.', variant: 'destructive' });
    } else {
      toast({ title: 'Profil mis à jour !', description: 'Vos informations ont été enregistrées.' });
      await refreshProfile();
      setIsEditing(false);
    }
    setLoading(false);
    setAvatarFile(null);
    setAvatarPreview(null);
  };
  
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return;
    try {
      const { error } = await supabase.from('listings').delete().eq('id', listingId);
      if (error) throw error;
      toast({ title: 'Annonce supprimée', description: 'Votre annonce a été retirée.' });
      fetchUserListings();
    } catch(error) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer l\'annonce.', variant: 'destructive' });
    }
  };

  if (!profile) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }
  
  const getInitials = (name) => {
    if (!name) return '...';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  return (
    <>
      <Helmet><title>Mon Profil - {profile.full_name}</title></Helmet>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Card className="overflow-hidden mb-6">
          <CardHeader className="p-0">
            <div className="bg-muted h-32 md:h-48" />
            <div className="flex flex-col md:flex-row items-center md:items-end p-6 -mt-20 md:-mt-24 space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background bg-muted">
                  <AvatarImage src={avatarPreview || profile.avatar_url} alt={profile.full_name} />
                  <AvatarFallback className="text-4xl">{getInitials(profile.full_name)}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label htmlFor="avatar" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                    <input id="avatar" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center justify-center md:justify-start gap-2">
                  {profile.full_name}
                  {profile.kyc_status === 'verified' && <Verified className="h-6 w-6 text-blue-500" title="Identité vérifiée" />}
                </h1>
                <p className="text-muted-foreground mt-1">{profile.location || 'Lieu non spécifié'}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onContactAdmin}><HelpCircle className="mr-2 h-4 w-4" />Contacter l'admin</Button>
                <Button onClick={() => setIsEditing(!isEditing)}>{isEditing ? 'Annuler' : 'Modifier le profil'}</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl mx-auto py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nom complet</Label>
                    <Input id="full_name" value={formData.full_name} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" value={formData.phone} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Lieu (Ville, Pays)</Label>
                  <Input id="location" value={formData.location} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" value={formData.bio} onChange={handleInputChange} placeholder="Parlez un peu de vous..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Annuler</Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer
                  </Button>
                </div>
              </form>
            ) : (
              <Tabs defaultValue="listings" className="w-full pt-4">
                <TabsList className="flex flex-wrap justify-center sm:justify-start">
                  <TabsTrigger value="listings"><ShoppingBag className="mr-2 h-4 w-4" />Mes Annonces ({userListings.length})</TabsTrigger>
                  <TabsTrigger value="about"><User className="mr-2 h-4 w-4" />À Propos</TabsTrigger>
                  <TabsTrigger value="verification"><Shield className="mr-2 h-4 w-4" />Vérification</TabsTrigger>
                  <TabsTrigger value="reviews"><Star className="mr-2 h-4 w-4" />Évaluations</TabsTrigger>
                </TabsList>
                <TabsContent value="listings" className="py-6">
                  {loading ? <div className="text-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> : 
                   userListings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {userListings.map(listing => (
                        <div key={listing.id} className="relative group">
                          <ListingCard listing={listing} onListingClick={() => onListingClick(listing)} isLiked={profile?.likes?.includes(listing.id) || false} onLikeToggle={() => {}} />
                          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => onEditListing(listing)}><Edit size={16} /></Button>
                            <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDeleteListing(listing.id)}><Trash2 size={16} /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                      <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-xl font-semibold">Aucune annonce</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Vous n'avez pas encore publié d'annonce.</p>
                      <Button className="mt-6" onClick={() => navigate('/')}>Commencer à explorer</Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="about" className="max-w-2xl mx-auto py-6 space-y-4">
                    <Card><CardHeader><CardTitle>Bio</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{profile.bio || 'Aucune biographie fournie.'}</p></CardContent></Card>
                    <Card><CardHeader><CardTitle>Informations</CardTitle></CardHeader><CardContent className="space-y-2">
                        <p><strong>Membre depuis:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                        <p><strong>Téléphone:</strong> {profile.phone || 'Non fourni'}</p>
                    </CardContent></Card>
                </TabsContent>
                <TabsContent value="verification" className="max-w-2xl mx-auto py-6">
                  <AccountVerification user={user} />
                </TabsContent>
                <TabsContent value="reviews" className="py-6">
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                      <Star className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-xl font-semibold">Bientôt disponible</h3>
                      <p className="mt-1 text-sm text-muted-foreground">La fonctionnalité d'évaluation sera bientôt disponible.</p>
                    </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ProfilePage;