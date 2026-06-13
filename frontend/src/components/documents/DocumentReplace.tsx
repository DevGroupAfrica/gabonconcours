import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface DocumentReplaceProps {
  documentId: number;
  documentName: string;
  onSuccess: () => void;
}

const DocumentReplace: React.FC<DocumentReplaceProps> = ({ documentId, documentName, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Vérifier la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: 'La taille maximale est de 2 Mo',
          variant: 'destructive'
        });
        return;
      }
      
      // Vérifier le type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Type de fichier non autorisé',
          description: 'Seuls les PDF, JPEG et PNG sont acceptés',
          variant: 'destructive'
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Aucun fichier sélectionné',
        description: 'Veuillez choisir un fichier',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);

      const response = await apiService.replaceDocument(documentId, formData);

      if (response.success) {
        toast({
          title: 'Document remplacé',
          description: 'Le nouveau document a été téléversé avec succès'
        });
        setSelectedFile(null);
        onSuccess();
      } else {
        throw new Error(response.message || 'Erreur lors du remplacement');
      }
    } catch (error: any) {
      console.error('Erreur remplacement document:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de remplacer le document',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <p className="font-medium text-orange-900">Document rejeté</p>
            <p className="text-sm text-orange-700 mt-1">
              Veuillez téléverser une nouvelle version de : <strong>{documentName}</strong>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor={`file-${documentId}`} className="cursor-pointer">
              <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                <Upload className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-orange-900">
                  {selectedFile ? selectedFile.name : 'Cliquez pour choisir un fichier'}
                </p>
                <p className="text-xs text-orange-600 mt-1">PDF, JPEG ou PNG (max 2 Mo)</p>
              </div>
              <input
                id={`file-${documentId}`}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {selectedFile && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Téléversement...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Remplacer le document
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentReplace;
