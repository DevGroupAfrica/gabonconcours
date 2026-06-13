import React from 'react';
import { useQuery } from '@tanstack/react-query';
import EnhancedAdminDashboard from '@/components/admin/EnhancedAdminDashboard';
import LoginNotifications, { useLoginNotifications } from '@/components/admin/LoginNotifications';
import { apiService } from '@/services/api';

const AdminEtablissementDashboard = () => {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    
    const { data: statistics } = useQuery({
        queryKey: ['admin-statistics', adminData.etablissement_id],
        queryFn: () => apiService.getStatistics(),
        refetchInterval: 30000,
    });

    const { notifications, dismissNotification } = useLoginNotifications(
        adminData,
        statistics?.data
    );

    return (
        <>
            <LoginNotifications 
                notifications={notifications} 
                onDismiss={dismissNotification}
            />
            <EnhancedAdminDashboard />
        </>
    );
};

export default AdminEtablissementDashboard;
