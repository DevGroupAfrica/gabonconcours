import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Mail, Clock, CheckCircle2, User, Paperclip, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface Message {
    id: number;
    candidat_nupcan: string;
    sujet: string;
    message: string;
    expediteur: 'candidat' | 'admin';
    statut: 'lu' | 'non_lu';
    created_at: string;
    nomcan?: string;
    prncan?: string;
    maican?: string;
    admin_nom?: string;
    admin_prenom?: string;
    pieces_jointes?: Attachment[];
}

interface Attachment {
    original_name: string;
    filename: string;
    mimetype: string;
    size: number;
    url: string;
}

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8002/api').replace(/\/api\/?$/, '');
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const formatFileSize = (size: number) => {
    if (!size) return '';
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
    return `${(size / 1024 / 1024).toFixed(1)} Mo`;
};

const MessagerieAdmin: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replySubject, setReplySubject] = useState('');
    const [replyFiles, setReplyFiles] = useState<File[]>([]);

    // Récupération de l'admin connecté pour filtrer par établissement
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    
    const { data: messages, isLoading } = useQuery<Message[]>({
        queryKey: ['admin-messages', adminData.etablissement_id],
        queryFn: async () => {
            // ✅ Filtrer les messages par établissement de l'admin
            const params = adminData.etablissement_id 
                ? `?etablissement_id=${adminData.etablissement_id}` 
                : '';
            const response = await apiService.makeRequest<Message[]>(`/messages/admin${params}`, 'GET');
            return response.data || [];
        },
        refetchInterval: 10000,
    });

    const replyMutation = useMutation({
        mutationFn: async (data: { message_id: number; nupcan: string; sujet: string; message: string }) => {
            const admin = JSON.parse(localStorage.getItem('adminData') || localStorage.getItem('adminUser') || '{}');
            const formData = new FormData();
            formData.append('message_id', String(data.message_id));
            formData.append('nupcan', data.nupcan);
            formData.append('sujet', data.sujet);
            formData.append('message', data.message);
            formData.append('admin_id', String(admin.id || ''));
            replyFiles.forEach((file) => formData.append('pieces_jointes', file));
            const response = await apiService.makeFormDataRequest('/messages/admin/repondre', 'POST', formData);
            if (!response.success) throw new Error(response.message || 'Impossible d\'envoyer la réponse');
            return response;
        },
        onSuccess: () => {
            toast({
                title: 'Réponse envoyée',
                description: 'Votre réponse a été envoyée au candidat',
            });
            setReplyText('');
            setReplySubject('');
            setReplyFiles([]);
            setSelectedMessage(null);
            queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Erreur',
                description: error.message || 'Impossible d\'envoyer la réponse',
                variant: 'destructive',
            });
        },
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (messageId: number) => {
            return await apiService.makeRequest(`/messages/${messageId}/marquer-lu`, 'PUT');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
        },
    });

    const handleReply = (message: Message) => {
        setSelectedMessage(message);
        setReplySubject(`Re: ${message.sujet}`);
        if (message.statut === 'non_lu') {
            markAsReadMutation.mutate(message.id);
        }
    };

    const handleSendReply = () => {
        if (!selectedMessage || !replyText.trim()) {
            toast({
                title: 'Erreur',
                description: 'Veuillez saisir un message',
                variant: 'destructive',
            });
            return;
        }

        replyMutation.mutate({
            message_id: selectedMessage.id,
            nupcan: selectedMessage.candidat_nupcan,
            sujet: replySubject,
            message: replyText,
        });
    };

    const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        const nextFiles = [...replyFiles, ...selectedFiles].slice(0, MAX_FILES);
        const invalidFile = nextFiles.find((file) => !allowedTypes.includes(file.type) || file.size > MAX_FILE_SIZE);

        if (invalidFile) {
            toast({
                title: 'Fichier non accepté',
                description: 'Ajoutez uniquement photo, PDF, DOC, DOCX, XLS ou XLSX de 10 Mo maximum.',
                variant: 'destructive',
            });
            event.target.value = '';
            return;
        }

        setReplyFiles(nextFiles);
        event.target.value = '';
    };

    const unreadCount = messages?.filter((m) => m.statut === 'non_lu' && m.expediteur === 'candidat').length || 0;

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4">Chargement des messages...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Messagerie
                    </CardTitle>
                    <Badge variant="destructive">{unreadCount} non lu(s)</Badge>
                </div>
            </CardHeader>
            <CardContent>
                {messages && messages.length > 0 ? (
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <Card
                                key={message.id}
                                className={`cursor-pointer hover:border-primary transition-colors ${
                                    message.statut === 'non_lu' && message.expediteur === 'candidat'
                                        ? 'border-primary bg-primary/5'
                                        : ''
                                }`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {message.expediteur === 'candidat' ? (
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Mail className="h-4 w-4 text-primary" />
                                                )}
                                                <span className="font-medium">
                                                    {message.expediteur === 'candidat'
                                                        ? `${message.prncan || ''} ${message.nomcan || ''} (${message.candidat_nupcan})`
                                                        : `Admin: ${message.admin_prenom || ''} ${message.admin_nom || ''}`}
                                                </span>
                                                {message.statut === 'lu' ? (
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <Clock className="h-4 w-4 text-orange-600" />
                                                )}
                                            </div>
                                            <h4 className="font-semibold mb-2">{message.sujet}</h4>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {message.message}
                                            </p>
                                            {(message.pieces_jointes?.length || 0) > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {message.pieces_jointes!.map((file) => (
                                                        <a
                                                            key={file.filename}
                                                            href={`${API_ORIGIN}${file.url}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-primary hover:underline"
                                                        >
                                                            <Paperclip className="h-3 w-3" />
                                                            {file.original_name}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span>{new Date(message.created_at).toLocaleString('fr-FR')}</span>
                                                {message.maican && <span>{message.maican}</span>}
                                            </div>
                                        </div>
                                        {message.expediteur === 'candidat' && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleReply(message)}
                                                    >
                                                        <Send className="h-4 w-4 mr-2" />
                                                        Répondre
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Répondre au message</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-sm font-medium mb-2 block">
                                                                Destinataire
                                                            </label>
                                                            <Input
                                                                value={`${message.prncan} ${message.nomcan} (${message.candidat_nupcan})`}
                                                                disabled
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium mb-2 block">
                                                                Sujet
                                                            </label>
                                                            <Input
                                                                value={replySubject}
                                                                onChange={(e) => setReplySubject(e.target.value)}
                                                                placeholder="Sujet de la réponse"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium mb-2 block">
                                                                Message original
                                                            </label>
                                                            <div className="p-3 bg-muted rounded-lg text-sm">
                                                                <p className="font-medium mb-1">{message.sujet}</p>
                                                                <p className="text-muted-foreground">{message.message}</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium mb-2 block">
                                                                Votre réponse
                                                            </label>
                                                            <Textarea
                                                                value={replyText}
                                                                onChange={(e) => setReplyText(e.target.value)}
                                                                placeholder="Votre message..."
                                                                rows={6}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium mb-2 block">
                                                                Pièces jointes
                                                            </label>
                                                            <Input
                                                                type="file"
                                                                multiple
                                                                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx"
                                                                onChange={handleFilesChange}
                                                            />
                                                            <p className="mt-1 text-xs text-muted-foreground">Jusqu'à 5 fichiers, 10 Mo chacun.</p>
                                                            {replyFiles.length > 0 && (
                                                                <div className="mt-3 space-y-2">
                                                                    {replyFiles.map((file, index) => (
                                                                        <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                                                                            <span className="flex items-center gap-2">
                                                                                <Paperclip className="h-4 w-4" />
                                                                                {file.name}
                                                                                <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                                                                            </span>
                                                                            <Button type="button" size="sm" variant="ghost" onClick={() => setReplyFiles(replyFiles.filter((_, fileIndex) => fileIndex !== index))}>
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setSelectedMessage(null);
                                                                    setReplyText('');
                                                                    setReplySubject('');
                                                                    setReplyFiles([]);
                                                                }}
                                                            >
                                                                Annuler
                                                            </Button>
                                                            <Button
                                                                onClick={handleSendReply}
                                                                disabled={replyMutation.isPending || !replyText.trim()}
                                                            >
                                                                {replyMutation.isPending ? 'Envoi...' : 'Envoyer'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p>Aucun message</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MessagerieAdmin;
