import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHALLENGE_TYPES, generateUniqueId } from './constants';
import { addTaskToCalendar, removeTaskFromCalendar, updateTaskInCalendar } from '../services/calendarService';

// Clés de stockage
const TASKS_STORAGE_KEY = '@challengr_tasks';
const DAILY_TASKS_KEY = '@challengr_daily_tasks';
const TIMED_TASKS_KEY = '@challengr_timed_tasks';
const QUIZ_TASKS_KEY = '@challengr_quiz_tasks';
const POINTS_STORAGE_KEY = '@challengr_points';
const COMPLETED_TASKS_KEY = '@challengr_completed_tasks';
const USER_PROFILE_KEY = '@challengr_user_profile';
const STREAK_KEY = '@challengr_streak';
const LAST_DAILY_REFRESH_KEY = '@challengr_last_daily_refresh';
const LAST_QUIZ_REFRESH_KEY = '@challengr_last_quiz_refresh';
const CURRENT_USER_KEY = '@challengr_current_user'; // Ajout de la clé utilisée dans authService

/**
 * Récupère l'ID de l'utilisateur connecté directement depuis AsyncStorage
 * au lieu de passer par authService pour éviter le cycle de dépendances
 */
export const getCurrentUserId = async () => {
  try {
    const currentUserJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (!currentUserJson) {
      console.warn('Aucun utilisateur connecté');
      return null;
    }
    
    const currentUser = JSON.parse(currentUserJson);
    if (!currentUser || !currentUser.userId) {
      console.warn('userId manquant dans les données utilisateur');
      return null;
    }
    
    return currentUser.userId;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
    return null;
  }
};

/**
 * Génère une clé de stockage spécifique à un utilisateur
 * Cette fonction est essentielle pour séparer les données entre utilisateurs
 */
const getUserSpecificKey = async (baseKey) => {
  const userId = await getCurrentUserId();
  if (!userId) return baseKey; // Fallback au cas où
  return `${baseKey}_${userId}`;
};

/**
 * Récupère les tâches depuis le stockage
 */
export const retrieveTasks = async () => {
  try {
    const userKey = await getUserSpecificKey(TASKS_STORAGE_KEY);
    const tasksJson = await AsyncStorage.getItem(userKey);
    
    if (tasksJson !== null) {
      return JSON.parse(tasksJson);
    }
    
    // Si aucune tâche n'existe, retourner un tableau vide
    return [];
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error);
    return [];
  }
};

/**
 * Enregistre les tâches dans le stockage
 */
export const saveTasks = async (tasks) => {
  try {
    const userKey = await getUserSpecificKey(TASKS_STORAGE_KEY);
    await AsyncStorage.setItem(userKey, JSON.stringify(tasks));
    return tasks;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des tâches:', error);
    return [];
  }
};

/**
 * Crée une nouvelle tâche
 */
export const createTask = async (task) => {
  try {
    const tasks = await retrieveTasks();
    
    // Créer la nouvelle tâche
    const newTask = {
      ...task,
      id: generateUniqueId(),
      type: CHALLENGE_TYPES.REGULAR,
      completed: false,
      createdAt: new Date().toISOString(),
      calendarEventId: null  // Ajout du champ pour l'ID d'événement calendrier
    };
    
    // Remarque: Nous n'ajoutons plus automatiquement la tâche au calendrier ici
    // Cette logique est gérée dans TasksScreen.js
    
    const updatedTasks = [...tasks, newTask];
    await saveTasks(updatedTasks);
    
    return newTask;
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error);
    return null;
  }
};

/**
 * Marque une tâche comme complétée et l'ajoute à la liste des tâches terminées
 */
export const completeTask = async (taskId) => {
  try {
    // 1. Tâches standards
    let tasks = await retrieveTasks();
    let found = false;
    let updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        found = true;
        return { ...task, completed: true };
      }
      return task;
    });
    if (found) {
      await saveTasks(updatedTasks);
      await addCompletedTask(taskId);
      return updatedTasks;
    }

    // 2. Tâches quotidiennes
    let dailyTasks = await retrieveDailyTasks();
    let updatedDailyTasks = dailyTasks.map(task => {
      if (task.id === taskId) {
        found = true;
        return { ...task, completed: true };
      }
      return task;
    });
    if (found) {
      const userKey = await getUserSpecificKey(DAILY_TASKS_KEY);
      await AsyncStorage.setItem(userKey, JSON.stringify(updatedDailyTasks));
      await addCompletedTask(taskId);
      return updatedDailyTasks;
    }

    // 3. Tâches temporaires
    let timedTasks = await retrieveTimedTasks();
    let updatedTimedTasks = timedTasks.map(task => {
      if (task.id === taskId) {
        found = true;
        return { ...task, completed: true };
      }
      return task;
    });
    if (found) {
      const userKey = await getUserSpecificKey(TIMED_TASKS_KEY);
      await AsyncStorage.setItem(userKey, JSON.stringify(updatedTimedTasks));
      await addCompletedTask(taskId);
      return updatedTimedTasks;
    }

    // Si la tâche n'a pas été trouvée
    return [];
  } catch (error) {
    console.error('Erreur lors de la complétion de la tâche:', error);
    return [];
  }
};

