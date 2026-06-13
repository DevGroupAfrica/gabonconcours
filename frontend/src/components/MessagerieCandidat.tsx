import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Mail, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

interface Message {
    id: number;
    sujet: string;
    message: string;
    expediteur: 'candidat' | 'admin';
    statut: 'lu' | 'non_lu';
    created_at: string;
    admin_nom?: string;
    admin_prenom?: string;
}

interface MessagerieCandidatProps {
    nupcan: string;
}

const MessagerieCandidat: React.FC<MessagerieCandidatProps> = ({ nupcan }) => {
    const [showForm, setShowForm] = useState(false);
    const [sujet, setSujet] = useState('');
    const [message, setMessage] = useState('');
    const queryClient = useQueryClient();

    const { data: messages, isLoading } = useQuery({
        queryKey: ['messages', nupcan],
        queryFn: async () => {
            const response = await apiService.makeRequest<Message[]>(`/messages/candidat/${nupcan}`, 'GET');
            return response.data || [];
        },
        refetchInterval: 10000,
    });

    const sendMessageMutation = useMutation({
        mutationFn: async (data: { sujet: string; message: string }) => {
            return await apiService.makeRequest('/messages/candidat', 'POST', {
                nupcan,
                ...data,
            });
        },
        onSuccess: () => {
            toast({
                title: 'Message envoyé',
                description: 'Votre message a été envoyé avec succès',
            });
            setSujet('');
            setMessage('');
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['messages', nupcan] });
        },
        onError: (error: any) => {
            toast({
                title: 'Erreur',
                description: error.message || 'Impossible d\'envoyer le message',
                variant: 'destructive',
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sujet.trim() || !message.trim()) {
            toast({
                title: 'Erreur',
                description: 'Veuillez remplir tous les champs',
                variant: 'destructive',
            });
            return;
        }
        sendMessageMutation.mutate({ sujet, message });
    };

    return (
        <Card className="rounded-md border-slate-300 shadow-none">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Messagerie
                    </CardTitle>
                    {!showForm && (
                        <Button onClick={() => setShowForm(true)} size="sm">
                            <Send className="h-4 w-4 mr-2" />
                            Nouveau message
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {showForm && (
                    <form onSubmit={handleSubmit} className="mb-6 space-y-4 border border-slate-300 bg-slate-50 p-5">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Sujet</label>
                            <Input
                                value={sujet}
                                onChange={(e) => setSujet(e.target.value)}
                                placeholder="Sujet de votre message"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Message</label>
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Votre message..."
                                rows={4}
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={sendMessageMutation.isPending}>
                                {sendMessageMutation.isPending ? 'Envoi...' : 'Envoyer'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowForm(false);
                                    setSujet('');
                                    setMessage('');
                                }}
                            >
                                Annuler
                            </Button>
                        </div>
                    </form>
                )}

                {isLoading ? (
                    <div className="py-8 text-center text-sm text-slate-500">Chargement des messages...</div>
                ) : messages && messages.length > 0 ? (
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`border p-4 ${
                                    msg.expediteur === 'candidat'
                                        ? 'border-l-2 border-l-primary border-slate-300 bg-white ml-8'
                                        : 'border-slate-300 bg-slate-50 mr-8'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {msg.expediteur === 'admin' ? (
                                            <Mail className="h-4 w-4 text-slate-500" />
                                        ) : (
                                            <Send className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="font-medium">
                                            {msg.expediteur === 'admin'
                                                ? `${msg.admin_prenom || ''} ${msg.admin_nom || 'Administration'}`
                                                : 'Vous'}
                                        </span>
                                        {msg.statut === 'lu' ? (
                                            <CheckCircle2 className="h-4 w-4 text-slate-400" />
                                        ) : (
                                            <Clock className="h-4 w-4 text-slate-400" />
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(msg.created_at).toLocaleString('fr-FR')}
                                    </span>
                                </div>
                                <h4 className="font-semibold mb-2">{msg.sujet}</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {msg.message}
                                </p>
                                <p className="mt-3 text-xs font-medium text-slate-400">{msg.expediteur === 'admin' ? 'Réponse de l’administration' : 'Message envoyé'}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Aucun message pour le moment</p>
                        <p className="text-sm">Envoyez un message pour contacter l'administration</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MessagerieCandidat;
