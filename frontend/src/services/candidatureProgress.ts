export type EtapeType = 'inscription' | 'documents' | 'paiement' | 'termine';

export interface ProgressionStatus {
    etapeActuelle: EtapeType;
    etapesCompletes: EtapeType[];
    documentsUploads: boolean;
    paiementEffectue: boolean;
    dateInscription: string;
    dernierAcces: string;
}

class CandidatureProgressService {
    private getStorageKey(nupcan: string): string {
        return `candidature_progress_${nupcan}`;
    }

    // Sauvegarder la progression
    saveProgress(nupcan: string, status: ProgressionStatus): void {
        const data = {
            ...status,
            dernierAcces: new Date().toISOString()
        };
        localStorage.setItem(this.getStorageKey(nupcan), JSON.stringify(data));
    }

    // Récupérer la progression
    getProgress(nupcan: string): ProgressionStatus | null {
        const stored = localStorage.getItem(this.getStorageKey(nupcan));
        if (!stored) return null;

        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }

    // Marquer une étape comme complète
    markStepComplete(nupcan: string, etape: EtapeType): void {
        const current = this.getProgress(nupcan) || this.createInitialProgress();

        if (!current.etapesCompletes.includes(etape)) {
            current.etapesCompletes.push(etape);
        }

        // Déterminer la prochaine étape
        current.etapeActuelle = this.getNextStep(current.etapesCompletes);

        this.saveProgress(nupcan, current);
    }

    // Créer une progression initiale
    createInitialProgress(): ProgressionStatus {
        return {
            etapeActuelle: 'inscription',
            etapesCompletes: [],
            documentsUploads: false,
            paiementEffectue: false,
            dateInscription: new Date().toISOString(),
            dernierAcces: new Date().toISOString()
        };
    }

    // Déterminer la prochaine étape
    private getNextStep(etapesCompletes: EtapeType[]): EtapeType {
        if (!etapesCompletes.includes('inscription')) {
            return 'inscription';
        }
        if (!etapesCompletes.includes('documents')) {
            return 'documents';
        }
        if (!etapesCompletes.includes('paiement')) {
            return 'paiement';
        }
        return 'termine';
    }

    // Vérifier si une étape est complète
    isStepComplete(nupcan: string, etape: EtapeType): boolean {
        const progress = this.getProgress(nupcan);
        return progress?.etapesCompletes.includes(etape) || false;
    }

    // Obtenir le pourcentage de completion
    getCompletionPercentage(nupcan: string): number {
        const progress = this.getProgress(nupcan);
        if (!progress) return 0;

        const totalSteps = 3; // inscription, documents, paiement
        const completedSteps = progress.etapesCompletes.length;
        return Math.round((completedSteps / totalSteps) * 100);
    }
}

export const candidatureProgressService = new CandidatureProgressService();
