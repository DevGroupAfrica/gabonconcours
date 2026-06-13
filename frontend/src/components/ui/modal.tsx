import * as React from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@radix-ui/react-dialog';
import {cn} from '@/lib/utils';

export function Modal({open, onOpenChange, children}: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogOverlay className="fixed inset-0 z-[110] bg-slate-950/45 backdrop-blur-sm"/>
            {children}
        </Dialog>
    );
}

export function ModalContent({children, className}: any) {
    return (
        <DialogContent className={cn(
            'fixed left-1/2 top-1/2 z-[120] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl focus:outline-none',
            className
        )}>
            {children}
        </DialogContent>
    );
}
