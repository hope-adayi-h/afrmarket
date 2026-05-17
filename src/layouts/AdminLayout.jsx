import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import {
  Bell,
  Home,
  LogOut,
  Menu,
  FileText,
  Shield,
  BarChart2,
  Users,
  X,
  ShoppingBag,
  User as UserIcon,
  MessageSquare,
  ArrowLeft,
  Palette,
  CreditCard,
  Tag,
  Banknote,
  Percent,
  Crown,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const AdminSidebar = ({ isMobile, onLinkClick }) => {
  const navItems = [
    { href: "/administrateur", icon: Home, label: "Dashboard" },
    { href: "/administrateur/annonces", icon: ShoppingBag, label: "Annonces" },
    { href: "/administrateur/utilisateurs", icon: Users, label: "Utilisateurs" },
    { href: "/administrateur/plans", icon: Layers, label: "Plans d'abonnement" }, // New
    { href: "/administrateur/abonnements", icon: Crown, label: "Abonnés" }, 
    { href: "/administrateur/messages", icon: MessageSquare, label: "Messages" },
    { href: "/administrateur/notifications", icon: Bell, label: "Notifications" },
    { href: "/administrateur/paiements-config", icon: CreditCard, label: "Config Paiements" },
    { href: "/administrateur/paiements-dashboard", icon: Banknote, label: "Tableau Paiements" },
    { href: "/administrateur/codes-promo", icon: Tag, label: "Codes Promo" },
    { href: "/administrateur/commissions", icon: Percent, label: "Commissions" },
    { href: "/administrateur/statistiques", icon: BarChart2, label: "Statistiques" },
    { href: "/administrateur/audit-log", icon: FileText, label: "Audit Log" },
    { href: "/administrateur/personnalisation", icon: Palette, label: "Personnalisation" },
  ];

  return (
    <nav className="flex flex-col gap-2 px-2 py-4">
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.href}
          end={item.href === "/administrateur"}
          onClick={onLinkClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isActive && "bg-muted text-primary"
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const isDashboard = location.pathname === '/administrateur';

  const fetchUnreadCount = useCallback(async () => {
    if (profile?.role === 'admin') {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      if (!error) {
        setUnreadNotifications(count);
      }
    }
  }, [profile]);
  
  useEffect(() => {
      fetchUnreadCount();
      const channel = supabase
        .channel('public:notifications:layout')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
            fetchUnreadCount();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
  }, [fetchUnreadCount]);
  
  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  };
  
  const handleNotificationsClick = () => {
      navigate('/administrateur/notifications');
  }

  const handleGoBack = () => {
    if (window.history.length > 2) { 
      navigate(-1);
    } else {
      navigate('/administrateur');
    }
  };
  
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <NavLink to="/" className="flex items-center gap-2">
              <img 
                src="https://horizons-cdn.hostinger.com/c735c746-5412-405c-bba1-5d6b13dc1adf/0340e062e86869ccc0abcd4ae0d1358b.png"
                alt="AFR MARKET Admin" 
                className="h-10 w-auto object-contain"
              />
            </NavLink>
          </div>
          <div className="flex-1"><AdminSidebar /></div>
        </div>
      </div>
      
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Button variant="outline" size="icon" className="shrink-0 md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" /><span className="sr-only">Toggle navigation menu</span>
          </Button>
          
          <div className="w-full flex-1 flex items-center gap-2">
            {!isDashboard && (
              <Button variant="ghost" size="icon" onClick={handleGoBack} className="hover:bg-muted">
                <ArrowLeft className="h-5 w-5" /><span className="sr-only">Retour</span>
              </Button>
            )}
          </div>
          
          <div className="relative">
              <Button variant="ghost" size="icon" onClick={handleNotificationsClick}>
                  <Bell className="h-5 w-5" />
              </Button>
              {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
              )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10"><AvatarImage src={profile?.avatar_url} alt={profile?.full_name} /><AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback></Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal"><div className="flex flex-col space-y-1"><p className="text-sm font-medium leading-none">{profile?.full_name}</p><p className="text-xs leading-none text-muted-foreground">{user?.email}</p></div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/')}><Home className="mr-2 h-4 w-4" /><span>Site principal</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}><UserIcon className="mr-2 h-4 w-4" /><span>Mon Profil</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-500/10"><LogOut className="mr-2 h-4 w-4" /><span>Déconnexion</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {sidebarOpen && (
             <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setSidebarOpen(false)}>
                <div className="fixed left-0 top-0 h-full w-3/4 max-w-sm bg-background border-r" onClick={e => e.stopPropagation()}>
                    <div className="flex h-14 items-center border-b px-4">
                        <NavLink to="/" className="flex items-center gap-2">
                           <img 
                            src="https://horizons-cdn.hostinger.com/c735c746-5412-405c-bba1-5d6b13dc1adf/0340e062e86869ccc0abcd4ae0d1358b.png"
                            alt="AFR MARKET Admin" 
                            className="h-10 w-auto object-contain"
                          />
                        </NavLink>
                        <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></Button>
                    </div>
                    <div className="flex-1 overflow-y-auto"><AdminSidebar onLinkClick={() => setSidebarOpen(false)} /></div>
                </div>
            </div>
        )}
        
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;