export type RouteType = 'new-candidature' | 'continue-candidature';

export interface RouteParams {
    candidatureId?: string;
    nupcan?: string;
    concoursId?: string;
}

class RouteManagerService {
    // Détermine le type de route basé sur les paramètres
    getRouteType(params: RouteParams): RouteType {
        if (params.nupcan) {
            return 'continue-candidature';
        }
        return 'new-candidature';
    }

    // Génère les URLs pour les différentes étapes - Utilise toujours NUPCAN
    getDocumentsUrl(params: RouteParams): string {
        const identifier = this.getIdentifier(params);
        const routeType = this.getRouteType(params);
        if (routeType === 'continue-candidature') {
            return `/documents/continue/${encodeURIComponent(identifier)}`;
        }
        return `/documents/${encodeURIComponent(identifier)}`;
    }

    getPaiementUrl(params: RouteParams): string {
        const identifier = this.getIdentifier(params);
        const routeType = this.getRouteType(params);
        if (routeType === 'continue-candidature') {
            return `/paiement/continue/${encodeURIComponent(identifier)}`;
        }
        // Pour les nouvelles candidatures, on utilise aussi le NUPCAN maintenant
        return `/paiement/${encodeURIComponent(identifier)}`;
    }

    getSuccesUrl(params: RouteParams): string {
        const identifier = this.getIdentifier(params);
        const routeType = this.getRouteType(params);
        if (routeType === 'continue-candidature') {
            return `/succes/continue/${encodeURIComponent(identifier)}`;
        }
        return `/succes/${encodeURIComponent(identifier)}`;
    }

    getStatutUrl(nupcan: string): string {
        return `/statut/${encodeURIComponent(nupcan)}`;
    }

    // Extrait l'identifiant selon le type de route - Toujours un NUPCAN maintenant
    getIdentifier(params: RouteParams): string {
        if (params.nupcan) {
            return params.nupcan;
        }
        // Pour les nouvelles candidatures, candidatureId est maintenant le NUPCAN
        return params.candidatureId!;
    }
}

export const routeManager = new RouteManagerService();
