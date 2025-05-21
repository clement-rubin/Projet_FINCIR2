# 🌟 ChallengR - Relevez des défis, transformez-vous ! 🌟

![ChallengR Logo](./assets/newicon.png)

## 📱 Présentation du projet

**ChallengR** est une application mobile inspirante conçue pour vous aider à grandir personnellement à travers des défis quotidiens. Que vous souhaitiez améliorer votre condition physique, votre bien-être mental, vos compétences sociales ou votre créativité, ChallengR vous accompagne dans votre parcours de développement personnel avec une interface immersive et engageante.

> *"Le succès n'est pas définitif, l'échec n'est pas fatal : c'est le courage de continuer qui compte."* - Winston Churchill

## 🚀 Fonctionnalités principales

### 🏆 Système de points et de niveaux
- **Accumulation de points** : Gagnez des points en relevant des défis
- **Progression par niveaux** : Montez en niveau et suivez votre progression avec une barre de progression intuitive
- **Récompenses visuelles** : Animations de récompense pour célébrer vos accomplissements
- **Aperçu des avantages futurs** : Consultez les pouvoirs qui vous attendent aux rangs supérieurs

### 📅 Défis quotidiens
- **Défis diversifiés** : Des activités variées dans plusieurs catégories (fitness, bien-être, apprentissage, socialisation...)
- **Rotation des défis** : Nouveaux défis réguliers pour maintenir la motivation
- **Limite quotidienne** : Maximum 2 défis par jour pour encourager la constance sans surcharge

### 🌍 Défis géolocalisés
- **Carte interactive** : Découvrez des défis disponibles autour de vous
- **Navigation intégrée** : Directions pour vous rendre aux points d'intérêt
- **Variété de défis locaux** : Activités spécifiques à votre environnement

### 👫 Fonctionnalités sociales
- **Liste d'amis** : Connectez-vous avec d'autres utilisateurs
- **Partage de progression** : Motivation par l'émulation positive
- **Communication** : Échangez des messages avec vos amis

### 📊 Suivi de progression
- **Statistiques personnelles** : Visualisez votre parcours et vos accomplissements
- **Historique des défis** : Accédez à vos défis passés et complétés
- **Analyses de performance** : Identifiez vos domaines de force et d'amélioration

### 🎨 Interface utilisateur
- **Design moderne** : Interface élégante avec des animations fluides
- **Expérience immersive** : Retours haptiques (vibrations) pour un engagement accru
- **Thèmes visuels** : Dégradés de couleurs et styles visuels attrayants
- **Accessibilité** : Interface intuitive et facile à naviguer

## 🛠️ Technologies utilisées

- **React Native** : Framework cross-platform pour le développement mobile
- **Expo** : Plateforme pour simplifier le développement React Native
- **React Navigation** : Navigation entre les écrans de l'application
- **AsyncStorage** : Stockage local des données utilisateur
- **Expo Haptics** : Retours haptiques pour améliorer l'expérience utilisateur
- **Expo Linear Gradient** : Effets visuels de dégradés
- **Expo Location** : Services de géolocalisation
- **React Native Maps** : Intégration de cartes interactives
- **Expo Camera** : Fonctionnalités liées à l'appareil photo
- **Expo Blur** : Effets visuels de flou
- **Animations React Native** : Animations fluides pour une expérience dynamique

## 🏁 Mise en route

### Prérequis
- Node.js (v14.0.0 ou plus)
- npm ou yarn
- Expo CLI
- Un appareil mobile ou un émulateur

### Installation

1. **Cloner le dépôt**
   ```bash
   git clone [URL_DU_REPO]
   cd Projet_Web_FINCIR2
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Lancer l'application**
   ```bash
   npm start
   # ou
   yarn start
   ```

4. **Scanner le QR code** avec l'application Expo Go sur votre appareil mobile ou choisir de lancer sur un émulateur.

## 📱 Structure de l'application

L'application est organisée selon une architecture claire et modulaire :

```
Projet_Web_FINCIR2/
├── App.js                    # Point d'entrée de l'application
├── assets/                   # Ressources graphiques et médias
├── components/               # Composants réutilisables
│   ├── common/               # Composants communs (ex: icônes)
│   └── ...
├── navigation/               # Configuration des navigateurs
├── screens/                  # Écrans principaux
│   ├── HomeScreen.js         # Écran d'accueil
│   ├── TasksScreen.js        # Écran des défis
│   ├── ProfileScreen.js      # Profil utilisateur
│   └── ...
├── services/                 # Services (authentification, messages...)
├── utils/                    # Utilitaires et fonctions d'aide
└── ...
```

## 🌈 Écrans principaux

### 🏠 Écran d'accueil (HomeScreen)
L'écran d'accueil présente un résumé de votre progression actuelle, votre niveau, vos points et le défi du jour. Vous pouvez également accéder rapidement aux fonctionnalités principales via des boutons d'action.

### 📋 Écran des défis (TasksScreen)
Consultez et gérez tous vos défis actuels, suivez votre progression et validez les défis complétés.

### 👤 Écran de profil (ProfileScreen)
Visualisez et modifiez vos informations personnelles, consultez vos statistiques détaillées et personnalisez vos préférences.

### 👫 Écran amis (FriendsScreen)
Gérez vos connexions sociales, trouvez de nouveaux amis et suivez leurs activités et progressions.

### 💬 Écran de conversation (ConversationScreen)
Communiquez avec vos amis pour partager votre expérience et vous motiver mutuellement.

## 🔄 Flux utilisateur

1. **Onboarding** : À la première connexion, les utilisateurs répondent à quelques questions pour personnaliser leur expérience.
2. **Authentification** : Connexion sécurisée pour accéder à leur compte.
3. **Accueil** : Vue d'ensemble avec le défi du jour et les statistiques principales.
4. **Accomplissement des défis** : L'utilisateur choisit et complète des défis pour gagner des points.
5. **Progression** : Montée en niveau au fur et à mesure que l'utilisateur accumule des points.
6. **Interaction sociale** : Possibilité de se connecter avec d'autres utilisateurs pour enrichir l'expérience.

## 🤝 Contribution

Les contributions sont les bienvenues ! Si vous souhaitez améliorer ChallengR, n'hésitez pas à :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📜 Licence

Ce projet est sous licence 0BSD - voir le fichier LICENSE pour plus de détails.

## 📞 Contact

Pour toute question ou suggestion, n'hésitez pas à nous contacter !

---

⭐ **ChallengR** - Relevez des défis, transformez-vous ! ⭐

Développé avec ❤️ par l'équipe CIR2
