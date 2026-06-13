// src/pages/APropos.tsx
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Globe2, Shield, Calendar, Users, Laptop, Zap, Target,
  BarChart3, Lock, Headphones, ArrowRight, CheckCircle,
  Award, Smartphone, FileText, Building2, HandshakeIcon
} from "lucide-react";

const APropos = () => {
  const navigate = useNavigate();

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <Layout>
      <div className="bg-gradient-to-b from-background via-muted/5 to-background">

        {/* HERO - Institutionnel & impactant */}
        <section className="relative overflow-hidden py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div {...fadeInUp} className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-semibold">
                  <Zap className="w-4 h-4" />
                  Solution officielle du Ministère de l'Enseignement Supérieur
                </div>

                <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
                    GABConcours
                  </span>
                  <br />
                  <span className="text-foreground">La plateforme nationale des concours</span>
                </h1>

                <p className="text-xl text-muted-foreground leading-relaxed">
                  Une solution numérique 100% gabonaise pour <strong>simplifier, sécuriser et démocratiser</strong> l’accès aux concours publics.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="px-8 py-6 text-lg font-medium bg-primary hover:bg-primary/90 shadow-lg"
                    onClick={() => navigate("/concours")}
                  >
                    Explorer les concours
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-6 text-lg border-2"
                    onClick={() => navigate("/connexion")}
                  >
                    Se connecter
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl animate-pulse" />
                <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border">
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="text-4xl font-bold text-primary">+50 000</div>
                      <div className="text-sm text-muted-foreground">Candidatures traitées</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary">99,9%</div>
                      <div className="text-sm text-muted-foreground">Disponibilité</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary">24/7</div>
                      <div className="text-sm text-muted-foreground">Support actif</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary">100%</div>
                      <div className="text-sm text-muted-foreground">Sécurisé</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PROBLÉMATIQUE */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 text-center space-y-8">
            <motion.h2 {...fadeInUp} className="text-4xl font-bold">
              Pourquoi <span className="text-primary">GABConcours</span> ?
            </motion.h2>
            <motion.p {...fadeInUp} className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Avant, les candidats devaient se déplacer, remplir des formulaires papier, attendre des semaines pour une réponse.
              Un système lent, coûteux, et inégalitaire.
            </motion.p>
            <motion.p {...fadeInUp} className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Aujourd’hui, <strong>tout se fait en ligne</strong> : inscription, paiement, suivi, résultats.
              Une révolution pour l’administration gabonaise.
            </motion.p>
          </div>
        </section>

        {/* OBJECTIFS */}
      <section className="py-24">
  <div className="max-w-7xl mx-auto px-4">
    <motion.h2
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-4xl font-bold text-center mb-16"
    >
      Nos <span className="text-primary">missions</span>
    </motion.h2>

    <div className="grid md:grid-cols-3 gap-8">
      {[
        { icon: FileText, title: "Simplifier", desc: "Un formulaire unique, intuitif, accessible partout." },
        { icon: Shield, title: "Sécuriser", desc: "Données cryptées, traçabilité totale." },
        { icon: Calendar, title: "Automatiser", desc: "Suivi en temps réel via NUPCAN." },
        { icon: Users, title: "Inclure", desc: "Accès équitable dans toutes les provinces." },
        { icon: Laptop, title: "Moderniser", desc: "Soutien au Plan Gabon Numérique 2025." },
        { icon: Globe2, title: "Connecter", desc: "Institutions, candidats, administration." },
      ].map((obj, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: i * 0.1 }}
          whileHover={{ y: -8 }}
          className="group"
        >
          <Card className="h-full p-8 bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <obj.icon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-center mb-3">{obj.title}</h3>
            <p className="text-muted-foreground text-center text-sm leading-relaxed">{obj.desc}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  </div>
</section>

        {/* FONCTIONNALITÉS */}
        <section className="py-24 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="max-w-7xl mx-auto px-4">
            <motion.h2 {...fadeInUp} className="text-4xl font-bold text-center mb-16">
              Fonctionnalités <span className="text-primary">clés</span>
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { icon: Smartphone, title: "Accès mobile", desc: "Postulez depuis n’importe où, sur smartphone ou ordinateur." },
                { icon: Lock, title: "Sécurité renforcée", desc: "Cryptage SSL, authentification forte, conformité RGPD." },
                { icon: BarChart3, title: "Suivi en temps réel", desc: "Statut de votre dossier mis à jour instantanément." },
                { icon: Headphones, title: "Support 24/7", desc: "Équipe dédiée pour répondre à vos questions." },
              ].map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex gap-4 p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0">
                    <feat.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
                    <p className="text-muted-foreground">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* IMPACT & PARTENAIRES */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4">
            <motion.h2 {...fadeInUp} className="text-4xl font-bold text-center mb-16">
              Un <span className="text-primary">impact réel</span>
            </motion.h2>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <motion.div {...fadeInUp}>
                <h3 className="text-2xl font-bold mb-4">Soutenu par les institutions</h3>
                <p className="text-muted-foreground leading-relaxed">
                  GABConcours est une initiative du <strong>Ministère de l’Enseignement Supérieur</strong>,
                  en partenariat avec les universités, grandes écoles et le <strong>Plan Gabon Numérique 2025</strong>.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-3 gap-6"
              >
                {[
                  { icon: Building2, name: "MINESUP" },
                  { icon: HandshakeIcon, name: "Universités" },
                  { icon: Target, name: "Gabon Numérique" },
                ].map((p, i) => (
                  <div key={i} className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                      <p.icon className="w-10 h-10 text-primary" />
                    </div>
                    <p className="mt-3 font-medium">{p.name}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <div className="bg-muted/50 rounded-3xl p-8 text-center">
              <motion.div {...fadeInUp}>
                <h3 className="text-2xl font-bold mb-4">Une transformation numérique réussie</h3>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  En 2 ans, <strong>GABConcours</strong> a permis de réduire de <strong>80%</strong> les délais de traitement,
                  et d’augmenter de <strong>300%</strong> le nombre de candidatures en ligne.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ENGAGEMENT FINAL */}
        <section className="py-24 bg-gradient-to-r from-primary to-accent text-white">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
            <motion.h2 {...fadeInUp} className="text-5xl font-bold">
              Rejoignez la <span className="underline decoration-white/50">révolution numérique</span>
            </motion.h2>
            <motion.p {...fadeInUp} className="text-xl opacity-90 leading-relaxed">
              GABConcours, c’est l’avenir de l’administration gabonaise : transparente, efficace, inclusive.
            </motion.p>
            <motion.div {...fadeInUp}>
              <Button
                size="lg"
                variant="secondary"
                className="px-12 py-8 text-xl font-semibold bg-white text-primary hover:bg-gray-50 shadow-2xl"
                onClick={() => navigate("/connexion")}
              >
                Accéder à mon espace
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default APropos;