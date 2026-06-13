import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { BookOpen, TrendingUp, Download, FileText } from 'lucide-react';
import GradesBulletinPDF from '@/components/candidat/GradesBulletinPDF';

interface Grade {
  matiere: string;
  coefficient: number;
  note: number;
  nommat: string;
  coefmat: number;
}

interface GradesData {
  candidat: any;
  notes: Grade[];
  moyenneGenerale: number;
}

const GradesView: React.FC<{ nupcan: string }> = ({ nupcan }) => {
  const [gradesData, setGradesData] = useState<GradesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBulletin, setShowBulletin] = useState(false);

  useEffect(() => {
    loadGrades();
  }, [nupcan]);

  const loadGrades = async () => {
    try {
      const response = await apiService.makeRequest<GradesData>(`/grades/candidat/${nupcan}`, 'GET');
      if (response.success && response.data) {
        setGradesData(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement notes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!gradesData || !gradesData.notes || gradesData.notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Mes Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Aucune note disponible pour le moment</p>
            <p className="text-sm mt-2">Les notes seront publiées après les examens</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showBulletin && gradesData) {
    return (
      <div className="space-y-4">
        <Button onClick={() => setShowBulletin(false)} variant="outline">
          ← Retour aux notes
        </Button>
        <GradesBulletinPDF
          candidat={gradesData.candidat}
          notes={gradesData.notes}
          moyenneGenerale={parseFloat(gradesData.moyenneGenerale as any)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Moyenne Générale */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Moyenne Générale
          </CardTitle>
          <CardDescription>Votre résultat global</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">
                {gradesData.moyenneGenerale}
                <span className="text-3xl text-muted-foreground">/20</span>
              </div>
              <Badge variant={parseFloat(gradesData.moyenneGenerale as any) >= 10 ? 'default' : 'destructive'} className="text-sm">
                {parseFloat(gradesData.moyenneGenerale as any) >= 10 ? 'Admissible' : 'Non admissible'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détail des Notes */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Détail des Notes par Matière</CardTitle>
              <CardDescription>Vos résultats par matière avec coefficients</CardDescription>
            </div>
            <Button onClick={() => setShowBulletin(true)} className="gap-2">
              <FileText className="h-4 w-4" />
              Bulletin PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matière</TableHead>
                <TableHead className="text-center">Note</TableHead>
                <TableHead className="text-center">Coefficient</TableHead>
                <TableHead className="text-center">Note × Coef</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gradesData.notes.map((grade, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{grade.nommat}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={grade.note >= 10 ? 'default' : 'secondary'}>
                      {grade.note}/20
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{grade.coefmat}</TableCell>
                  <TableCell className="text-center font-semibold">
                    {(grade.note * grade.coefmat).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradesView;
