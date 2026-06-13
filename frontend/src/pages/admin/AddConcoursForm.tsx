import React from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useMutation} from '@tanstack/react-query';
import {apiService} from '@/services/api';
import {toast} from '@/hooks/use-toast';

const concoursSchema = z.object({
    libcnc: z.string().min(2, 'Le nom du concours est requis'),
    sescnc: z.string().min(2, 'La session est requise'),
    debcnc: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date de début invalide'),
    fincnc: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date de fin invalide'),
    fracnc: z.string().min(1, 'Les frais sont requis'),
    etablissement_id: z.string().min(1, "L'établissement est requis"),
    stacnc: z.string().min(1, 'Le statut est requis'),
});

type ConcoursFormData = z.infer<typeof concoursSchema>;

interface Props {
    onSuccess?: () => void;
}

const AddConcoursForm: React.FC<Props> = ({onSuccess}) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: {errors, isSubmitting},
    } = useForm<ConcoursFormData>({
        resolver: zodResolver(concoursSchema),
        defaultValues: {
            libcnc: '',
            sescnc: '',
            debcnc: '',
            fincnc: '',
            fracnc: '',
            etablissement_id: '',
            stacnc: ''
        }
    });

    const mutation = useMutation({
        mutationFn: (data: ConcoursFormData) => {
            // @ts-ignore
            return apiService.createConcours(data);
        },
        onError: () => {
            toast({
                title: 'Erreur',
                description: 'Impossible d\'ajouter le concours',
                variant: 'destructive',
            });
        },
        onSuccess: () => {
            toast({
                title: 'Concours ajouté',
                description: 'Le concours a été ajouté avec succès.',
            });
            reset();
            onSuccess?.();
        },
    });

    const onSubmit = (data: ConcoursFormData) => {
        mutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <Label htmlFor="libcnc">Nom du concours</Label>
                <Input id="libcnc" {...register('libcnc')} />
                {errors.libcnc && <p className="text-red-500 text-sm">{errors.libcnc.message}</p>}
            </div>

            <div>
                <Label htmlFor="sescnc">Session</Label>
                <Input id="sescnc" {...register('sescnc')} />
                {errors.sescnc && <p className="text-red-500 text-sm">{errors.sescnc.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="debcnc">Date de début</Label>
                    <Input type="date" id="debcnc" {...register('debcnc')} />
                    {errors.debcnc && <p className="text-red-500 text-sm">{errors.debcnc.message}</p>}
                </div>

                <div>
                    <Label htmlFor="fincnc">Date de fin</Label>
                    <Input type="date" id="fincnc" {...register('fincnc')} />
                    {errors.fincnc && <p className="text-red-500 text-sm">{errors.fincnc.message}</p>}
                </div>
            </div>

            <div>
                <Label htmlFor="fracnc">Frais du concours</Label>
                <Input id="fracnc" type="number" {...register('fracnc')} />
                {errors.fracnc && <p className="text-red-500 text-sm">{errors.fracnc.message}</p>}
            </div>

            <div>
                <Label htmlFor="etablissement_id">ID Établissement</Label>
                <Input id="etablissement_id" {...register('etablissement_id')} />
                {errors.etablissement_id && (
                    <p className="text-red-500 text-sm">{errors.etablissement_id.message}</p>
                )}
            </div>

            <div>
                <Label htmlFor="stacnc">Statut</Label>
                <select id="stacnc" {...register('stacnc')} className="w-full border rounded px-3 py-2">
                    <option value="">-- Sélectionner --</option>
                    <option value="1">Ouvert</option>
                    <option value="2">Fermé</option>
                    <option value="3">Terminé</option>
                </select>
                {errors.stacnc && <p className="text-red-500 text-sm">{errors.stacnc.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending ? 'Ajout en cours...' : 'Ajouter le concours'}
            </Button>
        </form>
    );
};

export default AddConcoursForm;
