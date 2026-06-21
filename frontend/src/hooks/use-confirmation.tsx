import React, {useCallback, useRef, useState} from 'react';
import {AlertTriangle} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmationOptions {
    title?: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
}

const defaultOptions: Required<ConfirmationOptions> = {
    title: 'Confirmer la suppression',
    description: 'Cette action est définitive et ne peut pas être annulée.',
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
};

export const useConfirmation = () => {
    const [options, setOptions] = useState<Required<ConfirmationOptions>>(defaultOptions);
    const [isOpen, setIsOpen] = useState(false);
    const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

    const resolve = useCallback((confirmed: boolean) => {
        resolverRef.current?.(confirmed);
        resolverRef.current = null;
        setIsOpen(false);
    }, []);

    const confirm = useCallback((nextOptions: ConfirmationOptions) => {
        resolverRef.current?.(false);
        setOptions({...defaultOptions, ...nextOptions});
        setIsOpen(true);

        return new Promise<boolean>((resolvePromise) => {
            resolverRef.current = resolvePromise;
        });
    }, []);

    const ConfirmationDialog = useCallback(() => (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && resolve(false)}>
            <AlertDialogContent className="overflow-hidden border-0 p-0 shadow-2xl sm:max-w-md">
                <div className="border-b border-red-100 bg-red-50 px-6 py-5">
                    <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                            <AlertTriangle className="h-5 w-5"/>
                        </span>
                        <AlertDialogHeader className="space-y-1 text-left">
                            <AlertDialogTitle className="text-lg text-slate-950">{options.title}</AlertDialogTitle>
                            <AlertDialogDescription className="leading-6 text-slate-600">
                                {options.description}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                </div>
                <AlertDialogFooter className="gap-2 px-6 pb-6 sm:space-x-0">
                    <AlertDialogCancel onClick={() => resolve(false)}>{options.cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => resolve(true)}
                        className="bg-red-600 text-white hover:bg-red-700"
                    >
                        {options.confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    ), [isOpen, options, resolve]);

    return {confirm, ConfirmationDialog};
};
