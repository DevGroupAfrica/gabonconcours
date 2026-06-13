import React from 'react';
import ModernReceiptDesign from '@/components/ModernReceiptDesign';

interface RecuCandidatureProps {
    candidatureData: any;
    onDownload?: () => void;
}

const RecuCandidature: React.FC<RecuCandidatureProps> = ({candidatureData, onDownload}) => {
    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <ModernReceiptDesign
                candidatureData={candidatureData}
                onDownload={onDownload}
            />
        </div>
    );
};

export default RecuCandidature;
