import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, User, Eye, EyeOff, GraduationCap, CheckCircle, Shield, Clock, FileCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { candidatureStateManager } from '@/services/candidatureStateManager';
import IllustrationGraduate from '@/components/IllustrationGraduate';

const LoginCandidat = () => {
  const [nipcan, setNipcan] = useState('');
  const [showNipcan, setShowNipcan] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nipcan.trim()) {
      toast({
        title: "NIPCAN requis",
        description: "Veuillez saisir votre identifiant permanent",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Valider le format NIPCAN (commence par NIP suivi de l'année et d'un numéro)
      const nipcanRegex = /^NIP\d{10}$/;
      if (!nipcanRegex.test(nipcan.trim())) {
        toast({
          title: "Format invalide",
          description: "Le NIPCAN doit commencer par NIP suivi de 10 chiffres (ex: NIP2026000001)",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Vérifier si le NIPCAN existe dans la base de données
      const response = await apiService.verifyNipcan(nipcan.trim());

      if (!response.success) {
        toast({
          title: "NIPCAN introuvable",
          description: response.message || "Aucun compte trouvé avec cet identifiant. Vérifiez votre NIPCAN.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Stocker le NIPCAN dans le localStorage pour persistance
      localStorage.setItem('candidat_nipcan', nipcan.trim());

      const candidatData = response.data as { prenom?: string; nom?: string };
      toast({
        title: "Connexion réussie !",
        description: `Bienvenue ${candidatData?.prenom || ''} ${candidatData?.nom || ''}`,
      });

      // Rediriger vers le dashboard
      navigate(`/dashboard/${encodeURIComponent(nipcan.trim())}`);

    } catch (error) {
      console.error('Erreur de connexion:', error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue. Veuillez réessayer.";
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center py-12 px-4">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
          
          {/* === ILLUSTRATION & INFO (gauche) === */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden md:block space-y-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-12 flex items-center justify-center">
                <IllustrationGraduate className="w-full h-auto max-w-md" />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Bienvenue sur GABConcours</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Accédez à votre espace candidat pour suivre votre dossier en temps réel,
                compléter vos documents et consulter vos résultats.
              </p>

              <div className="grid grid-cols-1 gap-4 pt-4">
                {[
                  { icon: CheckCircle, text: "Suivi en temps réel", color: "text-green-600" },
                  { icon: Shield, text: "Documents sécurisés", color: "text-blue-600" },
                  { icon: Clock, text: "Notifications instantanées", color: "text-purple-600" },
                  { icon: FileCheck, text: "Paiement en ligne", color: "text-orange-600" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent`} />
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* === FORMULAIRE (droite) === */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <Card className="shadow-2xl border-2 border-primary/10 bg-white/95 backdrop-blur">
              <CardHeader className="space-y-4 pb-8">
                <div className="flex justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                  >
                    <LogIn className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
                <CardTitle className="text-2xl font-bold text-center">
                  Connexion Candidat
                </CardTitle>
                <p className="text-center text-muted-foreground">
                  Saisissez votre NIPCAN pour accéder à votre dashboard
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nipcan" className="text-base font-medium">
                      Identifiant Permanent (NIPCAN)
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="nipcan"
                        type={showNipcan ? 'text' : 'password'}
                        value={nipcan}
                        onChange={(e) => setNipcan(e.target.value)}
                        placeholder="Ex: NIP2026000001"
                        className="pl-10 pr-12 py-6 text-base font-mono tracking-wider"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNipcan(!showNipcan)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isLoading}
                      >
                        {showNipcan ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Format: <code className="font-mono bg-muted px-1 rounded">NIP + année + numéro</code> (reçu par email)
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-6 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/70 transition-all"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-2" />
                        Accéder à mon dashboard
                      </>
                    )}
                  </Button>
                </form>

                {/* CTA secondaire */}
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-muted" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Pas encore inscrit ?
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-6 py-6 border-2"
                    onClick={() => navigate('/concours')}
                  >
                    Découvrir les concours disponibles
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* === CARTE INFO === */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center text-primary">
                  <Shield className="w-5 h-5 mr-2" />
                  Que faire avec votre NIPCAN ?
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    "Accéder à toutes vos candidatures en un seul endroit",
                    "Suivre l'état de chaque candidature en temps réel",
                    "Gérer vos documents et paiements",
                    "Créer de nouvelles candidatures facilement",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-primary mr-2 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* === MOBILE ILLUSTRATION === */}
            <div className="md:hidden mt-8">
              <IllustrationGraduate className="w-full h-auto max-w-xs mx-auto opacity-50" />
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginCandidat;