import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  details,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        {details && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
            <p className="text-sm text-red-800 font-mono">{details}</p>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button onClick={onClose} className="w-full">
            J'ai compris
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorModal;

// Hook pour gérer les modales d'erreur
export const useErrorModal = () => {
  const [errorModal, setErrorModal] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showError = (title: string, message: string, details?: string) => {
    setErrorModal({
      isOpen: true,
      title,
      message,
      details,
    });
  };

  const hideError = () => {
    setErrorModal({
      ...errorModal,
      isOpen: false,
    });
  };

  return { errorModal, showError, hideError };
};
