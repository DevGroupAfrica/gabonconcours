import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: number;
  candidat_id: number;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  created_at: string;
}

export const useRealtimeNotifications = (candidatId?: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastNotificationId, setLastNotificationId] = useState<number>(0);

  // Récupérer les notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications', candidatId],
    queryFn: async () => {
      if (!candidatId) return [];
      const response = await apiService.makeRequest<Notification[]>(
        `/notifications/candidat/${candidatId}`,
        'GET'
      );
      return response.data || [];
    },
    enabled: !!candidatId,
    refetchInterval: 5000, // Poll toutes les 5 secondes
  });

  // Détecter les nouvelles notifications
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const latestNotif = notifications[0];
    
    // Si nouvelle notification détectée
    if (latestNotif.id > lastNotificationId && lastNotificationId > 0) {
      // Afficher toast
      toast({
        title: latestNotif.titre,
        description: latestNotif.message,
        duration: 5000,
      });

      // Jouer un son (optionnel)
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(() => {
        // Ignorer les erreurs de lecture audio
      });

      // Invalider les queries liées
      if (latestNotif.type === 'resultat') {
        queryClient.invalidateQueries({ queryKey: ['participation'] });
        queryClient.invalidateQueries({ queryKey: ['grades'] });
      } else if (latestNotif.type === 'validation') {
        queryClient.invalidateQueries({ queryKey: ['participation'] });
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['paiement'] });
      }
    }

    // Mettre à jour l'ID de la dernière notification
    if (latestNotif.id > lastNotificationId) {
      setLastNotificationId(latestNotif.id);
    }
  }, [notifications, lastNotificationId, toast, queryClient]);

  const markAsRead = async (notificationId: number) => {
    try {
      await apiService.makeRequest(
        `/notifications/${notificationId}/read`,
        'PUT'
      );
      queryClient.invalidateQueries({ queryKey: ['notifications', candidatId] });
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!candidatId) return;
      await apiService.makeRequest(
        `/notifications/candidat/${candidatId}/read-all`,
        'PUT'
      );
      queryClient.invalidateQueries({ queryKey: ['notifications', candidatId] });
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
    }
  };

  return {
    notifications: notifications || [],
    unreadCount: notifications?.filter(n => !n.lu).length || 0,
    markAsRead,
    markAllAsRead,
  };
};
