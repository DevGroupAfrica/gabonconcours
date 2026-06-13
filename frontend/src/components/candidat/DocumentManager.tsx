import { useState, useEffect } from 'react';
import { documentService } from '@/services/documentService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Document {
    id: number;
    nomdoc: string;
    statut: 'valide' | 'rejete' | 'en_attente';
    commentaire_validation?: string;
}

export const DocumentManager = ({ nupcan }: { nupcan: string }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [canAdd, setCanAdd] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadDocuments();
    }, [nupcan]);

    const loadDocuments = async () => {
        const docs = await documentService.getDocumentsByNupcan(nupcan);
        setDocuments(docs);
        setCanAdd(await documentService.canAddDocument(nupcan));
    };

    const handleReplace = async (docId: number, file: File) => {
        try {
            await documentService.replaceDocument(docId, file);
            toast({ title: 'Document remplacé avec succès!' });
            loadDocuments();
        } catch (error) {
            toast({ title: 'Erreur', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-4">
            {documents.map(doc => (
                <Card key={doc.id} className="p-4">
                    <h3>{doc.nomdoc}</h3>
                    <p>Statut: {doc.statut}</p>
                    {doc.statut === 'rejete' && (
                        <Button onClick={() => {/* Upload logic */}}>
                            Remplacer
                        </Button>
                    )}
                </Card>
            ))}
            {canAdd && <Button>Ajouter un document</Button>}
        </div>
    );
};
