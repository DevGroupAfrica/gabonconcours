# 🎨 Système de Design GABConcours

## Vue d'ensemble

Ce système de design moderne s'inspire des meilleures pratiques UI/UX pour créer une expérience utilisateur attractive et engageante, similaire à Revival Youth Gabon.

## 🎨 Palette de couleurs

### Couleurs principales
- **Orange Brand**: `#FF8C42` - Couleur principale, énergique et accueillante
- **Orange Light**: `#FFB380` - Variante claire pour les dégradés
- **Orange Dark**: `#E67A2E` - Variante foncée pour les états hover

### Utilisation
```tsx
// Dégradé principal
className="bg-gradient-to-r from-brand-orange to-brand-orange-light"

// Texte avec dégradé
className="gradient-text"

// Background animé
className="gradient-bg-animated"
```

## 🔘 Boutons

### Variantes disponibles

#### Default (Gradient)
```tsx
<Button>Action principale</Button>
```
- Dégradé orange avec effet glow
- Animation scale au hover
- Ombre lumineuse

#### Outline
```tsx
<Button variant="outline">Action secondaire</Button>
```
- Bordure orange, fond transparent
- Remplit au hover

#### Ghost
```tsx
<Button variant="ghost">Action tertiaire</Button>
```

### Tailles
```tsx
<Button size="sm">Petit</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grand</Button>
```

## 📝 Formulaires

### Champs de formulaire modernes

```tsx
import { ModernFormField } from "@/components/ui/modern-form";

<ModernFormField
  label="Nom complet"
  name="nom"
  placeholder="Ex: Jean Dupont"
  icon={<User className="w-5 h-5" />}
  error={errors.nom}
  helperText="Texte d'aide"
  required
/>
```

### Caractéristiques
- Bordures arrondies (rounded-xl)
- Effet backdrop-blur
- Focus avec ring coloré
- Support des icônes
- Messages d'erreur avec icône
- Texte d'aide

## 🎴 Cartes

### Card moderne
```tsx
<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
  </CardHeader>
  <CardContent>
    Contenu
  </CardContent>
</Card>
```

### Caractéristiques
- Coins arrondis (rounded-2xl)
- Ombre douce (shadow-soft)
- Animation hover (translate-y)
- Transition fluide

## 🏷️ Badges

### Variantes
```tsx
<Badge>Default</Badge>
<Badge variant="secondary">Secondaire</Badge>
<Badge variant="success">Succès</Badge>
<Badge variant="destructive">Erreur</Badge>
```

### Caractéristiques
- Coins arrondis complets
- Padding généreux
- Support des icônes
- Transitions douces

## 🎯 Composants spécialisés

### Hero Section
```tsx
<HeroSection
  badge={{ icon: <Zap />, text: "Nouveau" }}
  title={<>Titre <span className="gradient-text">coloré</span></>}
  subtitle="Description engageante"
  primaryAction={{ text: "Commencer", onClick: () => {} }}
  secondaryAction={{ text: "En savoir plus", onClick: () => {} }}
  stats={[
    { value: "+50K", label: "Utilisateurs" },
    { value: "99.9%", label: "Disponibilité" }
  ]}
/>
```

### Feature Card
```tsx
<FeatureCard
  icon={Shield}
  title="Sécurisé"
  description="Vos données sont protégées"
  variant="gradient"
/>
```

### Feature Grid
```tsx
<FeatureGrid
  features={[
    { icon: Shield, title: "Sécurisé", description: "..." },
    { icon: Zap, title: "Rapide", description: "..." }
  ]}
  columns={3}
  variant="default"
/>
```

### Section Header
```tsx
<SectionHeader
  badge="Nouveauté"
  title={<>Nos <span className="text-brand-orange">services</span></>}
  subtitle="Découvrez tout ce que nous offrons"
  align="center"
/>
```

## 🎭 Animations

### Framer Motion - Fade In Up
```tsx
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

<motion.div {...fadeInUp}>
  Contenu
</motion.div>
```

### Animations CSS
```tsx
// Float animation
className="animate-float"

// Gradient shift
className="animate-gradient-shift"

// Pulse glow
className="animate-pulse-glow"
```

## 🌈 Classes utilitaires

### Effets de verre
```tsx
className="glass-effect"
```

### Ombres
```tsx
className="shadow-soft"        // Ombre douce
className="shadow-soft-lg"     // Ombre douce large
className="shadow-glow"        // Ombre lumineuse
className="shadow-glow-lg"     // Ombre lumineuse large
```

### Coins arrondis
```tsx
className="rounded-xl"   // 1rem
className="rounded-2xl"  // 1.5rem
className="rounded-3xl"  // 2rem
```

## 📱 Responsive Design

Toujours mobile-first:
```tsx
className="text-base md:text-lg lg:text-xl"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="p-4 md:p-6 lg:p-8"
```

## 🎨 Exemples de pages

### Page de formulaire
Voir: `frontend/src/components/ModernFormExample.tsx`

### Page d'accueil
Voir: `frontend/src/pages/Index.tsx`

## 🚀 Bonnes pratiques

1. **Toujours utiliser les composants UI** plutôt que du HTML brut
2. **Animations subtiles** - Ne pas en abuser
3. **Cohérence** - Utiliser les mêmes espacements partout
4. **Accessibilité** - Toujours inclure les labels et aria-labels
5. **Performance** - Lazy load les images et composants lourds
6. **Dark mode** - Toujours tester en mode sombre

## 🎯 Checklist pour une nouvelle page

- [ ] Hero section avec badge et CTA
- [ ] Section header avec titre et sous-titre
- [ ] Feature cards ou grid
- [ ] Formulaires avec ModernFormField
- [ ] Boutons avec variantes appropriées
- [ ] Animations Framer Motion
- [ ] Responsive sur mobile/tablet/desktop
- [ ] Dark mode testé
- [ ] Accessibilité vérifiée

## 📚 Ressources

- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev)
- [Radix UI](https://www.radix-ui.com)
