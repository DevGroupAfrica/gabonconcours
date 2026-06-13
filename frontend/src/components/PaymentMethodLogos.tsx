import React from 'react';

interface PaymentMethodLogoProps {
    method: 'airtel' | 'moov' | 'virement';
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const PaymentMethodLogo: React.FC<PaymentMethodLogoProps> = ({
                                                                 method,
                                                                 className = '',
                                                                 size = 'md'
                                                             }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    if (method === 'airtel') {
        return (
            <div
                className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-red-600 rounded-lg shadow-md`}>
                <svg viewBox="0 0 100 100" className="w-full h-full p-1">
                    <defs>
                        <linearGradient id="airtelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FF0000"/>
                            <stop offset="100%" stopColor="#CC0000"/>
                        </linearGradient>
                    </defs>

                    {/* Logo Airtel stylisé */}
                    <circle cx="50" cy="50" r="45" fill="url(#airtelGradient)"/>
                    <path
                        d="M25 35 Q50 20 75 35 Q50 50 25 35"
                        fill="white"
                        stroke="white"
                        strokeWidth="2"
                    />
                    <path
                        d="M30 45 Q50 30 70 45 Q50 60 30 45"
                        fill="white"
                        stroke="white"
                        strokeWidth="1.5"
                    />
                    <text
                        x="50"
                        y="75"
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                        fontFamily="Arial, sans-serif"
                    >
                        AIRTEL
                    </text>
                </svg>
            </div>
        );
    }

    if (method === 'moov') {
        return (
            <div
                className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-blue-600 rounded-lg shadow-md`}>
                <svg viewBox="0 0 100 100" className="w-full h-full p-1">
                    <defs>
                        <linearGradient id="moovGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0066CC"/>
                            <stop offset="100%" stopColor="#004499"/>
                        </linearGradient>
                    </defs>

                    {/* Logo Moov stylisé */}
                    <circle cx="50" cy="50" r="45" fill="url(#moovGradient)"/>
                    <path
                        d="M20 40 L30 25 L40 40 L50 25 L60 40 L70 25 L80 40"
                        fill="none"
                        stroke="white"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <circle cx="35" cy="55" r="8" fill="white"/>
                    <circle cx="65" cy="55" r="8" fill="white"/>
                    <text
                        x="50"
                        y="80"
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                        fontFamily="Arial, sans-serif"
                    >
                        MOOV
                    </text>
                </svg>
            </div>
        );
    }

    if (method === 'virement') {
        return (
            <div
                className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-green-600 rounded-lg shadow-md`}>
                <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                    <defs>
                        <linearGradient id="bankGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#16A34A"/>
                            <stop offset="100%" stopColor="#15803D"/>
                        </linearGradient>
                    </defs>

                    {/* Icône banque stylisée */}
                    <rect x="10" y="40" width="80" height="40" fill="url(#bankGradient)" rx="4"/>
                    <rect x="20" y="25" width="60" height="8" fill="white" rx="2"/>
                    <rect x="25" y="15" width="50" height="8" fill="white" rx="2"/>

                    {/* Colonnes */}
                    <rect x="20" y="45" width="8" height="25" fill="white"/>
                    <rect x="35" y="45" width="8" height="25" fill="white"/>
                    <rect x="50" y="45" width="8" height="25" fill="white"/>
                    <rect x="65" y="45" width="8" height="25" fill="white"/>

                    {/* Base */}
                    <rect x="10" y="75" width="80" height="5" fill="white"/>

                    <text
                        x="50"
                        y="95"
                        textAnchor="middle"
                        fill="#16A34A"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="Arial, sans-serif"
                    >
                        BANQUE
                    </text>
                </svg>
            </div>
        );
    }

    return null;
};

export default PaymentMethodLogo;
