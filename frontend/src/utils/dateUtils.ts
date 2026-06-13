export const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Non spécifiée';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Date invalide';

        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Erreur formatage date:', error);
        return dateString;
    }
};

export const formatDateTime = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Non spécifiée';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Date invalide';

        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Erreur formatage date/heure:', error);
        return dateString;
    }
};

export const formatAge = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Non calculable';

    try {
        const birthDate = new Date(dateString);
        if (isNaN(birthDate.getTime())) return 'Date invalide';

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return `${age} ans`;
    } catch (error) {
        console.error('Erreur calcul âge:', error);
        return 'Non calculable';
    }
};
