# ChallengR - Guide d'installation

Ce guide vous explique comment installer et lancer l'application ChallengR étape par étape, en partant de zéro après avoir cloné le dépôt.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- [Node.js](https://nodejs.org/) (version 16.x ou supérieure recommandée)
- [Git](https://git-scm.com/downloads) pour cloner le dépôt
- Un terminal/invite de commande

## Étapes d'installation

### 1. Cloner le dépôt

```bash
git clone <URL_DU_DEPOT>
cd Projet_Web_CIR2-ma-nouvelle-fonctionnalite
```

Remplacez `<URL_DU_DEPOT>` par l'URL de votre dépôt Git.

### 2. Création des fichiers manquants

⚠️ **Important** : Certains fichiers n'ont pas pu être ajoutés au dépôt GitHub. Vous devez les créer manuellement :

#### Créer le fichier config.js

Créez un fichier `config.js` à la racine du projet avec le contenu suivant :

```javascript
export const API_URL = 'https://api.challengr.app';
export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_DATA_KEY = 'user_data';
export const API_TIMEOUT = 10000; // 10 secondes
export const MAPS_API_KEY = 'votre_cle_api_google_maps'; // Optionnel pour les fonctionnalités de carte
```

#### Créer le dossier node_modules

Au lieu de créer ce dossier manuellement, il sera généré automatiquement à l'étape suivante.

### 3. Installer Expo CLI globalement

```bash
npm install -g expo-cli
```

Cette commande installe l'outil en ligne de commande d'Expo qui est nécessaire pour développer et tester l'application.

### 4. Installer les dépendances du projet

```bash
npm install
```

Cette commande lit le fichier package.json et installe toutes les dépendances nécessaires pour le projet. Cela peut prendre quelques minutes.

### 5. Démarrer l'application

```bash
npm start
```

Cette commande lance le serveur de développement Expo. Un QR code s'affichera dans votre terminal.

### 6. Tester l'application

Vous avez plusieurs options pour tester l'application :

#### Sur un appareil physique :
1. Installez l'application "Expo Go" sur votre smartphone (disponible sur [App Store](https://apps.apple.com/app/apple-store/id982107779) ou [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. Scannez le QR code affiché dans votre terminal avec :
   - L'appareil photo de votre iPhone
   - L'application Expo Go sur Android

#### Sur un émulateur :
- Pour Android : assurez-vous que l'émulateur est lancé, puis appuyez sur 'a' dans le terminal
- Pour iOS : appuyez sur 'i' dans le terminal (nécessite un Mac avec Xcode)

#### Dans un navigateur web :
- Appuyez sur 'w' dans le terminal pour lancer l'application dans votre navigateur web

## Problèmes courants et solutions

### Metro Bundler ne démarre pas
```bash
npx expo start --clear
```

### Problèmes de dépendances
```bash
rm -rf node_modules
npm install
```

### Erreurs liées à Expo
```bash
expo doctor
```
Cette commande vérifie votre environnement et propose des solutions.

### Problèmes avec les modules natifs
Certains modules comme la caméra ou la géolocalisation peuvent nécessiter des permissions supplémentaires sur les appareils physiques.

### Erreur "Cannot find module 'config'"
Si vous recevez cette erreur, vérifiez que vous avez bien créé le fichier `config.js` comme indiqué à l'étape 2.

## Structure du projet

- `screens/` : Contient les différents écrans de l'application
- `components/` : Composants réutilisables
- `navigation/` : Configuration des routes et de la navigation
- `services/` : Services pour l'authentification, les amis, etc.
- `utils/` : Fonctions utilitaires et constantes
- `assets/` : Images, icônes et autres ressources

## Fonctionnalités principales

- Système de défis et de tâches
- Profil utilisateur avec progression et niveaux
- Système d'amis et messagerie
- Géolocalisation

## Besoin d'aide supplémentaire ?

N'hésitez pas à contacter l'équipe de développement pour toute question ou problème lors de l'installation.
