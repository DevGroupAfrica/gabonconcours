import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  User,
  Mail,
  Clock,
  CheckCircle2,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SuccessModal from '@/components/modals/SuccessModal';
import ErrorModal from '@/components/modals/ErrorModal';

interface Message {
  id: number;
  candidat_nupcan: string;
  admin_id?: number;
  sujet: string;
  message: string;
  expediteur: 'candidat' | 'admin';
  statut: 'lu' | 'non_lu';
  created_at: string;
  updated_at: string;
  nomcan?: string;
  prncan?: string;
  maican?: string;
  admin_nom?: string;
  admin_prenom?: string;
}

interface MessagerieRealtimeProps {
  nupcan: string;
  mode: 'candidat' | 'admin';
  adminId?: number;
}

const MessagerieRealtime: React.FC<MessagerieRealtimeProps> = ({ nupcan, mode, adminId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sujet, setSujet] = useState('');
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [successModal, setSuccessModal] = useState({ show: false, message: '' });
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Charger les messages
  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8002/api/messaging-realtime/candidat/${nupcan}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      setErrorModal({
        show: true,
        message: 'Impossible de charger les messages. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh toutes les 10 secondes
  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [nupcan]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Envoyer un message (candidat)
  const handleSendMessage = async () => {
    if (!sujet.trim() || !nouveauMessage.trim()) {
      setErrorModal({
        show: true,
        message: 'Veuillez remplir le sujet et le message.'
      });
      return;
    }

    setSending(true);

    try {
      const response = await fetch('http://localhost:8002/api/messaging-realtime/candidat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nupcan,
          sujet,
          message: nouveauMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessModal({
          show: true,
          message: 'Message envoyé avec succès ! Vous recevrez une réponse par email.'
        });
        setSujet('');
        setNouveauMessage('');
        setShowNewMessage(false);
        loadMessages();
      } else {
        setErrorModal({ show: true, message: data.message });
      }
    } catch (error: any) {
      console.error('Erreur envoi message:', error);
      setErrorModal({
        show: true,
        message: 'Erreur lors de l\'envoi. Veuillez réessayer.'
      });
    } finally {
      setSending(false);
    }
  };

  // Répondre à un message (admin)
  const handleReply = async (messageId: number) => {
    if (!nouveauMessage.trim() || !adminId) {
      setErrorModal({
        show: true,
        message: 'Veuillez saisir un message et vous assurer d\'être connecté.'
      });
      return;
    }

    setSending(true);

    try {
      const response = await fetch('http://localhost:8002/api/messaging-realtime/admin/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nupcan,
          admin_id: adminId,
          message_id: messageId,
          sujet: sujet || 'Réponse à votre message',
          message: nouveauMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessModal({
          show: true,
          message: 'Réponse envoyée avec succès ! Le candidat recevra un email.'
        });
        setNouveauMessage('');
        setSujet('');
        setShowNewMessage(false);
        loadMessages();
      } else {
        setErrorModal({ show: true, message: data.message });
      }
    } catch (error) {
      console.error('Erreur réponse:', error);
      setErrorModal({
        show: true,
        message: 'Erreur lors de l\'envoi de la réponse.'
      });
    } finally {
      setSending(false);
    }
  };

  // Marquer comme lu
  const markAsRead = async (messageId: number) => {
    try {
      await fetch(`http://localhost:8002/api/messaging-realtime/${messageId}/read`, {
        method: 'PUT'
      });
      loadMessages();
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>Messagerie</CardTitle>
                <CardDescription>
                  {mode === 'candidat'
                    ? 'Échangez avec l\'administration'
                    : `Conversation avec ${messages[0]?.prncan} ${messages[0]?.nomcan}`}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={loadMessages}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              {mode === 'candidat' && (
                <Button
                  size="sm"
                  onClick={() => setShowNewMessage(!showNewMessage)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Nouveau message
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Formulaire nouveau message */}
      {showNewMessage && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg">
              {mode === 'candidat' ? 'Nouveau message' : 'Répondre'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Sujet</label>
              <Input
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                placeholder="Sujet de votre message"
                disabled={sending}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                value={nouveauMessage}
                onChange={(e) => setNouveauMessage(e.target.value)}
                placeholder="Votre message..."
                rows={5}
                disabled={sending}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={mode === 'candidat' ? handleSendMessage : () => handleReply(messages[0]?.id)}
                disabled={sending || !nouveauMessage.trim()}
                className="flex-1"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewMessage(false);
                  setSujet('');
                  setNouveauMessage('');
                }}
                disabled={sending}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique des messages ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Aucun message</p>
              <p className="text-sm">
                {mode === 'candidat'
                  ? 'Commencez une conversation en envoyant un message'
                  : 'Aucun message dans cette conversation'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {messages.map((msg, index) => {
                const isFromCandidat = msg.expediteur === 'candidat';
                const isCurrentUser = mode === 'candidat' ? isFromCandidat : !isFromCandidat;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {/* En-tête du message */}
                      <div className="flex items-center gap-2 mb-2">
                        {isFromCandidat ? (
                          <>
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {msg.prncan} {msg.nomcan}
                            </span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {msg.admin_prenom} {msg.admin_nom}
                            </span>
                          </>
                        )}
                        {msg.statut === 'non_lu' && !isCurrentUser && (
                          <Badge variant="secondary" className="ml-auto">Nouveau</Badge>
                        )}
                      </div>

                      {/* Sujet */}
                      {index === 0 || msg.sujet !== messages[index - 1]?.sujet ? (
                        <p className="text-sm font-semibold mb-2 opacity-90">
                          {msg.sujet}
                        </p>
                      ) : null}

                      {/* Message */}
                      <p className="text-sm whitespace-pre-wrap mb-3">{msg.message}</p>

                      {/* Footer */}
                      <div className="flex items-center gap-2 text-xs opacity-75">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(new Date(msg.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </span>
                        {msg.statut === 'lu' && isCurrentUser && (
                          <>
                            <CheckCircle2 className="w-3 h-3 ml-2" />
                            <span>Lu</span>
                          </>
                        )}
                      </div>

                      {/* Actions pour admin */}
                      {mode === 'admin' && !isCurrentUser && msg.statut === 'non_lu' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 w-full"
                          onClick={() => markAsRead(msg.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Marquer comme lu
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bouton réponse rapide pour admin */}
      {mode === 'admin' && messages.length > 0 && !showNewMessage && (
        <Button
          onClick={() => setShowNewMessage(true)}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          Répondre au candidat
        </Button>
      )}

      <SuccessModal
        isOpen={successModal.show}
        onClose={() => setSuccessModal({ show: false, message: '' })}
        message={successModal.message}
      />

      <ErrorModal
        isOpen={errorModal.show}
        onClose={() => setErrorModal({ show: false, message: '' })}
        message={errorModal.message}
      />
    </div>
  );
};

export default MessagerieRealtime;
