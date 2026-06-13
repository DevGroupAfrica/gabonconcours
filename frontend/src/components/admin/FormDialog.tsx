import React from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select';
    required?: boolean;
    options?: { value: string; label: string }[];
    placeholder?: string;
}

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    fields: FormField[];
    data: any;
    onDataChange: (data: any) => void;
    onSubmit: () => void;
    isLoading?: boolean;
}

const FormDialog: React.FC<FormDialogProps> = ({
                                                   open,
                                                   onOpenChange,
                                                   title,
                                                   fields,
                                                   data,
                                                   onDataChange,
                                                   onSubmit,
                                                   isLoading
                                               }) => {
    const handleFieldChange = (name: string, value: any) => {
        onDataChange({...data, [name]: value});
    };

    const renderField = (field: FormField) => {
        const value = data[field.name] || '';

        switch (field.type) {
            case 'textarea':
                return (
                    <Textarea
                        id={field.name}
                        value={value}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                    />
                );
case 'select':
    return (
        <Select
            value={value}
            onValueChange={(val) => handleFieldChange(field.name, val)}
        >
            <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Sélectionner..."} />
            </SelectTrigger>
          
            <SelectContent
                className="z-[9999]"
                position="popper"
                side="bottom"
                sideOffset={4}
            >
                {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );



            default:
                return (
                    <Input
                        id={field.name}
                        type={field.type}
                        value={value}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                    />
                );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {fields.map((field) => (
                        <div key={field.name} className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor={field.name} className="text-right">
                                {field.label}
                                {field.required && <span className="text-red-500">*</span>}
                            </Label>
                            <div className="col-span-3">
                                {renderField(field)}
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button onClick={onSubmit} disabled={isLoading}>
                        {isLoading ? 'En cours...' : 'Enregistrer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormDialog;
