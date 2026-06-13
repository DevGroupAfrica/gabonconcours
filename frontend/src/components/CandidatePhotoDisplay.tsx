import React from 'react';
import {User} from 'lucide-react';

interface CandidatePhotoDisplayProps {
    photoPath?: string;
    candidateName: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const CandidatePhotoDisplay: React.FC<CandidatePhotoDisplayProps> = ({
                                                                         photoPath,
                                                                         candidateName,
                                                                         size = 'md',
                                                                         className = ''
                                                                     }) => {
    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-24 h-24',
        lg: 'w-32 h-32',
        xl: 'w-48 h-48'
    };

    const iconSizes = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16'
    };

    // Construire l'URL de la photo en fonction du type de donnée
    let photoUrl = null;
    if (photoPath) {
        // Si c'est un nom de fichier ou un chemin, construire l'URL complète
        if (typeof photoPath === 'string' && photoPath !== '{}' && photoPath.trim() !== '') {
            photoUrl = `http://localhost:8002/uploads/photos/${photoPath}`;
        }
    }

    return (
        <div
            className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-primary/20 bg-muted flex items-center justify-center ${className}`}>
            {photoUrl ? (
                <img
                    src={photoUrl}
                    alt={`Photo de ${candidateName}`}
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
                <User className={`${iconSizes[size]} text-muted-foreground`}/>
            </div>
        </div>
    );
};

export default CandidatePhotoDisplay;
