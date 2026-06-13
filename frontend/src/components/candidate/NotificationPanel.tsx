import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Bell, CheckCircle, XCircle, Clock, Eye, ChevronLeft, ChevronRight, Trash2} from 'lucide-react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {apiService} from '@/services/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

interface Notification {
    id: number;
    titre: string;
    message: string;
    type: string;
    statut: 'lu' | 'non_lu';
    created_at: string;
}

const NotificationPanel = ({nupcan}: { nupcan: string }) => {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const {data: notificationsData, isLoading, error} = useQuery({
        queryKey: ['notifications', nupcan],
        queryFn: () => apiService.getCandidateNotifications<Notification[]>(nupcan),
        refetchInterval: 10000,
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id: number) => {
            if (id == null) {
                console.error('ID est null ou undefined');
                return Promise.reject(new Error('ID de notification invalide'));
            }
            return apiService.markNotificationAsRead<null>(String(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['notifications', nupcan]});
        },
    });

    const deleteNotificationMutation = useMutation({
        mutationFn: (id: number) => {
            if (id == null) {
                console.error('ID est null ou undefined');
                return Promise.reject(new Error('ID de notification invalide'));
            }
            return apiService.deleteNotification(String(id));
        },
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({queryKey: ['notifications', nupcan]});
            setSelectedIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        },
    });

    const deleteAllNotificationsMutation = useMutation({
        mutationFn: () => apiService.deleteAllNotifications(nupcan),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['notifications', nupcan]});
            setSelectedIds(new Set());
        },
    });

    console.log('Données reçues:', notificationsData);
    if (error) console.error('Erreur API:', error);

    const notifications = notificationsData && notificationsData.success && Array.isArray(notificationsData.data)
        ? notificationsData.data
        : [];
    const unreadCount = notifications.filter((n: Notification) => n.statut === 'non_lu').length;

    const filteredNotifications = notifications.filter((n: Notification) => {
        if (filterStatus === 'all') return true;
        return n.statut === filterStatus;
    });

    const notificationsPerPage = 5;
    const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
    const startIndex = (currentPage - 1) * notificationsPerPage;
    const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + notificationsPerPage);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'document_validation':
                return <CheckCircle className="h-4 w-4 text-slate-500"/>;
            case 'document_rejection':
                return <XCircle className="h-4 w-4 text-slate-500"/>;
            default:
                return <Bell className="h-4 w-4 text-slate-500"/>;
        }
    };

    const handleMarkAsRead = (id: number) => {
        markAsReadMutation.mutate(id);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleFilterChange = (status: string) => {
        setFilterStatus(status);
        setCurrentPage(1);
    };

    const openModal = (notification: Notification) => {
        setSelectedNotification(notification);
    };

    const closeModal = () => {
        setSelectedNotification(null);
    };

    const handleToggleSelect = (id: number) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size > 0) {
            selectedIds.forEach((id) => deleteNotificationMutation.mutate(id));
        }
    };

    const handleDeleteAll = () => {
        deleteAllNotificationsMutation.mutate();
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-sm text-slate-500">Chargement des notifications...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-md border-slate-300 shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Bell className="h-5 w-5 mr-2"/>
                        Notifications
                    </div>
                    {unreadCount > 0 && <span className="rounded-full border border-[#dbe7f6] bg-[#f7faff] px-2.5 py-1 text-xs font-medium text-primary">{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex space-x-4">
                    <select
                        value={filterStatus}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none"
                    >
                        <option value="all">Tous</option>
                        <option value="lu">Lu</option>
                        <option value="non_lu">Non lu</option>
                    </select>
                    <Button variant="outline" size="sm" className="text-slate-600 hover:text-red-700" onClick={handleDeleteAll}
                            disabled={notifications.length === 0}>
                        <Trash2 className="h-4 w-4 mr-2"/>
                        Tout supprimer
                    </Button>
                    {selectedIds.size > 0 && (
                        <Button variant="outline" size="sm" className="text-slate-600 hover:text-red-700" onClick={handleDeleteSelected}>
                            <Trash2 className="h-4 w-4 mr-2"/>
                            Supprimer sélection ({selectedIds.size})
                        </Button>
                    )}
                </div>
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8">
                        <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                        <p className="text-muted-foreground">Aucune notification ou erreur de chargement</p>
                        {error && <p className="text-red-500 text-sm mt-2">Erreur : {error.message}</p>}
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {paginatedNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`cursor-pointer border p-4 ${
                                        notification.statut === 'non_lu'
                                            ? 'border-l-2 border-l-primary border-slate-300 bg-white'
                                            : 'border-slate-200 bg-slate-50'
                                    }`}
                                    onClick={() => openModal(notification)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3 flex-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(notification.id)}
                                                onChange={() => handleToggleSelect(notification.id)}
                                                className="mr-2 cursor-pointer"
                                            />
                                            {getNotificationIcon(notification.type)}
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-sm">{notification.titre}</h4>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-2 flex items-center">
                                                    <Clock className="h-3 w-3 mr-1"/>
                                                    {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            {notification.statut === 'non_lu' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(notification.id);
                                                    }}
                                                    disabled={markAsReadMutation.isPending}
                                                >
                                                    <Eye className="h-4 w-4"/>
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotificationMutation.mutate(notification.id);
                                                }}
                                                disabled={deleteNotificationMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-2"/>
                                Précédent
                            </Button>
                            <span>
                Page {currentPage} sur {totalPages}
              </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Suivant
                                <ChevronRight className="h-4 w-4 ml-2"/>
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
            <Dialog open={!!selectedNotification} onOpenChange={closeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedNotification?.titre}</DialogTitle>
                        <DialogDescription>
                            <p>{selectedNotification?.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                                <Clock className="h-3 w-3 mr-1 inline"/>
                                {selectedNotification?.created_at &&
                                    new Date(selectedNotification.created_at).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                            </p>
                            {selectedNotification?.statut === 'non_lu' && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(selectedNotification.id);
                                        closeModal();
                                    }}
                                    className="mt-4"
                                >
                                    <Eye className="h-4 w-4 mr-2"/> Marquer comme lu
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotificationMutation.mutate(selectedNotification.id);
                                    closeModal();
                                }}
                                className="mt-2"
                            >
                                <Trash2 className="h-4 w-4 mr-2"/> Supprimer
                            </Button>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default NotificationPanel;
