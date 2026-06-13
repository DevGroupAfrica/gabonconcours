import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const NotificationBadge = () => {
    const navigate = useNavigate();
    const { admin } = useAdminAuth();

    const { data: notifications } = useQuery({
        queryKey: ['notifications', admin?.id],
        queryFn: async () => {
            const response = await apiService.makeRequest('/notifications/unread', 'GET');
            return response.data;
        },
        refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
        enabled: !!admin
    });

    const unreadCount = notifications?.length || 0;

    if (unreadCount === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge 
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 animate-pulse"
                            variant="destructive"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="p-2 border-b">
                    <h3 className="font-semibold">Notifications ({unreadCount})</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {notifications?.slice(0, 5).map((notif: any) => (
                        <DropdownMenuItem
                            key={notif.id}
                            onClick={() => {
                                if (notif.link) navigate(notif.link);
                            }}
                            className="cursor-pointer p-3 hover:bg-muted"
                        >
                            <div className="space-y-1">
                                <p className="text-sm font-medium">{notif.titre}</p>
                                <p className="text-xs text-muted-foreground">{notif.message}</p>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </div>
                <div className="p-2 border-t">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate('/admin/notifications')}
                    >
                        Voir toutes les notifications
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationBadge;
