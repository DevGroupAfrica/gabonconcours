import React, {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {toast} from '@/hooks/use-toast';
import {apiService} from '@/services/api';
import CrudTable from '@/components/admin/CrudTable';
import FormDialog from '@/components/admin/FormDialog';

const GestionNiveaux = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState({});
    const queryClient = useQueryClient();

    const {data: niveauxData, isLoading} = useQuery({
        queryKey: ['niveaux'],
        queryFn: () => apiService.getNiveaux(),
    });

    const niveaux = niveauxData?.data || [];
    const filteredNiveaux = niveaux.filter((n: any) =>
        n.nomniv?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const createMutation = useMutation({
        mutationFn: (data: any) => apiService.createNiveau(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['niveaux']});
            toast({
                title: "Niveau créé",
                description: "Le niveau a été créé avec succès",
            });
            setDialogOpen(false);
            setFormData({});
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de créer le niveau",
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({id, data}: { id: string; data: any }) =>
            apiService.updateNiveau(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['niveaux']});
            toast({
                title: "Niveau modifié",
                description: "Le niveau a été modifié avec succès",
            });
            setDialogOpen(false);
            setEditingItem(null);
            setFormData({});
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de modifier le niveau",
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiService.deleteNiveau(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['niveaux']});
            toast({
                title: "Niveau supprimé",
                description: "Le niveau a été supprimé avec succès",
            });
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de supprimer le niveau",
                variant: "destructive",
            });
        },
    });

    const columns = [
        {key: 'nomniv', label: 'Nom du niveau'},
        {key: 'description', label: 'Description'},
        {
            key: 'created_at',
            label: 'Date de création',
            render: (value: string) => new Date(value).toLocaleDateString('fr-FR')
        },
    ];

    const formFields = [
        {
            name: 'nomniv',
            label: 'Nom du niveau',
            type: 'text' as const,
            required: true,
            placeholder: 'Ex: Licence, Master...'
        },
        {
            name: 'description',
            label: 'Description',
            type: 'textarea' as const,
            placeholder: 'Description du niveau...'
        },
    ];

    const handleAdd = () => {
        setEditingItem(null);
        setFormData({});
        setDialogOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData(item);
        setDialogOpen(true);
    };

    const handleDelete = (item: any) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce niveau ?')) {
            deleteMutation.mutate(item.id.toString());
        }
    };

    const handleSubmit = () => {
        if (editingItem) {
            updateMutation.mutate({id: editingItem.id.toString(), data: formData});
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <div className="space-y-6">
            <CrudTable
                title="Niveaux"
                description="Gestion des niveaux d'études"
                data={filteredNiveaux}
                columns={columns}
                isLoading={isLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchPlaceholder="Rechercher un niveau..."
            />

            <FormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editingItem ? 'Modifier le niveau' : 'Ajouter un niveau'}
                fields={formFields}
                data={formData}
                onDataChange={setFormData}
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
};

export default GestionNiveaux;
