import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit2, Trash2, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';

const AdminSubscriptionPlansPage = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    duration_interval: 'month',
    features: '',
    is_active: true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les plans.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setCurrentPlan(plan);
      // Convert features JSON array back to string for textarea
      const featuresString = Array.isArray(plan.features) ? plan.features.join('\n') : '';
      setFormData({
        name: plan.name,
        price: plan.price,
        duration_interval: plan.duration_interval,
        features: featuresString,
        is_active: plan.is_active
      });
    } else {
      setCurrentPlan(null);
      setFormData({
        name: '',
        price: 0,
        duration_interval: 'month',
        features: 'Visibilité accrue\nSupport prioritaire\nBadge vendeur',
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      // Convert textarea string to array
      const featuresArray = formData.features.split('\n').filter(f => f.trim() !== '');

      const dataToSave = {
        name: formData.name,
        price: Number(formData.price),
        duration_interval: formData.duration_interval,
        features: featuresArray,
        is_active: formData.is_active
      };

      if (currentPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(dataToSave)
          .eq('id', currentPlan.id);
        if (error) throw error;
        toast({ title: 'Succès', description: 'Plan mis à jour.' });
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert(dataToSave);
        if (error) throw error;
        toast({ title: 'Succès', description: 'Nouveau plan créé.' });
      }
      setIsDialogOpen(false);
      fetchPlans();
    } catch (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteClick = (id) => {
    setPlanToDelete(id);
  }

  const confirmDelete = async () => {
    if (!planToDelete) return;
    
    try {
        const { error } = await supabase.from('subscription_plans').delete().eq('id', planToDelete);
        if (error) throw error;
        toast({ title: 'Plan supprimé' });
        setPlans(plans.filter(p => p.id !== planToDelete));
    } catch (error) {
        toast({ title: 'Erreur', description: 'Impossible de supprimer le plan.', variant: 'destructive' });
    } finally {
        setPlanToDelete(null);
    }
  }

  const getDurationLabel = (val) => {
    const map = { 'month': 'Mensuel', 'quarter': 'Trimestriel', 'year': 'Annuel' };
    return map[val] || val;
  }

  return (
    <>
      <Helmet><title>Admin - Plans d'Abonnement</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Plans d'Abonnement</h1>
            <p className="text-muted-foreground">Configurez les offres disponibles pour les utilisateurs.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau Plan
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? <Loader2 className="animate-spin mx-auto col-span-full" /> : 
             plans.length === 0 ? <div className="col-span-full text-center text-muted-foreground">Aucun plan configuré.</div> :
             plans.map(plan => (
                 <Card key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
                     <CardHeader>
                         <div className="flex justify-between items-start">
                            <CardTitle>{plan.name}</CardTitle>
                            {plan.is_active ? <Check className="text-green-500 h-5 w-5"/> : <X className="text-red-500 h-5 w-5"/>}
                         </div>
                         <CardDescription>
                             {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(plan.price)} / {getDurationLabel(plan.duration_interval)}
                         </CardDescription>
                     </CardHeader>
                     <CardContent>
                         <ul className="list-disc list-inside text-sm space-y-1 mb-4 text-muted-foreground">
                             {Array.isArray(plan.features) && plan.features.slice(0, 4).map((f, i) => (
                                 <li key={i}>{f}</li>
                             ))}
                             {Array.isArray(plan.features) && plan.features.length > 4 && <li>...et plus</li>}
                         </ul>
                         <div className="flex gap-2 mt-4">
                             <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenDialog(plan)}>
                                 <Edit2 className="h-4 w-4 mr-2" /> Modifier
                             </Button>
                             <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(plan.id)}>
                                 <Trash2 className="h-4 w-4" />
                             </Button>
                         </div>
                     </CardContent>
                 </Card>
             ))
            }
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentPlan ? 'Modifier le Plan' : 'Nouveau Plan'}</DialogTitle>
              <DialogDescription>Définissez les caractéristiques de l'abonnement.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom du Plan</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="ex: Premium Mensuel" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="price">Prix (XOF)</Label>
                    <Input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="duration">Durée</Label>
                    <Select 
                        value={formData.duration_interval} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, duration_interval: val }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">Mensuel (1 mois)</SelectItem>
                            <SelectItem value="quarter">Trimestriel (3 mois)</SelectItem>
                            <SelectItem value="year">Annuel (1 an)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="features">Fonctionnalités (une par ligne)</Label>
                <Textarea 
                    id="features" 
                    value={formData.features} 
                    onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))} 
                    placeholder="Badge vendeur&#10;Support 24/7&#10;10 annonces gratuites"
                    className="h-32"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} />
                <Label htmlFor="is_active">Plan Actif (visible par les utilisateurs)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmit}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!planToDelete} onOpenChange={() => setPlanToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Cela supprimera définitivement ce plan d'abonnement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default AdminSubscriptionPlansPage;