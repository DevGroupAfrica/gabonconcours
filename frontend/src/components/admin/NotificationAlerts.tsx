import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
    <div className="mb-6 grid gap-3 md:grid-cols-3">
      {newCandidates > 0 && (
        <AlertItem icon={Users} value={newCandidates} title="Nouvelles candidatures" text="En attente de traitement"/>
      )}

      {pendingDocuments > 0 && (
        <AlertItem icon={FileText} value={pendingDocuments} title="Documents à valider" text="Nécessitent votre validation"/>
      )}

      {pendingPayments > 0 && (
        <AlertItem icon={DollarSign} value={pendingPayments} title="Paiements en attente" text="À confirmer"/>
      )}
    </div>
  );
};

const AlertItem = ({icon: Icon, value, title, text}: any) => (
  <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-4">
    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[#2A6DF3]"><Icon className="h-5 w-5"/></span>
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold text-slate-900">{title}</p><span className="text-lg font-bold text-[#2A6DF3]">{value}</span></div>
      <p className="mt-0.5 text-xs text-slate-500">{text}</p>
    </div>
  </div>
);

export default NotificationAlerts;
