import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageCircle, User } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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
    const [messages, setMessages] = useState<Message[]>([]);
    const [sujet, setSujet] = useState('');
    const [nouveauMessage, setNouveauMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 10000); // Rafraîchir toutes les 10s
        return () => clearInterval(interval);
    }, [nupcan]);

    const loadMessages = async () => {
        try {
            setIsLoading(true);
            const response = await apiService.makeRequest<Message[]>(
                `/messages/candidat/${nupcan}`,
                'GET'
            );
            if (response.success && response.data) {
                setMessages(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!sujet.trim() || !nouveauMessage.trim()) {
            toast({
                title: 'Erreur',
                description: 'Veuillez remplir le sujet et le message',
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsSending(true);
            const response = await apiService.makeRequest(
                '/messages/candidat',
                'POST',
                {
                    nupcan,
                    sujet: sujet.trim(),
                    message: nouveauMessage.trim(),
                }
            );

            if (response.success) {
                toast({
                    title: 'Message envoyé',
                    description: 'Votre message a été envoyé à l\'administration',
                });
                setSujet('');
                setNouveauMessage('');
                await loadMessages();
            } else {
                throw new Error(response.message || 'Erreur envoi');
            }
        } catch (error: any) {
            toast({
                title: 'Erreur',
                description: error.message || 'Impossible d\'envoyer le message',
                variant: 'destructive',
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Formulaire d'envoi */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Nouveau message
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Sujet</label>
                        <Input
                            placeholder="Objet de votre message"
                            value={sujet}
                            onChange={(e) => setSujet(e.target.value)}
                            maxLength={200}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Message</label>
                        <Textarea
                            placeholder="Votre message..."
                            value={nouveauMessage}
                            onChange={(e) => setNouveauMessage(e.target.value)}
                            rows={5}
                            maxLength={2000}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {nouveauMessage.length}/2000 caractères
                        </p>
                    </div>
                    <Button
                        onClick={handleSendMessage}
                        disabled={isSending || !sujet.trim() || !nouveauMessage.trim()}
                        className="w-full"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        {isSending ? 'Envoi...' : 'Envoyer le message'}
                    </Button>
                </CardContent>
            </Card>

            {/* Liste des messages */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Historique des messages
                        {messages.length > 0 && (
                            <Badge variant="secondary">{messages.length}</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-sm text-muted-foreground mt-2">Chargement...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>Aucun message pour le moment</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`p-4 rounded-lg border ${
                                        msg.expediteur === 'candidat'
                                            ? 'bg-primary/5 border-primary/20 ml-8'
                                            : 'bg-muted/50 mr-8'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    msg.expediteur === 'candidat'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted'
                                                }`}
                                            >
                                                <User className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">
                                                    {msg.expediteur === 'candidat'
                                                        ? 'Vous'
                                                        : `Admin: ${msg.admin_prenom || ''} ${msg.admin_nom || ''}`}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(msg.created_at).toLocaleString('fr-FR')}
                                                </p>
                                            </div>
                                        </div>
                                        {msg.statut === 'non_lu' && msg.expediteur === 'admin' && (
                                            <Badge variant="default" className="text-xs">
                                                Nouveau
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="ml-10">
                                        <p className="font-medium text-sm mb-1">{msg.sujet}</p>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">
                                            {msg.message}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default MessagerieCandidat;