/**
 * Ajoute une tâche complétée à la liste des tâches terminées
 */
export const addCompletedTask = async (taskId) => {
  try {
    const userKey = await getUserSpecificKey(COMPLETED_TASKS_KEY);
    const completedTasks = await retrieveCompletedTasks();
    
    // Vérifier si la tâche n'est pas déjà dans la liste
    if (!completedTasks.includes(taskId)) {
      const updatedCompletedTasks = [...completedTasks, taskId];
      await AsyncStorage.setItem(
        userKey, 
        JSON.stringify(updatedCompletedTasks)
      );
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout aux tâches complétées:', error);
  }
};

/**
 * Récupère la liste des tâches complétées
 */
export const retrieveCompletedTasks = async () => {
  try {
    const userKey = await getUserSpecificKey(COMPLETED_TASKS_KEY);
    const completedTasksJson = await AsyncStorage.getItem(userKey);
    
    if (completedTasksJson !== null) {
      return JSON.parse(completedTasksJson);
    }
    
    return [];
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches complétées:', error);
    return [];
  }
};

/**
 * Supprime une tâche de n'importe quel type (standard, quotidien, temporaire)
 */
export const deleteTask = async (taskId) => {
  try {
    // 1. Chercher dans les tâches standards
    const standardTasks = await retrieveTasks();
    const taskToDelete = standardTasks.find(task => task.id === taskId);
    
    if (taskToDelete) {
      // Supprimer l'événement calendrier associé s'il existe
      if (taskToDelete.calendarEventId) {
        await removeTaskFromCalendar(taskToDelete.calendarEventId);
      }
      
      // Filtrer la tâche à supprimer des tâches standards
      const updatedTasks = standardTasks.filter(task => task.id !== taskId);
      await saveTasks(updatedTasks);
      return updatedTasks;
    }
    
    // 2. Chercher dans les tâches quotidiennes
    const dailyTasks = await retrieveDailyTasks();
    const dailyTaskToDelete = dailyTasks.find(task => task.id === taskId);
    
    if (dailyTaskToDelete) {
      // Supprimer l'événement calendrier associé s'il existe
      if (dailyTaskToDelete.calendarEventId) {
        await removeTaskFromCalendar(dailyTaskToDelete.calendarEventId);
      }
      
      // Filtrer la tâche à supprimer des tâches quotidiennes
      const updatedDailyTasks = dailyTasks.filter(task => task.id !== taskId);
      const userKey = await getUserSpecificKey(DAILY_TASKS_KEY);
      await AsyncStorage.setItem(userKey, JSON.stringify(updatedDailyTasks));
      // Retourner toutes les tâches standards (car la fonction est attendue pour retourner les tâches standards)
      return standardTasks;
    }
    
    // 3. Chercher dans les tâches à durée limitée
    const timedTasks = await retrieveTimedTasks();
    const timedTaskToDelete = timedTasks.find(task => task.id === taskId);
    
    if (timedTaskToDelete) {
      // Supprimer l'événement calendrier associé s'il existe
      if (timedTaskToDelete.calendarEventId) {
        await removeTaskFromCalendar(timedTaskToDelete.calendarEventId);
      }
      
      // Filtrer la tâche à supprimer des tâches à durée limitée
      const updatedTimedTasks = timedTasks.filter(task => task.id !== taskId);
      const userKey = await getUserSpecificKey(TIMED_TASKS_KEY);
      await AsyncStorage.setItem(userKey, JSON.stringify(updatedTimedTasks));
      // Retourner toutes les tâches standards (car la fonction est attendue pour retourner les tâches standards)
      return standardTasks;
    }
    
    // Si on arrive ici, la tâche n'a pas été trouvée
    return standardTasks;
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error);
    return [];
  }
};

/**
 * Récupère le nombre de points actuel
 */
export const retrievePoints = async () => {
  try {
    const points = await AsyncStorage.getItem(POINTS_STORAGE_KEY);
    return points ? parseInt(points, 10) : 0;
  } catch (e) {
    console.error("Erreur lors de la récupération des points:", e);
    return 0;
  }
};

/**
 * Stocker les points de l'utilisateur (assurez-vous que cette fonction REMPLACE les points précédents)
 */
export const storePoints = async (points) => {
  try {
    // Stocke exactement la valeur passée, remplaçant l'ancienne valeur
    await AsyncStorage.setItem(POINTS_STORAGE_KEY, points.toString());
    return points;
  } catch (e) {
    console.error("Erreur lors du stockage des points:", e);
    return null;
  }
};

/**
 * Nouvelle fonction pour ajouter des points (si elle n'existe pas encore)
 */
export const addPoints = async (pointsToAdd) => {
  try {
    // Récupérer les points actuels
    const currentPoints = await retrievePoints() || 0;
    // Ajouter les nouveaux points
    const newPoints = currentPoints + pointsToAdd;
    // Stocker le nouveau total
    await AsyncStorage.setItem(POINTS_STORAGE_KEY, newPoints.toString());
    return newPoints;
  } catch (e) {
    console.error("Erreur lors de l'ajout des points:", e);
    return null;
  }
};

/**
 * Récupère le profil utilisateur depuis le stockage
 */
export const retrieveUserProfile = async () => {
  try {
    const userKey = await getUserSpecificKey(USER_PROFILE_KEY);
    const profileJson = await AsyncStorage.getItem(userKey);
    
    if (profileJson !== null) {
      return JSON.parse(profileJson);
    }
    
    // Si aucun profil n'existe, retourner un profil par défaut
    return {
      username: 'Utilisateur',
      bio: 'Passionné de défis et aventures!',
      profileImage: null,
      email: 'user@example.com'
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du profil utilisateur:', error);
    return null;
  }
};

/**
 * Enregistre le profil utilisateur dans le stockage
 */
export const storeUserProfile = async (userProfile) => {
  try {
    const userKey = await getUserSpecificKey(USER_PROFILE_KEY);
    await AsyncStorage.setItem(userKey, JSON.stringify(userProfile));
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du profil utilisateur:', error);
    return false;
  }
};

/**
 * Réinitialise toutes les données de l'application
 * Fonction utile pour les tests ou pour permettre à l'utilisateur de tout réinitialiser
 */
export const resetAllData = async () => {
  try {
    const keys = [TASKS_STORAGE_KEY, POINTS_STORAGE_KEY, COMPLETED_TASKS_KEY, USER_PROFILE_KEY];
    const userKeys = await Promise.all(keys.map(key => getUserSpecificKey(key)));
    await AsyncStorage.multiRemove(userKeys);
    console.log('Toutes les données ont été réinitialisées');
    return true;
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des données:', error);
    return false;
  }
};

/**
 * Récupère les défis quotidiens
 */
export const retrieveDailyTasks = async () => {
  try {
    // Vérifier si les défis quotidiens doivent être rafraîchis
    await refreshDailyTasksIfNeeded();
    
    const userKey = await getUserSpecificKey(DAILY_TASKS_KEY);
    const dailyTasksJson = await AsyncStorage.getItem(userKey);
    
    if (dailyTasksJson !== null) {
      return JSON.parse(dailyTasksJson);
    }
    
    // Si aucun défi quotidien n'existe, en générer de nouveaux
    return await generateAndSaveDailyTasks();
  } catch (error) {
    console.error('Erreur lors de la récupération des défis quotidiens:', error);
    return [];
  }
};

/**
 * Vérifie si les défis quotidiens doivent être rafraîchis (une fois par jour)
 */
export const refreshDailyTasksIfNeeded = async () => {
  try {
    const userKey = await getUserSpecificKey(LAST_DAILY_REFRESH_KEY);
    const lastRefreshJson = await AsyncStorage.getItem(userKey);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    let lastRefresh = 0;
    if (lastRefreshJson !== null) {
      lastRefresh = parseInt(lastRefreshJson, 10);
    }
    
    // Si la dernière actualisation n'est pas d'aujourd'hui, régénérer les défis
    if (lastRefresh < today) {
      await generateAndSaveDailyTasks();
      await AsyncStorage.setItem(userKey, today.toString());
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'actualisation des défis quotidiens:', error);
  }
};

/**
 * Génère de nouveaux défis quotidiens
 */
const generateAndSaveDailyTasks = async () => {
  // Liste des défis quotidiens possibles
  const possibleDailyTasks = [
    {
      title: "Boire 2 litres d'eau",
      description: "Hydratez-vous correctement aujourd'hui",
      points: 15,
      difficulty: "EASY",
      category: "FITNESS"
    },
    {
      title: "15 minutes de méditation",
      description: "Prenez un moment pour vous recentrer",
      points: 20,
      difficulty: "EASY",
      category: "MINDFULNESS"
    },
    {
      title: "Lire 20 pages",
      description: "Développez votre connaissance ou votre imagination",
      points: 25,
      difficulty: "MEDIUM",
      category: "LEARNING"
    },
    {
      title: "Faire 30 minutes d'exercice",
      description: "Restez actif pour votre santé",
      points: 30,
      difficulty: "MEDIUM",
      category: "FITNESS"
    },
    {
      title: "Apprendre 5 nouveaux mots",
      description: "Enrichissez votre vocabulaire",
      points: 15,
      difficulty: "EASY",
      category: "LEARNING"
    },
    {
      title: "Contacter un ami ou un membre de la famille",
      description: "Maintenez vos liens sociaux",
      points: 20,
      difficulty: "EASY",
      category: "SOCIAL"
    },
    {
      title: "Ranger votre espace de travail",
      description: "Un environnement propre améliore la productivité",
      points: 15,
      difficulty: "EASY",
      category: "PRODUCTIVITY"
    },
    {
      title: "Faire une bonne action",
      description: "Aidez quelqu'un aujourd'hui",
      points: 25,
      difficulty: "MEDIUM",
      category: "SOCIAL"
    },
    {
      title: "Essayer une nouvelle recette",
      description: "Développez vos compétences culinaires",
      points: 35,
      difficulty: "MEDIUM",
      category: "CREATIVITY"
    },
    {
      title: "Faire une liste de tâches pour demain",
      description: "Organisez-vous pour être plus efficace",
      points: 15,
      difficulty: "EASY",
      category: "PRODUCTIVITY"
    }
  ].map(task => ({
    ...task,
    // Ajout d'un champ categoryLabel en français
    categoryLabel:
      task.category === "FITNESS" ? "Sport" :
      task.category === "MINDFULNESS" ? "Méditation" :
      task.category === "LEARNING" ? "Lecture / Apprentissage" :
      task.category === "SOCIAL" ? "Social" :
      task.category === "PRODUCTIVITY" ? "Productivité" :
      task.category === "CREATIVITY" ? "Créativité" :
      "Autre"
  }));
  
  // Sélectionner aléatoirement 3 défis quotidiens
  const selectedIndices = new Set();
  while (selectedIndices.size < 3 && selectedIndices.size < possibleDailyTasks.length) {
    const randomIndex = Math.floor(Math.random() * possibleDailyTasks.length);
    selectedIndices.add(randomIndex);
  }
  
  // Créer les défis quotidiens
  const dailyTasks = Array.from(selectedIndices).map(index => {
    const task = possibleDailyTasks[index];
    return {
      id: generateUniqueId(),
      title: task.title,
      description: task.description,
      points: task.points,
      difficulty: task.difficulty,
      category: task.category,
      type: CHALLENGE_TYPES.DAILY,
      completed: false,
      calendarEventId: null, // Ajout du champ pour l'ID d'événement calendrier
      createdAt: new Date().toISOString(),
      expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
    };
  });
  
  // Ajouter les défis au calendrier
  for (let i = 0; i < dailyTasks.length; i++) {
    const eventId = await addTaskToCalendar(dailyTasks[i]);
    if (eventId) {
      dailyTasks[i].calendarEventId = eventId;
    }
  }
  
  // Sauvegarder les défis quotidiens
  const userKey = await getUserSpecificKey(DAILY_TASKS_KEY);
  await AsyncStorage.setItem(userKey, JSON.stringify(dailyTasks));
  
  return dailyTasks;
};

/**
 * Récupère les défis à durée limitée
 */
export const retrieveTimedTasks = async () => {
  try {
    const userKey = await getUserSpecificKey(TIMED_TASKS_KEY);
    const timedTasksJson = await AsyncStorage.getItem(userKey);
    
    if (timedTasksJson !== null) {
      const timedTasks = JSON.parse(timedTasksJson);
      
      // Filtrer les défis expirés
      const now = new Date().getTime();
      const validTimedTasks = timedTasks.filter(task => {
        const expiresAt = new Date(task.expiresAt).getTime();
        return expiresAt > now;
      });
      
      // Si des défis ont expiré, mettre à jour le stockage
      if (validTimedTasks.length !== timedTasks.length) {
        await AsyncStorage.setItem(userKey, JSON.stringify(validTimedTasks));
      }
      
      return validTimedTasks;
    }
    
    return [];
  } catch (error) {
    console.error('Erreur lors de la récupération des défis à durée limitée:', error);
    return [];
  }
};

/**
 * Crée un nouveau défi à durée limitée
 */
export const createTimedTask = async (task) => {
  try {
    const timedTasks = await retrieveTimedTasks();
    
    // Créer le nouveau défi à durée limitée
    const newTimedTask = {
      ...task,
      id: generateUniqueId(),
      type: CHALLENGE_TYPES.TIMED,
      completed: false,
      calendarEventId: null, // Ajout du champ pour l'ID d'événement calendrier
      createdAt: new Date().toISOString()
    };
    
    // Si expiresAt n'est pas fourni, définir une durée par défaut de 3 jours
    if (!newTimedTask.expiresAt) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);
      newTimedTask.expiresAt = expiresAt.toISOString();
    }
    
    // Remarque: Nous n'ajoutons plus automatiquement la tâche au calendrier ici
    // Cette logique est gérée dans TasksScreen.js
    
    const updatedTimedTasks = [...timedTasks, newTimedTask];
    const userKey = await getUserSpecificKey(TIMED_TASKS_KEY);
    await AsyncStorage.setItem(userKey, JSON.stringify(updatedTimedTasks));
    
    return newTimedTask;
  } catch (error) {
    console.error('Erreur lors de la création d\'un défi à durée limitée:', error);
    return null;
  }
};

