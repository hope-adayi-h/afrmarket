import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search, UserCheck, UserX, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const AdminUserSubscriptionsPage = () => {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSub, setSelectedSub] = useState(null);
  const [userPayments, setUserPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          profiles:user_id ( full_name, email, avatar_url ),
          subscription_plans:plan_id ( name, price, duration_interval )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les abonnements.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPayments = async (userId) => {
      setLoadingPayments(true);
      try {
          const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          setUserPayments(data || []);
      } catch (error) {
          console.error(error);
          setUserPayments([]);
      } finally {
          setLoadingPayments(false);
      }
  }

  const handleViewDetails = (sub) => {
      setSelectedSub(sub);
      if (sub.user_id) {
          fetchUserPayments(sub.user_id);
      } else {
          setUserPayments([]);
      }
  }

  const handleToggleSuspend = async (sub) => {
    try {
      const newSuspendedStatus = !sub.is_suspended;
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ is_suspended: newSuspendedStatus })
        .eq('id', sub.id);

      if (error) throw error;

      setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, is_suspended: newSuspendedStatus } : s));
      toast({ 
        title: newSuspendedStatus ? 'Abonnement suspendu' : 'Abonnement réactivé',
        description: `L'abonnement de ${sub.profiles?.full_name} a été mis à jour.`
      });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Action échouée.', variant: 'destructive' });
    }
  };

  const filteredSubs = subscriptions.filter(s => 
    s.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet><title>Admin - Gestion Abonnements</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Abonnés</h1>
          <p className="text-muted-foreground">Suivi des abonnements utilisateurs et historique de paiement.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un utilisateur..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Plan Actuel</TableHead>
                  <TableHead>Renouvellement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                ) : filteredSubs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun abonnement trouvé.</TableCell></TableRow>
                ) : (
                  filteredSubs.map(sub => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{sub.profiles?.full_name}</span>
                          <span className="text-xs text-muted-foreground">{sub.profiles?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                          {sub.subscription_plans ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{sub.subscription_plans.name}</Badge>
                          ) : (
                              <Badge variant="outline">{sub.plan_name || 'Inconnu'}</Badge>
                          )}
                      </TableCell>
                      <TableCell className="text-sm">
                          {sub.end_date ? format(new Date(sub.end_date), 'dd MMM yyyy', { locale: fr }) : '-'}
                      </TableCell>
                      <TableCell>
                         {sub.is_suspended ? <Badge variant="destructive">Suspendu</Badge> : 
                          sub.status === 'active' ? <Badge className="bg-green-500">Actif</Badge> : 
                          <Badge variant="secondary">Expiré</Badge>
                         }
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(sub)}>Détails</Button>
                        <Button 
                          variant={sub.is_suspended ? "outline" : "destructive"} 
                          size="sm"
                          onClick={() => handleToggleSuspend(sub)}
                        >
                          {sub.is_suspended ? <UserCheck className="h-4 w-4 mr-1"/> : <UserX className="h-4 w-4 mr-1"/>}
                          {sub.is_suspended ? 'Réactiver' : 'Suspendre'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedSub && (
           <Dialog open={!!selectedSub} onOpenChange={() => setSelectedSub(null)}>
              <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                      <DialogTitle>Détails de l'Abonnement</DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Informations Générales</h4>
                          <div className="grid grid-cols-2 gap-y-4 text-sm">
                             <div><span className="text-muted-foreground block">Utilisateur</span><span className="font-medium">{selectedSub.profiles?.full_name}</span></div>
                             <div><span className="text-muted-foreground block">Plan</span><span className="font-medium">{selectedSub.subscription_plans?.name || selectedSub.plan_name}</span></div>
                             <div><span className="text-muted-foreground block">Début</span><span className="font-medium">{selectedSub.start_date ? format(new Date(selectedSub.start_date), 'dd/MM/yyyy') : '-'}</span></div>
                             <div><span className="text-muted-foreground block">Fin/Renouvellement</span><span className="font-medium">{selectedSub.end_date ? format(new Date(selectedSub.end_date), 'dd/MM/yyyy') : '-'}</span></div>
                             <div><span className="text-muted-foreground block">Statut</span><span className="font-medium capitalize">{selectedSub.status}</span></div>
                          </div>
                      </div>
                      
                      <div className="space-y-4">
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Historique des Paiements</h4>
                          <div className="border rounded-md overflow-hidden max-h-[200px] overflow-y-auto">
                             {loadingPayments ? (
                                 <div className="p-4 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto"/></div>
                             ) : userPayments.length === 0 ? (
                                 <div className="p-4 text-center text-sm text-muted-foreground">Aucun paiement trouvé.</div>
                             ) : (
                                 <table className="w-full text-xs">
                                     <thead className="bg-muted">
                                         <tr>
                                             <th className="p-2 text-left">Date</th>
                                             <th className="p-2 text-left">Montant</th>
                                             <th className="p-2 text-left">Statut</th>
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {userPayments.map(p => (
                                             <tr key={p.id} className="border-t">
                                                 <td className="p-2">{format(new Date(p.created_at), 'dd/MM/yy')}</td>
                                                 <td className="p-2 font-medium">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(p.amount)}</td>
                                                 <td className="p-2">
                                                    <span className={`inline-block w-2 h-2 rounded-full ${p.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                                 </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             )}
                          </div>
                      </div>
                  </div>

                  <DialogFooter>
                      <Button onClick={() => setSelectedSub(null)}>Fermer</Button>
                  </DialogFooter>
              </DialogContent>
           </Dialog>
        )}
      </div>
    </>
  );
};

export default AdminUserSubscriptionsPage;