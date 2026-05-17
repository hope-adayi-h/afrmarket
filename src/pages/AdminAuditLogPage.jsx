import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { FileText, Filter, Calendar, Loader2, User, List as ListIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useNavigate } from 'react-router-dom';

const AdminAuditLogPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select(`
          *,
          profiles:admin_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les logs d\'audit.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    fetchLogs();

    const channel = supabase.channel('admin-audit-log-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_audit_log' }, (payload) => {
        // Fetch full payload with profile info
        const fetchNewLog = async () => {
          const { data } = await supabase
            .from('admin_audit_log')
            .select('*, profiles:admin_id(full_name)')
            .eq('id', payload.new.id)
            .single();
          if (data) {
            setLogs(currentLogs => [data, ...currentLogs]);
          }
        };
        fetchNewLog();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => logs.filter((log) => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesDate =
      !dateFilter ||
      new Date(log.created_at).toDateString() === dateFilter.toDateString();
    return matchesAction && matchesDate;
  }), [logs, actionFilter, dateFilter]);

  const getActionLabel = (action) => {
    const labels = {
      listing_approved: 'Annonce Approuvée',
      listing_rejected: 'Annonce Rejetée',
      listing_deleted: 'Annonce Supprimée',
      user_role_changed: 'Rôle Modifié',
      user_blocked: 'Utilisateur Bloqué',
    };
    return labels[action] || action;
  };

  const getActionColor = (action) => {
    const colors = {
      listing_approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      listing_rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      listing_deleted: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      user_role_changed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      user_blocked: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    };
    return colors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const actionTypes = [
    { value: 'all', label: 'Toutes les actions' },
    { value: 'listing_approved', label: 'Annonces approuvées' },
    { value: 'listing_rejected', label: 'Annonces rejetées' },
    { value: 'listing_deleted', label: 'Annonces supprimées' },
    { value: 'user_role_changed', label: 'Rôles modifiés' },
    { value: 'user_blocked', label: 'Utilisateurs bloqués' },
  ];

  return (
    <>
      <Helmet>
        <title>Admin - Audit Log</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Journal d'Audit</h1>
            <p className="text-muted-foreground">Historique de toutes les actions administratives</p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter size={16} className="mr-2" />
                  {actionTypes.find((t) => t.value === actionFilter)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {actionTypes.map((type) => (
                  <DropdownMenuItem key={type.value} onClick={() => setActionFilter(type.value)}>
                    {type.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Calendar size={16} className="mr-2" />
                  {dateFilter ? dateFilter.toLocaleDateString('fr-FR') : 'Toutes les dates'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={dateFilter}
                  onSelect={(date) => setDateFilter(date)}
                  initialFocus
                />
                {dateFilter && (
                  <div className="p-3 border-t">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setDateFilter(null)}
                    >
                      Effacer le filtre
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Logs d'Activité ({filteredLogs.length})</CardTitle>
            <CardDescription>Toutes les actions effectuées par les administrateurs</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Administrateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Cible</TableHead>
                      <TableHead>Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-12">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <p className="mt-4 text-muted-foreground">Aucun log ne correspond à vos filtres</p>
                            </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log) => (
                          <motion.tr
                            layout
                            key={log.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <TableCell className="text-sm whitespace-nowrap">
                              {formatDistanceToNow(new Date(log.created_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User size={14} className="text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {log.profiles?.full_name || 'Admin'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(
                                  log.action
                                )}`}
                              >
                                {getActionLabel(log.action)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {log.target_type === 'listing' && log.target_id && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 h-auto"
                                  onClick={() => navigate(`/listing/${log.target_id}`)}
                                >
                                  <ListIcon size={14} className="mr-1" />
                                  Voir l'annonce
                                </Button>
                              )}
                              {log.target_type === 'user' && log.target_id && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <User size={14} />
                                  Utilisateur
                                </div>
                              )}
                              {!log.target_type && <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              {log.details && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {JSON.stringify(log.details)}
                                </p>
                              )}
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminAuditLogPage;