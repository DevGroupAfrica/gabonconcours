import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

interface DocumentReplacementFormProps {
  documentId: number;
  documentName: string;
  onSuccess?: () => void;
}

const DocumentReplacementForm: React.FC<DocumentReplacementFormProps> = ({
  documentId,
  documentName,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const replaceMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const candidatData = JSON.parse(localStorage.getItem('candidatData') || '{}');
      const token = candidatData.token || localStorage.getItem('token');

      const response = await fetch(`http://localhost:8002/api/documents/${documentId}/replace`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du remplacement');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Document remplacé',
        description: 'Votre nouveau document a été soumis pour validation',
      });
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['candidat-documents'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de remplacer le document',
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier la taille (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: 'La taille maximale est de 10 MB',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: 'Aucun fichier',
        description: 'Veuillez sélectionner un fichier',
        variant: 'destructive',
      });
      return;
    }
    replaceMutation.mutate(file);
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-2 text-sm text-orange-800 mb-4">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Ce document a été rejeté. Veuillez télécharger une nouvelle version corrigée.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`file-${documentId}`}>
              Remplacer: {documentName}
            </Label>
            <Input
              id={`file-${documentId}`}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={replaceMutation.isPending}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Fichier sélectionné: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!file || replaceMutation.isPending}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {replaceMutation.isPending ? 'Téléchargement...' : 'Remplacer le document'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DocumentReplacementForm;
