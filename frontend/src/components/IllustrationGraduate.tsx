import React from 'react';

const IllustrationGraduate: React.FC<{ className?: string }> = ({className = "w-full h-auto"}) => {
    return (
        <svg
            className={className}
            viewBox="0 0 400 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Background */}
            <rect width="400" height="300" fill="url(#graduateGradient)"/>

            {/* Person */}
            <circle cx="200" cy="120" r="25" fill="#FDB5A6"/>
            <rect x="180" y="140" width="40" height="60" rx="5" fill="#4F46E5"/>
            <rect x="175" y="150" width="50" height="40" rx="3" fill="#6366F1"/>

            {/* Graduation Cap */}
            <rect x="185" y="100" width="30" height="15" rx="2" fill="#1F2937"/>
            <rect x="175" y="95" width="50" height="8" rx="4" fill="#1F2937"/>
            <rect x="215" y="95" width="3" height="15" fill="#1F2937"/>
            <circle cx="218" cy="102" r="2" fill="#F59E0B"/>

            {/* Arms */}
            <rect x="165" y="155" width="15" height="25" rx="7" fill="#FDB5A6"/>
            <rect x="220" y="155" width="15" height="25" rx="7" fill="#FDB5A6"/>

            {/* Diploma */}
            <rect x="225" y="170" width="20" height="15" rx="2" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1"/>
            <rect x="245" y="175" width="3" height="5" fill="#EF4444"/>

            {/* Books */}
            <rect x="120" y="200" width="15" height="20" rx="2" fill="#10B981"/>
            <rect x="140" y="195" width="15" height="25" rx="2" fill="#3B82F6"/>
            <rect x="160" y="205" width="15" height="15" rx="2" fill="#F59E0B"/>

            {/* Trophy */}
            <rect x="260" y="195" width="20" height="25" rx="2" fill="#F59E0B"/>
            <rect x="265" y="190" width="10" height="8" rx="5" fill="#F59E0B"/>
            <rect x="267" y="188" width="6" height="4" rx="1" fill="#FDE047"/>
            <rect x="255" y="220" width="30" height="5" rx="2" fill="#A3A3A3"/>

            {/* Stars */}
            <g fill="#FDE047">
                <polygon points="100,50 102,56 108,56 103,60 105,66 100,62 95,66 97,60 92,56 98,56"/>
                <polygon points="320,40 321,44 325,44 322,47 323,51 320,49 317,51 318,47 315,44 319,44"/>
                <polygon points="350,80 351,84 355,84 352,87 353,91 350,89 347,91 348,87 345,84 349,84"/>
            </g>

            {/* Success Elements */}
            <circle cx="80" cy="100" r="15" fill="#10B981" opacity="0.2"/>
            <path d="M75 100 L79 104 L85 96" stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round"
                  strokeLinejoin="round"/>

            <circle cx="330" cy="150" r="15" fill="#3B82F6" opacity="0.2"/>
            <path d="M325 150 L330 145 L335 155" stroke="#3B82F6" strokeWidth="2" fill="none" strokeLinecap="round"
                  strokeLinejoin="round"/>

            {/* Gradient Definitions */}
            <defs>
                <linearGradient id="graduateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F8FAFC"/>
                    <stop offset="100%" stopColor="#E2E8F0"/>
                </linearGradient>
            </defs>
        </svg>
    );
};

export default IllustrationGraduate;
