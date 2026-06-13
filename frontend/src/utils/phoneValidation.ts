export interface PhoneValidationResult {
    isValid: boolean;
    message: string;
    formattedPhone?: string;
}

export const validatePhoneNumber = (phone: string, method: 'moov' | 'airtel_money'): PhoneValidationResult => {
    if (!phone || phone.trim() === '') {
        return {isValid: false, message: 'Numéro de téléphone requis'};
    }

    // Nettoyer le numéro (supprimer espaces, tirets, etc.)
    const cleanPhone = phone.replace(/[\s+-]/g, '');

    if (method === 'moov') {
        // Numéros Moov: 060, 062, 066
        if (!/^(241)?(060|062|066)\d{6}$/.test(cleanPhone)) {
            return {
                isValid: false,
                message: 'Numéro Moov invalide. Doit commencer par 060, 062 ou 066'
            };
        }
    } else if (method === 'airtel_money') {
        // Numéros Airtel: 074, 076
        if (!/^(241)?(074|076)\d{6}$/.test(cleanPhone)) {
            return {
                isValid: false,
                message: 'Numéro Airtel invalide. Doit commencer par 074 ou 076'
            };
        }
    }

    // Formater le numéro pour l'affichage
    const formattedPhone = cleanPhone.startsWith('241') ? cleanPhone : `241${cleanPhone}`;

    return {
        isValid: true,
        message: 'Numéro valide',
        formattedPhone: formattedPhone
    };
};

export const formatPhoneDisplay = (phone: string): string => {
    const cleanPhone = phone.replace(/[\s+-]/g, '');
    if (cleanPhone.length === 9) {
        return `+241 ${cleanPhone.substring(0, 3)} ${cleanPhone.substring(3, 5)} ${cleanPhone.substring(5, 7)} ${cleanPhone.substring(7, 9)}`;
    }
    return phone;
};
