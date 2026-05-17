import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Trash2, Clock, Search, ExternalLink, ChevronDown, MessageSquare as MessageSquareWarning, RefreshCcw, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminListingsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // Default to pending
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [listingToReject, setListingToReject] = useState(null);

  const fetchListings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id, title, description, price, status, images, created_at, rejection_reason,
          profiles:user_id ( full_name )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de récupérer la liste des annonces.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    fetchListings();
    
    const channel = supabase.channel('realtime-admin-listings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => fetchListings())
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchListings]);

  const handleUpdateStatus = async (listing, newStatus, reason = null) => {
    setProcessingId(listing.id);
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'rejected') {
        updateData.rejection_reason = reason;
      }
      if (newStatus === 'pending') {
          updateData.rejection_reason = null; // Clear reason on restore
      }

      const { error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listing.id);

      if (error) throw error;

      await supabase.from('admin_audit_log').insert({
          admin_id: adminUser.id,
          action: newStatus === 'approved' ? 'listing_approved' : newStatus === 'rejected' ? 'listing_rejected' : 'listing_status_changed',
          target_type: 'listing',
          target_id: listing.id,
          details: { title: listing.title, reason, newStatus }
      });
      
      toast({
        title: "Statut mis à jour",
        description: `L'annonce a été marquée comme "${newStatus}".`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
      setRejectionModalOpen(false);
      setListingToReject(null);
      setRejectionReason('');
    }
  };
  
  const openRejectionModal = (listing) => {
    setListingToReject(listing);
    setRejectionModalOpen(true);
  };
  
  const handleRejectSubmit = () => {
    if (rejectionReason.trim() === '') {
        toast({ title: "Raison requise", description: "Veuillez fournir une raison pour le rejet.", variant: "destructive" });
        return;
    }
    if (listingToReject) {
        handleUpdateStatus(listingToReject, 'rejected', rejectionReason);
    }
  }

  const handleDeleteListing = async (listing) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette annonce ? Cette action est irréversible.")) return;
    
    setProcessingId(listing.id);
    try {
      const { error } = await supabase.from('listings').delete().eq('id', listing.id);
      if (error) throw error;

      await supabase.from('admin_audit_log').insert({
          admin_id: adminUser.id,
          action: 'listing_deleted',
          target_type: 'listing',
          target_id: listing.id,
          details: { title: listing.title }
      });
      
      toast({
        title: "Annonce supprimée",
        description: "L'annonce a été supprimée de la base de données.",
      });
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'annonce.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      const matchesFilter = filter === 'all' || listing.status === filter;
      const matchesSearch = searchTerm === '' ||
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [listings, filter, searchTerm]);

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: { style: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800", icon: <Clock size={12} className="mr-1.5" />, label: "En attente" },
      approved: { style: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800", icon: <CheckCircle size={12} className="mr-1.5" />, label: "Approuvée" },
      rejected: { style: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800", icon: <XCircle size={12} className="mr-1.5" />, label: "Rejetée" },
    };
    const config = statusConfig[status] || { style: 'bg-gray-100', icon: null, label: status };
    return (
      <div className={`flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${config.style}`}>
        {config.icon}
        {config.label}
      </div>
    );
  };
  
  const FilterButton = ({ value, label, count }) => (
    <Button
      variant={filter === value ? 'default' : 'outline'}
      onClick={() => setFilter(value)}
      className="h-9 px-3 text-xs sm:text-sm sm:h-10 sm:px-4"
    >
      {label}
      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${filter === value ? 'bg-background/20' : 'bg-muted'}`}>{count}</span>
    </Button>
  );

  return (
    <>
      <Helmet>
        <title>Admin - Gestion des Annonces</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Annonces</h1>
            <p className="text-muted-foreground">Validez, rejetez ou supprimez les annonces.</p>
          </div>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <input
              type="text"
              placeholder="Rechercher une annonce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-3 py-2 bg-background border border-input rounded-md focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-border">
          <FilterButton value="pending" label="En attente" count={listings.filter(l => l.status === 'pending').length} />
          <FilterButton value="approved" label="Approuvées" count={listings.filter(l => l.status === 'approved').length} />
          <FilterButton value="rejected" label="Rejetées" count={listings.filter(l => l.status === 'rejected').length} />
          <FilterButton value="all" label="Toutes" count={listings.length} />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Annonce</TableHead>
                    <TableHead>Vendeur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredListings.length > 0 ? filteredListings.map(listing => (
                      <React.Fragment key={listing.id}>
                        <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b hover:bg-muted/50 transition-colors">
                          <TableCell className="px-2 py-2 text-center">
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setExpandedRow(expandedRow === listing.id ? null : listing.id)}>
                              <ChevronDown className={`h-4 w-4 transition-transform ${expandedRow === listing.id ? 'rotate-180' : ''}`} />
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium truncate max-w-xs">{listing.title}</TableCell>
                          <TableCell className="text-muted-foreground">{listing.profiles?.full_name || 'N/A'}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(listing.created_at).toLocaleDateString()}</TableCell>
                          <TableCell><StatusBadge status={listing.status} /></TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                             {processingId === listing.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                               <>
                                {listing.status === 'pending' && (
                                  <>
                                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleUpdateStatus(listing, 'approved')}><CheckCircle size={14} className="mr-1" />Approuver</Button>
                                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openRejectionModal(listing)}><XCircle size={14} className="mr-1" />Rejeter</Button>
                                  </>
                                )}
                                {listing.status === 'rejected' && (
                                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleUpdateStatus(listing, 'pending')}><RefreshCcw size={14} className="mr-1" />Restaurer</Button>
                                )}
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate(`/listing/${listing.id}`)}><ExternalLink className="h-4 w-4 text-muted-foreground" /></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleDeleteListing(listing)}><Trash2 size={14} /></Button>
                               </>
                             )}
                            </div>
                          </TableCell>
                        </motion.tr>
                        <AnimatePresence>
                          {expandedRow === listing.id && (
                            <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <TableCell colSpan={6} className="p-0">
                                <div className="bg-muted/30 p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 space-y-4">
                                      <div>
                                          <h4 className="font-semibold text-sm mb-1">Description</h4>
                                          <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">{listing.description}</p>
                                      </div>
                                      {listing.rejection_reason && (
                                          <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 rounded-lg p-3">
                                              <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><MessageSquareWarning size={16}/> Raison du Rejet</h4>
                                              <p className="text-sm">{listing.rejection_reason}</p>
                                          </div>
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-sm mb-2">Images</h4>
                                      <div className="grid grid-cols-3 gap-2">
                                        {listing.images && listing.images.length > 0 ? (
                                          listing.images.slice(0, 6).map((img, idx) => (
                                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                                              <img src={img} alt={`Listing image ${idx + 1}`} className="aspect-square w-full rounded-md object-cover hover:ring-2 ring-primary transition-all"/>
                                            </a>
                                          ))
                                        ) : (
                                          <div className="col-span-3 flex flex-col items-center justify-center text-muted-foreground bg-slate-100 dark:bg-slate-800 aspect-square rounded-md">
                                             <ImageIcon size={24} />
                                             <p className="text-xs mt-1">Aucune image</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    )) : (
                       <tr><td colSpan="6" className="text-center py-12"><p className="text-muted-foreground">Aucune annonce à afficher pour ce filtre.</p></td></tr>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
      
      <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Rejeter l'annonce</DialogTitle>
                <DialogDescription>Veuillez spécifier la raison du rejet. Cette information sera visible par le vendeur.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="rejection-reason">Raison du rejet</Label>
                <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ex: Photos de mauvaise qualité, description incomplète..."
                    className="mt-2 min-h-[100px]"
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setRejectionModalOpen(false)}>Annuler</Button>
                <Button variant="destructive" onClick={handleRejectSubmit} disabled={processingId !== null}>
                  {processingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirmer le Rejet
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminListingsPage;