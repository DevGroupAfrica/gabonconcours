import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, FileText, Calendar, AlertCircle, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminDocumentService, AdminDocumentData } from '@/services/adminDocumentService';
import DocumentValidationModal from './DocumentValidationModal';

// LE BADGE QUE TOUT LE MONDE VEUT
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
    valide: {
      className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      label: 'Validé',
      icon: <CheckCircle className="h-3 w-3" />
    },
    rejete: {
      className: 'bg-rose-100 text-rose-800 border-rose-300',
      label: 'Rejeté',
      icon: <XCircle className="h-3 w-3" />
    },
    en_attente: {
      className: 'bg-amber-100 text-amber-800 border-amber-300',
      label: 'En attente',
      icon: <Clock className="h-3 w-3" />
    },
    soumis: {
      className: 'bg-blue-100 text-blue-800 border-blue-300',
      label: 'Soumis',
      icon: <Clock className="h-3 w-3" />
    },
  };

  const normalized = status?.toLowerCase();
  const { className, label, icon } = config[normalized] || config.en_attente;

  return (
    <Badge variant="outline" className={`font-medium ${className} flex items-center gap-1 px-2 py-0.5`}>
      {icon}
      {label}
    </Badge>
  );
};

interface CandidateDocumentManagerProps {
  candidatNupcan: string;
  candidatInfo: {
    nom: string;
    prenom: string;
    email: string;
  };
  onDocumentValidated?: () => void;
}

const CandidateDocumentManager: React.FC<CandidateDocumentManagerProps> = ({
  candidatNupcan,
  candidatInfo,
  onDocumentValidated
}) => {
  const [selectedDocument, setSelectedDocument] = useState<AdminDocumentData | null>(null);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['candidat-documents', candidatNupcan],
    queryFn: () => adminDocumentService.getCandidatDocuments(candidatNupcan),
  });

  const validateDocumentMutation = useMutation({
    mutationFn: ({ documentId, statut, commentaire }: {
      documentId: number;
      statut: 'valide' | 'rejete';
      commentaire?: string;
    }) => adminDocumentService.validateDocument(documentId, statut, commentaire),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['candidat-documents', candidatNupcan] });
      onDocumentValidated?.();
      toast({
        title: "Validé !",
        description: "Le statut du document a été mis à jour avec succès",
      });
    },

    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  });

  const handleValidateDocument = async (
    documentId: number,
    statut: 'valide' | 'rejete',
    commentaire?: string
  ) => {
    await validateDocumentMutation.mutateAsync({ documentId, statut, commentaire });
  };

  const handleViewDocument = (document: AdminDocumentData) => {
    setSelectedDocument(document);
    setIsValidationModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement des documents...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents du Candidat
          </CardTitle>
        </CardHeader>
        <CardContent className="py-16 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-lg text-muted-foreground">Aucun document soumis pour le moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Documents du Candidat ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Soumis le</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    {document.nomdoc}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {document.type || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(document.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* LE VRAI STATUT QUI VIENT DE LA BASE */}
                    <StatusBadge status={document.document_statut } />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDocument(document)}
                      className="hover:bg-primary/10 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Vérifier
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DocumentValidationModal
        document={selectedDocument}
        isOpen={isValidationModalOpen}
        onClose={() => {
          setIsValidationModalOpen(false);
          setSelectedDocument(null);
        }}
        onValidate={handleValidateDocument}
        isValidating={validateDocumentMutation.isPending}
        candidatInfo={{
          nomcan: candidatInfo.nom,
          prncan: candidatInfo.prenom,
          maican: candidatInfo.email
        }}
      />
    </>
  );
};

export default CandidateDocumentManager;
