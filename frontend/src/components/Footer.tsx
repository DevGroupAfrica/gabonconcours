import React from 'react';
import { Link } from 'react-router-dom';
import {
    GraduationCap,
    Mail,
    Phone,
    MapPin,
    Facebook,
    Twitter,
    Instagram,
    Linkedin
} from 'lucide-react';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t-4 border-[#2A6DF3] bg-[#102554] text-white">
            <div className="site-container py-14">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* À propos */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="flex h-10 w-10 items-center justify-center bg-[#2A6DF3]">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold">GABConcours</span>
                        </div>
                        <p className="max-w-xs text-sm leading-6 text-slate-400">
                            Plateforme officielle de gestion des concours d'entrée dans les établissements d'enseignement supérieur au Gabon.
                        </p>
                        <div className="hidden space-x-3">
                            <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Liens rapides */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-white">Liens rapides</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-gray-300 hover:text-white transition-colors flex items-center">
                                    Accueil
                                </Link>
                            </li>
                            <li>
                                <Link to="/concours" className="text-gray-300 hover:text-white transition-colors flex items-center">
                                    Concours disponibles
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-gray-300 hover:text-white transition-colors flex items-center">
                                    À propos
                                </Link>
                            </li>
                            <li>
                                <Link to="/support" className="text-gray-300 hover:text-white transition-colors flex items-center">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link to="/connexion" className="text-gray-300 hover:text-white transition-colors flex items-center">
                                    Connexion
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-white">Services</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                                    Candidature en ligne
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                                    Suivi de dossier
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                                    Paiement sécurisé
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                                    Résultats
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                                    Support 24/7
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-white">Contact</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start space-x-3">
                                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-gray-300 text-sm">
                  Libreville, Gabon<br />
                  BP 1234
                </span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                                <span className="text-gray-300 text-sm">
                  +241 74604327
                </span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                                <a href="mailto:contact@gabconcours.ga" className="text-gray-300 hover:text-white text-sm">
                                    contact@gabconcours.ga
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-white/10">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-gray-400 text-sm text-center md:text-left">
                            © {currentYear} GABConcours. Tous droits réservés.
                        </p>
                        <div className="flex space-x-6 text-sm">
                            <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                                Politique de confidentialité
                            </Link>
                            <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                                Conditions d'utilisation
                            </Link>
                            <Link to="/legal" className="text-gray-400 hover:text-white transition-colors">
                                Mentions légales
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
