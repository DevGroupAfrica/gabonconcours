import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { Mail, Send, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {useAdminAuth} from '@/contexts/AdminAuthContext';
interface SupportRequest {
    id: number;
    sujet: string;
    message: string;
    status: string;
    created_at: string;
}
// ✅ Interface pour typer la réponse du backend
interface SupportMessage {
  id: number;
  nom: string;
  email: string;
  message: string;
  statut: 'en_attente' | 'traite' | string;
  created_at: string;
}

interface ApiResponse {
  success?: boolean;
  data?: SupportMessage[] | { requests?: SupportMessage[] } | any;
}

const SuperAdminSupport = () => {
     const {admin, logout} = useAdminAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [reponse, setReponse] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
  try {
    const response = await apiService.makeRequest<any>('/support', 'GET');

    // Certaines API renvoient les données sous response.data, d’autres directement
    const data = response?.data || response;

    // Vérifie si la réponse contient un tableau de messages
    if (Array.isArray(data)) {
      setMessages(data);
    } 
    else if (Array.isArray(data.data)) {
      setMessages(data.data);
    } 
    else if (Array.isArray(data.requests)) {
      setMessages(data.requests);
    } 
    else {
      console.warn('Format inattendu de la réponse API:', data);
      setMessages([]);
    }

    console.log('✅ Messages chargés avec succès:', data);

  } catch (error) {
    console.error('❌ Erreur lors du chargement des messages:', error);
  } finally {
    setLoading(false);
  }
};


 const handleRepondre = async () => {
    if (!reponse.trim() || !selectedMessage) {
      toast({ title: 'Réponse requise', description: 'Veuillez entrer une réponse', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const response = await apiService.makeRequest<ApiResponse>(
        `/support/requests/${selectedMessage.id}/responses`,
        'POST',
        { message: reponse, admin_id: admin.id }
      );

      if (response?.success || response?.data?.success) {
        toast({ title: 'Succès', description: 'Réponse envoyée par email' });
        setReponse('');
        setSelectedMessage(null);
        loadMessages();
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible d\'envoyer la réponse', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const marquerCommeTraite = async (id: number) => {
    try {
      await apiService.makeRequest(`/support/${id}/traiter`, 'PUT');
      toast({
        title: 'Message traité',
        description: 'Le message a été marqué comme traité'
      });
      loadMessages();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'traite':
        return <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />Traité</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Support Client</h1>
          <p className="text-muted-foreground">Gérer les demandes de support</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {messages.filter(m => m.statut === 'en_attente').length} en attente
        </Badge>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{messages.length}</div>
              <div className="text-sm text-muted-foreground">Total messages</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">
                {messages.filter(m => m.statut === 'en_attente').length}
              </div>
              <div className="text-sm text-muted-foreground">En attente</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">
                {messages.filter(m => m.statut === 'traite').length}
              </div>
              <div className="text-sm text-muted-foreground">Traités</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des messages */}
      <Card>
        <CardHeader>
          <CardTitle>Messages de Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun message de support
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{message.nom}</h3>
                        {getStatusBadge(message.statut)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{message.email}</span>
                        <span>•</span>
                        <span>{new Date(message.created_at).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm mb-3 whitespace-pre-wrap">{message.message}</p>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => setSelectedMessage(message)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Répondre
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Répondre à {message.nom}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm font-medium mb-1">Message original:</p>
                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Votre réponse:</label>
                            <Textarea
                              value={reponse}
                              onChange={(e) => setReponse(e.target.value)}
                              placeholder="Entrez votre réponse..."
                              rows={6}
                              className="mt-2"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedMessage(null);
                                setReponse('');
                              }}
                            >
                              Annuler
                            </Button>
                            <Button onClick={handleRepondre} disabled={sending}>
                              {sending ? 'Envoi...' : 'Envoyer par email'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {message.statut === 'en_attente' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => marquerCommeTraite(message.id)}
                      >
                        Marquer comme traité
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminSupport;
