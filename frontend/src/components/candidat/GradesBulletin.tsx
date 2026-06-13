import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Download, BookOpen, Award } from 'lucide-react';
import { apiService } from '@/services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {useNavigate} from "react-router-dom";

interface Note {
    id: number;
    note: number;
    nommat: string;
    coefmat: number;
}

interface GradesBulletinProps {
    nupcan: string;
    candidat: {
        nomcan: string;
        prncan: string;
        concourId: number;
        libcnc : string;
    };
}

const GradesBulletin: React.FC<GradesBulletinProps> = ({ nupcan, candidat }) => {
    const navigate = useNavigate();
    const [notes, setNotes] = useState<Note[]>([]);
    const [moyenne, setMoyenne] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotes();
    }, [nupcan]);

    const fetchNotes = async () => {
        try {
            setLoading(true);

            const response = await apiService.makeRequest(`/grades/candidat/${nupcan}`, 'GET');

            if (response.success && response.data) {
                const data = response.data as any;
                setNotes(data.notes || []);
                setMoyenne(data.moyenneGenerale);
            }
        } catch (error) {
            console.error('Erreur chargement notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = () => {
        const doc = new jsPDF();

        // En-tête
        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235);
        doc.text('BULLETIN DE NOTES', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('République Gabonaise - GABConcours', 105, 30, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`          Concours : ${candidat.libcnc} `, 7, 40);


        // Informations candidat
        doc.setFontSize(14);
        doc.text(`Candidat: ${candidat.prncan} ${candidat.nomcan}`, 20, 50);
        doc.text(`NUPCAN: ${nupcan}`, 20, 60);

        // Tableau des notes
        const tableData = notes.map(note => [
            note.nommat,
            `${note.note}/20`,
            note.coefmat.toString()
        ]);

        autoTable(doc, {
            startY: 75,
            head: [['Matière', 'Note', 'Coefficient']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: 255,
                fontSize: 12,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 11
            }
        });

        const finalY = (doc as any).lastAutoTable?.finalY || 75;

        doc.setFontSize(16);
        doc.setTextColor(37, 99, 235);
        doc.text(`Moyenne Générale: ${moyenne || 'N/A'}/20`, 105, finalY + 20, { align: 'center' });

        // Pied de page
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Document édité le ${new Date().toLocaleDateString('fr-FR')}`, 105, 280, { align: 'center' });

        doc.save(`Bulletin_${nupcan}_${new Date().toISOString().split('T')[0]}.pdf`);

        toast({
            title: 'Succès',
            description: 'Bulletin téléchargé avec succès'
        });
    };

    if (loading) {
        return (
            <Card className="rounded-md border-slate-300 shadow-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Bulletin de Notes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center items-center h-32">
                        <p className="text-sm text-slate-500">Chargement des résultats...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (notes.length === 0) {
        return (
            <Card className="rounded-md border-slate-300 shadow-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Bulletin de Notes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune note disponible pour le moment</p>
                        <p className="text-sm mt-2">Vos notes seront affichées ici dès qu'elles seront saisies.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-md border-slate-300 shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Bulletin de Notes
                    </div>
                    <Button onClick={downloadPDF} variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Télécharger PDF
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Informations candidat */}
                    <div className="border border-slate-300 bg-slate-50 p-4">
                        <h3 className="font-semibold mb-2">Informations</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground">Nom:</span>
                                <span className="ml-2 font-medium">{candidat.prncan} {candidat.nomcan}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">NUPCAN:</span>
                                <span className="ml-2 font-medium">{nupcan}</span>
                            </div>
                           <div>
                                <span className="text-muted-foreground">Concours:</span>
                                <span className="ml-2 font-medium">{candidat.libcnc}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tableau des notes */}
                    <div className="overflow-hidden border border-slate-300">
                        <table className="w-full">
                            <thead className="border-b border-slate-300 bg-slate-100 text-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left">Matière</th>
                                    <th className="px-4 py-3 text-center">Note</th>
                                    <th className="px-4 py-3 text-center">Coefficient</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {notes.map((note, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3">{note.nommat}</td>
                                        <td className="px-4 py-3 text-center font-semibold">{note.note}/20</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-sm text-slate-600">{note.coefmat}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Moyenne */}
                    {moyenne && (
                        <div className="rounded-md border border-[#dbe7f6] bg-[#f7faff] p-6 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Award className="h-6 w-6 text-slate-500" />
                                <h3 className="text-lg font-semibold">Moyenne Générale</h3>
                            </div>
                            <div className="text-4xl font-bold text-[#29415f]">
                                {moyenne}/20
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Calculée sur {notes.length} matière(s)
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default GradesBulletin;
