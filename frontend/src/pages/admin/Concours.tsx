// =================================================================
// FICHIER : components/Concours.tsx (Composant React)
// =================================================================
import React, {useState} from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {apiService} from '@/services/api';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {toast} from '@/hooks/use-toast';
import CreateConcoursMultiStep from '@/components/admin/CreateConcoursMultiStep';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Badge} from "@/components/ui/badge";
import {CheckCircle, XCircle, Loader2} from 'lucide-react';

const Concours = () => {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

    // Requêtes
    const {data: concoursData, isLoading: isLoadingConcours} = useQuery({
        queryKey: ['admin-concours'],
        queryFn: () => apiService.getConcours(),
    });

    const {data: niveauxData} = useQuery({
        queryKey: ['admin-niveaux'],
        queryFn: () => apiService.getNiveaux(),
    });

    const {data: etablissementsData} = useQuery({
        queryKey: ['admin-etablissements'],
        queryFn: () => apiService.getEtablissements(),
    });

    // Données (avec fallback)
    const niveaux = niveauxData?.data || [];
    const etablissements = etablissementsData?.data || [];

    // Enrichissement pour la table
    const concours = (concoursData?.data || []).map((concoursItem: any) => ({
        ...concoursItem,
        nomniv: niveaux.find((n: any) => n.id === concoursItem.niveau_id)?.nomniv || 'N/A',
        etablissement_nom: etablissements.find((e: any) => e.id === concoursItem.etablissement_id)?.nomets || 'N/A',
    }));

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiService.deleteConcours(id.toString()),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['admin-concours']});
            toast({
                title: "Concours supprimé",
                description: "Le concours a été supprimé avec succès",
            });
        },
        onError: (error) => {
            console.error('Erreur suppression concours:', error);
            toast({
                title: "Erreur",
                description: "Impossible de supprimer le concours",
                variant: "destructive",
            });
        },
    });

    // @ts-ignore
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestion des Concours</CardTitle>
                <CardDescription>
                    Liste de tous les concours enregistrés.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* MODALE DE CRÉATION - Multi-Step Form */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="mb-4">Ajouter un concours</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <CreateConcoursMultiStep 
                            onClose={() => setOpen(false)}
                            onSuccess={() => {
                                queryClient.invalidateQueries({queryKey: ['admin-concours']});
                                setOpen(false);
                            }}
                        />
                    </DialogContent>
                </Dialog>

                {/* LISTE DES CONCOURS - Design Amélioré */}
                <div className="mt-6">
                    {isLoadingConcours ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin"/>
                            <p className="text-lg text-gray-500">Chargement des concours...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableCaption>Liste de tous les concours.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Id</TableHead>
                                    <TableHead>Concours</TableHead>
                                    <TableHead>Niveau/Établissement</TableHead>
                                    <TableHead className="text-right">Frais</TableHead>
                                    <TableHead className="text-center">Gorri</TableHead>
                                    <TableHead className="text-center">Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {concours.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                                            Aucun concours trouvé.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    concours.map((concoursItem: any) => (
                                        <TableRow key={concoursItem.id}>
                                            <TableCell className="font-medium">{concoursItem.id}</TableCell>
                                            <TableCell>
                                                <p className="font-semibold">{concoursItem.libcnc}</p>
                                                <Badge variant="outline" className="mt-1">{concoursItem.sescnc}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm font-medium">{concoursItem.nomniv}</p>
                                                <p className="text-xs text-muted-foreground">{concoursItem.etablissement_nom}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {concoursItem.fracnc ? `${concoursItem.fracnc.toLocaleString('fr-FR')} FCFA` : '0 FCFA'}
                                            </TableCell>

                                            {/* Statut Gorri */}
                                            <TableCell className="text-center">
                                                {concoursItem.is_gorri ? (
                                                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" title="Programme Gorri Actif"/>
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-gray-400 mx-auto" title="Programme Gorri Inactif"/>
                                                )}
                                            </TableCell>

                                            {/* Statut Actif */}
                                            <TableCell className="text-center">
                                                {concoursItem.stacnc === '1' ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" title="Concours Actif"/>
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-red-500 mx-auto" title="Concours Inactif"/>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => deleteMutation.mutate(concoursItem.id)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                    Supprimer
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default Concours;