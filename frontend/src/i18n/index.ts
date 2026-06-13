import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'fr' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'fr',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-storage',
    }
  )
);

export const translations = {
  fr: {
    // Navigation
    home: 'Accueil',
    contests: 'Concours',
    about: 'À propos',
    contact: 'Contact',
    login: 'Connexion',
    register: 'S\'inscrire',
    dashboard: 'Tableau de bord',
    logout: 'Déconnexion',
    
    // Common
    loading: 'Chargement...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    view: 'Voir',
    download: 'Télécharger',
    upload: 'Téléverser',
    search: 'Rechercher',
    filter: 'Filtrer',
    export: 'Exporter',
    print: 'Imprimer',
    close: 'Fermer',
    confirm: 'Confirmer',
    submit: 'Soumettre',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    finish: 'Terminer',
    
    // Hero Section
    heroTitle: 'Plateforme Officielle',
    heroMainTitle: 'GABConcours',
    heroSubtitle: 'Votre portail unique pour tous les concours du Gabon',
    heroDescription: 'Inscrivez-vous facilement, suivez votre progression et réussissez vos concours',
    registerNow: 'S\'inscrire maintenant',
    searchCandidate: 'Rechercher ma candidature',
    
    // Stats
    activeContests: 'Concours actifs',
    registeredCandidates: 'Candidats inscrits',
    institutions: 'Établissements',
    successRate: 'Taux de réussite',
    
    // Features
    features: 'Fonctionnalités',
    easyRegistration: 'Inscription simplifiée',
    easyRegistrationDesc: 'Processus d\'inscription intuitif en quelques étapes',
    realTimeTracking: 'Suivi en temps réel',
    realTimeTrackingDesc: 'Suivez l\'état de votre candidature à tout moment',
    securePayment: 'Paiement sécurisé',
    securePaymentDesc: 'Plusieurs moyens de paiement disponibles',
    instantNotifications: 'Notifications instantanées',
    instantNotificationsDesc: 'Recevez des alertes pour chaque étape importante',
    
    // Application Steps
    applicationSteps: 'Étapes de candidature',
    step: 'Étape',
    step1Title: 'Inscription',
    step1Desc: 'Remplissez le formulaire de candidature',
    step2Title: 'Documents',
    step2Desc: 'Téléversez vos documents requis',
    step3Title: 'Paiement',
    step3Desc: 'Effectuez le paiement des frais',
    
    // Contests
    availableContests: 'Concours disponibles',
    contestDetails: 'Détails du concours',
    registrationDeadline: 'Date limite d\'inscription',
    contestDate: 'Date du concours',
    registrationFee: 'Frais d\'inscription',
    applyNow: 'Postuler maintenant',
    
    // Dashboard
    myApplications: 'Mes candidatures',
    myDocuments: 'Mes documents',
    myPayments: 'Mes paiements',
    myResults: 'Mes résultats',
    notifications: 'Notifications',
    messages: 'Messages',
    profile: 'Profil',
    
    // Documents
    uploadDocument: 'Téléverser un document',
    replaceDocument: 'Remplacer le document',
    documentStatus: 'Statut du document',
    pending: 'En attente',
    validated: 'Validé',
    rejected: 'Rejeté',
    
    // Payment
    paymentMethod: 'Méthode de paiement',
    amount: 'Montant',
    reference: 'Référence',
    paymentStatus: 'Statut du paiement',
    paid: 'Payé',
    unpaid: 'Non payé',
    
    // Admin
    adminPanel: 'Panneau d\'administration',
    candidateManagement: 'Gestion des candidats',
    contestManagement: 'Gestion des concours',
    documentValidation: 'Validation des documents',
    paymentTracking: 'Suivi des paiements',
    gradeManagement: 'Gestion des notes',
    statistics: 'Statistiques',
    reports: 'Rapports',
    settings: 'Paramètres',
    
    // Grades
    enterGrades: 'Saisir les notes',
    subject: 'Matière',
    grade: 'Note',
    coefficient: 'Coefficient',
    average: 'Moyenne',
    totalGrades: 'Total notes',
    
    // Errors
    errorOccurred: 'Une erreur s\'est produite',
    tryAgain: 'Réessayer',
    invalidData: 'Données invalides',
    
    // Success
    operationSuccess: 'Opération réussie',
    documentUploaded: 'Document téléversé avec succès',
    paymentConfirmed: 'Paiement confirmé',
    
    // Footer
    contactUs: 'Nous contacter',
    termsAndConditions: 'Conditions d\'utilisation',
    privacyPolicy: 'Politique de confidentialité',
    allRightsReserved: 'Tous droits réservés',
  },
  en: {
    // Navigation
    home: 'Home',
    contests: 'Contests',
    about: 'About',
    contact: 'Contact',
    login: 'Login',
    register: 'Register',
    dashboard: 'Dashboard',
    logout: 'Logout',
    
    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    download: 'Download',
    upload: 'Upload',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    print: 'Print',
    close: 'Close',
    confirm: 'Confirm',
    submit: 'Submit',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    finish: 'Finish',
    
    // Hero Section
    heroTitle: 'Official Platform',
    heroMainTitle: 'GABContests',
    heroSubtitle: 'Your unique portal for all contests in Gabon',
    heroDescription: 'Register easily, track your progress and succeed in your contests',
    registerNow: 'Register now',
    searchCandidate: 'Search my application',
    
    // Stats
    activeContests: 'Active contests',
    registeredCandidates: 'Registered candidates',
    institutions: 'Institutions',
    successRate: 'Success rate',
    
    // Features
    features: 'Features',
    easyRegistration: 'Easy registration',
    easyRegistrationDesc: 'Intuitive registration process in a few steps',
    realTimeTracking: 'Real-time tracking',
    realTimeTrackingDesc: 'Track your application status at any time',
    securePayment: 'Secure payment',
    securePaymentDesc: 'Multiple payment methods available',
    instantNotifications: 'Instant notifications',
    instantNotificationsDesc: 'Receive alerts for each important step',
    
    // Application Steps
    applicationSteps: 'Application steps',
    step: 'Step',
    step1Title: 'Registration',
    step1Desc: 'Fill out the application form',
    step2Title: 'Documents',
    step2Desc: 'Upload your required documents',
    step3Title: 'Payment',
    step3Desc: 'Pay the registration fees',
    
    // Contests
    availableContests: 'Available contests',
    contestDetails: 'Contest details',
    registrationDeadline: 'Registration deadline',
    contestDate: 'Contest date',
    registrationFee: 'Registration fee',
    applyNow: 'Apply now',
    
    // Dashboard
    myApplications: 'My applications',
    myDocuments: 'My documents',
    myPayments: 'My payments',
    myResults: 'My results',
    notifications: 'Notifications',
    messages: 'Messages',
    profile: 'Profile',
    
    // Documents
    uploadDocument: 'Upload document',
    replaceDocument: 'Replace document',
    documentStatus: 'Document status',
    pending: 'Pending',
    validated: 'Validated',
    rejected: 'Rejected',
    
    // Payment
    paymentMethod: 'Payment method',
    amount: 'Amount',
    reference: 'Reference',
    paymentStatus: 'Payment status',
    paid: 'Paid',
    unpaid: 'Unpaid',
    
    // Admin
    adminPanel: 'Admin panel',
    candidateManagement: 'Candidate management',
    contestManagement: 'Contest management',
    documentValidation: 'Document validation',
    paymentTracking: 'Payment tracking',
    gradeManagement: 'Grade management',
    statistics: 'Statistics',
    reports: 'Reports',
    settings: 'Settings',
    
    // Grades
    enterGrades: 'Enter grades',
    subject: 'Subject',
    grade: 'Grade',
    coefficient: 'Coefficient',
    average: 'Average',
    totalGrades: 'Total grades',
    
    // Errors
    errorOccurred: 'An error occurred',
    tryAgain: 'Try again',
    invalidData: 'Invalid data',
    
    // Success
    operationSuccess: 'Operation successful',
    documentUploaded: 'Document uploaded successfully',
    paymentConfirmed: 'Payment confirmed',
    
    // Footer
    contactUs: 'Contact us',
    termsAndConditions: 'Terms and conditions',
    privacyPolicy: 'Privacy policy',
    allRightsReserved: 'All rights reserved',
  },
};

export const useTranslation = () => {
  const { language } = useLanguage();
  
  return {
    t: (key: keyof typeof translations.fr) => translations[language][key] || key,
    language,
  };
};