// Constantes et utilitaires pour l'application ChallengR
import { Dimensions, StatusBar } from 'react-native';
import * as ReactNative from 'react-native';

const Platform = ReactNative.Platform;

// Dimensions
export const SCREEN = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
  statusBarHeight: StatusBar.currentHeight || 25,
  navBarHeight: 50,
};

// Niveaux de difficulté pour les tâches
export const DIFFICULTY_LEVELS = {
  EASY: { name: "Facile", points: 10, color: "#27ae60" },
  MEDIUM: { name: "Moyen", points: 30, color: "#f39c12" },
  HARD: { name: "Difficile", points: 50, color: "#e74c3c" },
};

// Catégories de défis
export const CHALLENGE_CATEGORIES = {
  PERSONAL: { id: 'personal', name: "Développement personnel", icon: "person", color: "#3498db" },
  FITNESS: { id: 'fitness', name: "Forme physique", icon: "fitness", color: "#2ecc71" },
  LEARNING: { id: 'learning', name: "Apprentissage", icon: "book", color: "#9b59b6" },
  SOCIAL: { id: 'social', name: "Relations sociales", icon: "people", color: "#e67e22" },
  CREATIVITY: { id: 'creativity', name: "Créativité", icon: "color-palette", color: "#1abc9c" },
  PRODUCTIVITY: { id: 'productivity', name: "Productivité", icon: "timer", color: "#f1c40f" },
  MINDFULNESS: { id: 'mindfulness', name: "Bien-être mental", icon: "leaf", color: "#16a085" },
  CUSTOM: { id: 'custom', name: "Personnalisé", icon: "create", color: "#34495e" },
  QUIZ: { id: 'quiz', name: "Culture Générale", icon: "help-circle", color: "#8e44ad" },
  SPORT: {
    id: 'sport',
    name: 'Sport',
    icon: 'fitness',
    color: '#e74c3c'
  },
  CUISINE: {
    id: 'cuisine',
    name: 'Cuisine',
    icon: 'restaurant',
    color: '#f39c12'
  },
  TRAVAIL: {
    id: 'travail',
    name: 'Travail',
    icon: 'briefcase',
    color: '#3498db'
  },
  LECTURE: {
    id: 'lecture',
    name: 'Lecture',
    icon: 'book',
    color: '#9b59b6'
  },
  RELAXATION: {
    id: 'relaxation',
    name: 'Relaxation',
    icon: 'leaf',
    color: '#27ae60'
  }
};

// Types de défis
export const CHALLENGE_TYPES = {
  REGULAR: 'regular',     // Défis standards
  DAILY: 'daily',         // Défis quotidiens qui se renouvellent chaque jour
  TIMED: 'timed',         // Défis à durée limitée
  STREAK: 'streak',       // Défis qui demandent une série de complétion consécutive
  COMMUNITY: 'community', // Défis de la communauté
  QUIZ: 'quiz',           // Questions de culture générale
  COMPLETED: 'completed'  // Défis complétés par l'utilisateur
};

// Clés de stockage pour AsyncStorage
export const STORAGE_KEYS = {
  TASKS: '@challengr_tasks',
  POINTS: '@challengr_points',
  USER_PROFILE: '@challengr_user_profile',
  FRIENDS: '@challengr_friends',
  PENDING_REQUESTS: '@challengr_pending_requests',
  USERS: '@challengr_users',
  CONVERSATIONS: '@challengr_conversations',
  MESSAGES: '@challengr_messages',
};
    
