import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet';
import { Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import CreateListingModal from '@/components/CreateListingModal';
import MessageModal from '@/components/MessageModal';
import ContactAdminModal from '@/components/ContactAdminModal';
import BackButton from '@/components/BackButton';
import VerificationCheckModal from '@/components/VerificationCheckModal';

const HomePage = lazy(() => import('@/pages/HomePage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SearchResultsPage = lazy(() => import('@/pages/SearchResultsPage'));
const AllListingsPage = lazy(() => import('@/pages/AllListingsPage'));
const ListingDetailPage = lazy(() => import('@/pages/ListingDetailPage'));
const MessagesPage = lazy(() => import('@/pages/MessagesPage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const BlogPage = lazy(() => import('@/pages/BlogPage'));
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const FAQPage = lazy(() => import('@/pages/FAQPage'));
const UpdatePasswordPage = lazy(() => import('@/pages/UpdatePasswordPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'));
const ConditionsPage = lazy(() => import('@/pages/ConditionsPage'));
const ConfidentialitePage = lazy(() => import('@/pages/ConfidentialitePage'));
const SellerProfilePage = lazy(() => import('@/pages/SellerProfilePage'));
const SignupVideoPage = lazy(() => import('@/pages/SignupVideoPage'));
const SubscriptionsPage = lazy(() => import('@/pages/SubscriptionsPage'));
const InfluencerDashboardPage = lazy(() => import('@/pages/InfluencerDashboardPage'));
const PaymentSuccessPage = lazy(() => import('@/pages/PaymentSuccessPage'));
const PaymentPage = lazy(() => import('@/pages/PaymentPage'));

// Admin Imports (chargés uniquement quand un admin visite /administrateur/*)
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage'));
const AdminListingsPage = lazy(() => import('@/pages/AdminListingsPage'));
const AdminUsersPage = lazy(() => import('@/pages/AdminUsersPage'));
const AdminMessagesPage = lazy(() => import('@/pages/AdminMessagesPage'));
const AdminNotificationsPage = lazy(() => import('@/pages/AdminNotificationsPage'));
const AdminStatsPage = lazy(() => import('@/pages/AdminStatsPage'));
const AdminAuditLogPage = lazy(() => import('@/pages/AdminAuditLogPage'));
const AdminCustomizationPage = lazy(() => import('@/pages/AdminCustomizationPage'));
const AdminPaymentProvidersPage = lazy(() => import('@/pages/AdminPaymentProvidersPage'));
const AdminPromoCodesPage = lazy(() => import('@/pages/AdminPromoCodesPage'));
const AdminPaymentsPage = lazy(() => import('@/pages/AdminPaymentsPage'));
const AdminCommissionsPage = lazy(() => import('@/pages/AdminCommissionsPage'));
const AdminUserSubscriptionsPage = lazy(() => import('@/pages/AdminUserSubscriptionsPage'));
const AdminSubscriptionPlansPage = lazy(() => import('@/pages/AdminSubscriptionPlansPage'));
const AdminVerificationPage = lazy(() => import('@/pages/AdminVerificationPage'));

import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabaseClient';
import { isVerified } from '@/lib/verificationUtils';

function AppContent() {
  const { toast } = useToast();
  const { user, profile, signOut, refreshProfile, subscription } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateListingOpen, setIsCreateListingOpen] = useState(false);
  const [listingToEdit, setListingToEdit] = useState(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState(null);
  const [isContactAdminModalOpen, setIsContactAdminModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  
  const [guestLikes, setGuestLikes] = useState(() => {
    const saved = localStorage.getItem('afrmarket_guest_likes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'login' && !user) {
      setIsAuthModalOpen(true);
    }
  }, [searchParams, user]);

  useEffect(() => {
    if (user) {
      const channel = supabase.channel('user_verification_status')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'kyc',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          if (payload.new.status === 'approved') {
            toast({ title: "Votre compte a été vérifié! ✔", description: "Vous pouvez désormais publier." });
            refreshProfile();
          } else if (payload.new.status === 'rejected') {
            toast({ title: "Demande rejetée", description: "Votre demande de vérification a été rejetée. Vérifiez vos notes et réessayez.", variant: "destructive" });
          }
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [user, toast, refreshProfile]);

  useEffect(() => {
    const syncLikes = async () => {
      if (user && profile && guestLikes.length > 0) {
        const currentProfileLikes = profile.likes || [];
        const mergedLikes = [...new Set([...currentProfileLikes, ...guestLikes])];
        
        if (mergedLikes.length > currentProfileLikes.length) {
           const { error } = await supabase
            .from('profiles')
            .update({ likes: mergedLikes })
            .eq('id', user.id);
            
           if (!error) {
             setGuestLikes([]);
             localStorage.removeItem('afrmarket_guest_likes');
             await refreshProfile();
             toast({ 
               title: "Favoris synchronisés", 
               description: "Vos favoris temporaires ont été ajoutés à votre compte." 
             });
           }
        } else {
             setGuestLikes([]);
             localStorage.removeItem('afrmarket_guest_likes');
        }
      }
    };
    syncLikes();
  }, [user, profile, guestLikes, refreshProfile, toast]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast({ title: "Déconnexion réussie !", description: "À bientôt sur AfterMarket." });
  };
  
  const handleLoginSuccess = () => {
    setIsAuthModalOpen(false);
    toast({ title: "Connexion réussie ! 👋", description: `Bon retour !` });
    refreshProfile();
  };

  const handleSearch = (query, category) => {
    const searchParams = new URLSearchParams();
    if(query) searchParams.set('q', query);
    if(category) searchParams.set('category', category);
    navigate(`/search?${searchParams.toString()}`);
  };
  
  const handleOpenMessageModal = (recipient) => {
    setMessageRecipient(recipient);
    setIsMessageModalOpen(true);
  };
  
  const handleLikeToggle = async (listingId) => {
    if (!user) {
      const isLiked = guestLikes.includes(listingId);
      let newGuestLikes;
      if (isLiked) {
        newGuestLikes = guestLikes.filter(id => id !== listingId);
        toast({ title: "Retiré des favoris", description: "L'annonce a été retirée de vos favoris temporaires." });
      } else {
        newGuestLikes = [...guestLikes, listingId];
        toast({ title: "Ajouté aux favoris ❤️", description: "Annonce sauvegardée temporairement sur cet appareil." });
      }
      setGuestLikes(newGuestLikes);
      localStorage.setItem('afrmarket_guest_likes', JSON.stringify(newGuestLikes));
      return;
    }

    const currentLikes = profile?.likes || [];
    const isLiked = currentLikes.includes(listingId);
    const newLikes = isLiked
      ? currentLikes.filter(id => id !== listingId)
      : [...currentLikes, listingId];

    const { error } = await supabase
      .from('profiles')
      .update({ likes: newLikes })
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour vos favoris.', variant: 'destructive' });
    } else {
      await refreshProfile();
      setForceUpdateKey(c => c + 1);
      toast({
        title: isLiked ? "Retiré des favoris" : "Ajouté aux favoris ❤️",
        description: isLiked ? "L'annonce a été retirée de votre liste." : "Retrouvez cette annonce dans vos favoris.",
      });
    }
  };

  const handleCreateListing = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      toast({ title: "Connexion requise", description: "Vous devez être connecté pour publier une annonce." });
    } else if (!subscription) {
      toast({ 
        title: "Abonnement requis pour publier", 
        description: "Choisissez un plan pour commencer à publier vos annonces.", 
        variant: "destructive",
        action: (
          <button 
            onClick={() => navigate('/abonnements')} 
            className="ml-2 px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold hover:bg-primary/90 shrink-0"
          >
            Voir les plans
          </button>
        )
      });
    } else {
      setListingToEdit(null);
      setIsCreateListingOpen(true);
    }
  };

  const handleEditListing = (listing) => {
    setListingToEdit(listing);
    setIsCreateListingOpen(true);
  };
  
  const handleNavigate = (page) => {
      navigate(`/${page}`);
  };

  const handleListingClick = (listing) => {
    navigate(`/listing/${listing.id}`);
  };

  const currentUserForHeader = user && profile ? { ...user, ...profile } : null;
  const currentUserForProps = user && profile ? { ...user, ...profile } : null;
  const likedListingIds = user ? (profile?.likes || []) : guestLikes;
  const isAdminRoute = location.pathname.startsWith('/administrateur');
  const isPaymentRoute = location.pathname === '/payment';
  const showBackButton = !['/', '/home'].includes(location.pathname) && !isAdminRoute && !isPaymentRoute;

  return (
    <>
      <Helmet>
        <title>AfterMarket - Petites Annonces en Afrique | Achat, Vente & Échange</title>
        <meta name="description" content="AfterMarket est la plateforme d'annonces leader en Afrique. Achetez, vendez et échangez facilement : immobilier, véhicules, électronique, mode, emplois et plus encore." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {!isAdminRoute && !isPaymentRoute && (
          <Header
            currentUser={currentUserForHeader}
            onLoginClick={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            onCreateListing={handleCreateListing}
            onNavigate={handleNavigate}
          />
        )}
        
        {showBackButton && <BackButton />}

        <main className="flex-grow">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }>
          <Routes>
            <Route path="/administrateur" element={profile?.role === 'admin' ? <AdminLayout><AdminDashboardPage /></AdminLayout> : <NotFoundPage />} />
            <Route path="/administrateur/annonces" element={profile?.role === 'admin' ? <AdminLayout><AdminListingsPage /></AdminLayout> : <NotFoundPage />} />
            <Route path="/administrateur/utilisateurs" element={profile?.role === 'admin' ? <AdminLayout><AdminUsersPage /></AdminLayout> : <NotFoundPage />} />
            <Route path="/administrateur/abonnements" element={profile?.role === 'admin' ? <AdminLayout><AdminUserSubscriptionsPage /></AdminLayout> : <NotFoundPage />} />
            <Route path="/administrateur/plans" element={profile?.role === 'admin' ? <AdminLayout><AdminSubscriptionPlansPage /></AdminLayout> : <NotFoundPage />} />
            <Route path="/administrateur/messages" element={profile?.role === 'admin' ? <AdminLayout><AdminMessagesPage /></AdminLayout> : <NotFoundPage />} />
            <Route path="/administrateur/notifications" element={profile?.role === 'admin' ? <AdminLayout><AdminNotificationsPage /></AdminLayout> : <NotFoundPage />} />
            <Route path="/administrateur/statistiques" element={profile?.role === 'admin' ? <AdminLayout><AdminStatsPage /></AdminLayout> : <NotFoundPage />} />
            <Route path="/administrateur/audit-log" element={profile?.role === 'admin' ? <AdminLayout><AdminAuditLogPage /></AdminLayout> : <NotFoundPage />} />
            <Route path="/administrateur/personnalisation" element={profile?.role === 'admin' ? <AdminLayout><AdminCustomizationPage /></AdminLayout> : <NotFoundPage />} />
            <Route path="/administrateur/paiements-config" element={profile?.role === 'admin' ? <AdminLayout><AdminPaymentProvidersPage /></AdminLayout> : <NotFoundPage />} />
            <Route path="/administrateur/codes-promo" element={profile?.role === 'admin' ? <AdminLayout><AdminPromoCodesPage /></AdminLayout> : <NotFoundPage />} />
            <Route path="/administrateur/paiements-dashboard" element={profile?.role === 'admin' ? <AdminLayout><AdminPaymentsPage /></AdminLayout> : <NotFoundPage />} />
            <Route path="/administrateur/commissions" element={profile?.role === 'admin' ? <AdminLayout><AdminCommissionsPage /></AdminLayout> : <NotFoundPage />} />
            <Route path="/administrateur/verification" element={profile?.role === 'admin' ? <AdminLayout><AdminVerificationPage /></AdminLayout> : <NotFoundPage />} />

            <Route path="/" element={<HomePage onSearch={handleSearch} onListingClick={handleListingClick} currentUser={currentUserForProps} likedListingIds={likedListingIds} onLikeToggle={handleLikeToggle} forceUpdateKey={forceUpdateKey} />} />
            <Route path="/home" element={<HomePage onSearch={handleSearch} onListingClick={handleListingClick} currentUser={currentUserForProps} likedListingIds={likedListingIds} onLikeToggle={handleLikeToggle} forceUpdateKey={forceUpdateKey} />} />
            <Route path="/listing/:id" element={<ListingDetailPage currentUser={currentUserForProps} likedListingIds={likedListingIds} onLikeToggle={handleLikeToggle} onMessage={handleOpenMessageModal} />} />
            <Route path="/vendeur/:id" element={<SellerProfilePage currentUser={currentUserForProps} likedListingIds={likedListingIds} onLikeToggle={handleLikeToggle} onListingClick={handleListingClick} />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/profile" element={
              <ProfilePage
                onListingClick={handleListingClick} 
                onMessageClick={handleOpenMessageModal} 
                onEditListing={handleEditListing} 
                onContactAdmin={() => setIsContactAdminModalOpen(true)}
              />
            }/>
            <Route path="/favorites" element={<FavoritesPage currentUser={currentUserForProps} likedListingIds={likedListingIds} onListingClick={handleListingClick} onLikeToggle={handleLikeToggle} onLoginClick={() => setIsAuthModalOpen(true)} />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/search" element={<SearchResultsPage onListingClick={handleListingClick} currentUser={currentUserForProps} likedListingIds={likedListingIds} onLikeToggle={handleLikeToggle} />} />
            <Route path="/listings" element={<AllListingsPage onListingClick={handleListingClick} currentUser={currentUserForProps} likedListingIds={likedListingIds} onLikeToggle={handleLikeToggle} />} />
            <Route path="/all-listings" element={<AllListingsPage onListingClick={handleListingClick} currentUser={currentUserForProps} likedListingIds={likedListingIds} onLikeToggle={handleLikeToggle} />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:postId" element={<BlogPostPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/abonnements" element={<SubscriptionsPage />} />
            
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/video-inscription" element={<SignupVideoPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route path="/conditions" element={<ConditionsPage />} />
            <Route path="/confidentialite" element={<ConfidentialitePage />} />
            
            <Route path="/influencer-dashboard" element={<InfluencerDashboardPage />} />
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </main>
        
        {!isAdminRoute && !isPaymentRoute && <Footer onNavigate={handleNavigate} />}

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
        <CreateListingModal isOpen={isCreateListingOpen} onClose={() => { setIsCreateListingOpen(false); setListingToEdit(null); setForceUpdateKey(k => k + 1); }} currentUser={user} listingToEdit={listingToEdit} />
        {isMessageModalOpen && <MessageModal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} currentUser={user} recipient={messageRecipient} />}
        {isContactAdminModalOpen && <ContactAdminModal isOpen={isContactAdminModalOpen} onClose={() => setIsContactAdminModalOpen(false)} user={user} />}
        <VerificationCheckModal isOpen={isVerificationModalOpen} onClose={() => setIsVerificationModalOpen(false)} />
      </div>
    </>
  );
}

export default AppContent;