/**
 * Récupère les informations de série actuelle
 */
export const retrieveStreak = async () => {
  try {
    const userKey = await getUserSpecificKey(STREAK_KEY);
    const streakJson = await AsyncStorage.getItem(userKey);
    
    if (streakJson !== null) {
      const streak = JSON.parse(streakJson);
      
      // Vérifier si la série est toujours active (moins de 24h depuis la dernière complétion)
      const now = new Date().getTime();
      const lastCompletionTime = new Date(streak.lastCompletionDate).getTime();
      const daysSinceLastCompletion = Math.floor((now - lastCompletionTime) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastCompletion > 1) {
        // Si plus d'un jour s'est écoulé, réinitialiser la série
        const resetStreak = {
          count: 0,
          lastCompletionDate: null
        };
        await AsyncStorage.setItem(userKey, JSON.stringify(resetStreak));
        return resetStreak;
      }
      
      return streak;
    }
    
    // Si aucune série n'existe, en créer une nouvelle
    const newStreak = {
      count: 0,
      lastCompletionDate: null
    };
    await AsyncStorage.setItem(userKey, JSON.stringify(newStreak));
    return newStreak;
  } catch (error) {
    console.error('Erreur lors de la récupération de la série:', error);
    return { count: 0, lastCompletionDate: null };
  }
};

