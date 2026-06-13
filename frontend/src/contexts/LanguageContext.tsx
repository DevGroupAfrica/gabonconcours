import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  fr: {
    'nav.home': 'Accueil',
    'nav.concours': 'Concours',
    'nav.contact': 'Contact',
    'nav.login': 'Connexion',
    'hero.title': 'GABConcours',
    'hero.subtitle': 'Votre portail unique pour tous les concours du Gabon',
    'hero.description': 'Inscrivez-vous facilement, suivez votre progression et réussissez vos concours',
    'search.title': 'Suivre ma candidature',
    'search.placeholder': 'Ex: 20251021-4',
    'search.button': 'Rechercher',
    'concours.available': 'Concours Disponibles',
    'concours.register': 'Postuler maintenant',
    'stats.concours': 'Concours',
    'stats.candidates': 'Candidats',
    'stats.establishments': 'Établissements',
    'stats.support': 'Support',
    'officialPlatform': 'Plateforme Officielle',
    'welcomeTitle': 'Votre portail unique pour tous les concours du Gabon',
    'welcomeSubtitle': 'Inscription, suivi et résultats - tout au même endroit',
    'viewCompetitions': 'Voir les concours',
    'login': 'Connexion',
    'competitions_stat': 'Concours',
    'candidates': 'Candidats',
    'institutions': 'Établissements',
    'support': 'Support',
    'trackApplication': 'Suivre ma candidature',
    'searchPlaceholder': 'Ex: 20251021-4',
    'search': 'Rechercher',
    'noNupcan': "Vous n'avez pas de NUPCAN ?",
    'createApplication': 'Créer une candidature',
    'whyChoose': 'Pourquoi choisir GABConcours ?',
    'simplifiedRegistration': 'Inscription simplifiée',
    'simplifiedRegDesc': 'Processus d\'inscription rapide et intuitif',
    'realTimeTracking': 'Suivi en temps réel',
    'realTimeTrackingDesc': 'Suivez l\'état de votre candidature à tout moment',
    'securePayment': 'Paiement sécurisé',
    'securePaymentDesc': 'Système de paiement fiable et sécurisé',
    'support247': 'Support 24/7',
    'support247Desc': 'Une équipe dédiée à votre service',
    'readyToStart': 'Prêt à commencer ?',
    'joinThousands': 'Rejoignez des milliers de candidats qui nous font confiance',
    'discoverCompetitions': 'Découvrir les concours',
    'error': 'Erreur',
  },
  en: {
    'nav.home': 'Home',
    'nav.concours': 'Competitions',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'hero.title': 'GABConcours',
    'hero.subtitle': 'Your unique portal for all competitions in Gabon',
    'hero.description': 'Register easily, track your progress and succeed in your competitions',
    'search.title': 'Track my application',
    'search.placeholder': 'Ex: 20251021-4',
    'search.button': 'Search',
    'concours.available': 'Available Competitions',
    'concours.register': 'Apply now',
    'stats.concours': 'Competitions',
    'stats.candidates': 'Candidates',
    'stats.establishments': 'Establishments',
    'stats.support': 'Support',
    'officialPlatform': 'Official Platform',
    'welcomeTitle': 'Your unique portal for all competitions in Gabon',
    'welcomeSubtitle': 'Registration, tracking and results - all in one place',
    'viewCompetitions': 'View competitions',
    'login': 'Login',
    'competitions_stat': 'Competitions',
    'candidates': 'Candidates',
    'institutions': 'Institutions',
    'support': 'Support',
    'trackApplication': 'Track my application',
    'searchPlaceholder': 'Ex: 20251021-4',
    'search': 'Search',
    'noNupcan': "Don't have a NUPCAN?",
    'createApplication': 'Create application',
    'whyChoose': 'Why choose GABConcours?',
    'simplifiedRegistration': 'Simplified registration',
    'simplifiedRegDesc': 'Quick and intuitive registration process',
    'realTimeTracking': 'Real-time tracking',
    'realTimeTrackingDesc': 'Track your application status anytime',
    'securePayment': 'Secure payment',
    'securePaymentDesc': 'Reliable and secure payment system',
    'support247': '24/7 Support',
    'support247Desc': 'A dedicated team at your service',
    'readyToStart': 'Ready to start?',
    'joinThousands': 'Join thousands of candidates who trust us',
    'discoverCompetitions': 'Discover competitions',
    'error': 'Error',
  },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang && (savedLang === 'fr' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
