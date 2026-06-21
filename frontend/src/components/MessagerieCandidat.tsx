import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Mail, Clock, CheckCircle2, Paperclip, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

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

interface Attachment {
    original_name: string;
    filename: string;
    mimetype: string;
    size: number;
    url: string;
}

interface Message {
    id: number;
    sujet: string;
    message: string;
    expediteur: 'candidat' | 'admin';
    statut: 'lu' | 'non_lu';
    created_at: string;
    admin_nom?: string;
    admin_prenom?: string;
    pieces_jointes?: Attachment[];
}

interface MessagerieCandidatProps {
    nupcan: string;
}

const formatFileSize = (size: number) => {
    if (!size) return '';
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
    return `${(size / 1024 / 1024).toFixed(1)} Mo`;
};

const MessagerieCandidat: React.FC<MessagerieCandidatProps> = ({ nupcan }) => {
    const [showForm, setShowForm] = useState(false);
    const [sujet, setSujet] = useState('');
    const [message, setMessage] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const queryClient = useQueryClient();

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['messages', nupcan],
        queryFn: async () => {
            const response = await apiService.makeRequest<Message[]>(`/messages/candidat/${nupcan}`, 'GET');
            return response.data || [];
        },
        enabled: !!nupcan,
        refetchInterval: 10000,
    });

    const sendMessageMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append('nupcan', nupcan);
            formData.append('sujet', sujet.trim());
            formData.append('message', message.trim());
            files.forEach((file) => formData.append('pieces_jointes', file));
            const response = await apiService.makeFormDataRequest('/messages/candidat', 'POST', formData);
            if (!response.success) throw new Error(response.message || 'Impossible d\'envoyer le message');
            return response;
        },
        onSuccess: () => {
            toast({ title: 'Message envoyé', description: 'Votre message a été envoyé avec succès' });
            setSujet('');
            setMessage('');
            setFiles([]);
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

    const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        const nextFiles = [...files, ...selectedFiles].slice(0, MAX_FILES);
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

        setFiles(nextFiles);
        event.target.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sujet.trim() || !message.trim()) {
            toast({ title: 'Erreur', description: 'Veuillez remplir le sujet et le message', variant: 'destructive' });
            return;
        }
        sendMessageMutation.mutate();
    };

    return (
        <Card className="rounded-md border-slate-300 shadow-none">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Messagerie interne
                        <Badge variant="secondary">{messages.length}/100</Badge>
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
                            <Input value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder="Sujet de votre message" maxLength={255} required />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Message</label>
                            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Votre message..." rows={4} maxLength={3000} required />
                            <p className="mt-1 text-xs text-slate-500">{message.length}/3000 caractères</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Pièces jointes</label>
                            <Input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFilesChange} />
                            <p className="mt-1 text-xs text-slate-500">Jusqu'à {MAX_FILES} fichiers, 10 Mo chacun.</p>
                            {files.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {files.map((file, index) => (
                                        <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
                                            <span className="flex items-center gap-2"><Paperclip className="h-4 w-4" />{file.name} <span className="text-slate-500">({formatFileSize(file.size)})</span></span>
                                            <Button type="button" size="sm" variant="ghost" onClick={() => setFiles(files.filter((_, fileIndex) => fileIndex !== index))}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={sendMessageMutation.isPending}>
                                {sendMessageMutation.isPending ? 'Envoi...' : 'Envoyer'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setSujet(''); setMessage(''); setFiles([]); }}>
                                Annuler
                            </Button>
                        </div>
                    </form>
                )}

                {isLoading ? (
                    <div className="py-8 text-center text-sm text-slate-500">Chargement des messages...</div>
                ) : messages.length > 0 ? (
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`border p-4 ${msg.expediteur === 'candidat' ? 'border-l-2 border-l-primary border-slate-300 bg-white ml-8' : 'border-slate-300 bg-slate-50 mr-8'}`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {msg.expediteur === 'admin' ? <Mail className="h-4 w-4 text-slate-500" /> : <Send className="h-4 w-4 text-muted-foreground" />}
                                        <span className="font-medium">{msg.expediteur === 'admin' ? `${msg.admin_prenom || ''} ${msg.admin_nom || 'Administration'}` : 'Vous'}</span>
                                        {msg.statut === 'lu' ? <CheckCircle2 className="h-4 w-4 text-slate-400" /> : <Clock className="h-4 w-4 text-slate-400" />}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString('fr-FR')}</span>
                                </div>
                                <h4 className="font-semibold mb-2">{msg.sujet}</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
                                {(msg.pieces_jointes?.length || 0) > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {msg.pieces_jointes!.map((file) => (
                                            <a key={file.filename} href={`${API_ORIGIN}${file.url}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm text-primary hover:underline">
                                                <Paperclip className="h-4 w-4" />
                                                {file.original_name}
                                                <span className="text-xs text-slate-500">({formatFileSize(file.size)})</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
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