/**
 * Met à jour la série après avoir complété un défi
 */
export const updateStreak = async () => {
  try {
    const streak = await retrieveStreak();
    const now = new Date();
    
    // Si c'est la première complétion ou si la série a été réinitialisée
    if (!streak.lastCompletionDate) {
      const updatedStreak = {
        count: 1,
        lastCompletionDate: now.toISOString()
      };
      const userKey = await getUserSpecificKey(STREAK_KEY);
      await AsyncStorage.setItem(userKey, JSON.stringify(updatedStreak));
      return updatedStreak;
    }
    
    const lastCompletionDate = new Date(streak.lastCompletionDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastCompletionDay = new Date(
      lastCompletionDate.getFullYear(),
      lastCompletionDate.getMonth(),
      lastCompletionDate.getDate()
    );
    
    // Si la dernière complétion était hier, incrémenter la série
    if (lastCompletionDay.getTime() === yesterday.getTime()) {
      const updatedStreak = {
        count: streak.count + 1,
        lastCompletionDate: now.toISOString()
      };
      const userKey = await getUserSpecificKey(STREAK_KEY);
      await AsyncStorage.setItem(userKey, JSON.stringify(updatedStreak));
      return updatedStreak;
    }
    
    // Si la dernière complétion était aujourd'hui, juste mettre à jour l'horodatage
    if (lastCompletionDay.getTime() === today.getTime()) {
      const updatedStreak = {
        count: streak.count,
        lastCompletionDate: now.toISOString()
      };
      const userKey = await getUserSpecificKey(STREAK_KEY);
      await AsyncStorage.setItem(userKey, JSON.stringify(updatedStreak));
      return updatedStreak;
    }
    
    // Si plus d'un jour s'est écoulé, réinitialiser la série
    const resetStreak = {
      count: 1, // Commence une nouvelle série
      lastCompletionDate: now.toISOString()
    };
    const userKey = await getUserSpecificKey(STREAK_KEY);
    await AsyncStorage.setItem(userKey, JSON.stringify(resetStreak));
    return resetStreak;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la série:', error);
    return { count: 0, lastCompletionDate: null };
  }
};

/**
 * Récupère les questions de quiz quotidiennes
 */
export const retrieveQuizTasks = async () => {
  try {
    // Vérifier si les questions de quiz doivent être rafraîchies
    await refreshQuizTasksIfNeeded();
    
    const userKey = await getUserSpecificKey(QUIZ_TASKS_KEY);
    const quizTasksJson = await AsyncStorage.getItem(userKey);
    
    if (quizTasksJson !== null) {
      return JSON.parse(quizTasksJson);
    }
    
    // Si aucune question de quiz n'existe, en générer de nouvelles
    return await generateAndSaveQuizTasks();
  } catch (error) {
    console.error('Erreur lors de la récupération des questions de quiz:', error);
    return [];
  }
};

/**
 * Vérifie si les questions de quiz doivent être rafraîchies (une fois par jour)
 */
export const refreshQuizTasksIfNeeded = async () => {
  try {
    const userKey = await getUserSpecificKey(LAST_QUIZ_REFRESH_KEY);
    const lastRefreshJson = await AsyncStorage.getItem(userKey);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    let lastRefresh = 0;
    if (lastRefreshJson !== null) {
      lastRefresh = parseInt(lastRefreshJson, 10);
    }
    
    // Si la dernière actualisation n'est pas d'aujourd'hui, régénérer les questions
    if (lastRefresh < today) {
      await generateAndSaveQuizTasks();
      await AsyncStorage.setItem(userKey, today.toString());
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'actualisation des questions de quiz:', error);
  }
};

/**
 * Génère de nouvelles questions de quiz
 */
const generateAndSaveQuizTasks = async () => {
  // Liste des questions de quiz possibles
  const possibleQuizTasks = [
    {
      title: "Quelle est la capitale de l'Australie?",
      description: "Indice: Ce n'est pas Sydney",
      answers: ["Canberra", "Sydney", "Melbourne", "Brisbane"],
      correctAnswer: "Canberra",
      points: 20,
      difficulty: "MEDIUM",
      category: "QUIZ"
    },
    {
      title: "Quel est l'élément chimique le plus abondant dans l'univers?",
      description: "C'est aussi le plus léger",
      answers: ["Hydrogène", "Hélium", "Oxygène", "Carbone"],
      correctAnswer: "Hydrogène",
      points: 15,
      difficulty: "EASY",
      category: "QUIZ"
    },
    {
      title: "Qui a peint 'La Nuit étoilée'?",
      description: "Un célèbre peintre post-impressionniste",
      answers: ["Vincent van Gogh", "Pablo Picasso", "Claude Monet", "Leonardo da Vinci"],
      correctAnswer: "Vincent van Gogh",
      points: 20,
      difficulty: "MEDIUM",
      category: "QUIZ"
    },
    {
      title: "En quelle année a eu lieu la révolution française?",
      description: "Un événement qui a marqué l'histoire de France",
      answers: ["1789", "1769", "1799", "1776"],
      correctAnswer: "1789",
      points: 25,
      difficulty: "MEDIUM",
      category: "QUIZ"
    },
    {
      title: "Quel est le plus grand océan du monde?",
      description: "Il couvre environ un tiers de la surface de la Terre",
      answers: ["Océan Pacifique", "Océan Atlantique", "Océan Indien", "Océan Arctique"],
      correctAnswer: "Océan Pacifique",
      points: 15,
      difficulty: "EASY",
      category: "QUIZ"
    },
    {
      title: "Quelle est la planète la plus proche du Soleil?",
      description: "C'est aussi la plus petite planète du système solaire",
      answers: ["Mercure", "Vénus", "Mars", "Jupiter"],
      correctAnswer: "Mercure",
      points: 15,
      difficulty: "EASY",
      category: "QUIZ"
    },
    {
      title: "Qui a écrit 'Les Misérables'?",
      description: "Un célèbre écrivain français du 19ème siècle",
      answers: ["Victor Hugo", "Alexandre Dumas", "Honoré de Balzac", "Émile Zola"],
      correctAnswer: "Victor Hugo",
      points: 20,
      difficulty: "MEDIUM",
      category: "QUIZ"
    },
    {
      title: "Quelle est la plus haute montagne du monde?",
      description: "Située dans la chaîne de l'Himalaya",
      answers: ["Mont Everest", "K2", "Mont Blanc", "Kilimandjaro"],
      correctAnswer: "Mont Everest",
      points: 15,
      difficulty: "EASY",
      category: "QUIZ"
    },
    {
      title: "Quel pays a remporté la Coupe du Monde de football en 2018?",
      description: "Un pays européen",
      answers: ["France", "Brésil", "Allemagne", "Argentine"],
      correctAnswer: "France",
      points: 15,
      difficulty: "EASY",
      category: "QUIZ"
    },
    {
      title: "Quel est le plus grand désert du monde?",
      description: "Contrairement à ce que l'on pense, ce n'est pas le Sahara",
      answers: ["Antarctique", "Sahara", "Kalahari", "Gobi"],
      correctAnswer: "Antarctique",
      points: 30,
      difficulty: "HARD",
      category: "QUIZ"
    },
    {
      title: "Qui a formulé la théorie de la relativité?",
      description: "Un physicien allemand très célèbre",
      answers: ["Albert Einstein", "Isaac Newton", "Stephen Hawking", "Niels Bohr"],
      correctAnswer: "Albert Einstein",
      points: 20,
      difficulty: "MEDIUM",
      category: "QUIZ"
    },
    {
      title: "Quel est le plus grand mammifère terrestre?",
      description: "On le trouve principalement en Afrique",
      answers: ["Éléphant d'Afrique", "Girafe", "Rhinocéros blanc", "Hippopotame"],
      correctAnswer: "Éléphant d'Afrique",
      points: 15,
      difficulty: "EASY",
      category: "QUIZ"
    }
  ];
  
  // Sélectionner aléatoirement une question de quiz quotidienne
  const randomIndex = Math.floor(Math.random() * possibleQuizTasks.length);
  const quizTask = possibleQuizTasks[randomIndex];
  
  // Créer la question de quiz
  const dailyQuiz = {
    id: generateUniqueId(),
    title: quizTask.title,
    description: quizTask.description,
    answers: quizTask.answers,
    correctAnswer: quizTask.correctAnswer,
    points: quizTask.points,
    difficulty: quizTask.difficulty,
    category: quizTask.category,
    type: CHALLENGE_TYPES.QUIZ,
    completed: false,
    calendarEventId: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
  };
  
  // Sauvegarder la question de quiz
  const userKey = await getUserSpecificKey(QUIZ_TASKS_KEY);
  await AsyncStorage.setItem(userKey, JSON.stringify([dailyQuiz]));
  
  return [dailyQuiz];
};

/**
 * Vérifie si la réponse à la question de quiz est correcte
 */
export const checkQuizAnswer = async (quizId, answer) => {
  try {
    const quizTasks = await retrieveQuizTasks();
    const quiz = quizTasks.find(q => q.id === quizId);
    
    if (!quiz) {
      return { success: false, message: "Question non trouvée" };
    }
    
    const isCorrect = quiz.correctAnswer === answer;
    
    if (isCorrect) {
      // Marquer la question comme complétée
      const updatedQuizTasks = quizTasks.map(q => {
        if (q.id === quizId) {
          return { ...q, completed: true };
        }
        return q;
      });
      
      // Sauvegarder la mise à jour
      const userKey = await getUserSpecificKey(QUIZ_TASKS_KEY);
      await AsyncStorage.setItem(userKey, JSON.stringify(updatedQuizTasks));
      
      // Ajouter aux tâches complétées
      await addCompletedTask(quizId);
      
      // Ajouter les points
      const pointsToAdd = quiz.points;
      await addPoints(pointsToAdd);
      
      return { 
        success: true, 
        isCorrect: true, 
        points: pointsToAdd, 
        message: "Bonne réponse! Vous avez gagné " + pointsToAdd + " points."
      };
    } else {
      return { 
        success: true, 
        isCorrect: false, 
        correctAnswer: quiz.correctAnswer,
        message: "Mauvaise réponse. La bonne réponse était: " + quiz.correctAnswer
      };
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de la réponse:', error);
    return { success: false, message: "Une erreur s'est produite" };
  }
};

/**
 * Génère une question de quiz aléatoire
 * @returns {Promise<Object|null>} La question générée ou null en cas d'erreur
 */
export const generateRandomQuizQuestion = async () => {
  try {
    // Banque de questions
    const quizBank = [
      {
        title: "Quelle est la capitale de la France ?",
        description: "Choisissez la bonne réponse parmi les options suivantes.",
        answers: ["Paris", "Londres", "Berlin", "Madrid"],
        correctAnswer: "Paris",
        points: 20,
        category: "QUIZ",
        difficulty: "EASY"
      },
      {
        title: "Combien de côtés a un hexagone ?",
        description: "Un polygone régulier avec combien de côtés ?",
        answers: ["5", "6", "7", "8"],
        correctAnswer: "6",
        points: 15,
        category: "QUIZ",
        difficulty: "EASY"
      },
      {
        title: "Quel est l'élément chimique de symbole 'O' ?",
        description: "Choisissez l'élément correspondant au symbole.",
        answers: ["Or", "Osmium", "Oxygène", "Oganesson"],
        correctAnswer: "Oxygène",
        points: 20,
        category: "QUIZ",
        difficulty: "EASY"
      },
      {
        title: "En quelle année a commencé la Première Guerre mondiale ?",
        description: "Choisissez l'année correcte.",
        answers: ["1914", "1918", "1939", "1945"],
        correctAnswer: "1914",
        points: 25,
        category: "QUIZ",
        difficulty: "MEDIUM"
      },
      {
        title: "Qui a peint 'La Joconde' ?",
        description: "Identifiez l'artiste de ce célèbre tableau.",
        answers: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michel-Ange"],
        correctAnswer: "Leonardo da Vinci",
        points: 20,
        category: "QUIZ",
        difficulty: "EASY"
      },
      {
        title: "Quelle est la planète la plus proche du Soleil ?",
        description: "Choisissez la planète correcte.",
        answers: ["Vénus", "Terre", "Mars", "Mercure"],
        correctAnswer: "Mercure",
        points: 20,
        category: "QUIZ",
        difficulty: "MEDIUM"
      },
      {
        title: "Quelle est la plus grande océan du monde ?",
        description: "Choisissez l'océan le plus vaste.",
        answers: ["Atlantique", "Indien", "Arctique", "Pacifique"],
        correctAnswer: "Pacifique",
        points: 20,
        category: "QUIZ",
        difficulty: "EASY"
      },
      {
        title: "Combien de joueurs composent une équipe de football sur le terrain ?",
        description: "Nombre de joueurs par équipe.",
        answers: ["9", "10", "11", "12"],
        correctAnswer: "11",
        points: 15,
        category: "QUIZ",
        difficulty: "EASY"
      },
      {
        title: "Quel pays a remporté le plus de Coupes du Monde de football ?",
        description: "Choisissez le pays ayant gagné le plus de fois.",
        answers: ["Allemagne", "Italie", "Argentine", "Brésil"],
        correctAnswer: "Brésil",
        points: 25,
        category: "QUIZ",
        difficulty: "MEDIUM"
      },
      {
        title: "Quelle est la monnaie officielle du Japon ?",
        description: "Choisissez la devise utilisée au Japon.",
        answers: ["Yuan", "Won", "Yen", "Ringgit"],
        correctAnswer: "Yen",
        points: 20,
        category: "QUIZ",
        difficulty: "EASY"
      },
      {
        title: "Qui a écrit 'Roméo et Juliette' ?",
        description: "Identifiez l'auteur de cette célèbre pièce.",
        answers: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Victor Hugo"],
        correctAnswer: "William Shakespeare",
        points: 20,
        category: "QUIZ",
        difficulty: "EASY"
      },
      {
        title: "Quelle est la plus haute montagne du monde ?",
        description: "Choisissez le sommet le plus élevé.",
        answers: ["K2", "Mont Blanc", "Everest", "Kilimandjaro"],
        correctAnswer: "Everest",
        points: 15,
        category: "QUIZ",
        difficulty: "EASY"
      },
      {
        title: "Quelle est la langue la plus parlée au monde ?",
        description: "En nombre total de locuteurs (natifs et non-natifs).",
        answers: ["Anglais", "Espagnol", "Mandarin", "Hindi"],
        correctAnswer: "Anglais",
        points: 25,
        category: "QUIZ",
        difficulty: "MEDIUM"
      },
      {
        title: "Quel est le plus grand désert du monde ?",
        description: "Attention, tous les déserts ne sont pas chauds !",
        answers: ["Sahara", "Gobi", "Antarctique", "Kalahari"],
        correctAnswer: "Antarctique",
        points: 30,
        category: "QUIZ",
        difficulty: "HARD"
      },
      {
        title: "En quelle année l'homme a-t-il marché sur la Lune pour la première fois ?",
        description: "Date du premier alunissage humain.",
        answers: ["1965", "1969", "1971", "1975"],
        correctAnswer: "1969",
        points: 20,
        category: "QUIZ",
        difficulty: "MEDIUM"
      }
    ];
    
    // Récupérer les questions déjà posées pour éviter les doublons
    const askedQuestions = await AsyncStorage.getItem('@challengr_asked_quiz_questions');
    const askedIds = askedQuestions ? JSON.parse(askedQuestions) : [];
    
    // Filtrer pour ne pas répéter les questions récentes (si on a posé toutes les questions, on recommence)
    let availableQuestions = quizBank;
    if (askedIds.length < quizBank.length) {
      availableQuestions = quizBank.filter((q, index) => !askedIds.includes(index));
    }
    
    // Sélectionner une question aléatoire
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];
    
    // Trouver l'index original de la question dans quizBank
    const originalIndex = quizBank.findIndex(q => 
      q.title === selectedQuestion.title && q.correctAnswer === selectedQuestion.correctAnswer
    );
    
    // Mettre à jour la liste des questions posées
    let newAskedIds = [...askedIds, originalIndex];
    if (newAskedIds.length >= quizBank.length) {
      // Si on a posé toutes les questions, on réinitialise mais on garde les 3 dernières
      // pour éviter de poser immédiatement les mêmes questions
      newAskedIds = newAskedIds.slice(-3);
    }
    await AsyncStorage.setItem('@challengr_asked_quiz_questions', JSON.stringify(newAskedIds));
    
    // Créer l'objet question formaté
    return {
      id: generateUniqueId(),
      title: selectedQuestion.title,
      description: selectedQuestion.description,
      answers: selectedQuestion.answers,
      correctAnswer: selectedQuestion.correctAnswer,
      points: selectedQuestion.points,
      category: selectedQuestion.category,
      difficulty: selectedQuestion.difficulty,
      type: CHALLENGE_TYPES.QUIZ,
      completed: false,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur lors de la génération d\'une question de quiz:', error);
    return null;
  }
};
