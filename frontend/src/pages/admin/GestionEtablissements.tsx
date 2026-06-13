import React, {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {toast} from '@/hooks/use-toast';
import {apiService} from '@/services/api';
import CrudTable from '@/components/admin/CrudTable';
import FormDialog from '@/components/admin/FormDialog';

const GestionEtablissements = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const queryClient = useQueryClient();

    const {data: etablissementsData, isLoading} = useQuery({
        queryKey: ['etablissements'],
        queryFn: () => apiService.getEtablissements(),
    });

    const {data: provincesData} = useQuery({
        queryKey: ['provinces'],
        queryFn: () => apiService.getProvinces(),
    });

    const etablissements = etablissementsData?.data || [];
    const provinces = provincesData?.data || [];
    const filteredEtablissements = etablissements.filter((e: any) =>
        e.nomets?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const createMutation = useMutation({
        mutationFn: (data: any) => apiService.createEtablissement(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['etablissements']});
            toast({
                title: "Établissement créé",
                description: "L'établissement a été créé avec succès",
            });
            setDialogOpen(false);
            setFormData({});
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de créer l'établissement",
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({id, data}: { id: string; data: any }) =>
            apiService.updateEtablissement(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['etablissements']});
            toast({
                title: "Établissement modifié",
                description: "L'établissement a été modifié avec succès",
            });
            setDialogOpen(false);
            setEditingItem(null);
            setFormData({});
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de modifier l'établissement",
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiService.deleteEtablissement(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['etablissements']});
            toast({
                title: "Établissement supprimé",
                description: "L'établissement a été supprimé avec succès",
            });
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de supprimer l'établissement",
                variant: "destructive",
            });
        },
    });

    const columns = [
        {key: 'nomets', label: 'Nom'},
        {key: 'adretes', label: 'Adresse'},
        {key: 'telefs', label: 'Téléphone'},
        {key: 'maiets', label: 'Email'},
        {
            key: 'created_at',
            label: 'Date de création',
            render: (value: string) => new Date(value).toLocaleDateString('fr-FR')
        },
    ];

    const formFields = [
        {
            name: 'nomets',
            label: 'Nom de l\'établissement',
            type: 'text' as const,
            required: true,
            placeholder: 'Nom de l\'établissement'
        },
        {
            name: 'adretes',
            label: 'Adresse',
            type: 'textarea' as const,
            required: true,
            placeholder: 'Adresse complète'
        },
        {
            name: 'telefs',
            label: 'Téléphone',
            type: 'text' as const,
            required: true,
            placeholder: '+241 XX XX XX XX'
        },
        {
            name: 'maiets',
            label: 'Email',
            type: 'email' as const,
            required: true,
            placeholder: 'email@etablissement.ga'
        },
        {
            name: 'province_id',
            label: 'Province',
            type: 'select' as const,
            required: true,
            options: provinces.map((p: any) => ({
                value: p.id.toString(),
                label: p.nompro
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
        setFormData({...item, province_id: item.province_id?.toString()});
        setDialogOpen(true);
    };

    const handleDelete = (item: any) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet établissement ?')) {
            deleteMutation.mutate(item.id.toString());
        }
    };

    const handleSubmit = () => {
        const submitData = {
            ...formData,
            province_id: formData.province_id ? parseInt(formData.province_id) : undefined
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
                title="Établissements"
                description="Gestion des établissements d'enseignement"
                data={filteredEtablissements}
                columns={columns}
                isLoading={isLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchPlaceholder="Rechercher un établissement..."
            />

            <FormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editingItem ? 'Modifier l\'établissement' : 'Ajouter un établissement'}
                fields={formFields}
                data={formData}
                onDataChange={setFormData}
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
};

export default GestionEtablissements;
