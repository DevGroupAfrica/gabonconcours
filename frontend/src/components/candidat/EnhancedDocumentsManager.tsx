import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Download,
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ErrorModal from '@/components/modals/ErrorModal';
import SuccessModal from '@/components/modals/SuccessModal';

interface Document {
  id: number;
  nomdoc: string;
  type: string;
  nom_fichier: string;
  statut: 'en_attente' | 'valide' | 'rejete';
  commentaire_validation?: string;
  created_at: string;
  chemin_fichier: string;
}

interface MandatoryCheck {
  allPresent: boolean;
  missing: Array<{ nomdoc: string; type: string; required: boolean }>;
  existing: string[];
}

interface EnhancedDocumentsManagerProps {
  candidatId: number;
  nupcan: string;
  concoursId: number;
}

const DOCUMENTS_OBLIGATOIRES = [
  { nomdoc: 'Acte de naissance', type: 'pdf', required: true },
  { nomdoc: 'Carte Nationale d\'Identité', type: 'pdf', required: true },
  { nomdoc: 'Attestation de niveau', type: 'pdf', required: true },
  { nomdoc: 'Photo d\'identité', type: 'image', required: true },
  { nomdoc: 'Certificat de résidence', type: 'pdf', required: false },
  { nomdoc: 'Diplôme', type: 'pdf', required: false }
];

