import React, {useState, useEffect} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {toast} from '@/hooks/use-toast';

interface Field {
    name: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'date';
    required?: boolean;
    options?: { value: string; label: string }[];
    validation?: (value: any) => string | undefined;
}

interface CrudModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    fields: Field[];
    data?: any;
    onSave: (data: any) => Promise<void>;
    isLoading?: boolean;
}

const CrudModal: React.FC<CrudModalProps> = ({
                                                 isOpen,
                                                 onClose,
                                                 title,
                                                 fields,
                                                 data,
                                                 onSave,
                                                 isLoading
                                             }) => {
    const [formData, setFormData] = useState<any>({});
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (data) {
            setFormData(data);
        } else {
            // Initialiser avec des valeurs vides
            const initialData: any = {};
            fields.forEach(field => {
                initialData[field.name] = field.type === 'number' ? 0 : '';
            });
            setFormData(initialData);
        }
        setErrors({});
    }, [data, fields, isOpen]);

    const validateForm = () => {
        const newErrors: any = {};

        fields.forEach(field => {
            const value = formData[field.name];

            if (field.required && (!value || value.toString().trim() === '')) {
                newErrors[field.name] = `${field.label} est requis`;
            }

            if (field.validation && value) {
                const error = field.validation(value);
                if (error) {
                    newErrors[field.name] = error;
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast({
                title: "Erreur de validation",
                description: "Veuillez corriger les erreurs dans le formulaire",
                variant: "destructive",
            });
            return;
        }

        try {
            await onSave(formData);
            onClose();
            toast({
                title: "Succès",
                description: `${title} ${data ? 'mis à jour' : 'créé'} avec succès`,
            });
        } catch (error) {
            toast({
                title: "Erreur",
                description: `Impossible de ${data ? 'mettre à jour' : 'créer'} ${title.toLowerCase()}`,
                variant: "destructive",
            });
        }
    };

    const handleFieldChange = (fieldName: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));

        // Effacer l'erreur du champ modifié
        if (errors[fieldName]) {
            setErrors(prev => ({
                ...prev,
                [fieldName]: undefined
            }));
        }
    };

    const renderField = (field: Field) => {
        const value = formData[field.name] || '';
        const error = errors[field.name];

        switch (field.type) {
            case 'textarea':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>{field.label}</Label>
                        <Textarea
                            id={field.name}
                            value={value}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            className={error ? 'border-red-500' : ''}
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>
                );

            case 'select':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>{field.label}</Label>
                        <Select
                            value={value?.toString()}
                            onValueChange={(val) => handleFieldChange(field.name, val)}
                        >
                            <SelectTrigger className={error ? 'border-red-500' : ''}>
                                <SelectValue placeholder={`Sélectionner ${field.label.toLowerCase()}`}/>
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>
                );

            default:
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>{field.label}</Label>
                        <Input
                            id={field.name}
                            type={field.type}
                            value={value}
                            onChange={(e) => {
                                const val = field.type === 'number' ?
                                    (e.target.value === '' ? 0 : parseFloat(e.target.value)) :
                                    e.target.value;
                                handleFieldChange(field.name, val);
                            }}
                            className={error ? 'border-red-500' : ''}
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{data ? 'Modifier' : 'Ajouter'} {title}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 max-h-96 overflow-y-auto">
                        {fields.map(renderField)}
                    </div>

                    <div className="flex space-x-2">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Annuler
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CrudModal;
