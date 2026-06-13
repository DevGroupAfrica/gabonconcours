import React, {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {toast} from '@/hooks/use-toast';
import {apiService} from '@/services/api';
import CrudTable from '@/components/admin/CrudTable';
import FormDialog from '@/components/admin/FormDialog';

const GestionFilieres = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const queryClient = useQueryClient();

    const {data: filieresData, isLoading} = useQuery({
        queryKey: ['filieres'],
        queryFn: () => apiService.getFilieres(),
    });

    const {data: niveauxData} = useQuery({
        queryKey: ['niveaux'],
        queryFn: () => apiService.getNiveaux(),
    });

    const filieres = filieresData?.data || [];
    const niveaux = niveauxData?.data || [];
    const filteredFilieres = filieres.filter((f: any) =>
        f.nomfil?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const createMutation = useMutation({
        mutationFn: (data: any) => apiService.createFiliere(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['filieres']});
            toast({
                title: "Filière créée",
                description: "La filière a été créée avec succès",
            });
            setDialogOpen(false);
            setFormData({});
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de créer la filière",
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({id, data}: { id: string; data: any }) =>
            apiService.updateFiliere(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['filieres']});
            toast({
                title: "Filière modifiée",
                description: "La filière a été modifiée avec succès",
            });
            setDialogOpen(false);
            setEditingItem(null);
            setFormData({});
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de modifier la filière",
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiService.deleteFiliere(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['filieres']});
            toast({
                title: "Filière supprimée",
                description: "La filière a été supprimée avec succès",
            });
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de supprimer la filière",
                variant: "destructive",
            });
        },
    });

    const columns = [
        {key: 'nomfil', label: 'Nom de la filière'},
        {key: 'description', label: 'Description'},
        {
            key: 'created_at',
            label: 'Date de création',
            render: (value: string) => new Date(value).toLocaleDateString('fr-FR')
        },
    ];

    const formFields = [
        {
            name: 'nomfil',
            label: 'Nom de la filière',
            type: 'text' as const,
            required: true,
            placeholder: 'Ex: Informatique, Droit...'
        },
        {
            name: 'description',
            label: 'Description',
            type: 'textarea' as const,
            placeholder: 'Description de la filière...'
        },
        {
            name: 'niveau_id',
            label: 'Niveau',
            type: 'select' as const,
            required: true,
            options: niveaux.map((n: any) => ({
                value: n.id.toString(),
                label: n.nomniv
            }))
        },
    ];

    const handleAdd = () => {
        setEditingItem(null);
        setFormData({});
        setDialogOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        // Ensure niveau_id is properly set as string
        const niveauId = item.niveau_id ? item.niveau_id.toString() : '';
        setFormData({
            ...item, 
            niveau_id: niveauId
        });
        setDialogOpen(true);
    };

    const handleDelete = (item: any) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette filière ?')) {
            deleteMutation.mutate(item.id.toString());
        }
    };

    const handleSubmit = () => {
        const submitData = {
            ...formData,
            niveau_id: formData.niveau_id ? parseInt(formData.niveau_id) : undefined
        };

        if (editingItem) {
            updateMutation.mutate({id: editingItem.id.toString(), data: submitData});
        } else {
            createMutation.mutate(submitData);
        }
    };

    return (
        <div className="space-y-6">
            <CrudTable
                title="Filières"
                description="Gestion des filières d'études"
                data={filteredFilieres}
                columns={columns}
                isLoading={isLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchPlaceholder="Rechercher une filière..."
            />

            <FormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editingItem ? 'Modifier la filière' : 'Ajouter une filière'}
                fields={formFields}
                data={formData}
                onDataChange={setFormData}
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
};

export default GestionFilieres;
