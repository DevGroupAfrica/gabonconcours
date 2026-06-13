import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {User, Download} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {toast} from '@/hooks/use-toast';

interface CandidatPhotoCardProps {
    candidat: {
        nom: string;
        prenom: string;
        phtcan?: string;
        nupcan: string;
    };
}

const CandidatPhotoCard: React.FC<CandidatPhotoCardProps> = ({candidat}) => {
    const getPhotoUrl = () => {
        if (candidat.phtcan && candidat.phtcan !== '{}' && candidat.phtcan.trim() !== '') {
            return `http://localhost:8002/uploads/photos/${candidat.phtcan}`;
        }
        return null;
    };

    const handleDownloadPhoto = async () => {
        const photoUrl = getPhotoUrl();
        if (!photoUrl) {
            toast({
                title: "Erreur",
                description: "Aucune photo disponible pour ce candidat",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await fetch(photoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `photo_${candidat.nupcan}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "Téléchargement",
                description: "La photo a été téléchargée avec succès",
            });
        } catch (error) {
            console.error('Erreur téléchargement photo:', error);
            toast({
                title: "Erreur",
                description: "Impossible de télécharger la photo",
                variant: "destructive",
            });
        }
    };

    const photoUrl = getPhotoUrl();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Photo du candidat</span>
                    {photoUrl && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadPhoto}
                        >
                            <Download className="h-4 w-4"/>
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
                <div
                    className="w-40 h-40 rounded-full overflow-hidden border-4 border-primary/20 bg-muted flex items-center justify-center">
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt={`Photo de ${candidat.prenom} ${candidat.nom}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                    const fallback = parent.querySelector('.photo-fallback') as HTMLElement;
                                    if (fallback) {
                                        fallback.style.display = 'flex';
                                    }
                                }
                            }}
                        />
                    ) : null}
                    <div
                        className={`photo-fallback w-full h-full bg-muted flex items-center justify-center ${photoUrl ? 'hidden' : 'flex'}`}>
                        <User className="h-16 w-16 text-muted-foreground"/>
                    </div>
                </div>
                <div className="text-center">
                    <p className="font-medium">{candidat.prenom} {candidat.nom}</p>
                    <p className="text-sm text-muted-foreground">{candidat.nupcan}</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default CandidatPhotoCard;
