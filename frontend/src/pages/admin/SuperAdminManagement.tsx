import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CrudManager from '@/components/admin/CrudManager';
import GestionNiveaux from "@/pages/admin/GestionNiveaux.tsx";
import Concours from "@/pages/admin/Concours.tsx";

const SuperAdminManagement: React.FC = () => {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Gestion Globale</h1>
                <p className="text-muted-foreground">
                    Gérer les concours, établissements, filières et matières
                </p>
            </div>

            <Tabs defaultValue="concours" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="concours">Concours</TabsTrigger>
                    <TabsTrigger value="etablissements">Établissements</TabsTrigger>
                    <TabsTrigger value="filieres">Filières</TabsTrigger>
                    <TabsTrigger value="matieres">Matières</TabsTrigger>
                    <TabsTrigger value="niveaux">Niveaux</TabsTrigger>
                </TabsList>

                <TabsContent value="concours">
                    <Concours  />
                </TabsContent>

                <TabsContent value="etablissements">
                    <CrudManager entity="etablissements" title="Établissements" />
                </TabsContent>

                <TabsContent value="filieres">
                    <CrudManager entity="filieres" title="Filières" />
                </TabsContent>

                <TabsContent value="matieres">
                    <CrudManager entity="matieres" title="Matières" />
                </TabsContent>

                <TabsContent value="niveaux">
                    <GestionNiveaux />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SuperAdminManagement;
