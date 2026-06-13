import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Grade {
  nommat: string;
  note: number;
  coefmat: number;
}

interface GradesBulletinPDFProps {
  candidat: {
    nomcan: string;
    prncan: string;
    nupcan: string;
  };
  notes: Grade[];
  moyenneGenerale: number;
  concours?: string;
}

const GradesBulletinPDF: React.FC<GradesBulletinPDFProps> = ({
  candidat,
  notes,
  moyenneGenerale,
  concours = 'Concours'
}) => {
  const bulletinRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      // Utiliser window.print() pour générer le PDF via le navigateur
      toast({
        title: 'Téléchargement',
        description: 'Utilisez la fonction imprimer de votre navigateur pour sauvegarder en PDF'
      });
      window.print();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le PDF',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 no-print">
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
        <Button onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Télécharger PDF
        </Button>
      </div>

      <div
        ref={bulletinRef}
        className="bg-white p-8 rounded-lg border shadow-sm print-content"
        style={{ maxWidth: '800px', margin: '0 auto' }}
      >
        {/* En-tête */}
        <div className="text-center mb-8 border-b-2 border-primary pb-4">
          <h1 className="text-3xl font-bold text-primary mb-2">GABConcours</h1>
          <p className="text-lg text-muted-foreground">République Gabonaise</p>
          <p className="text-sm text-muted-foreground">Plateforme Officielle des Concours</p>
        </div>

        {/* Titre */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">📊 Bulletin de Notes</h2>
          <p className="text-lg font-semibold text-muted-foreground">{concours}</p>
        </div>

        {/* Informations candidat */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nom et Prénom</p>
              <p className="font-semibold">{candidat.prncan} {candidat.nomcan}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">NUPCAN</p>
              <p className="font-semibold">{candidat.nupcan}</p>
            </div>
          </div>
        </div>

        {/* Tableau des notes */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Détail des Notes</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary text-white">
                <th className="border border-gray-300 px-4 py-2 text-left">Matière</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Note /20</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Coefficient</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Note × Coef</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((grade, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-300 px-4 py-2">{grade.nommat}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {grade.note.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{grade.coefmat}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {(grade.note * grade.coefmat).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-primary/10 font-bold">
                <td className="border border-gray-300 px-4 py-2" colSpan={3}>
                  TOTAL / MOYENNE GÉNÉRALE
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center text-lg">
                  {moyenneGenerale.toFixed(2)} / 20
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Résultat */}
        <div className={`p-4 rounded-lg text-center ${moyenneGenerale >= 10 ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
          <p className="text-lg font-bold">
            {moyenneGenerale >= 10 ? '✅ ADMISSIBLE' : ' NON ADMISSIBLE'}
          </p>
        </div>

        {/* Pied de page */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>Document généré le {new Date().toLocaleDateString('fr-FR')}</p>
          <p className="mt-2">GABConcours - Plateforme Officielle des Concours du Gabon</p>
        </div>
      </div>

      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-content {
              box-shadow: none !important;
              border: none !important;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>
    </div>
  );
};

export default GradesBulletinPDF;
