import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Plus, LogOut, Heart, User, MessageSquare, Shield, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Header = ({ currentUser, onLoginClick, onLogout, onCreateListing, onNavigate }) => {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('get_my_admin_messages');
      if (error) throw error;
      const unread = data.filter(msg => !msg.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching unread messages count:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    
    const channel = supabase
      .channel('header-admin-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, fetchUnreadCount)
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUnreadCount]);
  
  useEffect(() => {
    if (location.pathname === '/messages') {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'Annonces', path: '/all-listings' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' },
  ];
  
  const getInitials = (name) => {
    if (!name) return '...';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled || !isHome || isMobileMenuOpen ? "bg-background/95 backdrop-blur-md shadow-md border-b border-border/50 py-2" : "bg-transparent py-4 md:py-6"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <NavLink to="/" className="flex items-center group">
            <img 
              src="https://horizons-cdn.hostinger.com/c735c746-5412-405c-bba1-5d6b13dc1adf/0340e062e86869ccc0abcd4ae0d1358b.png" 
              alt="AFR MARKET" 
              className="h-16 md:h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
            />
          </NavLink>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <NavLink key={link.name} to={link.path} className={({isActive}) => cn("text-base font-semibold transition-colors hover:text-primary relative group py-2", isActive ? "text-primary" : (isScrolled || !isHome ? "text-foreground/80" : "text-white shadow-black/50 drop-shadow-sm"))}>
                {link.name}
                <span className={cn("absolute bottom-0 left-0 w-full h-0.5 bg-primary transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100", location.pathname === link.path && "scale-x-100")} />
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {currentUser ? (
              <>
                <Button onClick={onCreateListing} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/20 border-0 font-bold px-6 h-11 rounded-xl transition-all transform hover:scale-105">
                  <Plus size={20} className="mr-2" /> Publier
                </Button>

                <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-full" onClick={() => onNavigate('messages')}>
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0 ring-2 ring-offset-2 ring-transparent hover:ring-primary/50 transition-all">
                      <Avatar className="h-11 w-11 border-2 border-primary/20 shadow-sm">
                        <AvatarImage src={currentUser.avatar_url} alt={currentUser.full_name} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{getInitials(currentUser.full_name)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 p-2 mt-2" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-3 bg-muted/30 rounded-lg mb-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-base font-bold leading-none">{currentUser.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">{currentUser.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onNavigate('profile')} className="cursor-pointer py-3 text-sm font-medium"><User className="mr-3 h-5 w-5 text-primary" />Mon Profil</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNavigate('messages')} className="cursor-pointer py-3 text-sm font-medium flex justify-between items-center">
                      <div className="flex items-center"><MessageSquare className="mr-3 h-5 w-5 text-blue-500" />Messages</div>
                      {unreadCount > 0 && <span className="h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">{unreadCount}</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNavigate('favorites')} className="cursor-pointer py-3 text-sm font-medium"><Heart className="mr-3 h-5 w-5 text-red-500" />Mes Favoris</DropdownMenuItem>
                    
                    {currentUser.is_influencer && (
                         <DropdownMenuItem onClick={() => navigate('/influencer-dashboard')} className="cursor-pointer py-3 text-sm font-medium"><User className="mr-3 h-5 w-5 text-purple-500" />Espace Influenceur</DropdownMenuItem>
                    )}

                    {currentUser.role === 'admin' && (<DropdownMenuItem onClick={() => navigate('/administrateur')} className="cursor-pointer py-3 text-sm font-medium"><Shield className="mr-3 h-5 w-5 text-green-500" />Administration</DropdownMenuItem>)}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout} className="cursor-pointer py-3 text-red-600 focus:text-red-600 font-medium"><LogOut className="mr-3 h-5 w-5" />Se déconnecter</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={onLoginClick} className={cn("font-bold px-6 h-11 rounded-xl shadow-md transition-all", isScrolled || !isHome ? "bg-primary text-primary-foreground" : "bg-white text-slate-900 hover:bg-gray-100")}>
                <User size={20} className="mr-2" /> Se connecter
              </Button>
            )}
          </div>
          <button className={cn("md:hidden p-2 rounded-lg transition-colors z-50", isScrolled || !isHome || isMobileMenuOpen ? "text-foreground hover:bg-accent" : "text-white hover:bg-white/10")} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Menu">
            {isMobileMenuOpen ? <X size={32} strokeWidth={2.5} /> : <Menu size={32} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: '100vh' }} exit={{ opacity: 0, height: 0 }} className="md:hidden fixed inset-x-0 top-[68px] bg-background border-t border-border/50 overflow-y-auto pb-24">
            <div className="container mx-auto px-4 py-6 flex flex-col gap-6">
              {currentUser ? (
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                   <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
                    <AvatarImage src={currentUser.avatar_url} alt={currentUser.full_name} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">{getInitials(currentUser.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold truncate">{currentUser.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{currentUser.email}</p>
                    <Button variant="link" onClick={() => onNavigate('profile')} className="p-0 h-auto text-primary font-semibold mt-1">Voir mon profil</Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-gradient-to-br from-primary/10 to-orange-100/10 dark:from-primary/20 dark:to-orange-800/10 rounded-2xl border border-primary/20 dark:border-primary/30 text-center">
                  <h3 className="text-xl font-bold mb-2">Bienvenue !</h3>
                  <p className="text-muted-foreground mb-4 text-base">Connectez-vous pour une expérience complète.</p>
                  <Button onClick={onLoginClick} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 text-lg rounded-xl shadow-lg">Se connecter / S'inscrire</Button>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Navigation</p>
                {navLinks.map((link) => <NavLink key={link.name} to={link.path} className={({isActive}) => cn("flex items-center p-4 rounded-xl text-lg font-medium transition-colors active:scale-[0.98]", isActive ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted text-foreground")}>{link.name}</NavLink>)}
              </div>
              {currentUser && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Mon Compte</p>
                  <Button onClick={onCreateListing} className="w-full justify-start bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-6 text-lg rounded-xl shadow-md mb-3"><Plus className="mr-3 h-6 w-6" />Déposer une annonce</Button>
                  <Button onClick={() => onNavigate('messages')} variant="outline" className="w-full justify-start py-6 text-lg rounded-xl font-medium border-border/60 bg-background flex justify-between items-center">
                    <div className="flex items-center"><MessageSquare className="mr-3 h-5 w-5 text-blue-500" />Messages</div>
                    {unreadCount > 0 && <span className="h-6 w-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">{unreadCount}</span>}
                  </Button>
                  <Button onClick={() => onNavigate('favorites')} variant="outline" className="w-full justify-start py-6 text-lg rounded-xl font-medium border-border/60 bg-background"><Heart className="mr-3 h-5 w-5 text-red-500" />Mes Favoris</Button>
                  
                  {currentUser.is_influencer && (
                     <Button onClick={() => navigate('/influencer-dashboard')} variant="outline" className="w-full justify-start py-6 text-lg rounded-xl font-medium border-border/60 bg-background"><User className="mr-3 h-5 w-5 text-purple-500" />Espace Influenceur</Button>
                  )}

                  {currentUser.role === 'admin' && (<Button onClick={() => navigate('/administrateur')} variant="outline" className="w-full justify-start py-6 text-lg rounded-xl font-medium border-border/60 bg-background"><Shield className="mr-3 h-5 w-5 text-green-500" />Administration</Button>)}
                  <Button onClick={onLogout} variant="ghost" className="w-full justify-start py-6 text-lg rounded-xl font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><LogOut className="mr-3 h-5 w-5" />Déconnexion</Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;