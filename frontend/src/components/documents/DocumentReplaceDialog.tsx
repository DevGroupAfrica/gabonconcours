import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Upload, X, FileText, Image, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { documentService } from '@/services/documentService';
import { cn } from '@/lib/utils';

interface DocumentReplaceDialogProps {
  document: any;
  open: boolean;
  onClose: () => void;
  nupcan: string;
  onUpdated?: () => Promise<void>;
}

const DocumentReplaceDialog: React.FC<DocumentReplaceDialogProps> = ({
  document,
  open,
  onClose,
  nupcan,
  onUpdated,
}) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const replaceMutation = useMutation({
    mutationFn: (formData: FormData) =>
      documentService.replaceDocument(document.id, formData),
    onSuccess: async () => {
      toast({
        title: 'Document remplacé avec succès !',
        description: 'Votre nouveau fichier est en attente de validation',
      });
      queryClient.invalidateQueries({ queryKey: ['candidature-complete', nupcan] });
      if (onUpdated) await onUpdated();
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Échec du remplacement',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setFile(null);
    onClose();
  };

  const validateFile = (f: File): boolean => {
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: 'Fichier trop lourd', description: '5 Mo maximum', variant: 'destructive' });
      return false;
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(f.type)) {
      toast({ title: 'Format non autorisé', description: 'PDF, JPG ou PNG uniquement', variant: 'destructive' });
      return false;
    }

    return true;
  };

  const handleFileSelect = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const type = ext === 'pdf' ? 'pdf' : 'image';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('nupcan', nupcan);
    formData.append('type', type);
    formData.append('nomdoc', document.nomdoc);

    replaceMutation.mutate(formData);
  };

  const getFileIcon = () => {
    if (!file) return <FileText className="h-8 w-8 text-muted-foreground" />;
    return file.type === 'application/pdf' ? (
      <FileText className="h-8 w-8 text-red-600" />
    ) : (
      <Image className="h-8 w-8 text-emerald-600" />
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Remplacer le document</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {document.statut === 'rejete' && document.commentaire_validation && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-red-900">Raison du rejet</p>
                <p className="text-sm text-red-700 mt-1">{document.commentaire_validation}</p>
              </div>
            </div>
          )}

          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Document actuel</p>
            <p className="font-medium mt-1">{document.nomdoc}</p>
          </div>

          <div
            className={cn(
              "relative border-2 border-dashed rounded-xl p-8 text-center transition-all",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30",
              file && "border-green-500 bg-green-50"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={onDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={onFileInputChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />

            <div className="space-y-4">
              {getFileIcon()}

              {file ? (
                <div className="space-y-2">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} Ko
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setFile(null)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Glissez votre fichier ici</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ou cliquez pour sélectionner
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choisir un fichier
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Formats acceptés : PDF, JPG, PNG • Maximum 5 Mo
          </div>

          {replaceMutation.isPending && (
            <div className="space-y-2">
              <Progress value={75} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Envoi en cours...
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={handleClose} disabled={replaceMutation.isPending}>
            Annuler
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!file || replaceMutation.isPending}
            className={cn(
              "min-w-32",
              file && "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {replaceMutation.isPending ? (
              <>Envoi...</>
            ) : file ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Remplacer
              </>
            ) : (
              <>Remplacer</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentReplaceDialog;
