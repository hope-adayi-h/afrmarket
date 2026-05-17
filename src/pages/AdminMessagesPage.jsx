import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageSquare, Send, Users, User, Loader2, Search, ChevronsUpDown, Check, Inbox, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminMessagesPage = () => {
    const { user: adminUser } = useAuth();
    const { toast } = useToast();
    const [adminMessages, setAdminMessages] = useState([]);
    const [userMessages, setUserMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const highlightId = searchParams.get('highlight');

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const [adminRes, userRes] = await Promise.all([
                supabase.from('admin_messages').select(`*, admin:admin_id(full_name), recipient:recipient_user_id(full_name)`).order('created_at', { ascending: false }),
                supabase.from('user_messages').select(`*, user:user_id(full_name, avatar_url)`).order('created_at', { ascending: false })
            ]);

            if (adminRes.error) throw adminRes.error;
            if (userRes.error) throw userRes.error;

            setAdminMessages(adminRes.data || []);
            setUserMessages(userRes.data || []);

            if (highlightId) {
                const messageToUpdate = userRes.data.find(m => m.id === highlightId);
                if (messageToUpdate && !messageToUpdate.is_read) {
                    await supabase.from('user_messages').update({ is_read: true }).eq('id', highlightId);
                }
            }

        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de charger les messages.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast, highlightId]);

    useEffect(() => {
        fetchMessages();
        const channel = supabase
            .channel('admin-messages-realtime-all')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, () => fetchMessages())
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_messages' }, () => fetchMessages())
            .subscribe();
        
        return () => supabase.removeChannel(channel);
    }, [fetchMessages]);
    
    useEffect(() => {
        if (highlightId) {
            const timer = setTimeout(() => {
                searchParams.delete('highlight');
                setSearchParams(searchParams, { replace: true });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [highlightId, searchParams, setSearchParams]);


    return (
        <>
            <Helmet>
                <title>Admin - Messagerie</title>
            </Helmet>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Messagerie</h1>
                        <p className="text-muted-foreground">Gérez les communications avec les utilisateurs.</p>
                    </div>
                    <Button onClick={() => setIsComposeOpen(true)}>
                        <Send size={16} className="mr-2" />
                        Envoyer un Message
                    </Button>
                </div>

                <Tabs defaultValue="user-messages">
                    <TabsList>
                        <TabsTrigger value="user-messages">
                            <Inbox className="mr-2 h-4 w-4"/>Boîte de Réception
                            {userMessages.filter(m => !m.is_read).length > 0 && 
                                <span className="ml-2 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">{userMessages.filter(m => !m.is_read).length}</span>
                            }
                        </TabsTrigger>
                        <TabsTrigger value="admin-messages"><Send className="mr-2 h-4 w-4"/>Messages Envoyés</TabsTrigger>
                    </TabsList>
                    <TabsContent value="user-messages">
                        <UserMessagesTab messages={userMessages} loading={loading} highlightId={highlightId} navigate={navigate}/>
                    </TabsContent>
                    <TabsContent value="admin-messages">
                        <AdminMessagesTab messages={adminMessages} loading={loading} />
                    </TabsContent>
                </Tabs>
            </div>
            <ComposeMessageDialog isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} adminUser={adminUser} />
        </>
    );
};

const UserMessagesTab = ({ messages, loading, highlightId, navigate }) => (
    <Card>
        <CardHeader><CardTitle>Messages des Utilisateurs</CardTitle><CardDescription>Messages reçus de la part des utilisateurs.</CardDescription></CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader><TableRow><TableHead>Utilisateur</TableHead><TableHead>Sujet</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        <AnimatePresence>
                            {loading ? <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                                : messages.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center">Boîte de réception vide.</TableCell></TableRow>
                                : messages.map(msg => (
                                    <motion.tr 
                                        key={msg.id} 
                                        layout 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        exit={{ opacity: 0 }}
                                        className={cn(
                                            "transition-colors",
                                            !msg.is_read && "bg-muted font-semibold",
                                            msg.id === highlightId && "bg-primary/10 animate-pulse"
                                        )}
                                    >
                                        <TableCell><div className="flex items-center gap-2"><User size={14} /><span className={cn(!msg.is_read && "text-foreground")}>{msg.user?.full_name || 'Utilisateur supprimé'}</span></div></TableCell>
                                        <TableCell>{msg.subject}</TableCell>
                                        <TableCell className={cn(!msg.is_read ? "" : "text-muted-foreground")}>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => navigate(`/administrateur/utilisateurs?view=${msg.user_id}`)}>Voir l'utilisateur <ArrowRight className="ml-2 h-4 w-4"/></Button>
                                        </TableCell>
                                    </motion.tr>
                                ))
                            }
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
);

const AdminMessagesTab = ({ messages, loading }) => (
    <Card>
        <CardHeader><CardTitle>Messages Envoyés</CardTitle><CardDescription>Historique des messages envoyés par les administrateurs.</CardDescription></CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader><TableRow><TableHead>Destinataire</TableHead><TableHead>Sujet</TableHead><TableHead>Admin</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                    <TableBody>
                        <AnimatePresence>
                            {loading ? <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                                : messages.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center">Aucun message envoyé.</TableCell></TableRow>
                                : messages.map(msg => (
                                    <motion.tr key={msg.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <TableCell><div className="flex items-center gap-2">{msg.recipient_user_id ? <User size={14} /> : <Users size={14} />}<span className="font-medium">{msg.recipient?.full_name || 'Tous les utilisateurs'}</span></div></TableCell>
                                        <TableCell>{msg.subject}</TableCell>
                                        <TableCell className="text-muted-foreground">{msg.admin?.full_name || 'N/A'}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}</TableCell>
                                    </motion.tr>
                                ))
                            }
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
);


const ComposeMessageDialog = ({ isOpen, onClose, adminUser }) => {
    const { toast } = useToast();
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null); // null for broadcast, object for specific user
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    useEffect(() => {
        if(isOpen) {
            const fetchUsers = async () => {
                const { data } = await supabase.from('profiles').select('id, full_name');
                setAllUsers(data || []);
            };
            fetchUsers();
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!subject.trim() || !content.trim()) {
            toast({ title: "Champs requis", description: "Le sujet et le message sont obligatoires.", variant: "destructive" });
            return;
        }

        setIsSending(true);
        const { error } = await supabase.from('admin_messages').insert({
            admin_id: adminUser.id,
            recipient_user_id: selectedUser ? selectedUser.id : null,
            subject,
            message_content: content,
        });

        if (error) {
            toast({ title: "Erreur", description: "L'envoi du message a échoué.", variant: "destructive" });
        } else {
            toast({ title: "Succès", description: "Le message a été envoyé." });
            setSubject('');
            setContent('');
            setSelectedUser(null);
            onClose();
        }
        setIsSending(false);
    };
    
    const broadcastOption = { id: 'broadcast', full_name: 'Tous les utilisateurs' };
    const filteredUsers = useMemo(() => {
        const usersWithOptions = [broadcastOption, ...allUsers];
        if (!searchValue) return usersWithOptions;
        return usersWithOptions.filter(user =>
            user.full_name.toLowerCase().includes(searchValue.toLowerCase())
        );
    }, [allUsers, searchValue]);

    const handleRecipientSelect = (user) => {
        setSelectedUser(user.id === 'broadcast' ? null : user);
        setOpen(false);
        setSearchValue("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Nouveau Message Administratif</DialogTitle>
                    <DialogDescription>Rédigez et envoyez un message à un utilisateur spécifique ou à tout le monde.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="recipient" className="text-right">Destinataire</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={open} className="w-[380px] justify-between col-span-3">
                                    {selectedUser ? selectedUser.full_name : (selectedUser === null ? "Tous les utilisateurs" : "Sélectionner...")}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[380px] p-0">
                                <div className="p-2 border-b"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="pl-9" /></div></div>
                                <div className="max-h-[300px] overflow-y-auto p-1">
                                    {filteredUsers.map((user) => (
                                        <div key={user.id} onClick={() => handleRecipientSelect(user)} className="flex items-center justify-between p-2 mx-1 rounded-md hover:bg-accent cursor-pointer text-sm">
                                            <div className="flex items-center gap-2">{user.id === 'broadcast' ? <Users size={14} /> : <User size={14} />}{user.full_name}</div>
                                            <Check className={((selectedUser?.id === user.id) || (selectedUser === null && user.id === 'broadcast')) ? "opacity-100 h-4 w-4" : "opacity-0 h-4 w-4"} />
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subject" className="text-right">Sujet</Label>
                        <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="content" className="text-right pt-2">Message</Label>
                        <Textarea id="content" value={content} onChange={e => setContent(e.target.value)} className="col-span-3 min-h-[150px]" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button onClick={handleSend} disabled={isSending}>
                        {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send size={16} className="mr-2" />}
                        Envoyer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AdminMessagesPage;