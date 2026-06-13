import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModernFormField } from '@/components/ui/modern-form';
import { LogIn, Search, User, Shield, Zap, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import { candidatureStateManager } from '@/services/candidatureStateManager';
import { toast } from '@/hooks/use-toast';

const ModernConnexion = () => {
  const [nupcan, setNupcan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nupcan.trim()) {
      toast({
        title: "NUPCAN requis",
        description: "Veuillez saisir votre numéro de candidature",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!candidatureStateManager.validateNupcanFormat(nupcan.trim())) {
        throw new Error('Format NUPCAN invalide');
      }

      const state = await candidatureStateManager.initializeContinueCandidature(nupcan.trim());

      toast({
        title: "Connexion réussie !",
        description: `Bienvenue ${state.candidatData?.prncan || 'candidat'}`,
      });

      navigate(`/dashboard/${encodeURIComponent(nupcan.trim())}`);

    } catch (error) {
      console.error('Erreur de connexion:', error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "NUPCAN introuvable",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-orange/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden py-12 md:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,140,66,0.1),transparent_50%)]" />
          
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Info */}
              <motion.div {...fadeInUp} className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange/10 rounded-full text-brand-orange text-sm font-semibold border border-brand-orange/20">
                  <Shield className="w-4 h-4" />
                  Connexion sécurisée
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                  <span className="gradient-text">Accédez</span>
                  <br />
                  <span className="text-gray-900 dark:text-white">à votre espace</span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Suivez l'état de votre candidature en temps réel avec votre numéro NUPCAN
                </p>

                {/* Features */}
                <div className="space-y-4 pt-4">
                  {[
                    { icon: Zap, text: "Accès instantané à votre dossier" },
                    { icon: Shield, text: "Données sécurisées et cryptées" },
                    { icon: User, text: "Suivi en temps réel" }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-brand-orange" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right side - Form */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="overflow-hidden shadow-2xl">
                  <CardHeader className="bg-gradient-to-r from-brand-orange/5 to-brand-orange-light/5 border-b">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <LogIn className="w-6 h-6 text-brand-orange" />
                      Connexion
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <ModernFormField
                        label="Numéro NUPCAN"
                        name="nupcan"
                        placeholder="Ex: 20251025-1"
                        icon={<Search className="w-5 h-5" />}
                        value={nupcan}
                        onChange={(e) => setNupcan(e.target.value)}
                        helperText="Format: AAAAMMJJ-N (ex: 20251025-1)"
                        required
                      />

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full text-base"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Connexion en cours...
                          </>
                        ) : (
                          <>
                            Se connecter
                            <ArrowRight className="ml-2 w-5 h-5" />
                          </>
                        )}
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white dark:bg-gray-800 text-muted-foreground">
                            Pas encore de compte ?
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="w-full text-base"
                        onClick={() => navigate('/concours')}
                      >
                        Créer une candidature
                      </Button>
                    </form>

                    {/* Info Box */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl">
                      <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
                        💡 Votre NUPCAN vous a été envoyé par email après votre inscription
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 grid grid-cols-3 gap-4"
                >
                  {[
                    { value: "50K+", label: "Candidats" },
                    { value: "99.9%", label: "Uptime" },
                    { value: "24/7", label: "Support" }
                  ].map((stat, index) => (
                    <div key={index} className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-700">
                      <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Trust Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="py-12 bg-gray-50 dark:bg-gray-900/50"
        >
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Plateforme officielle du Ministère de l'Enseignement Supérieur
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {/* Add partner logos here */}
              <div className="text-2xl font-bold text-gray-400">MINESUP</div>
              <div className="text-2xl font-bold text-gray-400">Universités</div>
              <div className="text-2xl font-bold text-gray-400">Gabon Numérique</div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ModernConnexion;
