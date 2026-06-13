import React from 'react';

interface IllustrationProps {
    type: 'hero' | 'concours' | 'documents' | 'paiement' | 'success' | 'login' | 'dashboard';
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Illustration: React.FC<IllustrationProps> = ({
                                                       type,
                                                       className = '',
                                                       size = 'md'
                                                   }) => {
    const sizeClasses = {
        sm: 'w-32 h-32',
        md: 'w-48 h-48',
        lg: 'w-64 h-64',
        xl: 'w-96 h-96'
    };

    const illustrations = {
        hero: (
            <svg viewBox="0 0 400 300" className={`${sizeClasses[size]} ${className}`}>
                <defs>
                    <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2563EB"/>
                        <stop offset="100%" stopColor="#1D4ED8"/>
                    </linearGradient>
                </defs>

                {/* Arrière-plan */}
                <rect width="400" height="300" fill="#F8FAFC"/>

                {/* Bâtiment universitaire */}
                <rect x="100" y="150" width="200" height="100" fill="url(#heroGradient)" rx="8"/>
                <rect x="120" y="130" width="160" height="20" fill="#1E40AF" rx="4"/>
                <rect x="130" y="110" width="140" height="20" fill="#1E40AF" rx="4"/>

                {/* Colonnes */}
                <rect x="130" y="170" width="15" height="60" fill="white"/>
                <rect x="160" y="170" width="15" height="60" fill="white"/>
                <rect x="190" y="170" width="15" height="60" fill="white"/>
                <rect x="220" y="170" width="15" height="60" fill="white"/>
                <rect x="250" y="170" width="15" height="60" fill="white"/>

                {/* Étudiants */}
                <circle cx="80" cy="200" r="12" fill="#FEF3C7"/>
                <rect x="68" y="212" width="24" height="30" fill="#3B82F6" rx="12"/>

                <circle cx="320" cy="190" r="12" fill="#FEF3C7"/>
                <rect x="308" y="202" width="24" height="30" fill="#EF4444" rx="12"/>

                {/* Livres et documents */}
                <rect x="50" y="240" width="15" height="20" fill="#10B981" rx="2"/>
                <rect x="70" y="235" width="15" height="25" fill="#F59E0B" rx="2"/>

                {/* Texte */}
                <text x="200" y="40" textAnchor="middle" fill="#1F2937" fontSize="24" fontWeight="bold">
                    GABConcours
                </text>
                <text x="200" y="65" textAnchor="middle" fill="#6B7280" fontSize="14">
                    Plateforme Officielle des Concours
                </text>
            </svg>
        ),

        concours: (
            <svg viewBox="0 0 300 200" className={`${sizeClasses[size]} ${className}`}>
                <rect width="300" height="200" fill="#F0F9FF"/>

                {/* Tableau */}
                <rect x="50" y="60" width="200" height="120" fill="#1F2937" rx="8"/>
                <rect x="60" y="70" width="180" height="80" fill="#374151"/>

                {/* Écran/Contenu */}
                <rect x="70" y="80" width="160" height="60" fill="#0EA5E9"/>
                <text x="150" y="105" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                    CONCOURS
                </text>
                <text x="150" y="120" textAnchor="middle" fill="white" fontSize="8">
                    2024-2025
                </text>

                {/* Candidats */}
                <circle cx="80" cy="170" r="8" fill="#FEF3C7"/>
                <rect x="72" y="178" width="16" height="15" fill="#3B82F6" rx="8"/>

                <circle cx="150" cy="175" r="8" fill="#FEF3C7"/>
                <rect x="142" y="183" width="16" height="15" fill="#EF4444" rx="8"/>

                <circle cx="220" cy="170" r="8" fill="#FEF3C7"/>
                <rect x="212" y="178" width="16" height="15" fill="#10B981" rx="8"/>
            </svg>
        ),

        documents: (
            <svg viewBox="0 0 300 200" className={`${sizeClasses[size]} ${className}`}>
                <rect width="300" height="200" fill="#FEFCE8"/>

                {/* Dossier */}
                <rect x="100" y="80" width="100" height="80" fill="#F59E0B" rx="4"/>
                <rect x="90" y="90" width="20" height="8" fill="#D97706" rx="2"/>

                {/* Documents */}
                <rect x="110" y="100" width="80" height="50" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
                <rect x="115" y="105" width="30" height="2" fill="#6B7280"/>
                <rect x="115" y="110" width="40" height="2" fill="#6B7280"/>
                <rect x="115" y="115" width="35" height="2" fill="#6B7280"/>
                <rect x="115" y="125" width="25" height="2" fill="#6B7280"/>
                <rect x="115" y="130" width="45" height="2" fill="#6B7280"/>

                {/* Checkmarks */}
                <circle cx="250" cy="60" r="15" fill="#10B981"/>
                <path d="M245,60 L250,65 L255,55" stroke="white" strokeWidth="2" fill="none"/>

                <circle cx="50" cy="120" r="15" fill="#10B981"/>
                <path d="M45,120 L50,125 L55,115" stroke="white" strokeWidth="2" fill="none"/>
            </svg>
        ),

        paiement: (
            <svg viewBox="0 0 300 200" className={`${sizeClasses[size]} ${className}`}>
                <rect width="300" height="200" fill="#F0FDF4"/>

                {/* Téléphone */}
                <rect x="120" y="50" width="60" height="100" fill="#1F2937" rx="12"/>
                <rect x="125" y="60" width="50" height="80" fill="#0EA5E9" rx="4"/>

                {/* Écran de paiement */}
                <circle cx="150" cy="85" r="8" fill="#10B981"/>
                <text x="150" y="105" textAnchor="middle" fill="white" fontSize="8">
                    PAIEMENT
                </text>
                <text x="150" y="115" textAnchor="middle" fill="white" fontSize="6">
                    SÉCURISÉ
                </text>

                {/* Cartes/Money */}
                <rect x="200" y="80" width="30" height="20" fill="#EF4444" rx="4"/>
                <rect x="240" y="85" width="30" height="20" fill="#3B82F6" rx="4"/>

                {/* Symboles monétaires */}
                <text x="80" y="160" fill="#10B981" fontSize="20" fontWeight="bold">₣</text>
                <text x="220" y="45" fill="#10B981" fontSize="16" fontWeight="bold">€</text>
            </svg>
        ),

        success: (
            <svg viewBox="0 0 300 200" className={`${sizeClasses[size]} ${className}`}>
                <rect width="300" height="200" fill="#F0FDF4"/>

                {/* Grande coche de succès */}
                <circle cx="150" cy="100" r="50" fill="#10B981"/>
                <path d="M125,100 L140,115 L175,80" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round"/>

                {/* Confettis */}
                <rect x="70" y="40" width="4" height="4" fill="#F59E0B" transform="rotate(45 72 42)"/>
                <rect x="220" y="60" width="4" height="4" fill="#EF4444" transform="rotate(45 222 62)"/>
                <rect x="80" y="160" width="4" height="4" fill="#3B82F6" transform="rotate(45 82 162)"/>
                <rect x="230" y="140" width="4" height="4" fill="#8B5CF6" transform="rotate(45 232 142)"/>

                {/* Étoiles */}
                <path d="M100,30 L102,36 L108,36 L103,40 L105,46 L100,42 L95,46 L97,40 L92,36 L98,36 Z" fill="#F59E0B"/>
                <path d="M210,170 L212,176 L218,176 L213,180 L215,186 L210,182 L205,186 L207,180 L202,176 L208,176 Z"
                      fill="#EF4444"/>
            </svg>
        ),

        login: (
            <svg viewBox="0 0 300 200" className={`${sizeClasses[size]} ${className}`}>
                <rect width="300" height="200" fill="#FEF7FF"/>

                {/* Ordinateur portable */}
                <rect x="75" y="80" width="150" height="100" fill="#374151" rx="8"/>
                <rect x="85" y="90" width="130" height="80" fill="#1E40AF" rx="4"/>

                {/* Écran de connexion */}
                <circle cx="150" cy="120" r="15" fill="#FEF3C7"/>
                <rect x="120" y="140" width="60" height="8" fill="white" rx="4"/>
                <rect x="130" y="155" width="40" height="6" fill="#10B981" rx="3"/>

                {/* Clé de sécurité */}
                <circle cx="250" cy="60" r="12" fill="#F59E0B"/>
                <rect x="245" y="72" width="10" height="20" fill="#F59E0B"/>
                <rect x="247" y="76" width="2" height="2" fill="white"/>
                <rect x="251" y="76" width="2" height="2" fill="white"/>
            </svg>
        ),

        dashboard: (
            <svg viewBox="0 0 300 200" className={`${sizeClasses[size]} ${className}`}>
                <rect width="300" height="200" fill="#F8FAFC"/>

                {/* Écran de dashboard */}
                <rect x="50" y="40" width="200" height="120" fill="#1F2937" rx="8"/>
                <rect x="60" y="50" width="180" height="100" fill="white"/>

                {/* Header */}
                <rect x="60" y="50" width="180" height="20" fill="#2563EB"/>
                <circle cx="75" cy="60" r="5" fill="white"/>
                <rect x="85" y="57" width="40" height="6" fill="white" rx="3"/>

                {/* Cartes */}
                <rect x="70" y="80" width="50" height="30" fill="#F3F4F6" rx="4"/>
                <rect x="130" y="80" width="50" height="30" fill="#FEF3C7" rx="4"/>
                <rect x="190" y="80" width="40" height="30" fill="#F0FDF4" rx="4"/>

                {/* Graphique */}
                <rect x="70" y="120" width="80" height="20" fill="#DBEAFE" rx="2"/>
                <rect x="75" y="125" width="10" height="10" fill="#3B82F6"/>
                <rect x="90" y="122" width="10" height="13" fill="#3B82F6"/>
                <rect x="105" y="127" width="10" height="8" fill="#3B82F6"/>

                {/* Stats */}
                <circle cx="190" cy="130" r="8" fill="#10B981"/>
                <text x="190" y="134" textAnchor="middle" fill="white" fontSize="8">✓</text>
            </svg>
        )
    };

    return illustrations[type] || null;
};

export default Illustration;
