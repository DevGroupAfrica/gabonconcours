import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, AlertCircle, FileText, Users, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  type: 'candidature' | 'document' | 'paiement' | 'message';
  title: string;
  message: string;
  count?: number;
  icon: React.ReactNode;
  color: string;
}

interface LoginNotificationsProps {
  notifications: Notification[];
  onDismiss?: (id: string) => void;
}

const LoginNotifications: React.FC<LoginNotificationsProps> = ({ notifications, onDismiss }) => {
  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    // Show notifications one by one with delay
    notifications.forEach((notif, index) => {
      setTimeout(() => {
        setVisible(prev => [...prev, notif.id]);
      }, index * 500);
    });
  }, [notifications]);

  const handleDismiss = (id: string) => {
    setVisible(prev => prev.filter(visId => visId !== id));
    setTimeout(() => {
      onDismiss?.(id);
    }, 300);
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-md">
      <AnimatePresence>
        {notifications.map((notif) => 
          visible.includes(notif.id) && (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <Card className={`${notif.color} shadow-lg border-2 animate-pulse`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {notif.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Bell className="w-4 h-4 animate-bounce" />
                          {notif.title}
                          {notif.count && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs">
                              {notif.count}
                            </span>
                          )}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDismiss(notif.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginNotifications;

// Hook personnalisé pour gérer les notifications de connexion
export const useLoginNotifications = (adminData: any, statistics: any) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!adminData || !statistics) return;

    const newNotifications: Notification[] = [];

    // Nouvelles candidatures
    if (statistics.candidats?.en_attente > 0) {
      newNotifications.push({
        id: 'candidatures',
        type: 'candidature',
        title: 'Nouvelles candidatures',
        message: `${statistics.candidats.en_attente} nouvelle(s) candidature(s) pour votre établissement`,
        count: statistics.candidats.en_attente,
        icon: <Users className="w-5 h-5 text-blue-600" />,
        color: 'bg-blue-50 border-blue-200'
      });
    }

    // Documents en attente
    if (statistics.documents?.en_attente > 0) {
      newNotifications.push({
        id: 'documents',
        type: 'document',
        title: 'Documents à valider',
        message: `${statistics.documents.en_attente} document(s) en attente de validation`,
        count: statistics.documents.en_attente,
        icon: <FileText className="w-5 h-5 text-orange-600" />,
        color: 'bg-orange-50 border-orange-200'
      });
    }

    // Paiements en attente
    if (statistics.paiements?.en_attente > 0) {
      newNotifications.push({
        id: 'paiements',
        type: 'paiement',
        title: 'Paiements à confirmer',
        message: `${statistics.paiements.en_attente} paiement(s) en attente de confirmation`,
        count: statistics.paiements.en_attente,
        icon: <DollarSign className="w-5 h-5 text-green-600" />,
        color: 'bg-green-50 border-green-200'
      });
    }

    setNotifications(newNotifications);

    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      setNotifications([]);
    }, 10000);

    return () => clearTimeout(timer);
  }, [adminData, statistics]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { notifications, dismissNotification };
};
