import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Eye, Check, X, Search } from 'lucide-react';

export default function AdminVerificationPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('account_verification')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Erreur", description: "Impossible de charger les demandes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const channel = supabase.channel('admin_verifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'account_verification' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleActionClick = (req, type) => {
    setSelectedRequest(req);
    setActionType(type);
    setAdminNotes(req.admin_notes || '');
    setIsActionModalOpen(true);
  };

  const submitAction = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('account_verification')
        .update({ 
          status: actionType, 
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Update profile status as well for easy access
      if (actionType === 'approved') {
        await supabase.from('profiles').update({ kyc_status: 'verified' }).eq('id', selectedRequest.user_id);
      }

      toast({ 
        title: actionType === 'approved' ? "Compte approuvé" : "Compte rejeté", 
        description: "Le statut a été mis à jour avec succès." 
      });
      setIsActionModalOpen(false);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const getSignedUrl = async (path) => {
    if (!path) return;
    try {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(path, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'ouvrir le document.", variant: "destructive" });
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const matchesSearch = req.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="badge-verified px-2 py-1 rounded-full text-xs font-medium">Approuvé</span>;
      case 'rejected': return <span className="badge-rejected px-2 py-1 rounded-full text-xs font-medium">Rejeté</span>;
      case 'pending': return <span className="badge-pending px-2 py-1 rounded-full text-xs font-medium">En attente</span>;
      default: return <span className="badge-unverified px-2 py-1 rounded-full text-xs font-medium">Non vérifié</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vérifications de compte</h1>
          <p className="text-muted-foreground">Gérez les documents d'identité des utilisateurs.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un utilisateur..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} size="sm">Tous</Button>
          <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')} size="sm">En attente</Button>
          <Button variant={filter === 'approved' ? 'default' : 'outline'} onClick={() => setFilter('approved')} size="sm">Approuvés</Button>
          <Button variant={filter === 'rejected' ? 'default' : 'outline'} onClick={() => setFilter('rejected')} size="sm">Rejetés</Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Aucune demande trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium">{req.profiles?.full_name || 'Utilisateur inconnu'}</div>
                      <div className="text-xs text-muted-foreground">{req.profiles?.email}</div>
                    </TableCell>
                    <TableCell>{new Date(req.created_at).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>
                      {req.document_url && (
                        <Button variant="ghost" size="sm" onClick={() => getSignedUrl(req.document_url)}>
                          <Eye className="h-4 w-4 mr-2" /> Voir
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleActionClick(req, 'approved')}>
                            <Check className="h-4 w-4 mr-1" /> Approuver
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleActionClick(req, 'rejected')}>
                            <X className="h-4 w-4 mr-1" /> Rejeter
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approved' ? 'Approuver le compte' : 'Rejeter le compte'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approved' 
                ? 'L\'utilisateur sera autorisé à publier.' 
                : 'Veuillez préciser la raison du rejet (optionnel).'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes de l'administrateur</label>
              <Input 
                value={adminNotes} 
                onChange={(e) => setAdminNotes(e.target.value)} 
                placeholder={actionType === 'rejected' ? 'Ex: Document flou, pièce expirée...' : 'Notes internes...'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>Annuler</Button>
            <Button 
              variant={actionType === 'approved' ? 'default' : 'destructive'} 
              onClick={submitAction}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}