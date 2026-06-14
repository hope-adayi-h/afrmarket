import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit2, Search, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

const AdminPromoCodesPage = () => {
  const { toast } = useToast();
  const [codes, setCodes] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCode, setCurrentCode] = useState(null);
  
  // Stats Modal State
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [statsCode, setStatsCode] = useState(null);
  const [codeUsageStats, setCodeUsageStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    influencer_id: 'manual',
    influencer_name: '',
    influencer_email: '',
    commission_percentage: 10,
    is_active: true,
    discount_type: 'percentage',
    discount_value: 5,
    expiration_date: '',
    max_usage: ''
  });

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const { data: codesData, error } = await supabase
        .from('promo_codes')
        .select('*, payments(amount, created_at)');

      if (error) throw error;

      const processedCodes = codesData.map(code => ({
        ...code,
        revenue: code.payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0
      }));

      setCodes(processedCodes);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les codes promo.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchInfluencers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_influencer', true);
      if(!error) setInfluencers(data || []);
    } catch(e) {
      console.error("Error fetching influencers list", e);
    }
  }

  useEffect(() => {
    fetchCodes();
    fetchInfluencers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleInfluencerSelect = (value) => {
    if (value === 'manual') {
      setFormData(prev => ({ ...prev, influencer_id: 'manual', influencer_name: '', influencer_email: '' }));
    } else {
      const influencer = influencers.find(i => i.id === value);
      if (influencer) {
        setFormData(prev => ({ 
          ...prev, 
          influencer_id: value, 
          influencer_name: influencer.full_name || '', 
          influencer_email: influencer.email || '' 
        }));
      }
    }
  }

  const handleOpenDialog = (code = null) => {
    if (code) {
      setCurrentCode(code);
      setFormData({
        code: code.code,
        influencer_id: code.influencer_id || 'manual',
        influencer_name: code.influencer_name,
        influencer_email: code.influencer_email || '',
        commission_percentage: code.commission_percentage,
        is_active: code.is_active,
        discount_type: code.discount_type || 'percentage',
        discount_value: code.discount_value || 0,
        expiration_date: code.expiration_date ? new Date(code.expiration_date).toISOString().split('T')[0] : '',
        max_usage: code.max_usage || ''
      });
    } else {
      setCurrentCode(null);
      setFormData({
        code: '',
        influencer_id: 'manual',
        influencer_name: '',
        influencer_email: '',
        commission_percentage: 10,
        is_active: true,
        discount_type: 'percentage',
        discount_value: 5,
        expiration_date: '',
        max_usage: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const dataToSave = {
        code: formData.code.toUpperCase(),
        influencer_id: formData.influencer_id === 'manual' ? null : formData.influencer_id,
        influencer_name: formData.influencer_name,
        influencer_email: formData.influencer_email,
        commission_percentage: Number(formData.commission_percentage),
        is_active: formData.is_active,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        expiration_date: formData.expiration_date ? new Date(formData.expiration_date).toISOString() : null,
        max_usage: formData.max_usage ? Number(formData.max_usage) : null
      };

      if (currentCode) {
        const { error } = await supabase
          .from('promo_codes')
          .update(dataToSave)
          .eq('id', currentCode.id);
        if (error) throw error;
        toast({ title: 'Succès', description: 'Code promo mis à jour.' });
      } else {
        const { error } = await supabase
          .from('promo_codes')
          .insert(dataToSave);
        if (error) throw error;
        toast({ title: 'Succès', description: 'Code promo créé.' });
      }
      setIsDialogOpen(false);
      fetchCodes();
    } catch (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };
  
  const handleViewStats = async (code) => {
    setStatsCode(code);
    setIsStatsOpen(true);
    setLoadingStats(true);
    
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, profiles:user_id(full_name, email)')
        .eq('promo_code_id', code.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setCodeUsageStats(data || []);
    } catch(e) {
      toast({ title: 'Erreur', description: "Impossible de charger les statistiques", variant: "destructive" });
      setCodeUsageStats([]);
    } finally {
      setLoadingStats(false);
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
      toast({ title: 'Statut mis à jour' });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de modifier le statut.', variant: 'destructive' });
    }
  };

  const filteredCodes = codes.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.influencer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet><title>Admin - Codes Promo</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Codes Promo</h1>
            <p className="text-muted-foreground">Gérez les codes, remises et commissions.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau Code
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Influenceur</TableHead>
                    <TableHead>Réduction</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Utilisations</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                  ) : filteredCodes.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center">Aucun code trouvé.</TableCell></TableRow>
                  ) : (
                    filteredCodes.map(code => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono font-bold">{code.code}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{code.influencer_name}</span>
                            <span className="text-xs text-muted-foreground">{code.influencer_email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold">
                            {code.discount_type === 'percentage' ? `-${code.discount_value}%` : `-${code.discount_value} XOF`}
                          </span>
                        </TableCell>
                        <TableCell>{code.commission_percentage}%</TableCell>
                        <TableCell>
                          {code.usage_count}
                          {code.max_usage && <span className="text-muted-foreground"> / {code.max_usage}</span>}
                        </TableCell>
                        <TableCell>
                          <Switch 
                            checked={code.is_active}
                            onCheckedChange={() => handleToggleStatus(code.id, code.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleViewStats(code)} title="Voir les statistiques">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(code)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentCode ? 'Modifier le Code' : 'Nouveau Code Promo'}</DialogTitle>
              <DialogDescription>Configurez les paramètres du code et de la commission.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="code">Code Promo</Label>
                    <Input id="code" name="code" value={formData.code} onChange={handleInputChange} placeholder="ex: SUMMER20" className="uppercase" />
                  </div>
                   <div className="grid gap-2">
                    <Label htmlFor="max_usage">Limite d'usage (Optionnel)</Label>
                    <Input id="max_usage" name="max_usage" type="number" value={formData.max_usage} onChange={handleInputChange} placeholder="Infini si vide" />
                  </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Lier à un influenceur</Label>
                <Select value={formData.influencer_id} onValueChange={handleInfluencerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un influenceur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">-- Saisie Manuelle --</SelectItem>
                    {influencers.map(inf => (
                      <SelectItem key={inf.id} value={inf.id}>{inf.full_name || inf.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="influencer_name">Nom Influenceur</Label>
                    <Input id="influencer_name" name="influencer_name" value={formData.influencer_name} onChange={handleInputChange} disabled={formData.influencer_id !== 'manual'} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="influencer_email">Email Influenceur</Label>
                    <Input id="influencer_email" name="influencer_email" value={formData.influencer_email} onChange={handleInputChange} disabled={formData.influencer_id !== 'manual'} />
                  </div>
              </div>

              <div className="border-t pt-4 mt-2">
                  <h4 className="text-sm font-semibold mb-3">Réduction pour le client</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Type de réduction</Label>
                        <Select value={formData.discount_type} onValueChange={(val) => setFormData(prev => ({ ...prev, discount_type: val }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                                <SelectItem value="fixed">Montant Fixe (XOF)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Valeur</Label>
                        <Input name="discount_value" type="number" value={formData.discount_value} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid gap-2 mt-3">
                    <Label>Date d'expiration (Optionnel)</Label>
                    <Input name="expiration_date" type="date" value={formData.expiration_date} onChange={handleInputChange} />
                  </div>
              </div>

              <div className="border-t pt-4 mt-2">
                  <h4 className="text-sm font-semibold mb-3">Commission pour l'influenceur</h4>
                   <div className="grid gap-2">
                    <Label htmlFor="commission_percentage">Commission sur les ventes (%)</Label>
                    <Input id="commission_percentage" name="commission_percentage" type="number" min="0" max="100" value={formData.commission_percentage} onChange={handleInputChange} />
                    <p className="text-xs text-muted-foreground">L'influenceur recevra ce pourcentage sur chaque vente utilisant ce code.</p>
                  </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} />
                <Label htmlFor="is_active">Activer ce code</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmit}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Statistiques d'utilisation - {statsCode?.code}</DialogTitle>
                    <DialogDescription>Historique des paiements liés à ce code promo.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto border rounded-md mt-2">
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingStats ? (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
                            ) : codeUsageStats.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">Aucune utilisation trouvée.</TableCell></TableRow>
                            ) : (
                                codeUsageStats.map(stat => (
                                    <TableRow key={stat.id}>
                                        <TableCell className="text-xs">{format(new Date(stat.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{stat.profiles?.full_name || stat.client_name || 'Inconnu'}</span>
                                                <span className="text-xs text-muted-foreground">{stat.profiles?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stat.amount)}</TableCell>
                                        <TableCell>
                                            <span className={`inline-block w-2 h-2 rounded-full ${stat.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                   </Table>
                </div>
                <DialogFooter>
                    <Button onClick={() => setIsStatsOpen(false)}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default AdminPromoCodesPage;