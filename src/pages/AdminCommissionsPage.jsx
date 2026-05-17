import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, DollarSign, Search, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

const AdminCommissionsPage = () => {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Withdrawal Action
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [commsRes, withdrawRes] = await Promise.all([
          supabase
            .from('influencer_commissions')
            .select(`*, promo_codes ( code, influencer_name, influencer_email )`)
            .order('created_at', { ascending: false }),
          supabase
            .from('withdrawals')
            .select(`*, profiles:user_id ( full_name, email, phone )`)
            .order('created_at', { ascending: false })
      ]);

      if (commsRes.error) throw commsRes.error;
      if (withdrawRes.error) throw withdrawRes.error;
      
      setCommissions(commsRes.data || []);
      setWithdrawals(withdrawRes.data || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les données.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('influencer_commissions')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      toast({ title: 'Statut mis à jour', description: `Commission marquée comme ${newStatus}.` });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Mise à jour échouée.', variant: 'destructive' });
    }
  };
  
  const handleWithdrawalAction = async (status) => {
      if (!selectedWithdrawal) return;
      
      try {
          const { error } = await supabase
            .from('withdrawals')
            .update({ 
                status: status,
                admin_note: status === 'rejected' ? rejectReason : null
            })
            .eq('id', selectedWithdrawal.id);
            
          if (error) throw error;
          
          setWithdrawals(prev => prev.map(w => w.id === selectedWithdrawal.id ? { ...w, status: status } : w));
          toast({ title: "Mise à jour réussie", description: `Retrait ${status === 'approved' ? 'approuvé' : 'rejeté'}.` });
          setIsWithdrawalDialogOpen(false);
          setSelectedWithdrawal(null);
          setRejectReason('');
      } catch (e) {
          toast({ title: "Erreur", description: e.message, variant: "destructive" });
      }
  }

  // Aggregate data for Summary View
  const influencerSummary = commissions.reduce((acc, curr) => {
    const name = curr.promo_codes?.influencer_name || 'Inconnu';
    if (!acc[name]) {
      acc[name] = { 
        totalEarned: 0, 
        totalPaid: 0, 
        pending: 0, 
        email: curr.promo_codes?.influencer_email 
      };
    }
    const amount = Number(curr.amount);
    acc[name].totalEarned += amount;
    if (curr.status === 'paid') acc[name].totalPaid += amount;
    if (curr.status === 'pending') acc[name].pending += amount;
    return acc;
  }, {});

  const summaryList = Object.entries(influencerSummary).map(([name, data]) => ({ name, ...data }));

  const filteredCommissions = commissions.filter(c => 
    c.promo_codes?.influencer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredWithdrawals = withdrawals.filter(w => 
     w.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet><title>Admin - Commissions & Retraits</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commissions & Retraits</h1>
          <p className="text-muted-foreground">Gérez les commissions d'influenceurs et les demandes de retrait.</p>
        </div>

        <Tabs defaultValue="withdrawals">
          <TabsList>
            <TabsTrigger value="withdrawals">Demandes de Retrait</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="summary">Résumé Influenceurs</TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals">
              <Card>
                  <CardHeader><CardTitle>Demandes de virement</CardTitle></CardHeader>
                  <CardContent className="p-0">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Influenceur</TableHead>
                                  <TableHead>Montant</TableHead>
                                  <TableHead>Statut</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {loading ? <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="mx-auto animate-spin"/></TableCell></TableRow> :
                               filteredWithdrawals.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center h-24">Aucune demande.</TableCell></TableRow> :
                               filteredWithdrawals.map(w => (
                                   <TableRow key={w.id}>
                                       <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                                       <TableCell>
                                           <div className="font-medium">{w.profiles?.full_name}</div>
                                           <div className="text-xs text-muted-foreground">{w.profiles?.phone}</div>
                                       </TableCell>
                                       <TableCell className="font-bold">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(w.amount)}</TableCell>
                                       <TableCell>
                                           {w.status === 'approved' ? <Badge className="bg-green-500">Payé</Badge> : 
                                            w.status === 'rejected' ? <Badge variant="destructive">Rejeté</Badge> :
                                            <Badge className="bg-yellow-500">En attente</Badge>
                                           }
                                       </TableCell>
                                       <TableCell className="text-right">
                                           {w.status === 'pending' && (
                                               <div className="flex justify-end gap-2">
                                                   <Button size="sm" variant="outline" onClick={() => { setSelectedWithdrawal(w); setIsWithdrawalDialogOpen(true); }}>Traiter</Button>
                                               </div>
                                           )}
                                       </TableCell>
                                   </TableRow>
                               ))
                              }
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          </TabsContent>

          <TabsContent value="summary">
             <Card>
               <CardContent className="p-0">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Influenceur</TableHead>
                       <TableHead>Total Gagné</TableHead>
                       <TableHead>Déjà Payé</TableHead>
                       <TableHead>En Attente</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {summaryList.map((item, idx) => (
                       <TableRow key={idx}>
                         <TableCell className="font-medium">
                           {item.name}
                           <div className="text-xs text-muted-foreground">{item.email}</div>
                         </TableCell>
                         <TableCell>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(item.totalEarned)}</TableCell>
                         <TableCell className="text-green-600 font-medium">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(item.totalPaid)}</TableCell>
                         <TableCell className="text-yellow-600 font-medium">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(item.pending)}</TableCell>
                       </TableRow>
                     ))}
                     {summaryList.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8">Aucune donnée.</TableCell></TableRow>}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-4">
             <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher un influenceur..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
             </div>
             
             <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Influenceur</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> : 
                             filteredCommissions.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucune commission.</TableCell></TableRow> :
                             filteredCommissions.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <span className="font-medium">{c.promo_codes?.influencer_name}</span>
                                        <span className="text-xs text-muted-foreground block">{c.promo_codes?.code}</span>
                                    </TableCell>
                                    <TableCell>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(c.amount)}</TableCell>
                                    <TableCell>
                                        {c.status === 'paid' && <Badge className="bg-green-500">Payé</Badge>}
                                        {c.status === 'approved' && <Badge className="bg-blue-500">Approuvé</Badge>}
                                        {c.status === 'pending' && <Badge variant="outline" className="text-yellow-600 border-yellow-600">En Attente</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {c.status === 'pending' && (
                                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(c.id, 'approved')}>Approuver</Button>
                                        )}
                                        {c.status === 'approved' && (
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(c.id, 'paid')}>
                                                <DollarSign className="h-3 w-3 mr-1" /> Marquer Payé
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                             ))
                            }
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
        
        <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Traiter le retrait</DialogTitle>
                    <DialogDescription>
                        Demande de {selectedWithdrawal?.profiles?.full_name} pour {selectedWithdrawal && new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(selectedWithdrawal.amount)}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <p className="text-sm text-muted-foreground">Action: Confirmer le virement ou rejeter la demande.</p>
                    <Input 
                        placeholder="Raison du rejet (si rejeté)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                </div>
                
                <DialogFooter className="gap-2">
                    <Button variant="destructive" onClick={() => handleWithdrawalAction('rejected')}>Rejeter</Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleWithdrawalAction('approved')}>Confirmer Payé</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default AdminCommissionsPage;