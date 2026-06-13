import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    Menu,
    X,
    BookOpen,
    Phone,
    Home,
    LogIn,
    GraduationCap,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { t } = useLanguage();
    const navigate = useNavigate();

    const navItems = [
        { label: t('Accueil') || 'Accueil', icon: Home, path: '/' },
        { label: t('Concours') || 'Concours', icon: BookOpen, path: '/concours' },
        { label: t('A propos') || 'À propos', icon: GraduationCap, path: '/about' },
        { label: t('contact') || 'Contact', icon: Phone, path: '/support' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="site-container">
                <div className="flex h-[72px] items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center bg-[#2A6DF3]">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <span className="block text-lg font-bold tracking-tight text-slate-950">GABConcours</span>
                            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:block">Service public numérique</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center gap-1 lg:flex">
                        {navItems.map((item) => (
                            <Button
                                key={item.path}
                                variant="ghost"
                                className="text-sm font-medium text-slate-600 hover:text-slate-950"
                                onClick={() => navigate(item.path)}
                            >
                                <item.icon className="h-4 w-4 mr-2" />
                                {item.label}
                            </Button>
                        ))}
                    </nav>

                    {/* Right Actions */}
                    <div className="hidden items-center gap-2 md:flex">
                        <LanguageSwitcher />
                        <ThemeSwitcher />

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/connexion')}
                        >
                            <LogIn className="h-4 w-4 mr-2" />
                            Suivre ma candidature
                        </Button>

                        <Button
                            size="sm"
                            onClick={() => navigate('/concours')}
                        >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Postuler
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="p-2 md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="border-t py-4 md:hidden">
                        <nav className="flex flex-col space-y-2">
                            {navItems.map((item) => (
                                <Button
                                    key={item.path}
                                    variant="ghost"
                                    className="justify-start"
                                    onClick={() => {
                                        navigate(item.path);
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <item.icon className="h-4 w-4 mr-2" />
                                    {item.label}
                                </Button>
                            ))}

                            <div className="flex items-center space-x-2 px-4 py-2">
                                <LanguageSwitcher />
                                <ThemeSwitcher />
                            </div>

                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => {
                                    navigate('/connexion');
                                    setIsMenuOpen(false);
                                }}
                            >
                                <LogIn className="h-4 w-4 mr-2" />
                                Connexion
                            </Button>

                            <Button
                                className="w-full justify-start"
                                onClick={() => {
                                    navigate('/concours');
                                    setIsMenuOpen(false);
                                }}
                            >
                                <BookOpen className="h-4 w-4 mr-2" />
                                Postuler
                            </Button>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
