//
// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { Search, BookOpen, Users, Award, TrendingUp, ArrowRight, CheckCircle, Star, Zap } from 'lucide-react';
// import { toast } from '@/hooks/use-toast';
// import { apiService } from '@/services/api';
// import Layout from '@/components/Layout';
// import Illustration from '@/components/Illustrations';
//
// const Index = () => {
//   const navigate = useNavigate();
//   const [concours, setConcours] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [searchNupcan, setSearchNupcan] = useState('');
//   const [statistics, setStatistics] = useState({
//     concours: 0,
//     candidats: 0,
//     participations: 0,
//     etablissements: 0
//   });
//
//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const [concoursResponse, statsResponse] = await Promise.all([
//           apiService.getConcours(),
//           apiService.getStatistics()
//         ]);
//
//         if (concoursResponse.success) {
//           setConcours(concoursResponse.data || []);
//         }
//
//         if (statsResponse.success) {
//           setStatistics(statsResponse.data);
//         }
//       } catch (error) {
//         console.error('Erreur lors du chargement des données:', error);
//         toast({
//           title: "Erreur",
//           description: "Impossible de charger les données",
//           variant: "destructive",
//         });
//       } finally {
//         setIsLoading(false);
//       }
//     };
//
//     loadData();
//   }, []);
//
//   const handleSearch = () => {
//     if (searchNupcan.trim()) {
//       navigate(`/dashboard/${encodeURIComponent(searchNupcan.trim())}`);
//     } else {
//       toast({
//         title: "NUPCAN requis",
//         description: "Veuillez entrer votre numéro de candidature",
//         variant: "destructive",
//       });
//     }
//   };
//
//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter') {
//       handleSearch();
//     }
//   };
//
//   const concoursActifs = concours.filter(c => new Date(c.fincnc) > new Date());
//
//   return (
//     <Layout>
//       <div className="min-h-screen">
//         {/* Hero Section avec illustration */}
//         <section className="bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white py-20 relative overflow-hidden">
//           <div className="absolute inset-0 bg-black/10"></div>
//           <div className="container mx-auto px-4 relative z-10">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
//               <div className="space-y-8">
//                 <div className="space-y-4">
//                   <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
//                     <Zap className="h-4 w-4 mr-2" />
//                     Plateforme Officielle
//                   </Badge>
//                   <h1 className="text-5xl md:text-6xl font-bold leading-tight">
//                     GAB<span className="text-yellow-300">Concours</span>
//                   </h1>
//                   <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
//                     Votre portail unique pour tous les concours du Gabon
//                   </p>
//                   <p className="text-lg text-blue-200">
//                     Inscrivez-vous facilement, suivez votre progression et réussissez vos concours
//                   </p>
//                 </div>
//
//                 <div className="flex flex-col sm:flex-row gap-4">
//                   <Button
//                     size="lg"
//                     className="bg-white text-primary hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
//                     onClick={() => navigate('/concours')}
//                   >
//                     <BookOpen className="h-5 w-5 mr-2" />
//                     Voir les concours
//                   </Button>
//                   <Button
//                     size="lg"
//                     variant="outline"
//                     className="border-white text-white hover:bg-white hover:text-primary px-8 py-3 text-lg"
//                     onClick={() => navigate('/connexion')}
//                   >
//                     <Users className="h-5 w-5 mr-2" />
//                     Se connecter
//                   </Button>
//                 </div>
//
//                 {/* Statistiques */}
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
//                   <div className="text-center">
//                     <div className="text-3xl font-bold text-yellow-300">{statistics.concours}</div>
//                     <div className="text-blue-200">Concours</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-3xl font-bold text-yellow-300">{statistics.candidats}</div>
//                     <div className="text-blue-200">Candidats</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-3xl font-bold text-yellow-300">{statistics.etablissements}</div>
//                     <div className="text-blue-200">Établissements</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-3xl font-bold text-yellow-300">24/7</div>
//                     <div className="text-blue-200">Support</div>
//                   </div>
//                 </div>
//               </div>
//
//               <div className="flex justify-center lg:justify-end">
//                 <Illustration type="hero" size="xl" className="drop-shadow-2xl" />
//               </div>
//             </div>
//           </div>
//         </section>
//
//         {/* Section de recherche */}
//         <section className="py-16 bg-gradient-to-r from-slate-50 to-gray-100">
//           <div className="container mx-auto px-4">
//             <Card className="max-w-2xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur">
//               <CardHeader className="text-center pb-4">
//                 <CardTitle className="text-2xl font-bold text-primary">
//                   <Search className="h-6 w-6 mx-auto mb-2" />
//                   Suivre ma candidature
//                 </CardTitle>
//                 <p className="text-muted-foreground">
//                   Entrez votre numéro de candidature (NUPCAN) pour accéder à votre tableau de bord
//                 </p>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="flex gap-3">
//                   <div className="flex-1">
//                     <Input
//                       placeholder="Ex: GABCONCOURS-6-30-15"
//                       value={searchNupcan}
//                       onChange={(e) => setSearchNupcan(e.target.value)}
//                       onKeyPress={handleKeyPress}
//                       className="h-12 text-lg border-2 border-primary/20 focus:border-primary"
//                     />
//                   </div>
//                   <Button
//                     onClick={handleSearch}
//                     size="lg"
//                     className="px-8 gradient-bg text-white hover:opacity-90"
//                   >
//                     <Search className="h-5 w-5 mr-2" />
//                     Rechercher
//                   </Button>
//                 </div>
//                 <p className="text-sm text-muted-foreground text-center">
//                   Vous n'avez pas encore de NUPCAN ?
//                   <Button variant="link" className="pl-1" onClick={() => navigate('/concours')}>
//                     Créer une candidature
//                   </Button>
//                 </p>
//               </CardContent>
//             </Card>
//           </div>
//         </section>
//
//         {/* Concours disponibles */}
//         <section className="py-16">
//           <div className="container mx-auto px-4">
//             <div className="text-center mb-12">
//               <h2 className="text-4xl font-bold text-primary mb-4">
//                 Concours Disponibles
//               </h2>
//               <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
//                 Découvrez les concours ouverts et postulez dès maintenant
//               </p>
//             </div>
//
//             {isLoading ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {[1, 2, 3].map((i) => (
//                   <Card key={i} className="animate-pulse">
//                     <CardContent className="p-6">
//                       <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
//                       <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
//                       <div className="h-10 bg-gray-200 rounded"></div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {concoursActifs.slice(0, 6).map((concour) => {
//                   const isGratuit = parseFloat(concour.fracnc) === 0;
//                   const dateLimit = new Date(concour.fincnc);
//                   const joursRestants = Math.ceil((dateLimit.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
//
//                   return (
//                     <Card key={concour.id} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 group">
//                       <CardHeader className="pb-3">
//                         <div className="flex justify-between items-start mb-2">
//                           <Badge variant={isGratuit ? "default" : "secondary"} className="mb-2">
//                             {isGratuit ? '🎁 GRATUIT' : `${parseFloat(concour.fracnc).toLocaleString()} FCFA`}
//                           </Badge>
//                           {joursRestants <= 7 && (
//                             <Badge variant="destructive" className="animate-pulse">
//                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
//                               Urgent
//                             </Badge>
//                           )}
//                         </div>
//                         <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
//                           {concour.libcnc}
//                         </CardTitle>
//                         <p className="text-sm text-muted-foreground">
//                           {concour.etablissement_nomets}
//                         </p>
//                       </CardHeader>
//                       <CardContent className="space-y-4">
//                         <div className="space-y-2 text-sm">
//                           <div className="flex justify-between">
//                             <span className="text-muted-foreground">Session:</span>
//                             <span className="font-medium">{concour.sescnc}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-muted-foreground">Âge limite:</span>
//                             <span className="font-medium">{concour.agecnc} ans</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-muted-foreground">Temps restant:</span>
//                             <span className={`font-medium ${joursRestants <= 7 ? 'text-red-600' : 'text-green-600'}`}>
//                               {joursRestants} jour{joursRestants > 1 ? 's' : ''}
//                             </span>
//                           </div>
//                         </div>
//
//                         <Button
//                           className="w-full gradient-bg text-white hover:opacity-90 group-hover:scale-105 transition-all"
//                           onClick={() => navigate(`/candidature/${concour.id}`)}
//                         >
//                           <ArrowRight className="h-4 w-4 mr-2" />
//                           Postuler maintenant
//                         </Button>
//                       </CardContent>
//                     </Card>
//                   );
//                 })}
//               </div>
//             )}
//
//             {concoursActifs.length > 6 && (
//               <div className="text-center mt-8">
//                 <Button
//                   size="lg"
//                   variant="outline"
//                   onClick={() => navigate('/concours')}
//                   className="px-8"
//                 >
//                   Voir tous les concours
//                   <ArrowRight className="h-4 w-4 ml-2" />
//                 </Button>
//               </div>
//             )}
//           </div>
//         </section>
//
//         {/* Avantages avec illustrations */}
//         <section className="py-16 bg-gradient-to-r from-slate-50 to-gray-100">
//           <div className="container mx-auto px-4">
//             <div className="text-center mb-12">
//               <h2 className="text-4xl font-bold text-primary mb-4">
//                 Pourquoi choisir GABConcours ?
//               </h2>
//               <p className="text-xl text-muted-foreground">
//                 Une plateforme moderne et sécurisée pour votre avenir
//               </p>
//             </div>
//
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//               <Card className="text-center hover:shadow-lg transition-all p-6 border-0 bg-white">
//                 <CardContent className="space-y-4">
//                   <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
//                     <CheckCircle className="h-8 w-8 text-blue-600" />
//                   </div>
//                   <h3 className="font-bold text-lg">Inscription simplifiée</h3>
//                   <p className="text-muted-foreground text-sm">
//                     Un processus d'inscription rapide et intuitif en quelques clics seulement
//                   </p>
//                 </CardContent>
//               </Card>
//
//               <Card className="text-center hover:shadow-lg transition-all p-6 border-0 bg-white">
//                 <CardContent className="space-y-4">
//                   <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
//                     <Star className="h-8 w-8 text-green-600" />
//                   </div>
//                   <h3 className="font-bold text-lg">Suivi en temps réel</h3>
//                   <p className="text-muted-foreground text-sm">
//                     Suivez l'état de votre candidature à chaque étape du processus
//                   </p>
//                 </CardContent>
//               </Card>
//
//               <Card className="text-center hover:shadow-lg transition-all p-6 border-0 bg-white">
//                 <CardContent className="space-y-4">
//                   <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
//                     <Award className="h-8 w-8 text-purple-600" />
//                   </div>
//                   <h3 className="font-bold text-lg">Paiement sécurisé</h3>
//                   <p className="text-muted-foreground text-sm">
//                     Paiements via Airtel Money, Moov Money ou virement bancaire
//                   </p>
//                 </CardContent>
//               </Card>
//
//               <Card className="text-center hover:shadow-lg transition-all p-6 border-0 bg-white">
//                 <CardContent className="space-y-4">
//                   <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
//                     <TrendingUp className="h-8 w-8 text-orange-600" />
//                   </div>
//                   <h3 className="font-bold text-lg">Support 24/7</h3>
//                   <p className="text-muted-foreground text-sm">
//                     Une équipe dédiée pour vous accompagner à tout moment
//                   </p>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         </section>
//
//         {/* Call to Action */}
//         <section className="py-16 bg-gradient-to-r from-primary to-blue-600 text-white">
//           <div className="container mx-auto px-4 text-center">
//             <h2 className="text-4xl font-bold mb-4">
//               Prêt à commencer votre parcours ?
//             </h2>
//             <p className="text-xl mb-8 text-blue-100">
//               Rejoignez des milliers de candidats qui nous font confiance
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <Button
//                 size="lg"
//                 className="bg-white text-primary hover:bg-gray-100 px-8 py-3"
//                 onClick={() => navigate('/concours')}
//               >
//                 <BookOpen className="h-5 w-5 mr-2" />
//                 Découvrir les concours
//               </Button>
//               <Button
//                 size="lg"
//                 variant="outline"
//                 className="border-white text-white hover:bg-white hover:text-primary px-8 py-3"
//                 onClick={() => navigate('/connexion')}
//               >
//                 <Users className="h-5 w-5 mr-2" />
//                 Accéder à mon compte
//               </Button>
//             </div>
//           </div>
//         </section>
//       </div>
//     </Layout>
//   );
// };
//
// export default Index;

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, CheckCircle, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import StatsSection from '@/components/StatsSection';
import WhyChooseSection from '@/components/WhyChooseSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import {Card, CardContent} from "@mui/material";

const NewIndex = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
      <Layout>
        <div className="min-h-screen">
          {/*  Section Hero */}
          <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-accent/5 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-5xl lg:text-6xl font-bold gradient-text leading-tight">
                      Votre avenir académique commence ici
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                      En quelques etapes, enregistrer votre candidature,
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {/*<Button*/}
                    {/*    size="lg"*/}
                    {/*    className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg"*/}
                    {/*    onClick={() => handleNavigation('/concours')}*/}
                    {/*>*/}
                    {/*  Voir Concours*/}
                    {/*  <ArrowRight className="ml-2 h-5 w-5" />*/}
                    {/*</Button>*/}
                    <Button
                        variant="outline"
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg"
                        onClick={() => handleNavigation('/connexion')}
                    >
                     Suivre ma candidature
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <img
                        src="../../public/université.png"
                        alt="Gabonese students in training"
                        className="w-full h-auto"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
                  </div>

                  <div className="absolute -bottom-4 -left-4 bg-green-600 text-white p-4 rounded-lg shadow-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-6 w-6" />
                      <div>
                        <div className="font-bold">Programme Ngori</div>
                        <div className="text-sm opacity-90">Education Garantie</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <StatsSection />

          {/* Why Choose Section */}
          <WhyChooseSection />

          {/* How It Works Section */}
          <HowItWorksSection />

          {/* NGori Program */}
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-8 lg:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <h3 className="text-3xl font-bold text-green-800">Programme NGori </h3>
                    </div>
                    <p className="text-lg text-green-700 mb-6">
                      Grâce au programme gouvernemental NGori, l'enseignement supérieur devient accessible à tous les jeunes gabonais. De nombreux concours sont entièrement gratuits cette année
                    </p>
                    <ul className="space-y-3 text-green-700">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span>100% gratuit</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span>processus simplifié</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span>Soutient de l'Etat</span>
                      </li>
                    </ul>
                  </div>
                  <div className="text-center">
                    <div className="inline-block bg-white rounded-full p-8 shadow-lg">
                      <GraduationCap className="h-24 w-24 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-primary mb-4">Foire aux Questions</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Retrouvez les réponses aux questions les plus fréquentes sur GABConcours
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="hover:shadow-lg transition-all p-6 border-0 bg-white">
                  <CardContent className="space-y-4">
                    <h3 className="font-bold text-lg text-primary">Comment obtenir mon NUPCAN ?</h3>
                    <p className="text-muted-foreground text-sm">
                      Vous recevez votre numéro de candidature (NUPCAN) après avoir rempli le formulaire d'inscription et effectué le paiement requis, le cas échéant.
                    </p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all p-6 border-0 bg-white">
                  <CardContent className="space-y-4">
                    <h3 className="font-bold text-lg text-primary">Quels documents dois-je fournir ?</h3>
                    <p className="text-muted-foreground text-sm">
                      Les documents requis varient selon le concours. Généralement, il faut une copie de votre pièce d'identité, diplômes et un justificatif de paiement.
                    </p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all p-6 border-0 bg-white">
                  <CardContent className="space-y-4">
                    <h3 className="font-bold text-lg text-primary">Comment puis-je suivre ma candidature ?</h3>
                    <p className="text-muted-foreground text-sm">
                      Entrez votre NUPCAN dans la barre de recherche sur la page d'accueil pour accéder à votre tableau de bord et vérifier l'état de votre dossier.
                    </p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all p-6 border-0 bg-white">
                  <CardContent className="space-y-4">
                    <h3 className="font-bold text-lg text-primary">Que faire si mon paiement échoue ?</h3>
                    <p className="text-muted-foreground text-sm">
                      Contactez notre support 24/7 via l'email gabconcours@gmail.com ou appelez le +24174604327 pour assistance.
                    </p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all p-6 border-0 bg-white">
                  <CardContent className="space-y-4">
                    <h3 className="font-bold text-lg text-primary">Les concours sont-ils gratuits ?</h3>
                    <p className="text-muted-foreground text-sm">
                      Grâce au programme NGori, certains concours sont gratuits cette année. Vérifiez les détails de chaque concours pour les frais applicables.
                    </p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all p-6 border-0 bg-white">
                  <CardContent className="space-y-4">
                    <h3 className="font-bold text-lg text-primary">Comment contacter le support ?</h3>
                    <p className="text-muted-foreground text-sm">
                      Vous pouvez nous joindre par email à support@gabconcours.com ou par téléphone au +24174604327, disponible 24/7.
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="text-center mt-8">
                <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleNavigation('/support')}
                    className="px-8"
                >
                  Plus de questions ?
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 bg-primary text-white">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-bold mb-4">
                Qu'avons-nous aujourd'hui ?

              </h2>
              <p className="text-xl mb-8 text-primary-foreground/80">
                Rejoignez nous pour votre reussite
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                    size="lg"
                    variant="secondary"
                    className="px-8 py-4 text-lg"
                    onClick={() => handleNavigation('/concours')}
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Voir concours
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-4 text-lg border-white text-black hover:bg-white hover:text-primary"
                    onClick={() => handleNavigation('/connexion')}
                >
                  Acceder à mon espace
                </Button>
              </div>
            </div>
          </section>
        </div>
      </Layout>
  );
};

export default NewIndex;
