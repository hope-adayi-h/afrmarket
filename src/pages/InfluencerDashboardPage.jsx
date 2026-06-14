import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  LayoutDashboard, 
  DollarSign, 
  Users, 
  Tag, 
  ArrowUpRight, 
  Download, 
  Loader2, 
  Wallet,
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';

const InfluencerDashboardPage = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    totalUsage: 0,
    uniqueUsers: 0
  });
  const [commissions, setCommissions] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    if (!authLoading) {
        if (!user) {
            navigate('/');
        } else if (!profile?.is_influencer) {
            toast({ title: "Accès refusé", description: "Cette page est réservée aux influenceurs.", variant: "destructive" });
            navigate('/');
        } else {
            fetchData();
        }
    }
  }, [user, profile, authLoading, navigate, toast]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Promo Codes
      const { data: codes, error: codesError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('influencer_id', user.id);
        
      if (codesError) throw codesError;
      setPromoCodes(codes || []);
      
      const codeIds = codes.map(c => c.id);
      
      if (codeIds.length > 0) {
          // Fetch Commissions
          const { data: comms, error: commsError } = await supabase
            .from('influencer_commissions')
            .select(`
                *,
                payments (
                    amount,
                    created_at,
                    user_id,
                    client_name
                )
            `)
            .in('promo_code_id', codeIds)
            .order('created_at', { ascending: false });
            
          if (commsError) throw commsError;
          setCommissions(comms || []);
          
          // Fetch Referrals (Users who signed up with these codes)
          const { data: refs, error: refsError } = await supabase
             .from('profiles')
             .select('id, full_name, email, created_at, signup_promo_code_id')
             .in('signup_promo_code_id', codeIds)
             .order('created_at', { ascending: false });
             
          if (refsError) console.error("Referrals error", refsError);
          setReferrals(refs || []);

          // Calculate Stats
          const total = comms.reduce((acc, curr) => acc + Number(curr.amount), 0);
          const pending = comms.filter(c => c.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0);
          const paid = comms.filter(c => c.status === 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0);
          const uniqueUserIds = new Set(comms.map(c => c.payments?.user_id).filter(Boolean));
          
          setStats({
              totalEarnings: total,
              pendingEarnings: pending,
              paidEarnings: paid,
              totalUsage: comms.length,
              uniqueUsers: uniqueUserIds.size
          });
      }

      // Fetch Withdrawals
      const { data: withdraws, error: withdrawError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (withdrawError) throw withdrawError;
      setWithdrawals(withdraws || []);

    } catch (error) {
      console.error(error);
      toast({ title: "Erreur", description: "Impossible de charger les données.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestWithdrawal = async () => {
     const amount = parseFloat(withdrawalAmount);
     if (isNaN(amount) || amount <= 0) {
         toast({ title: "Montant invalide", variant: "destructive" });
         return;
     }
     
     try {
         const { error } = await supabase.from('withdrawals').insert({
             user_id: user.id,
             amount: amount,
             status: 'pending'
         });
         
         if (error) throw error;
         
         toast({ title: "Demande envoyée", description: "L'administrateur traitera votre demande sous peu." });
         setWithdrawalAmount('');
         fetchData(); 
     } catch (e) {
         toast({ title: "Erreur", description: e.message, variant: "destructive" });
     }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Rapport de Revenus - AFRMARKET", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Influenceur: ${profile?.full_name}`, 14, 32);
    doc.text(`Email: ${profile?.email || user?.email}`, 14, 38);
    doc.text(`Date du rapport: ${new Date().toLocaleDateString()}`, 14, 44);
    
    // Totals
    doc.text(`Total Gagné: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.totalEarnings)}`, 14, 55);
    doc.text(`En Attente: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.pendingEarnings)}`, 14, 61);
    
    // Table
    const tableData = commissions.map(c => [
        format(new Date(c.created_at), 'dd/MM/yyyy'),
        c.payments?.client_name || 'Client',
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(c.amount),
        c.status
    ]);
    
    doc.autoTable({
        startY: 70,
        head: [['Date', 'Client', 'Commission', 'Statut']],
        body: tableData,
    });
    
    // Signature
    const finalY = doc.lastAutoTable.finalY || 150;
    doc.text("Signature AFRMARKET:", 14, finalY + 20);
    doc.setFont("helvetica", "italic");
    doc.text("Document généré automatiquement.", 14, finalY + 30);
    
    doc.save(`rapport_revenus_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (loading || authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <Helmet><title>Tableau de bord Influenceur - AFRMARKET</title></Helmet>
      
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div>
               <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><LayoutDashboard className="h-8 w-8 text-primary" /> Espace Influenceur</h1>
               <p className="text-muted-foreground">Suivez vos performances et gérez vos revenus.</p>
           </div>
           <Button onClick={generatePDF} className="bg-primary text-white">
               <Download className="mr-2 h-4 w-4" /> Télécharger Rapport PDF
           </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenus</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-primary">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.totalEarnings)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.pendingEarnings)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Utilisations Codes</CardTitle>
                    <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsage}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Parrainages</CardTitle>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{referrals.length}</div>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-8">
                
                <Tabs defaultValue="commissions">
                    <TabsList className="mb-4">
                        <TabsTrigger value="commissions">Commissions</TabsTrigger>
                        <TabsTrigger value="users">Utilisateurs Parrainés</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="commissions">
                         <Card>
                            <CardHeader>
                                <CardTitle>Historique des Commissions</CardTitle>
                                <CardDescription>Détail de vos gains par transaction.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Client</TableHead>
                                            <TableHead>Montant Vente</TableHead>
                                            <TableHead>Commission</TableHead>
                                            <TableHead>Statut</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {commissions.length === 0 ? (
                                            <TableRow><TableCell colSpan={5} className="text-center py-8">Aucune commission pour le moment.</TableCell></TableRow>
                                        ) : (
                                            commissions.map(c => (
                                                <TableRow key={c.id}>
                                                    <TableCell>{format(new Date(c.created_at), 'dd/MM/yyyy')}</TableCell>
                                                    <TableCell>{c.payments?.client_name || 'Anonyme'}</TableCell>
                                                    <TableCell>{c.payments?.amount ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(c.payments.amount) : '-'}</TableCell>
                                                    <TableCell className="font-semibold text-primary">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(c.amount)}</TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            c.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                            c.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {c.status === 'paid' ? 'Payé' : c.status === 'approved' ? 'Approuvé' : 'En attente'}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="users">
                         <Card>
                            <CardHeader>
                                <CardTitle>Utilisateurs Parrainés</CardTitle>
                                <CardDescription>Liste des utilisateurs ayant utilisé votre code à l'inscription.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date Inscription</TableHead>
                                            <TableHead>Nom</TableHead>
                                            <TableHead>Email</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {referrals.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="text-center py-8">Aucun parrainage.</TableCell></TableRow>
                                        ) : (
                                            referrals.map(ref => (
                                                <TableRow key={ref.id}>
                                                    <TableCell>{format(new Date(ref.created_at), 'dd/MM/yyyy')}</TableCell>
                                                    <TableCell className="font-medium">{ref.full_name || 'Non renseigné'}</TableCell>
                                                    <TableCell className="text-muted-foreground">{ref.email}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                
                <Card>
                     <CardHeader>
                        <CardTitle>Mes Codes Promo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {promoCodes.map(code => (
                                <div key={code.id} className="flex flex-col p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-2xl font-mono font-bold text-primary tracking-wider">{code.code}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${code.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{code.is_active ? 'Actif' : 'Inactif'}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground flex justify-between">
                                        <span>Réduction: {code.discount_type === 'percentage' ? `-${code.discount_value}%` : `-${code.discount_value} XOF`}</span>
                                        <span>Commission: {code.commission_percentage}%</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                                        Utilisé {code.usage_count} fois
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="space-y-6">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Retrait de Fonds</CardTitle>
                        <CardDescription>Demandez un virement de vos commissions approuvées.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-background rounded-lg border">
                                <div className="text-sm text-muted-foreground">Disponible pour retrait (Estimé)</div>
                                <div className="text-2xl font-bold text-primary">
                                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(
                                        commissions.filter(c => c.status === 'approved').reduce((acc, curr) => acc + Number(curr.amount), 0) - 
                                        withdrawals.filter(w => w.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0)
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Montant à retirer (XOF)</label>
                                <input 
                                    type="number" 
                                    value={withdrawalAmount}
                                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="0"
                                />
                            </div>
                            
                            <Button onClick={handleRequestWithdrawal} className="w-full">Demander le retrait</Button>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Historique Retraits</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                             {withdrawals.length === 0 ? <div className="text-sm text-muted-foreground text-center">Aucune demande.</div> : 
                              withdrawals.map(w => (
                                  <div key={w.id} className="flex justify-between items-center p-2 border-b last:border-0">
                                      <div>
                                          <div className="font-medium">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(w.amount)}</div>
                                          <div className="text-xs text-muted-foreground">{format(new Date(w.created_at), 'dd/MM/yyyy')}</div>
                                      </div>
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                          w.status === 'approved' ? 'bg-green-100 text-green-800' :
                                          w.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                          'bg-yellow-100 text-yellow-800'
                                      }`}>{w.status === 'approved' ? 'Payé' : w.status === 'rejected' ? 'Rejeté' : 'En cours'}</span>
                                  </div>
                              ))
                             }
                         </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
};

function ClockIcon(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )
}

export default InfluencerDashboardPage;