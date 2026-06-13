import React from 'react';
import SubAdminsManager from '@/components/admin/SubAdminsManager';

const SousAdminsPage = () => {
    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Gestion des Sous-Administrateurs</h1>
                <p className="text-muted-foreground mt-2">
                    Gérez les sous-administrateurs de votre établissement (maximum 3)
                </p>
            </div>
            <SubAdminsManager />
        </div>
    );
};

export default SousAdminsPage;
