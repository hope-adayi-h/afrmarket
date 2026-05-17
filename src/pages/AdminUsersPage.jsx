import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { Users, Search, Shield, Loader2, Trash2, Phone, MapPin, FileText, Calendar as CalendarIcon, Package, Check, X, Eye, UserX, UserCheck, ChevronDown, Star, Tag, Award, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const AdminUsersPage = () => {
  const { toast } = useToast();
  const { user: adminUser, profile: adminProfile, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [users, setUsers] = useState([]);
  const [currentAdminRole, setCurrentAdminRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);
  
  const [actionUser, setActionUser] = useState(null);
  const [isRoleConfirmOpen, setIsRoleConfirmOpen] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [isBanConfirmOpen, setIsBanConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isInfluencerModalOpen, setIsInfluencerModalOpen] = useState(false);
  const [isPromoCodeModalOpen, setIsPromoCodeModalOpen] = useState(false);
  
  // Add Admin By Email Modal
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState('');

  // Simplified Promo Code Form for Quick Assign
  const [promoData, setPromoData] = useState({
    code: '',
    commission_percentage: 10,
    discount_value: 5
  });

  const fetchUsers = useCallback(async () => {
    if (authLoading) return;

    if (!adminUser || !['admin', 'super_admin'].includes(adminProfile?.role)) {
      setError('Accès non autorisé.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('get_user_details_for_admin');
      
      if (rpcError) throw rpcError;
      
      if (data && data.length > 0) {
        setUsers(data);
        setCurrentAdminRole(data[0].current_admin_role);
      } else {
        setUsers([]);
      }
      
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Impossible de charger les utilisateurs.');
      toast({ title: 'Erreur', description: err.message || 'Une erreur est survenue.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [adminUser, adminProfile, authLoading, toast]);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    fetchUsers();
    
    const channel = supabase.channel('profiles-realtime-users-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsers, authLoading]);
  
  useEffect(() => {
    if (users.length > 0) {
      const userIdToView = searchParams.get('view');
      if (userIdToView) {
        const userToView = users.find(u => u.id === userIdToView);
        if (userToView) {
          openDetailsModal(userToView);
          searchParams.delete('view');
          setSearchParams(searchParams, { replace: true });
        }
      }
    }
  }, [users, searchParams, setSearchParams]);

  const filteredUsers = useMemo(() => users.filter(
    (user) =>
      (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ), [users, searchTerm]);
  
  const isUserBanned = (user) => user && user.banned_until && new Date(user.banned_until) > new Date();

  const handleSetRole = async () => {
    if (!actionUser || !targetRole) return;
    setProcessingId(actionUser.id);
    setIsRoleConfirmOpen(false);

    try {
      const { error } = await supabase.from('profiles').update({ role: targetRole }).eq('id', actionUser.id);
      if (error) throw error;
      
      await supabase.from('admin_audit_log').insert({ admin_id: adminUser.id, action: `user_role_changed`, target_type: 'user', target_id: actionUser.id, details: { from: actionUser.role, to: targetRole } });
      
      toast({ title: 'Rôle mis à jour avec succès' });
      setIsDetailsModalOpen(false);
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le rôle.', variant: 'destructive' });
    } finally {
      setProcessingId(null);
      setActionUser(null);
      setTargetRole('');
    }
  };
  
  const handleAddAdminByEmail = async () => {
    if (!adminEmailInput.trim()) return;
    setProcessingId('add-admin');
    
    try {
      // 1. Find the user in the currently loaded list first (client-side optimization)
      let userToPromote = users.find(u => u.email?.toLowerCase() === adminEmailInput.toLowerCase().trim());
      
      // If not found in loaded list (unlikely if list is full, but possible if filtered/paginated in future),
      // ideally we would call an RPC to find by email, but get_user_details_for_admin returns all.
      // If user is not in the list, they probably don't exist or haven't completed signup.
      
      if (!userToPromote) {
         toast({ title: "Utilisateur introuvable", description: "Aucun utilisateur inscrit avec cet email.", variant: "destructive" });
         setProcessingId(null);
         return;
      }
      
      // 2. Update role
      const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userToPromote.id);
      if (error) throw error;
      
      await supabase.from('admin_audit_log').insert({ admin_id: adminUser.id, action: `user_promoted_admin`, target_type: 'user', target_id: userToPromote.id, details: { email: adminEmailInput } });
      
      toast({ title: "Succès !", description: `${userToPromote.full_name} est maintenant administrateur.` });
      setIsAddAdminModalOpen(false);
      setAdminEmailInput('');
      
    } catch (err) {
      console.error(err);
      toast({ title: 'Erreur', description: "Impossible de promouvoir l'utilisateur.", variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  }

  const handleToggleBan = async () => {
    if (!actionUser) return;
    setProcessingId(actionUser.id);
    setIsBanConfirmOpen(false);
    const shouldBan = !isUserBanned(actionUser);
    try {
      const { error } = await supabase.functions.invoke('toggle-user-ban', { body: JSON.stringify({ userId: actionUser.id, ban: shouldBan }) });
      if (error) throw new Error(error.message);
      await supabase.from('admin_audit_log').insert({ admin_id: adminUser.id, action: shouldBan ? 'user_disabled' : 'user_enabled', target_type: 'user', target_id: actionUser.id, details: { full_name: actionUser.full_name } });
      toast({ title: `Utilisateur ${shouldBan ? 'désactivé' : 'réactivé'} avec succès` });
      setIsDetailsModalOpen(false);
    } catch(err) {
       toast({ title: 'Erreur', description: err.message || 'Impossible de modifier le statut du compte.', variant: 'destructive' });
    } finally {
      setProcessingId(null);
      setActionUser(null);
    }
  };

  const handleToggleInfluencer = async () => {
    if (!actionUser) return;
    const newStatus = !actionUser.is_influencer;
    
    try {
      const { error } = await supabase.from('profiles').update({ is_influencer: newStatus }).eq('id', actionUser.id);
      if (error) throw error;
      toast({ title: 'Succès', description: `Statut influenceur ${newStatus ? 'activé' : 'désactivé'}.` });
      setUsers(prev => prev.map(u => u.id === actionUser.id ? { ...u, is_influencer: newStatus } : u));
      setIsInfluencerModalOpen(false);
      setIsDetailsModalOpen(false);
    } catch(err) {
      toast({ title: 'Erreur', description: 'Mise à jour échouée.', variant: 'destructive' });
    }
  };
  
  const handleCreateQuickPromo = async () => {
    if (!actionUser || !promoData.code) return;
    setProcessingId(actionUser.id);
    
    try {
      const { error } = await supabase.from('promo_codes').insert({
        code: promoData.code.toUpperCase(),
        influencer_id: actionUser.id,
        influencer_name: actionUser.full_name,
        influencer_email: actionUser.email,
        commission_percentage: promoData.commission_percentage,
        discount_type: 'percentage',
        discount_value: promoData.discount_value,
        is_active: true
      });
      
      if (error) throw error;
      toast({ title: 'Code Promo Créé', description: `Le code ${promoData.code.toUpperCase()} a été assigné.` });
      setIsPromoCodeModalOpen(false);
      setIsDetailsModalOpen(false);
    } catch(err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!actionUser) return;
    setProcessingId(actionUser.id);
    setIsDeleteConfirmOpen(false);
    try {
      const { error } = await supabase.functions.invoke('delete-user', { body: { userIdToDelete: actionUser.id } });
      if (error) throw new Error(error.message);
      await supabase.from('admin_audit_log').insert({ admin_id: adminUser.id, action: 'user_deleted', target_type: 'user', target_id: actionUser.id, details: { full_name: actionUser.full_name, email: actionUser.email } });
      toast({ title: "Utilisateur supprimé avec succès" });
      setIsDetailsModalOpen(false);
    } catch (err) {
      toast({ title: 'Erreur', description: err.message || "Impossible de supprimer l'utilisateur.", variant: 'destructive' });
    } finally {
      setProcessingId(null);
      setActionUser(null);
    }
  }

  const openDetailsModal = (user) => { setActionUser(user); setIsDetailsModalOpen(true); };
  const openRoleConfirm = (newRole) => { setTargetRole(newRole); setIsRoleConfirmOpen(true); };
  const openBanConfirm = () => setIsBanConfirmOpen(true);
  const openDeleteConfirm = () => setIsDeleteConfirmOpen(true);
  const openInfluencerConfirm = (user) => { setActionUser(user); setIsInfluencerModalOpen(true); };
  const openPromoCodeModal = (user) => { 
    setActionUser(user); 
    setPromoData({ code: `${getInitials(user.full_name)}2024`, commission_percentage: 10, discount_value: 5 });
    setIsPromoCodeModalOpen(true); 
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  const formatDate = (dateString) => {
    try {
      return dateString ? format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'N/A';
    } catch (e) {
      return 'Date invalide';
    }
  };
  
  const canManageUser = (userToManage) => {
    if (!userToManage || !adminUser) return false;
    if (userToManage.id === adminUser.id) return false;
    if (currentAdminRole === 'super_admin') return true;
    if (currentAdminRole === 'admin') return userToManage.role === 'user';
    return false;
  }
  
  const canManageRole = (userToManage) => canManageUser(userToManage) && currentAdminRole === 'super_admin';
  const canDeleteUser = (userToManage) => canManageUser(userToManage) && currentAdminRole === 'super_admin';

  if (authLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <>
      <Helmet><title>Admin - Gestion des Utilisateurs</title></Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
            <p className="text-muted-foreground">Gérez les utilisateurs, rôles, et statuts influenceurs.</p>
          </div>
          <div className="flex items-center gap-2">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-64 pl-9 pr-3 py-2 bg-background border border-input rounded-md focus:border-primary focus:outline-none" />
             </div>
             {currentAdminRole === 'super_admin' && (
               <Button onClick={() => setIsAddAdminModalOpen(true)} variant="outline" className="whitespace-nowrap">
                 <UserPlus className="mr-2 h-4 w-4" /> Admin
               </Button>
             )}
          </div>
        </div>

        {error && <Card className="border-destructive"><CardContent className="pt-6 text-destructive flex items-center gap-3"><X className="h-5 w-5" /><p className="font-medium">{error}</p></CardContent></Card>}

        <Card>
          <CardHeader><CardTitle>Utilisateurs Inscrits ({filteredUsers.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Utilisateur</TableHead><TableHead>Email</TableHead><TableHead>Rôle</TableHead><TableHead>Statut</TableHead><TableHead>Influenceur</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredUsers.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12"><Users className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-4 text-muted-foreground">Aucun utilisateur trouvé</p></TableCell></TableRow> : filteredUsers.map((user) => (
                        <motion.tr layout key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b hover:bg-muted/50 transition-colors">
                          <TableCell><div className="flex items-center space-x-3"><Avatar className="h-10 w-10"><AvatarImage src={user.avatar_url} /><AvatarFallback>{getInitials(user.full_name)}</AvatarFallback></Avatar><div className="font-medium">{user.full_name || 'Sans nom'}</div></div></TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell><span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', user.role === 'super_admin' ? 'bg-red-200 text-red-900' : user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800')}>{user.role || 'user'}</span></TableCell>
                          <TableCell><span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', isUserBanned(user) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>{isUserBanned(user) ? 'Désactivé' : 'Actif'}</span></TableCell>
                          <TableCell>
                            {user.is_influencer ? 
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Star className="h-3 w-3 fill-current" /> Influenceur</span> 
                              : <span className="text-muted-foreground text-xs">-</span>
                            }
                          </TableCell>
                          <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => openDetailsModal(user)}><Eye className="h-4 w-4 mr-2" />Voir</Button></TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Admin Modal */}
      <Dialog open={isAddAdminModalOpen} onOpenChange={setIsAddAdminModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un Administrateur</DialogTitle>
            <DialogDescription>
              Entrez l'email d'un utilisateur existant pour lui donner les droits d'administration.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="admin-email">Email de l'utilisateur</Label>
            <Input 
              id="admin-email" 
              placeholder="utilisateur@exemple.com" 
              value={adminEmailInput}
              onChange={(e) => setAdminEmailInput(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddAdminModalOpen(false)}>Annuler</Button>
            <Button onClick={handleAddAdminByEmail} disabled={!adminEmailInput || processingId === 'add-admin'}>
              {processingId === 'add-admin' ? <Loader2 className="animate-spin h-4 w-4" /> : 'Promouvoir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {actionUser && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader><DialogTitle>Détails de l'utilisateur</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                    <div className="md:col-span-1 flex flex-col items-center text-center"><Avatar className="h-24 w-24 mb-4"><AvatarImage src={actionUser.avatar_url} alt={actionUser.full_name} /><AvatarFallback className="text-3xl">{getInitials(actionUser.full_name)}</AvatarFallback></Avatar><h3 className="font-bold text-lg">{actionUser.full_name}</h3><p className="text-sm text-muted-foreground">{actionUser.email}</p></div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <div className="flex items-center gap-2"><CalendarIcon size={14} /><span>Inscrit: {formatDate(actionUser.created_at)}</span></div>
                        <div className="flex items-center gap-2"><Shield size={14} /><span>Rôle: <span className="font-semibold">{actionUser.role}</span></span></div>
                        <div className="flex items-center gap-2"><Award size={14} /><span>Influenceur: <span className="font-semibold">{actionUser.is_influencer ? 'Oui' : 'Non'}</span></span></div>
                        <div className="flex items-center gap-2"><Package size={14} /><span>Annonces: <span className="font-semibold">{actionUser.listings_count}</span></span></div>
                        <div className="flex items-center gap-2"><MapPin size={14} /><span>Lieu: <span className="font-semibold">{actionUser.location || 'N/A'}</span></span></div>
                        <div className="flex items-center gap-2">{actionUser.kyc_status === 'verified' ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-red-500"/>}<span>KYC: <span className="font-semibold">{actionUser.kyc_status || 'non vérifié'}</span></span></div>
                        <div className="col-span-2 flex items-start gap-2"><FileText size={14} className="mt-0.5"/><span>Bio: <p className="inline font-semibold">{actionUser.bio || 'Non renseignée'}</p></span></div>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:justify-between">
                  <div>
                    {canDeleteUser(actionUser) && (
                      <Button variant="destructive" size="sm" onClick={openDeleteConfirm} disabled={processingId === actionUser.id}>
                        <Trash2 size={14} className="mr-2" /> Supprimer
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end">
                      <Button variant="secondary" size="sm" onClick={() => openInfluencerConfirm(actionUser)}>
                        {actionUser.is_influencer ? 'Retirer Influenceur' : 'Marquer Influenceur'}
                      </Button>
                      
                      {actionUser.is_influencer && (
                        <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => openPromoCodeModal(actionUser)}>
                          <Tag className="h-3 w-3 mr-1" /> Assigner Code Promo
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" disabled={!canManageUser(actionUser)}>
                            Actions <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Compte</DropdownMenuLabel>
                          <DropdownMenuItem onClick={openBanConfirm}>{isUserBanned(actionUser) ? 'Réactiver le compte' : 'Désactiver le compte'}</DropdownMenuItem>
                          {canManageRole(actionUser) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Rôle</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openRoleConfirm('user')} disabled={actionUser.role === 'user'}>Utilisateur</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRoleConfirm('admin')} disabled={actionUser.role === 'admin'}>Admin</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRoleConfirm('super_admin')} disabled={actionUser.role === 'super_admin'}>Super Admin</DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isInfluencerModalOpen} onOpenChange={setIsInfluencerModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le statut Influenceur</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous {actionUser?.is_influencer ? 'retirer' : 'ajouter'} le statut d'influenceur pour <b>{actionUser?.full_name}</b> ?
              {!actionUser?.is_influencer && " Cela vous permettra ensuite de lui assigner un code promo unique."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleInfluencer}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPromoCodeModalOpen} onOpenChange={setIsPromoCodeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau Code Promo pour {actionUser?.full_name}</DialogTitle>
            <DialogDescription>Créez rapidement un code promo lié à cet influenceur.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="promo-code">Code (Uppercase)</Label>
              <Input id="promo-code" value={promoData.code} onChange={(e) => setPromoData({...promoData, code: e.target.value.toUpperCase()})} placeholder="EX: ALEX2025" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="commission">Commission (%)</Label>
                <Input id="commission" type="number" value={promoData.commission_percentage} onChange={(e) => setPromoData({...promoData, commission_percentage: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discount">Réduction Client (%)</Label>
                <Input id="discount" type="number" value={promoData.discount_value} onChange={(e) => setPromoData({...promoData, discount_value: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoCodeModalOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateQuickPromo} disabled={processingId !== null}>Créer le code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isRoleConfirmOpen} onOpenChange={setIsRoleConfirmOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Changement de rôle</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr de vouloir changer le rôle en <span className="font-bold">{targetRole}</span> ?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleSetRole}>Confirmer</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBanConfirmOpen} onOpenChange={setIsBanConfirmOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{isUserBanned(actionUser) ? 'Activation' : 'Désactivation'}</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr de vouloir {isUserBanned(actionUser) ? 'réactiver' : 'désactiver'} ce compte ?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleToggleBan} className={cn(isUserBanned(actionUser) ? '' : buttonVariants({ variant: "destructive" }))}>Confirmer</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle className="text-destructive">Action Irréversible</AlertDialogTitle><AlertDialogDescription>Êtes-vous absolument certain de vouloir supprimer cet utilisateur ? Toutes ses données seront perdues.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDeleteUser} className={buttonVariants({ variant: "destructive" })}>Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminUsersPage;