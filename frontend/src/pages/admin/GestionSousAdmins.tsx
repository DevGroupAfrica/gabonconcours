import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SubAdminsManager from '@/components/admin/SubAdminsManager';
import { Users } from 'lucide-react';

const GestionSousAdmins: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gestion des Sous-Administrateurs</h1>
          <p className="text-muted-foreground">
            Créez et gérez les sous-admins de votre établissement
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>À propos des Sous-Administrateurs</CardTitle>
          <CardDescription>
            Les sous-administrateurs sont des utilisateurs créés par l'administrateur d'établissement
            qui peuvent gérer des aspects spécifiques des candidatures aux concours de votre établissement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Rôles disponibles :</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Notes</strong> : Peut saisir et gérer les notes des candidats</li>
              <li><strong>Documents</strong> : Peut valider ou rejeter les documents des candidatures</li>
            </ul>
            <p className="mt-4 text-muted-foreground">
              <strong>Note :</strong> Chaque établissement peut créer jusqu'à 3 sous-administrateurs.
            </p>
          </div>
        </CardContent>
      </Card>

      <SubAdminsManager />
    </div>
  );
};

export default GestionSousAdmins;
