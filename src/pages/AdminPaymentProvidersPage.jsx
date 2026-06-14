import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Save, Loader2, Globe, AlertTriangle, Shield, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AdminPaymentProvidersPage = () => {
  const { toast } = useToast();
  const [monerooConfig, setMonerooConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMonerooConfig();
  }, []);

  const fetchMonerooConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_providers')
        .select('*')
        .eq('slug', 'moneroo')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setMonerooConfig(data);
      } else {
        // Initialize default config
        setMonerooConfig({
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          name: 'Moneroo',
          slug: 'moneroo',
          is_enabled: true
        });
      }
    } catch (error) {
      console.error('Error fetching Moneroo config:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la configuration Moneroo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = (checked) => {
    setMonerooConfig(prev => ({ ...prev, is_enabled: checked }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('payment_providers')
        .upsert({
          id: monerooConfig.id,
          name: 'Moneroo',
          slug: 'moneroo',
          is_enabled: monerooConfig.is_enabled,
          is_primary: true,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Configuration Moneroo ${monerooConfig.is_enabled ? 'activée' : 'désactivée'}.`,
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les modifications.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!monerooConfig) return null;

  return (
    <>
      <Helmet>
        <title>Admin - Configuration Paiements</title>
      </Helmet>

      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paiements (Moneroo)</h1>
          <p className="text-muted-foreground">Gérez l'intégration avec la passerelle de paiement Moneroo.</p>
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                  M
                </div>
                <div>
                  <CardTitle>Moneroo Gateway</CardTitle>
                  <CardDescription>Intégration officielle</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={monerooConfig.is_enabled ? "success" : "secondary"} className={monerooConfig.is_enabled ? "bg-green-100 text-green-800" : ""}>
                  {monerooConfig.is_enabled ? "Activé" : "Désactivé"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Configuration Sécurisée</p>
                  <p className="text-xs text-muted-foreground">
                    La clé API Moneroo est stockée de manière sécurisée dans les variables d'environnement Supabase et ne peut pas être consultée ou modifiée depuis ce panneau d'administration.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pour modifier la clé API, contactez votre administrateur système ou accédez directement aux paramètres Supabase.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="font-medium text-sm">Clé API Moneroo</p>
                  <div className="flex items-center gap-2 p-3 bg-background rounded border border-dashed">
                    <code className="text-xs font-mono text-muted-foreground">••••••••••••••••••••••••</code>
                    <Badge variant="outline" className="ml-auto">Protégée</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    La clé API est masquée pour des raisons de sécurité et gérée via les Edge Functions Supabase.
                  </p>
                </div>
              </div>
            </div>

            {!monerooConfig.is_enabled && (
              <div className="flex items-center gap-3 p-4 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Le paiement est désactivé</p>
                  <p>Les utilisateurs ne pourront pas effectuer d'achats ou d'abonnements tant que cette option n'est pas activée.</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe size={14} />
                <a href="https://moneroo.io" target="_blank" rel="noreferrer" className="hover:underline">Documentation Moneroo</a>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="is_enabled" className="cursor-pointer">Activer les paiements</Label>
                <Switch
                  id="is_enabled"
                  checked={monerooConfig.is_enabled}
                  onCheckedChange={handleToggleEnabled}
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end bg-muted/10 p-6 border-t">
            <Button onClick={handleSave} disabled={saving} size="lg" className="w-full sm:w-auto">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Enregistrer la configuration
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              Instructions pour configurer la clé API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">Pour sécuriser votre clé API Moneroo, suivez ces étapes :</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Accédez à votre projet Supabase</li>
              <li>Naviguez vers <strong>Edge Functions → Secrets</strong></li>
              <li>Créez un nouveau secret nommé <code className="bg-background px-1.5 py-0.5 rounded">MONEROO_API_KEY</code></li>
              <li>Collez votre clé API Moneroo (commence par pk_ ou pvk_)</li>
              <li>Enregistrez et redéployez vos Edge Functions si nécessaire</li>
            </ol>
            <p className="text-xs text-muted-foreground italic pt-2">
              Cette approche garantit que votre clé API n'est jamais exposée côté client et reste sécurisée dans l'environnement serveur.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminPaymentProvidersPage;