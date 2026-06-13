import React, { useState } from "react";
import { motion } from "framer-motion";
import { ModernForm, ModernFormField } from "./ui/modern-form";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { User, Mail, Phone, MapPin, Calendar, FileText } from "lucide-react";

export const ModernFormExample: React.FC = () => {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    quartier: "",
    dateNaissance: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation logic here
    console.log("Form submitted:", formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-500/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-500 text-sm font-semibold border border-blue-500/20">
              <FileText className="w-4 h-4" />
              Inscription en ligne
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="gradient-text">Rejoignez-nous</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Remplissez le formulaire ci-dessous pour commencer votre candidature
            </p>
          </div>

          {/* Form Card */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500/5 to-blue-400/5 border-b">
              <CardTitle className="text-2xl">Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <ModernForm onSubmit={handleSubmit}>
                <ModernFormField
                  label="Nom complet"
                  name="nom"
                  placeholder="Ex: Jean Dupont"
                  icon={<User className="w-5 h-5" />}
                  value={formData.nom}
                  onChange={handleChange}
                  error={errors.nom}
                  helperText="Entrez votre nom tel qu'il apparaît sur vos documents officiels"
                  required
                />

                <ModernFormField
                  label="Adresse email"
                  name="email"
                  type="email"
                  placeholder="exemple@email.com"
                  icon={<Mail className="w-5 h-5" />}
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  helperText="Nous vous enverrons des notifications importantes"
                  required
                />

                <ModernFormField
                  label="Téléphone"
                  name="telephone"
                  type="tel"
                  placeholder="+241 XX XX XX XX"
                  icon={<Phone className="w-5 h-5" />}
                  value={formData.telephone}
                  onChange={handleChange}
                  error={errors.telephone}
                  required
                />

                <ModernFormField
                  label="Quartier"
                  name="quartier"
                  placeholder="Ex: Quartier Louis"
                  icon={<MapPin className="w-5 h-5" />}
                  value={formData.quartier}
                  onChange={handleChange}
                  error={errors.quartier}
                />

                <ModernFormField
                  label="Date de naissance"
                  name="dateNaissance"
                  type="date"
                  icon={<Calendar className="w-5 h-5" />}
                  value={formData.dateNaissance}
                  onChange={handleChange}
                  error={errors.dateNaissance}
                  required
                />

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button type="submit" size="lg" className="flex-1">
                    Soumettre ma candidature
                  </Button>
                  <Button type="button" variant="outline" size="lg" className="flex-1">
                    Annuler
                  </Button>
                </div>
              </ModernForm>
            </CardContent>
          </Card>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl"
          >
            <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
              🔒 Vos données sont sécurisées et cryptées. Nous respectons votre vie privée.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
