import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bell, FileText, Users, DollarSign } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const NotificationAlerts = () => {
  const { admin } = useAdminAuth();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiService.getStatistics(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const statisticsData = stats?.data || {};
  
  const newCandidates = statisticsData?.candidats?.en_attente || 0;
  const pendingDocuments = statisticsData?.documents?.en_attente || 0;
  const pendingPayments = statisticsData?.paiements?.en_attente || 0;

  if (newCandidates === 0 && pendingDocuments === 0 && pendingPayments === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {newCandidates > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Users className="h-4 w-4 text-blue-600" />
          <AlertTitle className="flex items-center gap-2">
            Nouvelles Candidatures
            <Badge variant="default" className="bg-blue-600">
              {newCandidates}
            </Badge>
          </AlertTitle>
          <AlertDescription>
            Vous avez {newCandidates} nouvelle(s) candidature(s) en attente de traitement.
          </AlertDescription>
        </Alert>
      )}

      {pendingDocuments > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <FileText className="h-4 w-4 text-orange-600" />
          <AlertTitle className="flex items-center gap-2">
            Documents à Valider
            <Badge variant="default" className="bg-orange-600">
              {pendingDocuments}
            </Badge>
          </AlertTitle>
          <AlertDescription>
            {pendingDocuments} document(s) nécessite(nt) votre validation.
          </AlertDescription>
        </Alert>
      )}

      {pendingPayments > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <DollarSign className="h-4 w-4 text-green-600" />
          <AlertTitle className="flex items-center gap-2">
            Paiements en Attente
            <Badge variant="default" className="bg-green-600">
              {pendingPayments}
            </Badge>
          </AlertTitle>
          <AlertDescription>
            {pendingPayments} paiement(s) en attente de confirmation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default NotificationAlerts;
