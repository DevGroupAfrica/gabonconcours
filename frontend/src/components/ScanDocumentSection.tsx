// components/ScanDocumentSection.tsx
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileText, Upload, Loader2, CheckCircle, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { scanDocumentAdministratif, ScanResult } from '@/services/scanDocument';

interface ScanDocumentSectionProps {
    onScanSuccess: (data: ScanResult) => void;
    existingData?: {
        nomcan: string;
        prncan: string;
        dtncan: string;
    };
}

const ScanDocumentSection: React.FC<ScanDocumentSectionProps> = ({
                                                                     onScanSuccess,
                                                                     existingData
                                                                 }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [showRawText, setShowRawText] = useState(false);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validation
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            toast({
                title: "Format non supporté",
                description: "Veuillez sélectionner un PDF, JPG ou PNG",
                variant: "destructive"
            });
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
            toast({
                title: "Fichier trop volumineux",
                description: "Le document ne doit pas dépasser 10MB",
                variant: "destructive"
            });
            return;
        }

        setSelectedFile(file);
        setScanResult(null);
    }, []);

    const handleScan = async () => {
        if (!selectedFile) {
            toast({
                title: "Aucun fichier",
                description: "Veuillez sélectionner un document",
                variant: "destructive"
            });
            return;
        }

        setIsScanning(true);

        try {
            const result = await scanDocumentAdministratif(selectedFile);

            if (result.success && result.data) {
                setScanResult(result.data);

                if (result.data.success) {
                    toast({
                        title: "Scan réussi !",
                        description: "Les informations ont été extraites avec succès",
                    });
                    onScanSuccess(result.data);
                } else {
                    toast({
                        title: "Informations partielles",
                        description: "Certaines informations n'ont pas pu être extraites automatiquement",
                        variant: "default"
                    });
                    onScanSuccess(result.data);
                }
            } else {
                toast({
                    title: "Erreur de scan",
                    description: result.error || "Impossible d'analyser le document",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Erreur lors du scan du document",
                variant: "destructive"
            });
        } finally {
            setIsScanning(false);
        }
    };

    const handleAutoFill = () => {
        if (scanResult && scanResult.success) {
            onScanSuccess(scanResult);
            toast({
                title: "Auto-remplissage",
                description: "Les champs ont été pré-remplis avec les données scannées"
            });
        }
    };

    const formatDateForInput = (dateString?: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Scan Document Administratif
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Upload */}
                <div className="space-y-2">
                    <Label htmlFor="document-upload">Sélectionner un document</Label>
                    <div className="relative">
                        <input
                            id="document-upload"
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isScanning}
                        />
                        <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                            selectedFile
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-300 hover:border-primary'
                        }`}>
                            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm font-medium text-gray-900">
                                {selectedFile ? selectedFile.name : 'Cliquez pour sélectionner un fichier'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                PDF, JPG, PNG (max 10MB)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bouton Scan */}
                <Button
                    onClick={handleScan}
                    disabled={!selectedFile || isScanning}
                    className="w-full"
                >
                    {isScanning ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyse en cours...
                        </>
                    ) : (
                        <>
                            <FileText className="mr-2 h-4 w-4" />
                            Scanner le document
                        </>
                    )}
                </Button>

                {/* Résultats du scan */}
                {scanResult && (
                    <div className="space-y-4">
                        <Alert className={scanResult.success ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription>
                                {scanResult.success
                                    ? '✅ Informations extraites avec succès !'
                                    : `⚠️ ${scanResult.errors?.join(', ') || 'Informations partielles détectées'}`
                                }
                            </AlertDescription>
                        </Alert>

                        {/* Données extraites */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <Label className="text-sm font-medium">Nom</Label>
                                <Input
                                    value={scanResult.nom || ''}
                                    readOnly
                                    className={scanResult.nom ? 'bg-green-50 border-green-200' : 'bg-gray-100'}
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Prénoms</Label>
                                <Input
                                    value={scanResult.prenoms || ''}
                                    readOnly
                                    className={scanResult.prenoms ? 'bg-green-50 border-green-200' : 'bg-gray-100'}
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Date de naissance</Label>
                                <Input
                                    type="date"
                                    value={formatDateForInput(scanResult.dateNaissance)}
                                    readOnly
                                    className={scanResult.dateNaissance ? 'bg-green-50 border-green-200' : 'bg-gray-100'}
                                />
                            </div>
                        </div>

                        {/* Comparaison avec données existantes */}
                        {existingData && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800 font-medium mb-2">Comparaison avec vos données :</p>
                                <div className="text-xs space-y-1">
                                    {existingData.nomcan !== (scanResult.nom || '') && (
                                        <p className="text-orange-600">⚠️ Nom différent détecté</p>
                                    )}
                                    {existingData.prncan !== (scanResult.prenoms || '') && (
                                        <p className="text-orange-600">⚠️ Prénoms différents détectés</p>
                                    )}
                                    {existingData.dtncan !== scanResult.dateNaissance && (
                                        <p className="text-orange-600">⚠️ Date de naissance différente</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleAutoFill}
                                className="flex-1"
                                variant={scanResult.success ? "default" : "outline"}
                                disabled={!scanResult.nom || !scanResult.prenoms}
                            >
                                {existingData ? 'Mettre à jour' : 'Auto-remplir'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowRawText(!showRawText)}
                                size="sm"
                            >
                                <Eye className="h-4 w-4 mr-1" />
                                {showRawText ? 'Masquer' : 'Texte brut'}
                            </Button>
                        </div>

                        {/* Texte brut (optionnel) */}
                        {showRawText && scanResult.texteBrut && (
                            <div className="max-h-40 overflow-auto bg-gray-900 text-gray-100 text-xs p-3 rounded font-mono">
                                {scanResult.texteBrut}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ScanDocumentSection;