const EnhancedDocumentsManager: React.FC<EnhancedDocumentsManagerProps> = ({
  candidatId,
  nupcan,
  concoursId
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [mandatoryCheck, setMandatoryCheck] = useState<MandatoryCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedNomdoc, setSelectedNomdoc] = useState('');
  const [replacingDocId, setReplacingDocId] = useState<number | null>(null);
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });
  const [successModal, setSuccessModal] = useState({ show: false, message: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [candidatId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8002/api/documents-enhanced/candidat/${candidatId}`);
      const data = await response.json();

      if (data.success) {
        setDocuments(data.data);
        setMandatoryCheck(data.mandatory_check);
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      setErrorModal({
        show: true,
        message: 'Impossible de charger vos documents. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Vérifier la taille (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setErrorModal({
          show: true,
          message: 'Le fichier est trop volumineux. La taille maximale est de 10 MB.'
        });
        return;
      }

      // Vérifier le type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrorModal({
          show: true,
          message: 'Type de fichier non autorisé. Seuls les PDF, JPEG et PNG sont acceptés.'
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedNomdoc) {
      setErrorModal({
        show: true,
        message: 'Veuillez sélectionner un type de document et un fichier.'
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('nomdoc', selectedNomdoc);
      formData.append('candidat_id', candidatId.toString());
      formData.append('concours_id', concoursId.toString());
      formData.append('nupcan', nupcan);

      const response = await fetch('http://localhost:8002/api/documents-enhanced', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSuccessModal({
          show: true,
          message: `Document "${selectedNomdoc}" ajouté avec succès ! Il est en attente de validation.`
        });
        setSelectedFile(null);
        setSelectedNomdoc('');
        loadDocuments();
      } else {
        setErrorModal({ show: true, message: data.message });
      }
    } catch (error: any) {
      console.error('Erreur upload:', error);
      setErrorModal({
        show: true,
        message: 'Erreur lors de l\'ajout du document. Veuillez réessayer.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = async (docId: number) => {
    if (!selectedFile) {
      setErrorModal({
        show: true,
        message: 'Veuillez sélectionner un fichier à remplacer.'
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const doc = documents.find(d => d.id === docId);
      if (doc) {
        formData.append('nomdoc', doc.nomdoc);
      }

      const response = await fetch(`http://localhost:8002/api/documents-enhanced/${docId}/replace`, {
        method: 'PUT',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSuccessModal({
          show: true,
          message: 'Document remplacé avec succès ! Il est en attente de validation.'
        });
        setSelectedFile(null);
        setReplacingDocId(null);
        loadDocuments();
      } else {
        setErrorModal({ show: true, message: data.message });
      }
    } catch (error) {
      console.error('Erreur remplacement:', error);
      setErrorModal({
        show: true,
        message: 'Erreur lors du remplacement. Veuillez réessayer.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number, nomdoc: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le document "${nomdoc}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8002/api/documents-enhanced/${docId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccessModal({
          show: true,
          message: `Document "${nomdoc}" supprimé avec succès.`
        });
        loadDocuments();
      } else {
        setErrorModal({ show: true, message: data.message });
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      setErrorModal({
        show: true,
        message: 'Erreur lors de la suppression. Veuillez réessayer.'
      });
    }
  };

  const handleDownload = async (docId: number, nomdoc: string) => {
    try {
      const response = await fetch(`http://localhost:8002/api/documents-enhanced/${docId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomdoc;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      setErrorModal({
        show: true,
        message: 'Erreur lors du téléchargement. Veuillez réessayer.'
      });
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'valide':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Validé</Badge>;
      case 'rejete':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejeté</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
    }
  };

  const getAvailableDocuments = () => {
    const existingNames = documents.map(d => d.nomdoc.toLowerCase().trim());
    return DOCUMENTS_OBLIGATOIRES.filter(
      doc => !existingNames.includes(doc.nomdoc.toLowerCase())
    );
  };

  const completionPercentage = mandatoryCheck
    ? Math.round((mandatoryCheck.existing.length / DOCUMENTS_OBLIGATOIRES.filter(d => d.required).length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Progression */}
      <Card>
        <CardHeader>
          <CardTitle>Progression des documents</CardTitle>
          <CardDescription>
            {mandatoryCheck?.existing.length || 0} / {DOCUMENTS_OBLIGATOIRES.filter(d => d.required).length} documents obligatoires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {completionPercentage}% complété
          </p>
        </CardContent>
      </Card>

      {/* Documents manquants */}
      {mandatoryCheck && !mandatoryCheck.allPresent && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="w-5 h-5" />
              Documents obligatoires manquants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {mandatoryCheck.missing.map((doc, idx) => (
                <li key={idx} className="flex items-center gap-2 text-orange-800">
                  <XCircle className="w-4 h-4" />
                  <span>{doc.nomdoc} ({doc.type.toUpperCase()})</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Ajouter un document */}
      {getAvailableDocuments().length > 0 && documents.length < 6 && (
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un document</CardTitle>
            <CardDescription>
              ⚠️ Assurez-vous que le nom du fichier correspond au type de document sélectionné.
              <br />
              Exemple : pour "Acte de naissance", nommez votre fichier : <strong>acte-de-naissance.pdf</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nomdoc">Type de document</Label>
              <select
                id="nomdoc"
                value={selectedNomdoc}
                onChange={(e) => setSelectedNomdoc(e.target.value)}
                className="w-full border rounded-md p-2 mt-1"
              >
                <option value="">Sélectionnez un type</option>
                {getAvailableDocuments().map((doc, idx) => (
                  <option key={idx} value={doc.nomdoc}>
                    {doc.nomdoc} {doc.required && '(Obligatoire)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="file">Fichier (PDF, JPG, PNG - max 10MB)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                disabled={uploading || !selectedNomdoc}
                className="mt-1"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  ✅ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedNomdoc || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Téléversement...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter le document
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Liste des documents */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Mes documents ({documents.length}/6)</h3>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun document téléversé pour le moment</p>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className={doc.statut === 'rejete' ? 'border-red-300' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold">{doc.nomdoc}</h4>
                      {getStatusBadge(doc.statut)}
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      Fichier : {doc.nom_fichier}
                    </p>

                    {doc.commentaire_validation && doc.statut === 'rejete' && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                        <p className="text-sm text-red-800">
                          <strong>Motif du rejet :</strong> {doc.commentaire_validation}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(doc.id, doc.nomdoc)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Visualiser
                      </Button>

                      {doc.statut === 'rejete' && (
                        <>
                          {replacingDocId === doc.id ? (
                            <div className="flex gap-2 items-center">
                              <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileSelect}
                                className="text-sm"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleReplace(doc.id)}
                                disabled={!selectedFile || uploading}
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Valider
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setReplacingDocId(null);
                                  setSelectedFile(null);
                                }}
                              >
                                Annuler
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReplacingDocId(doc.id)}
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Remplacer
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(doc.id, doc.nomdoc)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Supprimer
                          </Button>
                        </>
                      )}

                      {doc.statut === 'en_attente' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(doc.id, doc.nomdoc)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ErrorModal
        isOpen={errorModal.show}
        onClose={() => setErrorModal({ show: false, message: '' })}
        message={errorModal.message}
      />

      <SuccessModal
        isOpen={successModal.show}
        onClose={() => setSuccessModal({ show: false, message: '' })}
        message={successModal.message}
      />
    </div>
  );
};

export default EnhancedDocumentsManager;
