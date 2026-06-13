import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {User} from 'lucide-react';

interface CandidatePhotoCardProps {
    candidat: {
        phtcan?: string;
        nomcan: string;
        prncan: string;
    };
}

const CandidatePhotoCard: React.FC<CandidatePhotoCardProps> = ({candidat}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-center">Photo du candidat</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
                {candidat.phtcan ? (
                    <img
                        src={`http://localhost:8002/uploads/photos/${candidat.phtcan}`}
                        alt={`Photo de ${candidat.prncan} ${candidat.nomcan}`}
                        className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.classList.remove('hidden');
                        }}
                    />
                ) : null}
                <div
                    className={`w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center ${candidat.phtcan ? 'hidden' : ''}`}>
                    <User className="h-16 w-16 text-gray-400"/>
                </div>
            </CardContent>
        </Card>
    );
};

export default CandidatePhotoCard;
