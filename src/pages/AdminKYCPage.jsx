import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Check, X, Search, FileText } from 'lucide-react';

export default function AdminKYCPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approved' or 'rejected'
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Viewing Modal state
  const [viewingRequest, setViewingRequest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [signedUrls, setSignedUrls] = useState({ selfie: null, front: null, back: null });
  const [loadingUrls, setLoadingUrls] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kyc')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching KYC requests:", error);
      toast({ title: "Erreur", description: "Impossible de charger les demandes KYC.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
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
        .from('kyc')
        .update({ 
          status: actionType, 
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({ 
        title: actionType === 'approved' ? "Demande approuvée" : "Demande rejetée", 
        description: "Le statut a été mis à jour avec succès." 
      });
      setIsActionModalOpen(false);
      setIsViewModalOpen(false);
      fetchRequests();
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const getSignedUrl = async (path) => {
    if (!path) return null;
    try {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(path, 3600); // 1 hour valid
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error("Error generating signed url:", error);
      return null;
    }
  };

  const handleViewClick = async (req) => {
    setViewingRequest(req);
    setIsViewModalOpen(true);
    setLoadingUrls(true);
    setSignedUrls({ selfie: null, front: null, back: null });

    const [selfie, front, back] = await Promise.all([
      getSignedUrl(req.selfie_url),
      getSignedUrl(req.id_front_url),
      getSignedUrl(req.id_back_url)
    ]);

    setSignedUrls({ selfie, front, back });
    setLoadingUrls(false);
  };

  const filteredRequests = requests.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const matchesSearch = req.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500 hover:bg-green-600">Approuvé</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejeté</Badge>;
      default: return <Badge variant="secondary">En attente</Badge>;
    }
  };

  const getDocTypeLabel = (req) => {
    if (!req) return '';
    if (req.document_type === 'cni') return 'Carte Nationale';
    if (req.document_type === 'passeport') return 'Passeport';
    if (req.document_type === 'autre') return req.document_type_label || 'Autre';
    return 'Document';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vérifications KYC</h1>
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
        <div className="flex gap-2 w-full sm:w-auto">
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
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Détails</TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {getDocTypeLabel(req)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleViewClick(req)}>
                        <Eye className="h-4 w-4 mr-2" /> Examiner
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleActionClick(req, 'approved')}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleActionClick(req, 'rejected')}>
                            <X className="h-4 w-4" />
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

      {/* Action Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approved' ? 'Approuver la demande' : 'Rejeter la demande'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approved' 
                ? 'L\'utilisateur sera autorisé à effectuer des paiements et sera marqué comme vérifié.' 
                : 'Veuillez préciser la raison du rejet (qui sera visible par l\'utilisateur).'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes de l'administrateur</label>
              <Input 
                value={adminNotes} 
                onChange={(e) => setAdminNotes(e.target.value)} 
                placeholder={actionType === 'rejected' ? 'Ex: Document flou, pièce expirée...' : 'Notes internes...'}
                required={actionType === 'rejected'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>Annuler</Button>
            <Button 
              variant={actionType === 'approved' ? 'default' : 'destructive'} 
              onClick={submitAction}
              disabled={actionLoading || (actionType === 'rejected' && !adminNotes.trim())}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la vérification</DialogTitle>
            <DialogDescription>
              Utilisateur : {viewingRequest?.profiles?.full_name} ({viewingRequest?.profiles?.email})
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-sm">Type de document :</span>
              <Badge variant="outline">{getDocTypeLabel(viewingRequest)}</Badge>
              <span className="font-semibold text-sm ml-4">Statut :</span>
              {viewingRequest && getStatusBadge(viewingRequest.status)}
            </div>

            {viewingRequest?.admin_notes && (
              <div className="bg-muted p-3 rounded-md text-sm border">
                <strong>Notes admin :</strong> {viewingRequest.admin_notes}
              </div>
            )}

            {loadingUrls ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground text-sm">Chargement sécurisé des documents...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Selfie</h4>
                  {signedUrls.selfie ? (
                    <a href={signedUrls.selfie} target="_blank" rel="noreferrer" className="block cursor-zoom-in">
                      <img src={signedUrls.selfie} alt="Selfie" className="w-full h-64 object-cover rounded-lg border shadow-sm hover:opacity-90 transition-opacity" />
                    </a>
                  ) : (
                    <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground text-sm border border-dashed">Non fourni (ancien format)</div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Recto {viewingRequest?.document_type === 'passeport' ? '(Passeport)' : ''}</h4>
                  {signedUrls.front ? (
                    <a href={signedUrls.front} target="_blank" rel="noreferrer" className="block cursor-zoom-in">
                      <img src={signedUrls.front} alt="Recto" className="w-full h-64 object-cover rounded-lg border shadow-sm hover:opacity-90 transition-opacity" />
                    </a>
                  ) : (
                    <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground text-sm border border-dashed">Non fourni</div>
                  )}
                </div>

                {viewingRequest?.document_type !== 'passeport' && (
                  <div className="space-y-2 md:col-span-2 md:w-1/2 md:mx-auto">
                    <h4 className="font-medium text-sm">Verso</h4>
                    {signedUrls.back ? (
                      <a href={signedUrls.back} target="_blank" rel="noreferrer" className="block cursor-zoom-in">
                        <img src={signedUrls.back} alt="Verso" className="w-full h-64 object-cover rounded-lg border shadow-sm hover:opacity-90 transition-opacity" />
                      </a>
                    ) : (
                      <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground text-sm border border-dashed">Non requis ou non fourni</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between border-t pt-4">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Fermer</Button>
            
            {viewingRequest?.status === 'pending' && (
              <div className="flex gap-2">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleActionClick(viewingRequest, 'rejected')}>
                  <X className="mr-2 h-4 w-4" /> Rejeter
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleActionClick(viewingRequest, 'approved')}>
                  <Check className="mr-2 h-4 w-4" /> Approuver
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}