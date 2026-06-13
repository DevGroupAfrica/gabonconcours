import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Search,
  User,
  Clock,
  Mail,
  RefreshCw,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import MessagerieRealtime from '@/components/messaging/MessagerieRealtime';

interface Conversation {
  nupcan: string;
  nomcan: string;
  prncan: string;
  maican: string;
  libcnc?: string;
  total_messages: number;
  messages_non_lus: number;
  dernier_message_date: string;
  dernier_message: string;
}

interface ConversationsAdminProps {
  etablissementId?: number;
  adminId: number;
}

const ConversationsAdmin: React.FC<ConversationsAdminProps> = ({ etablissementId, adminId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'non_lu'>('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (etablissementId) params.append('etablissement_id', etablissementId.toString());
      if (filter === 'non_lu') params.append('statut', 'non_lu');
      if (search) params.append('search', search);

      const response = await fetch(
        `http://localhost:8002/api/messaging-realtime/admin/conversations?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 15000); // Refresh toutes les 15s
    return () => clearInterval(interval);
  }, [etablissementId, filter, search]);

  if (selectedConversation) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedConversation(null);
            loadConversations();
          }}
        >
          ← Retour aux conversations
        </Button>
        <MessagerieRealtime
          nupcan={selectedConversation}
          mode="admin"
          adminId={adminId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>Messagerie</CardTitle>
                <CardDescription>
                  {conversations.length} conversation(s) active(s)
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadConversations}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barre de recherche */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou NUPCAN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Toutes
            </Button>
            <Button
              variant={filter === 'non_lu' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('non_lu')}
            >
              <Filter className="w-4 h-4 mr-2" />
              Non lues
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des conversations */}
      <div className="space-y-3">
        {loading && conversations.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        ) : conversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Aucune conversation</p>
              <p className="text-sm">Les messages des candidats apparaîtront ici</p>
            </CardContent>
          </Card>
        ) : (
          conversations.map((conv) => (
            <Card
              key={conv.nupcan}
              className={`cursor-pointer transition-all hover:shadow-md ${
                conv.messages_non_lus > 0 ? 'border-primary/50 bg-primary/5' : ''
              }`}
              onClick={() => setSelectedConversation(conv.nupcan)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {conv.prncan} {conv.nomcan}
                          </h4>
                          {conv.messages_non_lus > 0 && (
                            <Badge variant="destructive" className="h-5">
                              {conv.messages_non_lus} nouveau{conv.messages_non_lus > 1 ? 'x' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span className="font-mono">{conv.nupcan}</span>
                          {conv.libcnc && (
                            <>
                              <span>•</span>
                              <span>{conv.libcnc}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ml-13 space-y-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {conv.dernier_message}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(new Date(conv.dernier_message_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{conv.total_messages} message(s)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{conv.maican}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationsAdmin;