// Configuration des niveaux du jeu
export const LEVEL_CONFIG = {
  // Pour chaque niveau: titre, points requis, description et avantages
  1: { 
    title: "Débutant", 
    pointsRequired: 0, 
    description: "Commence ton aventure de défis", 
    advantages: ["Défis de base débloqués"]
  },
  2: { 
    title: "Novice", 
    pointsRequired: 100, 
    description: "Tu es sur la bonne voie", 
    advantages: ["Possibilité d'ajouter des amis"]
  },
  3: { 
    title: "Apprenti", 
    pointsRequired: 225, 
    description: "Gagne en expérience", 
    advantages: ["Défis de difficulté moyenne débloqués", "Bonus de points +5%"]
  },
  4: { 
    title: "Aventurier", 
    pointsRequired: 400, 
    description: "Ton voyage progresse bien", 
    advantages: ["Personnalisation du profil avancée"]
  },
  5: { 
    title: "Explorateur", 
    pointsRequired: 650, 
    description: "Tu explores de nouveaux horizons", 
    advantages: ["Badge 'Progresseur' débloqué", "Bonus de points +10%"]
  },
  8: { 
    title: "Expert", 
    pointsRequired: 1200, 
    description: "Tes compétences sont impressionnantes", 
    advantages: ["Défis exclusifs débloqués", "Bonus de points +15%"]
  },
  10: { 
    title: "Maître", 
    pointsRequired: 2000, 
    description: "Une véritable référence", 
    advantages: ["Création de défis personnalisés", "Bonus de points +20%"]
  },
  15: { 
    title: "Légendaire", 
    pointsRequired: 4000, 
    description: "Ton nom restera dans l'histoire", 
    advantages: ["Tous les avantages débloqués", "Bonus de points +25%"]
  }
};

// Fonctions utilitaires
export const generateUniqueId = () => {
  return Date.now().toString() + '-' + Math.random().toString(36).substring(2, 15);
};

// Calculer le niveau basé sur les points
export const calculateLevel = (points) => {
  let currentLevel = 1;
  let currentPoints = points || 0;
  let nextLevel = 2;
  let pointsForNextLevel = LEVEL_CONFIG[2].pointsRequired;
  
  // Trouver le niveau actuel basé sur les points
  Object.keys(LEVEL_CONFIG).forEach(levelKey => {
    const level = parseInt(levelKey);
    const config = LEVEL_CONFIG[level];
    
    if (currentPoints >= config.pointsRequired && level > currentLevel) {
      currentLevel = level;
    }
  });
  
  // Trouver le prochain niveau
  for (let i = currentLevel + 1; i <= Math.max(...Object.keys(LEVEL_CONFIG).map(Number)); i++) {
    if (LEVEL_CONFIG[i]) {
      nextLevel = i;
      pointsForNextLevel = LEVEL_CONFIG[i].pointsRequired;
      break;
    }
  }
  
  // Calculer la progression vers le prochain niveau
  const currentLevelPoints = LEVEL_CONFIG[currentLevel].pointsRequired;
  const progressPoints = currentPoints - currentLevelPoints;
  const totalPointsNeeded = pointsForNextLevel - currentLevelPoints;
  const progressToNext = (progressPoints / totalPointsNeeded) * 100;
  
  return {
    level: currentLevel,
    title: LEVEL_CONFIG[currentLevel].title,
    progress: progressToNext,
    pointsForNextLevel: pointsForNextLevel,
    remainingPoints: pointsForNextLevel - currentPoints,
    nextLevelTitle: LEVEL_CONFIG[nextLevel]?.title || "Niveau max",
    advantages: LEVEL_CONFIG[currentLevel].advantages,
    description: LEVEL_CONFIG[currentLevel].description,
    bonusMultiplier: getLevelBonusMultiplier(currentLevel)
  };
};

// Obtenir le multiplicateur de bonus pour un niveau donné
export const getLevelBonusMultiplier = (level) => {
  if (level >= 15) return 1.25; // +25% de points
  if (level >= 10) return 1.20; // +20% de points
  if (level >= 8) return 1.15;  // +15% de points
  if (level >= 5) return 1.10;  // +10% de points
  if (level >= 3) return 1.05;  // +5% de points
  return 1; // Pas de bonus
};

// Calculer les points ajustés en fonction du niveau
export const calculatePointsWithBonus = (basePoints, level) => {
  const bonusMultiplier = getLevelBonusMultiplier(level);
  return Math.floor(basePoints * bonusMultiplier);
};