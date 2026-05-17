import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Edit, Trash2, MapPin, Clock, MessageSquare, Bell, Heart, Camera, Check, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';

const ProfilePage = ({ user, onBack, onListingClick, onMessageClick, onUserUpdate, onEditListing, onVerifyIdentity }) => {
  const [userListings, setUserListings] = useState([]);
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('listings');
  const fileInputRef = useRef(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.full_name || '');

  useEffect(() => {
    if (user) {
      fetchUserListings();
      fetchFavoriteListings();
      setNewName(user.full_name || '');
      
      // Note: Message data is still in localStorage as per previous instructions.
      // This part would need a Supabase table for messages to be persistent and shared.
      const allMessages = JSON.parse(localStorage.getItem('afrmarket_messages_v2') || '[]');
      const myConversations = allMessages.filter(conv => conv.participants.includes(user.id));
      const allUsers = JSON.parse(localStorage.getItem('afrmarket_users') || '[]'); // This is also deprecated, should come from Supabase profiles
      const convData = myConversations.map(conv => {
        const otherParticipantId = conv.participants.find(p => p !== user.id);
        const otherUser = allUsers.find(u => u.id === otherParticipantId);
        const lastMessage = conv.messages[conv.messages.length - 1];
        return { ...conv, otherUser, lastMessage }
      });
      setConversations(convData);
    }
  }, [user]);

  const fetchUserListings = async () => {
    if(!user) return;
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user listings:', error);
    } else {
      const formattedListings = data.map(listing => ({
        ...listing,
        userName: listing.profiles?.full_name || 'Utilisateur',
        userAvatarUrl: listing.profiles?.avatar_url
      }));
      setUserListings(formattedListings);
    }
  };

  const fetchFavoriteListings = async () => {
    if(!user) return;
    const myFavoriteIds = user.likes || [];
    if (myFavoriteIds.length === 0) {
      setFavoriteListings([]);
      return;
    }

    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .in('id', myFavoriteIds);

    if (error) {
      console.error('Error fetching favorite listings:', error);
    } else {
      const formattedListings = data.map(listing => ({
        ...listing,
        userName: listing.profiles?.full_name || 'Utilisateur',
        userAvatarUrl: listing.profiles?.avatar_url
      }));
      setFavoriteListings(formattedListings);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (file && user) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

        if (uploadError) {
            toast({ title: "Erreur d'upload", description: uploadError.message, variant: "destructive" });
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) {
          toast({ title: "Erreur", description: "Impossible de mettre à jour la photo.", variant: "destructive" });
        } else {
          onUserUpdate();
          toast({ title: "Photo de profil mise à jour !", description: "Votre nouvelle photo est maintenant visible." });
        }
    }
  };

  const handleNameUpdate = async () => {
    if (newName.trim() === '' || !user) {
      toast({ title: "Nom invalide", description: "Le nom ne peut pas être vide.", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: newName })
      .eq('id', user.id);

    if (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le nom.", variant: "destructive" });
    } else {
      onUserUpdate();
      toast({ title: "Nom mis à jour !", description: "Votre nom a été modifié avec succès." });
      setIsEditingName(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer l'annonce.", variant: "destructive" });
    } else {
      setUserListings(userListings.filter(listing => listing.id !== listingId));
      toast({ title: "Annonce supprimée", description: "Votre annonce a été supprimée avec succès." });
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price);

  const getTimeAgo = (date) => {
    if (!date) return '';
    const diffInSeconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (diffInSeconds < 60) return `à l'instant`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return `Il y a ${Math.floor(diffInHours / 24)}j`;
  };
  
  const ListingCard = ({ listing }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border rounded-xl hover:shadow-md transition-shadow bg-card">
      <img src={(listing.images && listing.images[0]) || 'https://placehold.co/200x200/222/fff/png?text=Image'} alt={listing.title} className="w-full md:w-32 h-32 object-cover rounded-lg cursor-pointer" onClick={() => onListingClick(listing)} />
      <div className="flex-1 cursor-pointer" onClick={() => onListingClick(listing)}>
        <p className="font-bold text-lg text-card-foreground">{listing.title}</p>
        <p className="text-xl font-bold text-orange-500">{formatPrice(listing.price)}</p>
        <div className="flex flex-wrap items-center text-muted-foreground text-sm gap-x-4 gap-y-1 mt-1">
          <span className="flex items-center"><MapPin size={14} className="mr-1"/>{listing.location}</span>
          <span className="flex items-center"><Clock size={14} className="mr-1"/>{getTimeAgo(listing.created_at)}</span>
        </div>
      </div>
      {activeTab === 'listings' && (
        <div className="flex gap-2 self-start md:self-center mt-2 md:mt-0">
          <Button variant="outline" size="icon" className="border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10" onClick={() => onEditListing(listing)}><Edit size={18} /></Button>
          <Button variant="outline" size="icon" className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => handleDeleteListing(listing.id)}><Trash2 size={18} /></Button>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="container mx-auto px-4">
        <Button onClick={onBack} variant="ghost" className="mb-6 hover:bg-accent"><ArrowLeft size={20} className="mr-2" />Retour</Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden"/>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center text-white font-bold text-4xl overflow-hidden">
                {user?.avatar_url ? <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" /> : (user?.full_name?.charAt(0) || 'U')}
              </div>
              <Button onClick={() => fileInputRef.current.click()} size="icon" className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-card shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={16} className="text-foreground" /></Button>
            </div>
            <div className="text-center sm:text-left">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="px-3 py-1 text-2xl font-bold bg-background border-2 border-input rounded-lg focus:border-orange-500 focus:outline-none" />
                  <Button size="icon" onClick={handleNameUpdate} className="bg-green-500 hover:bg-green-600"><Check size={18} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)}><X size={18} /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <h1 className="text-3xl font-bold text-card-foreground">{user?.full_name}</h1>
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingName(true)}><Edit size={18} /></Button>
                </div>
              )}
              <p className="text-muted-foreground mt-1">{user?.email}</p>
              <p className="text-muted-foreground">{user?.phone}</p>
            </div>
          </div>
          {user?.kyc_status !== 'verified' && (
            <div className="mt-6 p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-orange-400">Vérifiez votre identité</h4>
                  <p className="text-sm text-orange-400/80">Pour pouvoir publier des annonces, vous devez vérifier votre profil.</p>
                </div>
                <Button onClick={onVerifyIdentity} className="bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap"><ShieldCheck className="mr-2 h-4 w-4" />Vérifier maintenant</Button>
              </div>
            </div>
          )}
          {user?.kyc_status === 'verified' && (
            <div className="mt-6 p-4 bg-green-500/10 border-l-4 border-green-500 rounded-r-lg flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-green-500" />
              <p className="font-semibold text-green-400">Votre profil est vérifié.</p>
            </div>
          )}
        </motion.div>

        <div className="bg-card rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="border-b overflow-x-auto">
            <nav className="flex space-x-2 sm:space-x-6">
              <button onClick={() => setActiveTab('listings')} className={`py-4 px-2 sm:px-4 font-semibold flex items-center gap-2 whitespace-nowrap ${activeTab === 'listings' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-muted-foreground'}`}><MessageSquare size={18} /> Mes annonces ({userListings.length})</button>
              <button onClick={() => setActiveTab('favorites')} className={`py-4 px-2 sm:px-4 font-semibold flex items-center gap-2 whitespace-nowrap ${activeTab === 'favorites' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-muted-foreground'}`}><Heart size={18} /> Favoris ({favoriteListings.length})</button>
              <button onClick={() => setActiveTab('messages')} className={`py-4 px-2 sm:px-4 font-semibold flex items-center gap-2 whitespace-nowrap ${activeTab === 'messages' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-muted-foreground'}`}><Bell size={18} /> Messages ({conversations.length})</button>
            </nav>
          </div>
          
          <div className="pt-6">
            {activeTab === 'listings' && (userListings.length === 0 ? <div className="text-center py-12"><p className="text-muted-foreground text-lg">Vous n'avez pas encore publié d'annonces.</p></div> : <div className="space-y-4">{userListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>)}
            {activeTab === 'favorites' && (favoriteListings.length === 0 ? <div className="text-center py-12"><p className="text-muted-foreground text-lg">Vous n'avez pas encore d'annonces favorites.</p></div> : <div className="space-y-4">{favoriteListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>)}
            {activeTab === 'messages' && (conversations.length === 0 ? <div className="text-center py-12"><p className="text-muted-foreground text-lg">Vous n'avez aucune conversation.</p></div> : <div className="space-y-2">{conversations.sort((a,b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)).map((conv) => (<motion.div key={conv.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => onMessageClick(conv.otherUser)} className="flex items-center gap-4 p-4 rounded-xl hover:bg-accent cursor-pointer transition-colors"><div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-green-400 flex items-center justify-center text-white font-bold text-lg overflow-hidden">{conv.otherUser?.avatarUrl ? <img src={conv.otherUser.avatarUrl} alt={conv.otherUser.name} className="w-full h-full object-cover" /> : (conv.otherUser?.name?.charAt(0) || '?')}</div><div className="flex-1"><div className="flex justify-between items-center"><p className="font-bold text-card-foreground">{conv.otherUser?.name || 'Utilisateur supprimé'}</p><p className="text-xs text-muted-foreground">{getTimeAgo(conv.lastMessage.timestamp)}</p></div><p className="text-muted-foreground text-sm line-clamp-1">{conv.lastMessage.text}</p></div></motion.div>))}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;