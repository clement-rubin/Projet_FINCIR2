import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ImageBackground, 
  ScrollView, 
  Animated, 
  Alert,
  StatusBar,
  Image,
  Dimensions,
  Platform,
  SafeAreaView,
  Easing,
  TouchableWithoutFeedback,
  Modal,
  Linking,
  TextInput,
  ActivityIndicator,
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import haptics from '../utils/haptics';
// Fix the MapView import to work with react-native-maps v1.18.0
import MapView from 'react-native-maps';
import { Marker } from 'react-native-maps';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { 
  retrievePoints, 
  retrieveDailyTasks, 
  retrieveQuizTasks, 
  checkQuizAnswer, 
  retrieveTasks, 
  storePoints, 
  retrieveCategoryPoints,
  addCategoryPoints
} from '../utils/storage';
import ProgressBar from '../components/ProgressBar';
import Icon, { COLORS } from '../components/common/Icon';
import { SCREEN, calculateLevel, generateUniqueId, CHALLENGE_TYPES, CHALLENGE_CATEGORIES } from '../utils/constants';

const { width, height } = SCREEN;

// Ajoutez cette fonction utilitaire pour obtenir le temps restant jusqu'à minuit
const getTimeUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { hours, minutes, seconds };
};

export default function HomeScreen({ navigation }) {
  // États pour l'utilisateur
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0);
  const [dailyTask, setDailyTask] = useState(null);
  const [showReward, setShowReward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyChallengesCompleted, setDailyChallengesCompleted] = useState(0);
  const [nextChallengeTime, setNextChallengeTime] = useState(null);
  const [countdownTimer, setCountdownTimer] = useState(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  
  // Variable d'état pour les quiz
  const [dailyQuiz, setDailyQuiz] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [quizStreak, setQuizStreak] = useState(0);
  const [quizProgress, setQuizProgress] = useState(0);
  const [quizProgressTotal, setQuizProgressTotal] = useState(5); // Limite à 5 quiz/jour
  const [quizCooldown, setQuizCooldown] = useState(null);
  const [quizAnimation, setQuizAnimation] = useState(null);
  
  // Simplifier pour n'avoir qu'une seule question dans le quiz
  const generateRandomQuizQuestion = async () => {
    try {
      // Liste de questions quiz prédéfinies - avec plusieurs questions variées
      const quizQuestions = [
        {
          id: generateUniqueId(),
          title: "Quelle est la capitale de la France?",
          description: "Choisissez la bonne réponse parmi les options suivantes.",
          answers: ["Paris", "Londres", "Berlin", "Madrid"],
          correctAnswer: "Paris",
          points: 20,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Quel est l'élément chimique de symbole 'O' ?",
          description: "Choisissez l'élément correspondant au symbole.",
          answers: ["Or", "Osmium", "Oxygène", "Oganesson"],
          correctAnswer: "Oxygène",
          points: 20,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Combien de côtés a un hexagone?",
          description: "Un polygone régulier avec combien de côtés?",
          answers: ["5", "6", "7", "8"],
          correctAnswer: "6",
          points: 15,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Qui a peint 'La Joconde'?",
          description: "Identifiez l'artiste de ce célèbre tableau.",
          answers: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michel-Ange"],
          correctAnswer: "Leonardo da Vinci",
          points: 20,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Quelle est la planète la plus proche du Soleil?",
          description: "Choisissez la planète correcte.",
          answers: ["Vénus", "Terre", "Mars", "Mercure"],
          correctAnswer: "Mercure",
          points: 20,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Dans quel pays se trouve la ville de Marrakech ?",
          description: "Sélectionnez le pays correspondant.",
          answers: ["Maroc", "Égypte", "Espagne", "Turquie"],
          correctAnswer: "Maroc",
          points: 15,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Quel est le plus grand océan du monde ?",
          description: "Choisissez la bonne réponse.",
          answers: ["Océan Atlantique", "Océan Indien", "Océan Pacifique", "Océan Arctique"],
          correctAnswer: "Océan Pacifique",
          points: 15,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Qui a écrit 'Les Misérables' ?",
          description: "Sélectionnez l'auteur de ce roman célèbre.",
          answers: ["Victor Hugo", "Émile Zola", "Gustave Flaubert", "Molière"],
          correctAnswer: "Victor Hugo",
          points: 20,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Quelle est la langue officielle du Brésil ?",
          description: "Choisissez la langue officielle.",
          answers: ["Espagnol", "Portugais", "Français", "Anglais"],
          correctAnswer: "Portugais",
          points: 15,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Quel est l'animal terrestre le plus rapide ?",
          description: "Sélectionnez l'animal le plus rapide sur terre.",
          answers: ["Lion", "Guépard", "Antilope", "Léopard"],
          correctAnswer: "Guépard",
          points: 15,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Dans quelle ville se trouve la statue de la Liberté ?",
          description: "Sélectionnez la ville correcte.",
          answers: ["Paris", "Londres", "New York", "Los Angeles"],
          correctAnswer: "New York",
          points: 15,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Quel est le plus long fleuve du monde ?",
          description: "Choisissez le fleuve le plus long.",
          answers: ["Nil", "Amazone", "Yangtsé", "Mississippi"],
          correctAnswer: "Amazone",
          points: 20,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Qui a inventé l'ampoule électrique ?",
          description: "Sélectionnez l'inventeur célèbre.",
          answers: ["Nikola Tesla", "Thomas Edison", "Benjamin Franklin", "Isaac Newton"],
          correctAnswer: "Thomas Edison",
          points: 15,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Quel pays a remporté la Coupe du Monde de football 2018 ?",
          description: "Sélectionnez le pays vainqueur.",
          answers: ["Brésil", "Allemagne", "France", "Argentine"],
          correctAnswer: "France",
          points: 15,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Quelle est la monnaie officielle du Japon ?",
          description: "Choisissez la bonne monnaie.",
          answers: ["Yuan", "Won", "Yen", "Dollar"],
          correctAnswer: "Yen",
          points: 15,
          type: "QUIZ"
        },
        {
          id: generateUniqueId(),
          title: "Quel scientifique a développé la théorie de la relativité ?",
          description: "Sélectionnez le bon scientifique.",
          answers: ["Isaac Newton", "Albert Einstein", "Galilée", "Marie Curie"],
          correctAnswer: "Albert Einstein",
          points: 20,
          type: "QUIZ"
        }
      ];
      
      // Récupérer les questions déjà posées récemment
      const recentQuestionsJson = await AsyncStorage.getItem('@challengr_recent_quiz_questions');
      let recentQuestions = [];
      if (recentQuestionsJson) {
        recentQuestions = JSON.parse(recentQuestionsJson);
      }
      
      // Filtrer les questions disponibles (pour éviter la répétition)
      let availableQuestions = quizQuestions;
      if (recentQuestions.length > 0 && recentQuestions.length < quizQuestions.length) {
        availableQuestions = quizQuestions.filter(q => !recentQuestions.includes(q.title));
      }
      
      // Sélectionner une question aléatoire
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const selectedQuestion = availableQuestions[randomIndex];
      
      // Enregistrer cette question comme posée récemment
      let updatedRecentQuestions = [...recentQuestions, selectedQuestion.title];
      // Si toutes les questions ont été posées, ne garder que les 2 dernières
      if (updatedRecentQuestions.length >= quizQuestions.length) {
        updatedRecentQuestions = updatedRecentQuestions.slice(-2);
      }
      await AsyncStorage.setItem('@challengr_recent_quiz_questions', JSON.stringify(updatedRecentQuestions));
      
      // Créer un objet question avec un ID unique
      const question = {
        ...selectedQuestion,
        id: generateUniqueId() // Assure un ID unique à chaque question
      };
      
      return question;
    } catch (error) {
      console.error('Erreur lors de la génération d\'une question de quiz:', error);
      return null;
    }
  };
  
  // Charger la question de quiz quotidienne et les statistiques
  const loadDailyQuiz = async () => {
    try {
      // Vérifier d'abord s'il y a un cooldown actif
      const cooldownData = await AsyncStorage.getItem('@challengr_quiz_cooldown');
      if (cooldownData) {
        const { until, remainingTime } = JSON.parse(cooldownData);
        const now = new Date().getTime();
        if (now < until) {
          setQuizCooldown({
            until,
            remainingTime: Math.floor((until - now) / 1000)
          });
          startQuizCooldownTimer(until);
          return;
        } else {
          await AsyncStorage.removeItem('@challengr_quiz_cooldown');
        }
      }

      // Charger les statistiques du quiz
      const statsData = await AsyncStorage.getItem('@challengr_quiz_stats');
      if (statsData) {
        const stats = JSON.parse(statsData);
        setQuizStreak(stats.streak || 0);
        setQuizProgress(stats.progress || 0);
        setQuizProgressTotal(5); // Toujours 5 quiz max/jour

        // Si déjà 5 quiz sont faits, activer le cooldown jusqu'à minuit
        if ((stats.progress || 0) >= 5) {
          const now = new Date();
          const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
          const until = tomorrow.getTime();
          const cooldown = {
            until,
            remainingTime: Math.floor((until - now.getTime()) / 1000)
          };
          await AsyncStorage.setItem('@challengr_quiz_cooldown', JSON.stringify(cooldown));
          setQuizCooldown(cooldown);
          startQuizCooldownTimer(until);
          return;
        }
      }
      
      // Récupérer la question du jour
      const quizTasks = await (typeof retrieveQuizTasks === 'function' ? retrieveQuizTasks() : Promise.resolve([])) || [];
      if (quizTasks.length > 0) {
        setDailyQuiz(quizTasks[0]);
      } else {
        setDailyQuiz(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du quiz quotidien:', error);
      setDailyQuiz(null);
    }
  };
  
  // Démarrer le compte à rebours du cooldown
  const startQuizCooldownTimer = (endTime) => {
    // Nettoyer d'abord tout timer existant
    if (quizCooldown && quizCooldown.timerId) {
      clearInterval(quizCooldown.timerId);
    }
    
    // Créer un nouveau timer qui met à jour toutes les secondes
    const timerId = setInterval(() => {
      const now = new Date().getTime();
      const remainingTime = Math.floor((endTime - now) / 1000);
      
      if (remainingTime <= 0) {
        // Le temps est écoulé, arrêter le timer et recharger le quiz
        clearInterval(timerId);
        setQuizCooldown(null);
        loadDailyQuiz();
      } else {
        // Mettre à jour le temps restant
        setQuizCooldown(prev => ({
          ...prev,
          remainingTime
        }));
      }
    }, 1000);
    
    // Stocker l'ID du timer pour pouvoir le nettoyer plus tard
    setQuizCooldown(prev => ({
      ...prev,
      timerId
    }));
  };
  
  // Gérer la soumission d'une réponse au quiz - simplifier cette logique
  const handleQuizSubmit = async () => {
    try {
      if (!selectedAnswer || !dailyQuiz) return;
      
      // Vérification manuelle de la réponse (plus fiable que l'appel API)
      const isCorrect = selectedAnswer === dailyQuiz.correctAnswer;
      
      // Créer un résultat basé sur la vérification locale
      const result = {
        isCorrect,
        correctAnswer: dailyQuiz.correctAnswer,
        message: isCorrect ? 
          `Bonne réponse ! Vous avez gagné ${dailyQuiz.points} points.` :
          `Mauvaise réponse. La bonne réponse était: ${dailyQuiz.correctAnswer}`
      };
      
      setQuizResult(result);
      
      if (isCorrect) {
        // Réponse correcte - animation et points
        try {
          haptics.notificationAsync('success');
        } catch (err) {
          console.warn('Haptics error:', err);
        }
        
        setQuizAnimation('correct');
        
        // Ajouter les points
        const newPoints = points + dailyQuiz.points;
        await storePoints(newPoints);
        setPoints(newPoints);
        
        // Mis à jour des statistiques
        const statsData = await AsyncStorage.getItem('@challengr_quiz_stats');
        const stats = statsData ? JSON.parse(statsData) : { streak: 0, progress: 0, total: 5 };
        stats.streak += 1;
        stats.progress += 1;
        stats.total = 5; // Toujours 5 quiz max/jour
        await AsyncStorage.setItem('@challengr_quiz_stats', JSON.stringify(stats));
        setQuizStreak(stats.streak);
        setQuizProgress(stats.progress);

        // Si on atteint 5 quiz, célébration puis cooldown
        if (stats.progress >= 5) {
          // Montrer l'animation de récompense (victoire) comme pour les autres questions
          showRewardAnimation();

          // Attendre la célébration puis activer le cooldown et afficher la page "Challenge réussi"
          setTimeout(async () => {
            setQuizAnimation(null);
            setSelectedAnswer(null);
            setQuizResult(null);

            // Activer le cooldown jusqu'à minuit
            const now = new Date();
            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
            const until = tomorrow.getTime();
            const cooldown = {
              until,
              remainingTime: Math.floor((until - now.getTime()) / 1000)
            };
            await AsyncStorage.setItem('@challengr_quiz_cooldown', JSON.stringify(cooldown));
            setQuizCooldown(cooldown);
            startQuizCooldownTimer(until);
          }, 1500); // même délai que pour les autres questions
          return;
        }
        
        // Montrer l'animation de récompense
        showRewardAnimation();
        
        // Charger une nouvelle question après un délai
        setTimeout(() => {
          setQuizAnimation(null);
          setSelectedAnswer(null);
          setQuizResult(null);
          loadNextQuizQuestion();
        }, 1500);
      } else {
        // Réponse incorrecte
        try {
          haptics.notificationAsync('error');
        } catch (err) {
          console.warn('Haptics error:', err);
        }
        
        setQuizAnimation('incorrect');
        
        // Permettre de réessayer après un court délai
        setTimeout(() => {
          setQuizAnimation(null);
          setSelectedAnswer(null);
          setQuizResult(null);
        }, 1500);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la réponse:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la vérification de votre réponse.');
      setSelectedAnswer(null);
      setQuizResult(null);
    }
  };
  
  // Charger la question suivante - Optimisation de cette fonction
  const loadNextQuizQuestion = async () => {
    try {
      // Générer une nouvelle question
      const newQuestion = await generateRandomQuizQuestion();
      
      if (newQuestion) {
        // Assurons-nous que la question a un ID unique
        if (!newQuestion.id) {
          newQuestion.id = generateUniqueId();
        }
        setDailyQuiz(newQuestion);
      } else {
        // Si on ne peut pas générer de nouvelle question, créer une question de secours
        const fallbackQuestion = {
          id: generateUniqueId(),
          title: "Quelle planète est connue comme la 'planète rouge'?",
          description: "Une question d'astronomie pour vous!",
          answers: ["Vénus", "Mars", "Jupiter", "Mercure"],
          correctAnswer: "Mars",
          points: 25,
          type: "QUIZ"
        };
        setDailyQuiz(fallbackQuestion);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la prochaine question:', error);
      Alert.alert('Erreur', 'Impossible de charger la prochaine question.');
    }
  };
  
  // Fonction pour mélanger un tableau (pour les réponses)
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };
  
  // Fonction pour formater le temps de cooldown en heures:minutes:secondes
  const formatCooldownTime = (seconds) => {
    if (!seconds) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // États pour la fonctionnalité de carte
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [nearbyChallenges, setNearbyChallenges] = useState([]);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState('undetermined');
  
  // État pour le défi sélectionné et les informations de route
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  
  // État pour contrôler l'opacité de la barre de navigation
  const [scrollY] = useState(new Animated.Value(0));
  const navBarOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  // États des animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const statCardAnim1 = useRef(new Animated.Value(SCREEN.width)).current;
  const statCardAnim2 = useRef(new Animated.Value(SCREEN.width)).current;
  const levelCardAnim = useRef(new Animated.Value(0.8)).current;
  const levelCardOpacity = useRef(new Animated.Value(0)).current;
  const actionButtonsAnim = useRef(new Animated.Value(30)).current;
  const actionButtonsOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rewardScaleAnim = useRef(new Animated.Value(0.8)).current;
  const rewardOpacityAnim = useRef(new Animated.Value(0)).current;

  // State for managing selected activity for map navigation
  const [activityToNavigate, setActivityToNavigate] = useState(null);

  // Charger les données utilisateur
  useEffect(() => {
    async function init() {
      await loadUserData();
      // Déplacer les animations après le chargement des données
      startAnimations();
      startPulseAnimation();
      // Charger un défi quotidien pour l'afficher en évidence
      await loadDailyChallenge();
      // Charger la question de quiz quotidienne
      await loadDailyQuiz();
      // Charger le nombre de défis complétés et le temps du prochain défi
      await loadChallengeCompletion();
    }
    init();
  }, []);

  // Recharge les points et le défi du jour à chaque focus de l'écran
  useFocusEffect(
    React.useCallback(() => {
      async function refreshData() {
        await loadUserData();
        await loadDailyChallenge();
      }
      refreshData();
      
      return () => {
        // Nettoyage : annuler toutes les requêtes en cours si nécessaire
      };
    }, [])
  );

  // Animation de pulsation continue pour attirer l'attention
  const startPulseAnimation = () => {
    // Éviter les mises à jour planifiées depuis les effets d'insertion
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ).start();
    }, 0);
  };
  // Charger les points et calculer le niveau
  const loadUserData = async () => {
    try {
      // Correction : Ne jamais remettre à zéro les points ici !
      const userPoints = await retrievePoints() || 0;
      setPoints(userPoints);

      // Utiliser la fonction de calcul de niveau centralisée
      const levelInfo = calculateLevel(userPoints);
      setLevel(levelInfo.level);
      setProgress(levelInfo.progress);
      
      // Charger les points par catégorie
      await calculateCategoryPoints();
    } catch (error) {
      console.error('Erreur lors du chargement des points utilisateur:', error);
      Alert.alert('Erreur', 'Impossible de charger les données utilisateur.');
    }
  };

  // Charger un défi quotidien
  const loadDailyChallenge = async () => {
    try {
      let dailyTasks = await retrieveDailyTasks() || [];
      // Si aucun défi n'est trouvé, attendre la génération puis recharger
      if (!dailyTasks || dailyTasks.length === 0) {
        // Attendre un court instant pour laisser le temps à la génération asynchrone
        await new Promise(res => setTimeout(res, 300));
        dailyTasks = await retrieveDailyTasks() || [];
      }
      if (dailyTasks.length > 0) {
        // Prendre le premier défi non complété, ou le premier défi s'ils sont tous complétés
        const task = dailyTasks.find(task => !task.completed) || dailyTasks[0];
        setDailyTask(task);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du défi quotidien:', error);
    }
  };

  // Rafraîchir le défi du jour
  const refreshDailyChallenge = async () => {
    try {
      setIsLoading(true);
      // Animation pour indiquer le rafraîchissement
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();

      // Forcer la génération de nouveaux défis quotidiens
      // Ceci contourne la vérification quotidienne dans storage.js
      const newTasks = await generateNewDailyTask();
      
      // Si de nouveaux défis ont été générés, mettre à jour l'interface
      if (newTasks && newTasks.length > 0) {
        // Choisir un défi aléatoire parmi les nouveaux défis
        const randomIndex = Math.floor(Math.random() * newTasks.length);
        setDailyTask(newTasks[randomIndex]);
      } else {
        // Si aucun nouveau défi n'a pu être généré, utiliser la fonction de secours
        // pour sélectionner un défi différent parmi les existants
        const dailyTasks = await retrieveDailyTasks() || [];
        if (dailyTasks.length > 0) {
          // Exclure le défi actuel si possible
          let availableTasks = dailyTask 
            ? dailyTasks.filter(task => task.id !== dailyTask.id)
            : dailyTasks;

          // Si après filtrage il n'y a plus de tâches, utiliser toutes les tâches
          if (availableTasks.length === 0) {
            availableTasks = dailyTasks;
          }

          // Sélectionner un défi aléatoire
          const randomIndex = Math.floor(Math.random() * availableTasks.length);
          setDailyTask(availableTasks[randomIndex]);
        }
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du défi quotidien:', error);
      Alert.alert(
        'Erreur',
        'Impossible de rafraîchir le défi du jour. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Générer un nouveau défi quotidien
  const generateNewDailyTask = async () => {
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
        title: "Contacter un ami",
        description: "Maintenez vos liens sociaux",
        points: 20,
        difficulty: "EASY",
        category: "SOCIAL"
      },
      {
        title: "Ranger votre espace",
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
        title: "Planifier votre journée de demain",
        description: "Organisez-vous pour être plus efficace",
        points: 15,
        difficulty: "EASY",
        category: "PRODUCTIVITY"
      },
      {
        title: "Faire 50 pompes ou squats",
        description: "Défi sportif du jour!",
        points: 40,
        difficulty: "HARD",
        category: "FITNESS"
      },
      {
        title: "Prendre 10 minutes de soleil",
        description: "Profitez de la vitamine D naturelle",
        points: 15,
        difficulty: "EASY",
        category: "WELLBEING"
      },
      {
        title: "Réduire votre temps d'écran",
        description: "Passez au moins 2h sans écran aujourd'hui",
        points: 30,
        difficulty: "MEDIUM",
        category: "WELLBEING"
      },
      {
        title: "Cuisiner un repas équilibré",
        description: "Prenez soin de votre alimentation",
        points: 25,
        difficulty: "MEDIUM",
        category: "NUTRITION"
      },
      {
        title: "Faire du yoga",
        description: "15 minutes de stretching ou yoga",
        points: 25,
        difficulty: "MEDIUM",
        category: "FITNESS"
      }
    ];
    
    try {
      // Sélectionner un défi quotidien aléatoire différent du défi actuel
      const selectedIndices = new Set();
      // Si un défi actuel existe, trouver son index pour l'exclure
      let currentTaskIndex = -1;
      if (dailyTask) {
        currentTaskIndex = possibleDailyTasks.findIndex(
          task => task.title === dailyTask.title
        );
      }
      
      // Sélectionner un défi aléatoire (différent de l'actuel si possible)
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * possibleDailyTasks.length);
      } while (randomIndex === currentTaskIndex && possibleDailyTasks.length > 1);
      
      selectedIndices.add(randomIndex);
      
      // Créer le nouveau défi quotidien
      const newDailyTasks = Array.from(selectedIndices).map(index => {
        const task = possibleDailyTasks[index];
        return {
          id: generateUniqueId(), // Assurez-vous que cette fonction est importée
          title: task.title,
          description: task.description,
          points: task.points,
          difficulty: task.difficulty,
          category: task.category,
          type: "DAILY", // Assurez-vous que ce type est défini
          completed: false,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
        };
      });
      
      // Récupérer les défis quotidiens actuels
      const currentDailyTasks = await AsyncStorage.getItem('@challengr_daily_tasks');
      let dailyTasks = [];
      
      if (currentDailyTasks) {
        dailyTasks = JSON.parse(currentDailyTasks);
      }
      
      // Ajouter le nouveau défi et conserver les autres
      const updatedDailyTasks = [...dailyTasks, ...newDailyTasks];
      
      // Limiter à maximum 5 défis quotidiens pour éviter trop de défis
      const limitedDailyTasks = updatedDailyTasks.slice(-5); 
      
      // Sauvegarder les défis mis à jour
      await AsyncStorage.setItem('@challengr_daily_tasks', JSON.stringify(limitedDailyTasks));
      
      return newDailyTasks;
    } catch (error) {
      console.error('Erreur lors de la génération d\'un nouveau défi quotidien:', error);
      return null;
    }
  };

  // Charger les informations sur les défis complétés et le délai
  const loadChallengeCompletion = async () => {
    try {
      // Récupérer le nombre de défis complétés aujourd'hui
      const dailyCompletedJson = await AsyncStorage.getItem('@challengr_daily_completed');
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      if (dailyCompletedJson) {
        const dailyCompleted = JSON.parse(dailyCompletedJson);

        // Vérifier si les informations correspondent à aujourd'hui
        if (dailyCompleted.date === today) {
          setDailyChallengesCompleted(dailyCompleted.count || 0);
          // Désactive le bouton uniquement si 2 défis sont complétés
          setIsButtonDisabled((dailyCompleted.count || 0) >= 2);
          setNextChallengeTime(null);
        } else {
          // C'est un nouveau jour, réinitialiser le compteur
          resetDailyCompletionCounter();
        }
      } else {
        // Première utilisation, initialiser le compteur
        resetDailyCompletionCounter();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des défis complétés:', error);
    }
  };
  
  // Réinitialiser le compteur de défis quotidiens
  const resetDailyCompletionCounter = async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      const dailyCompleted = {
        date: today,
        count: 0,
        nextChallengeTime: null
      };
      
      await AsyncStorage.setItem('@challengr_daily_completed', JSON.stringify(dailyCompleted));
      setDailyChallengesCompleted(0);
      setNextChallengeTime(null);
      setIsButtonDisabled(false);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du compteur:', error);
    }
  };
  
  // Supprime toute logique de délai/attente
  const updateChallengeCompletion = async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      // Récupérer les informations actuelles
      const dailyCompletedJson = await AsyncStorage.getItem('@challengr_daily_completed');
      let dailyCompleted = {
        date: today,
        count: 0,
        nextChallengeTime: null
      };
      
      if (dailyCompletedJson) {
        dailyCompleted = JSON.parse(dailyCompletedJson);
        
        // Vérifier si les informations correspondent à aujourd'hui
        if (dailyCompleted.date !== today) {
          dailyCompleted = {
            date: today,
            count: 0,
            nextChallengeTime: null
          };
        }
      }
      
      // Incrémenter le compteur
      const newCount = dailyCompleted.count + 1;
      dailyCompleted.count = newCount;
      setDailyChallengesCompleted(newCount);

      // Désactive le bouton uniquement si 2 défis sont complétés
      if (newCount >= 2) {
        setIsButtonDisabled(true);
      } else {
        setIsButtonDisabled(false);
      }
      setNextChallengeTime(null);

      // Sauvegarder les informations mises à jour
      await AsyncStorage.setItem('@challengr_daily_completed', JSON.stringify(dailyCompleted));
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour des défis complétés:', error);
    }
  };

  // Demander l'autorisation de localisation
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status);
      
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(location);
        loadNearbyChallenges(location.coords);
      } else {
        setErrorMsg('Permission de localisation non accordée');
        Alert.alert(
          "Localisation requise",
          "Pour découvrir les défis autour de vous, vous devez autoriser l'accès à votre position.",
          [{ text: "OK", onPress: () => console.log("Permission refusée") }]
        );
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission de localisation:', error);
      setErrorMsg('Impossible d\'accéder à la localisation');
    }
  };

  // Charger les défis à proximité
  const loadNearbyChallenges = (coords) => {
    // Simuler des défis à proximité avec des coordonnées générées aléatoirement autour de l'utilisateur
    const mockChallenges = generateMockChallengesAroundLocation(coords);
    setNearbyChallenges(mockChallenges);
  };

  // Générer des défis fictifs autour de la position de l'utilisateur
  const generateMockChallengesAroundLocation = (coords) => {
    // Créer des défis mock avec des positions aléatoires dans un rayon de 5km
    const challenges = [];
    const challengeTypes = [
      { title: "Course matinale", description: "Faites un jogging de 2km", points: 30, category: "FITNESS" },
      { title: "Visite culturelle", description: "Visitez un monument historique", points: 25, category: "CULTURE" },
      { title: "Détox digitale", description: "Profitez de la nature sans smartphone pendant 1h", points: 20, category: "WELLBEING" },
      { title: "Déjeuner healthy", description: "Mangez dans un restaurant bio", points: 15, category: "NUTRITION" },
      { title: "Photographe urbain", description: "Prenez 5 photos créatives de la ville", points: 20, category: "CREATIVITY" }
    ];

    // Générer 5 défis aléatoires autour de l'utilisateur
    for (let i = 0; i < 5; i++) {
      // Générer une position aléatoire dans un rayon de 5km
      const randomDistance = Math.random() * 5 * 1000; // Distance en mètres
      const randomAngle = Math.random() * 2 * Math.PI; // Angle en radians
      
      // Calculer les deltas approximatifs (cette méthode est simplifiée, non précise pour de grandes distances)
      const latOffset = randomDistance / 111000 * Math.cos(randomAngle);
      const lngOffset = randomDistance / (111000 * Math.cos(coords.latitude * Math.PI / 180)) * Math.sin(randomAngle);
      
      // Sélectionner un type de défi aléatoire
      const challenge = { ...challengeTypes[Math.floor(Math.random() * challengeTypes.length)] };
      
      // Ajouter des coordonnées et un identifiant unique
      challenge.id = `challenge-${i}-${Date.now()}`;
      challenge.latitude = coords.latitude + latOffset;
      challenge.longitude = coords.longitude + lngOffset;
      challenge.distance = Math.round(randomDistance) / 1000; // Distance en km
      
      challenges.push(challenge);
    }
    
    return challenges;
  };

  // Gérer l'ouverture de la modal de carte
  const handleOpenMapModal = async () => {
    if (locationPermissionStatus !== 'granted') {
      await requestLocationPermission();
    }
    if (locationPermissionStatus === 'granted') {
      if (!location) {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation(currentLocation);
          loadNearbyChallenges(currentLocation.coords);
        } catch (error) {
          console.error('Erreur lors de la récupération de la localisation:', error);
          Alert.alert(
            "Erreur",
            "Impossible de récupérer votre position. Veuillez réessayer.",
            [{ text: "OK" }]
          );
          return;
        }
      }
      setShowMapModal(true);
    } else {
      Alert.alert(
        "Localisation requise",
        "Pour accéder à la carte, vous devez autoriser l'accès à votre position.",
        [{ text: "OK" }]
      );
    }
  };

  // Fermer la modal de carte
  const handleCloseMapModal = () => {
    setShowMapModal(false);
  };

  // Lancer les animations
  const startAnimations = () => {
    // Éviter les mises à jour planifiées depuis les effets d'insertion
    setTimeout(() => {
      Animated.sequence([
        // Animation d'introduction du titre
        Animated.parallel([
          Animated.timing(fadeAnim, { 
            toValue: 1, 
            duration: 800, 
            useNativeDriver: true 
          }),
          Animated.timing(slideAnim, { 
            toValue: 0, 
            duration: 800, 
            useNativeDriver: true 
          }),
      ]),

        // Animation des cartes de statistiques
        Animated.stagger(150, [
          Animated.spring(statCardAnim1, { 
            toValue: 0, 
            friction: 8, 
            useNativeDriver: true 
          }),
          Animated.spring(statCardAnim2, { 
            toValue: 0, 
            friction: 8, 
            useNativeDriver: true 
          }),
        ]),

        // Animation de la carte de niveau
        Animated.parallel([
          Animated.timing(levelCardOpacity, { 
            toValue: 1, 
            duration: 400, 
            useNativeDriver: true 
          }),
          Animated.spring(levelCardAnim, { 
            toValue: 1, 
            friction: 8, 
            useNativeDriver: true 
          }),
        ]),

        // Animation des boutons d'action rapides
        Animated.parallel([
          Animated.timing(actionButtonsOpacity, { 
            toValue: 1, 
            duration: 400, 
            useNativeDriver: true 
          }),
          Animated.spring(actionButtonsAnim, { 
            toValue: 0, 
            friction: 8, 
            useNativeDriver: true 
          }),
        ]),
      ]).start();
    }, 0);
  };

  // Animation de récompense surprise
  const showRewardAnimation = () => {
    setShowReward(true);
    Animated.parallel([
      Animated.spring(rewardScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true
      }),
      Animated.timing(rewardOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  };

  const hideReward = () => {
    Animated.parallel([
      Animated.timing(rewardOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(rewardScaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => setShowReward(false));
  };

  // Simuler la complétion d'un défi
  const handleCompleteChallenge = async () => {
    // Désactive le bouton uniquement si 2 défis sont complétés
    if (isButtonDisabled) {
      Alert.alert(
        "Limite atteinte",
        "Vous avez déjà complété 2 défis aujourd'hui. Revenez demain pour de nouveaux défis!",
        [{ text: "Compris" }]
      );
      return;
    }

    try {
      // Récupérer les défis quotidiens actuels
      const dailyTasksJson = await AsyncStorage.getItem('@challengr_daily_tasks');
      if (!dailyTasksJson) return;
      
      let dailyTasks = JSON.parse(dailyTasksJson);
      
      // Trouver le défi actuel et le marquer comme complété
      const updatedTasks = dailyTasks.map(task => 
        task.id === dailyTask.id ? { ...task, completed: true } : task
      );
      
      // Mettre à jour le défi local
      const updatedTask = { ...dailyTask, completed: true };
      setDailyTask(updatedTask);
      
      // Sauvegarder les défis mis à jour
      await AsyncStorage.setItem('@challengr_daily_tasks', JSON.stringify(updatedTasks));
      
      // Ajouter les points à l'utilisateur
      const currentPoints = await retrievePoints() || 0;
      const newPoints = currentPoints + dailyTask.points;
      await storePoints(newPoints); // <-- Utilisez la fonction utilitaire standard
      setPoints(newPoints);
        // Ajouter les points à la catégorie
      if (dailyTask.category) {
        try {
          await addCategoryPoints(dailyTask.category, dailyTask.points);
          // Recalculer les points par catégorie pour mettre à jour l'affichage
          await calculateCategoryPoints();
        } catch (error) {
          console.error("Erreur lors de l'ajout des points à la catégorie:", error);
          // Continuer malgré l'erreur pour ne pas bloquer le processus de validation
        }
      }
      
      // Recalculer le niveau
      const levelInfo = calculateLevel(newPoints);
      setLevel(levelInfo.level);
      setProgress(levelInfo.progress);
      
      // Mettre à jour le compteur de défis complétés et appliquer le délai
      await updateChallengeCompletion();
      
      // Animation de surprise pour l'utilisateur
      showRewardAnimation();
    } catch (error) {
      console.error('Erreur lors de la complétion du défi:', error);
      Alert.alert(
        "Erreur",
        "Une erreur s'est produite lors de la complétion du défi. Veuillez réessayer.",
        [{ text: "OK" }]
      );
    }
  };

  // Calculer le temps estimé pour atteindre le défi
  const calculateRouteInfo = (challenge) => {
    if (!location || !challenge) return null;

    // Vitesse moyenne de marche en km/h
    const walkingSpeed = 5;
    
    // Distance en km
    const distance = challenge.distance;
    
    // Temps en minutes (distance / vitesse en km/h * 60)
    const duration = Math.round((distance / walkingSpeed) * 60);
    
    return {
      distance,
      duration,
      mode: 'walking'
    };
  };

  // Sélectionner un défi et calculer la route
  const handleSelectChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    const routeDetails = calculateRouteInfo(challenge);
    setRouteInfo(routeDetails);
  };

  // Ouvrir l'application de cartographie native avec itinéraire
  const openMapsWithDirections = () => {
    if (!location || !selectedChallenge) return;

    const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
    const url = `${scheme}0,0?q=${selectedChallenge.latitude},${selectedChallenge.longitude}(${selectedChallenge.title})`;
    
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert(
            "Erreur",
            "Impossible d'ouvrir l'application de cartographie.",
            [{ text: "OK" }]
          );
        }
      })
      .catch(err => console.error('Erreur lors de l\'ouverture de la carte:', err));
  };

  // Custom callout component to replace the missing Callout from react-native-maps
  const CustomCallout = ({ children, visible, onClose }) => {
    if (!visible) return null;
    return (
      <View style={styles.callout}>
        {children}
        <TouchableOpacity style={styles.calloutCloseButton} onPress={onClose}>
          <Icon name="close" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  // Ensure the newActivity coordinate is properly initialized and validated
  const [newActivity, setNewActivity] = useState({
    title: "Nouvelle activité",
    description: "",
    coordinate: null, // Initialize as null to avoid errors
  });

  // State for managing selected point details
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Function to handle selecting a point (existing or new)
  const handleSelectPoint = (point) => {
    setSelectedPoint(point);
  };

  // Function to handle saving changes to a point
  const handleSavePoint = async () => {
    if (!selectedPoint) return;

    try {
      const updatedChallenges = nearbyChallenges.map((challenge) =>
        challenge.id === selectedPoint.id ? selectedPoint : challenge
      );
      setNearbyChallenges(updatedChallenges);

      // Save updated challenges to AsyncStorage if it's a custom point
      if (selectedPoint.category === "CUSTOM") {
        await AsyncStorage.setItem('@custom_challenges', JSON.stringify(updatedChallenges));
      }

      Alert.alert("Succès", "Les modifications ont été enregistrées !");
      setSelectedPoint(null);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du point :", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications.");
    }
  };

  // Function to navigate to a point's location
  const navigateToPoint = (point) => {
    if (!point) return;

    const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
    const url = `${scheme}0,0?q=${point.latitude},${point.longitude}(${point.title})`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert("Erreur", "Impossible d'ouvrir l'application de cartographie.");
        }
      })
      .catch((err) => console.error("Erreur lors de l'ouverture de la carte :", err));
  };

  // Charger les défis personnalisés depuis AsyncStorage
  const loadCustomChallenges = async () => {
    try {
      const savedChallenges = await AsyncStorage.getItem('@custom_challenges');
      if (savedChallenges) {
        setNearbyChallenges((prevChallenges) => [
          ...prevChallenges,
          ...JSON.parse(savedChallenges),
        ]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des défis personnalisés :", error);
    }
  };

  // Call loadCustomChallenges when the component mounts
  useEffect(() => {
    loadCustomChallenges();
  }, []);

  // Function to handle adding a new challenge
  const handleAddChallenge = async () => {
    if (!newActivity.coordinate) {
      Alert.alert("Erreur", "Veuillez sélectionner un emplacement sur la carte.");
      return;
    }

    try {
      const newChallenge = {
        id: generateUniqueId(),
        title: newActivity.title,
        description: newActivity.description || "Description de l'activité",
        points: 10,
        difficulty: "EASY",
        category: "CUSTOM",
        latitude: newActivity.coordinate.latitude,
        longitude: newActivity.coordinate.longitude,
        distance: 0, // Distance is irrelevant for custom challenges
      };

      // Add the new challenge to the list of nearby challenges
      setNearbyChallenges((prevChallenges) => [...prevChallenges, newChallenge]);

      // Optionally save the new challenge to AsyncStorage
      const savedChallenges = await AsyncStorage.getItem('@custom_challenges');
      const challenges = savedChallenges ? JSON.parse(savedChallenges) : [];
      challenges.push(newChallenge);
      await AsyncStorage.setItem('@custom_challenges', JSON.stringify(challenges));

      Alert.alert("Succès", "Nouvelle activité ajoutée à la carte !");
      setNewActivity({ title: "Nouvelle activité", description: "", coordinate: null });
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'activité :", error);
      Alert.alert("Erreur", "Impossible d'ajouter l'activité.");
    }
  };

  // Function to navigate to a selected activity using GPS
  const navigateToActivity = (activity) => {
    if (!activity) return;

    const lat = activity.latitude;
    const lng = activity.longitude;
    const label = encodeURIComponent(activity.title);

    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${lat},${lng}&q=${label}`
        : `geo:0,0?q=${lat},${lng}(${label})`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert("Erreur", "Impossible d'ouvrir l'application de cartographie.");
        }
      })
      .catch((err) => console.error("Erreur lors de l'ouverture de la carte :", err));
  };

  // Dictionnaire pour traduire les catégories en français
const CATEGORY_LABELS_FR = {
  FITNESS: "Sport",
  MINDFULNESS: "Méditation",
  LEARNING: "Lecture / Apprentissage",
  SOCIAL: "Social",
  PRODUCTIVITY: "Productivité",
  CREATIVITY: "Créativité",
  WELLBEING: "Bien-être",
  NUTRITION: "Nutrition",
  CULTURE: "Culture",
  QUIZ: "Question du jour",
  "QUESTION DU JOUR": "Question du jour",
  CUSTOM: "Personnalisé",
  AUTRE: "Autre"
};

  // Ajoutez un état pour le timer jusqu'à minuit
  const [midnightTimer, setMidnightTimer] = useState(getTimeUntilMidnight());

  // Mettez à jour le timer chaque seconde si la limite est atteinte
  useEffect(() => {
    if (isButtonDisabled) {
      const interval = setInterval(() => {
        setMidnightTimer(getTimeUntilMidnight());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isButtonDisabled]);

  // Ajout pour la modale de détail de progression
  const [showProgressDetail, setShowProgressDetail] = useState(false);
  const [categoryPoints, setCategoryPoints] = useState({});
  const [categoryTotal, setCategoryTotal] = useState(0);
  // Fonction utilitaire pour calculer les points par catégorie
  const calculateCategoryPoints = async () => {
    try {
      // Récupérer les points par catégorie depuis AsyncStorage
      const categoryPointsData = await retrieveCategoryPoints();
      
      if (Object.keys(categoryPointsData).length > 0) {
        // Si nous avons des données, les utiliser directement
        setCategoryPoints(categoryPointsData);
        
        // Calculer le total des points
        const total = Object.values(categoryPointsData).reduce((sum, points) => sum + points, 0);
        setCategoryTotal(total);
      } else {
        // Sinon, faire comme avant: calculer les points à partir des tâches complétées
        // Récupérer toutes les tâches (standards, quotidiennes)
        const [allTasks, dailyTasks, quizTasks] = await Promise.all([
          retrieveTasks ? retrieveTasks() : [],
          retrieveDailyTasks ? retrieveDailyTasks() : [],
          retrieveQuizTasks ? retrieveQuizTasks() : [],
        ]);
        // Prendre toutes les tâches complétées (standards + quotidiennes)
        const completedTasks = [...(allTasks || []), ...(dailyTasks || [])].filter(t => t.completed);

        // Calcul des points par catégorie pour les tâches
        const pointsByCategory = {};
        let total = 0;
        completedTasks.forEach(task => {
          const cat = task.category || 'AUTRE';
          pointsByCategory[cat] = (pointsByCategory[cat] || 0) + (task.points || 0);
          total += (task.points || 0);
        });

        // Ajouter les points des quiz complétés sous la catégorie "QUESTION DU JOUR"
        if (quizTasks && Array.isArray(quizTasks)) {
          quizTasks.forEach(q => {
            if (q.completed) {
              const cat = 'QUESTION DU JOUR';
              pointsByCategory[cat] = (pointsByCategory[cat] || 0) + (q.points || 0);
              total += (q.points || 0);
            }
          });
        }

        setCategoryPoints(pointsByCategory);
        setCategoryTotal(total);
      }
    } catch (e) {
      console.error("Erreur lors du calcul des points par catégorie:", e);
      setCategoryPoints({});
      setCategoryTotal(0);
    }
  };

  // Ouvre la modale et calcule les points par catégorie
  const openProgressDetail = async () => {
    await calculateCategoryPoints();
    setShowProgressDetail(true);
  };  return (
    <View style={styles.safeArea}>
      <StatusBar hidden={true} />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Section d'en-tête avec dégradé et effet parallaxe */}
        <View style={styles.headerContainer}>
          <ImageBackground 
            source={require('../assets/newicon.png')}
            style={styles.headerBackground}
            imageStyle={styles.imageOverlay}
          >
            <LinearGradient
              colors={['rgba(36, 59, 85, 0.95)', 'rgba(91, 36, 122, 0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <Animated.View style={[
                styles.welcomeSection, 
                { 
                  opacity: fadeAnim, 
                  transform: [{ translateY: slideAnim }] 
                }
              ]}>
                <View style={styles.greetingContainer}>
                  <Text style={styles.welcomeText}>Bienvenue sur</Text>
                  <Text style={styles.appTitle}>ChallengR</Text>
                </View>
                
                <View style={styles.taglineContainer}>
                  <Text style={styles.tagline}>Relevez des quêtes, montez de rang, devenez légendaire !</Text>
                </View>
              </Animated.View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Contenu principal avec effet de carte surélevée */}
        <View style={styles.contentContainer}>
          <View style={styles.contentCard}>
            {/* Statistiques principales */}
            <View style={styles.statsContainer}>
              <Animated.View style={[
                styles.statCard, 
                { transform: [{ translateX: statCardAnim1 }] }
              ]}>
                <View style={styles.statIconContainer}>
                  <Icon name="star" size={28} color={COLORS.white} style={styles.statIcon} />
                </View>
                <Text style={styles.statValue}>{points}</Text>
                <Text style={styles.statLabel}>XP</Text>
              </Animated.View>

              <Animated.View style={[
                styles.statCard, 
                { transform: [{ translateX: statCardAnim2 }] }
              ]}>
                <View style={[styles.statIconContainer, styles.trophyIconContainer]}>
                  <Icon name="trophy" size={28} color={COLORS.white} style={styles.statIcon} />
                </View>
                <Text style={styles.statValue}>{level}</Text>
                <Text style={styles.statLabel}>Rang</Text>
              </Animated.View>
            </View>

            {/* Progression du niveau */}
            <Animated.View style={[
              styles.levelCard, 
              { 
                opacity: levelCardOpacity, 
                transform: [{ scale: levelCardAnim }] 
              }
            ]}>
              <View style={styles.levelHeader}>
                <Text style={styles.levelTitle}>Rang {level}</Text>
                <Text style={styles.levelProgress}>Prochain rang : {level + 1}</Text>
              </View>
              {/* Rendre la barre de progression cliquable */}
              <TouchableOpacity activeOpacity={0.8} onPress={openProgressDetail}>
                <ProgressBar 
                  progress={Math.round(progress * 10) / 10} 
                  total={100} 
                  height={12}
                  barColor="#4e54c8"
                  backgroundColor="#292b45"
                />              
              </TouchableOpacity>
            </Animated.View>

            {/* Barres d'XP par catégorie */}
            <Animated.View style={[
              styles.categoryProgressContainer, 
              { 
                opacity: levelCardOpacity, 
                transform: [{ scale: levelCardAnim }] 
              }
            ]}>
              <View style={styles.categoryProgressHeader}>
                <Text style={styles.categoryProgressTitle}>Progression par compétence</Text>
              </View>
              
              {Object.keys(categoryPoints).length === 0 ? (
                <Text style={styles.noCategoriesText}>Accomplissez des quêtes pour développer vos compétences</Text>
              ) : (
                <>
                  {Object.entries(categoryPoints)
                    .sort(([, pointsA], [, pointsB]) => pointsB - pointsA) // Trier par points décroissants
                    .slice(0, 5) // Limiter à 5 catégories maximum
                    .map(([category, points]) => {
                      // Déterminer la couleur de la barre en fonction de la catégorie
                      const categoryInfo = Object.values(CHALLENGE_CATEGORIES).find(
                        c => c.id.toUpperCase() === category || c.name.toUpperCase() === category
                      );
                      const barColor = categoryInfo ? categoryInfo.color : "#4e54c8";
                      // Déterminer le niveau max pour cette catégorie (100 points par défaut)
                      const categoryMaxPoints = Math.max(100, points * 1.5);
                      
                      return (
                        <View key={category} style={styles.categoryProgressItem}>
                          <Text style={styles.categoryLabel}>
                            {CATEGORY_LABELS_FR[category] || category}
                          </Text>
                          <ProgressBar 
                            progress={points} 
                            total={categoryMaxPoints} 
                            height={8}
                            barColor={barColor}
                            backgroundColor="#292b45"
                          />
                        </View>
                      );
                    })
                  }
                  <TouchableOpacity 
                    style={styles.viewAllCategoriesButton} 
                    onPress={openProgressDetail}
                  >
                    <Text style={styles.viewAllCategoriesText}>Voir toutes les compétences</Text>
                    <Icon name="arrow-forward" size={16} color="#4e54c8" />
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>

            {/* Défi du jour mis en évidence */}
            {dailyTask && (
              <>
                {dailyChallengesCompleted >= 2 ? (
                  // Affichage réduit si deux défis sont complétés
                  <View style={styles.dailyChallengeSmallContainer}>
                    <View style={styles.dailyChallengeHeaderSmall}>
                      <Icon name="calendar" size={22} color="#4e54c8" />
                      <Text style={styles.dailyChallengeTitleSmall}>Quête journalière</Text>
                    </View>
                    <View style={styles.comebackTomorrowContainer}>
                      <Icon name="moon" size={26} color="#4e54c8" style={{ marginBottom: 6 }} />
                      <Text style={styles.comebackText}>Revenez demain</Text>
                      <Text style={styles.comebackSubText}>
                        Prochaines quêtes dans&nbsp;
                        <Text style={styles.comebackTimer}>
                          {`${String(midnightTimer.hours).padStart(2, '0')}:${String(midnightTimer.minutes).padStart(2, '0')}:${String(midnightTimer.seconds).padStart(2, '0')}`}
                        </Text>
                      </Text>
                    </View>
                  </View>
                ) : (
                  // Affichage normal si moins de 2 défis complétés
                  <View style={styles.dailyChallengeContainer}>
                    <View style={styles.dailyChallengeHeader}>
                      <View style={styles.headerLeft}>
                        <Icon name="calendar" size={22} color="#4e54c8" />
                        <Text style={styles.dailyChallengeTitle}>Quête journalière</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.refreshButton}
                        onPress={refreshDailyChallenge}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Animated.View style={{ transform: [{ rotate: pulseAnim.interpolate({
                            inputRange: [1, 1.2],
                            outputRange: ['0deg', '360deg']
                          }) }] }}>
                            <Icon name="refresh" size={18} color="#ff7f50" />
                          </Animated.View>
                        ) : (
                          <Icon name="refresh" size={18} color="#4e54c8" />
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    {/* Compteur de défis complétés et délai */}
                    <View style={styles.challengeStatusContainer}>
                      <View style={styles.challengeCountContainer}>
                        <Icon name="checkmark-circle" size={16} color="#32cd32" />
                        <Text style={styles.challengeCountText}>
                          {dailyChallengesCompleted}/2 quêtes accomplies aujourd'hui
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.dailyChallengeContent}>
                      <View style={styles.challengeDetails}>
                        <Text style={[
                          styles.challengeTitle,
                          dailyTask.completed && styles.completedChallengeTitle
                        ]}>
                          {dailyTask.title}
                        </Text>
                        <Text style={[
                          styles.challengeDescription,
                          dailyTask.completed && styles.completedChallengeDescription
                        ]}>
                          {dailyTask.description}
                        </Text>
                        <View style={styles.challengeInfo}>
                          <View style={styles.pointsContainer}>
                            <Icon name="star" size={14} color="#ffd700" />
                            <Text style={styles.pointsText}>{dailyTask.points} XP</Text>
                          </View>
                          <View style={[styles.difficultyContainer, {
                            backgroundColor: dailyTask.difficulty === 'EASY' 
                              ? 'rgba(46, 204, 113, 0.15)' 
                              : dailyTask.difficulty === 'MEDIUM'
                                ? 'rgba(241, 196, 15, 0.15)'
                                : 'rgba(231, 76, 60, 0.15)'
                          }]}>
                            <Text style={[styles.difficultyText, {
                              color: dailyTask.difficulty === 'EASY' 
                                ? '#27ae60' 
                                : dailyTask.difficulty === 'MEDIUM'
                                  ? '#f39c12'
                                  : '#c0392b'
                            }]}>
                              {dailyTask.difficulty === 'EASY' 
                                ? 'Novice' 
                                : dailyTask.difficulty === 'MEDIUM'
                                  ? 'Aventurier'
                                  : 'Héroïque'
                              }
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <TouchableOpacity 
                        style={[
                          styles.completeButton,
                          dailyTask.completed && styles.completedButton,
                          isButtonDisabled && !dailyTask.completed && styles.disabledButton
                        ]}
                        onPress={handleCompleteChallenge}
                        disabled={dailyTask.completed || isButtonDisabled}
                      >
                        {dailyTask.completed ? (
                          <Icon name="checkmark-circle" size={24} color={COLORS.white} />
                        ) : isButtonDisabled ? (
                          <View style={styles.waitingContainer}>
                            <Icon name="time" size={20} color={COLORS.white} />
                            <Text style={styles.waitingText}>En attente</Text>
                          </View>
                        ) : (
                          <Text style={styles.completeButtonText}>Accomplir</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Quiz quotidien */}
            {dailyQuiz && (
              <View style={styles.dailyQuizContainer}>
                <LinearGradient
                  colors={['#21254c', '#2b2e59']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 20, padding: 20 }}
                >
                  <View style={styles.dailyQuizHeader}>
                    <View style={styles.headerLeft}>
                      <Icon name="game-controller" size={22} color="#8e44ad" />
                      <Text style={styles.dailyQuizTitle}>Défi d'Intelligence</Text>
                    </View>
                    {/* Afficher la série de bonnes réponses si > 0 */}
                    {quizStreak > 0 && (
                      <View style={styles.quizStreakContainer}>
                        <Icon name="flame" size={18} color="#f39c12" />
                        <Text style={styles.quizStreakText}>{quizStreak} <Text style={{fontSize: 12}}>combo</Text></Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Barre de progression du quiz */}
                  <View style={styles.quizProgressContainer}>
                    <View style={styles.quizProgressBackground}>
                      <View 
                        style={[
                          styles.quizProgressFill, 
                          { width: `${Math.min((quizProgress / quizProgressTotal), 1) * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.quizProgressText}>
                      {Math.min(quizProgress, 5)}/5 <Text style={{color: '#8e44ad'}}>niveaux</Text>
                    </Text>
                  </View>
                  
                  {/* Contenu du quiz */}
                  <View style={styles.quizContent}>
                    {/* Si en cooldown, afficher le message d'attente */}
                    {quizCooldown ? (
                      <View style={styles.quizCooldownContainer}>
                        <Icon
                          name="hourglass"
                          size={40}
                          color={quizProgress >= quizProgressTotal ? "#32cd32" : "#e74c3c"}
                          style={styles.cooldownIcon}
                        />
                        <Text
                          style={[
                            styles.cooldownTitle,
                            quizProgress >= quizProgressTotal
                              ? { color: '#32cd32' }
                              : { color: '#e74c3c' }
                          ]}
                        >
                          {
                            quizProgress >= quizProgressTotal
                              ? "Challenge réussi !"
                              : "Challenge échoué!"
                          }
                        </Text>
                        <Text style={styles.cooldownDescription}>
                          Prochain défi disponible dans :
                        </Text>
                        <View style={styles.cooldownTimerContainer}>
                          <Text
                            style={[
                              styles.cooldownTimer,
                              quizProgress >= quizProgressTotal
                                ? { color: '#32cd32' }
                                : { color: '#e74c3c' }
                            ]}
                          >
                            {formatCooldownTime(quizCooldown.remainingTime)}
                          </Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.cooldownHintButton}
                          onPress={() => Alert.alert("Astuce du maître de jeu", "Pour gagner le prochain défi, prenez votre temps et réfléchissez bien. La sagesse vient à ceux qui observent les détails.")}
                        >
                          <Text style={styles.cooldownHintText}>Consulter le sage</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        {/* Question normale */}
                        <Text style={styles.quizQuestion}>{dailyQuiz.title}</Text>
                        <Text style={styles.quizDescription}>{dailyQuiz.description}</Text>
                        
                        {/* Formulaire de réponse si non complété et pas de résultat affiché */}
                        {!dailyQuiz.completed && !quizResult && (
                          <View style={styles.quizAnswers}>
                            {dailyQuiz.answers.map((answer, index) => (
                              <TouchableOpacity 
                                key={index}
                                style={[
                                  styles.answerButton,
                                  selectedAnswer === answer && styles.selectedAnswerButton
                                ]}
                                onPress={() => {
                                  setSelectedAnswer(answer);
                                  try {
                                    haptics.impactAsync('light');
                                  } catch (err) {
                                    console.warn('Haptics error:', err);
                                  }
                                }}
                              >
                                <Text 
                                  style={[
                                    styles.answerText,
                                    selectedAnswer === answer && styles.selectedAnswerText
                                  ]}
                                >
                                  {answer}
                                </Text>
                              </TouchableOpacity>
                            ))}
                            
                            <TouchableOpacity 
                              style={[
                                styles.submitAnswerButton,
                                !selectedAnswer && styles.disabledButton
                              ]}
                              disabled={!selectedAnswer}
                              onPress={handleQuizSubmit}
                            >
                              <Text style={styles.submitAnswerText}>
                                Lancer le sort
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        
                        {/* Affichage du résultat */}
                        {quizResult && (
                          <View style={[
                            styles.quizResultContainer,
                            quizAnimation === 'correct' && styles.correctAnimation,
                            quizAnimation === 'incorrect' && styles.incorrectAnimation
                          ]}>
                            <View style={[
                              styles.resultIcon,
                              quizResult.isCorrect ? styles.correctResultIcon : styles.incorrectResultIcon
                            ]}>
                              <Icon 
                                name={quizResult.isCorrect ? "trophy" : "close-circle"} 
                                size={30} 
                                color={COLORS.white} 
                              />
                            </View>
                            <Text style={styles.resultMessage}>
                              {quizResult.isCorrect ? 
                                "Victoire! Votre sagesse vous honore." : 
                                "Défaite! Votre réponse est erronée."}
                            </Text>
                            {!quizResult.isCorrect && (
                              <Text style={styles.correctAnswerText}>
                                La réponse correcte était: {quizResult.correctAnswer}
                              </Text>
                            )}
                            {quizResult.isCorrect && (
                              <Text style={styles.pointsEarnedText}>
                                +{dailyQuiz.points} XP
                              </Text>
                            )}
                          </View>
                        )}
                        
                        {/* Si le défi est déjà complété */}
                        {dailyQuiz.completed && !quizResult && (
                          <View style={styles.quizResultContainer}>
                            <View style={styles.correctResultIcon}>
                              <Icon name="trophy" size={30} color={COLORS.white} />
                            </View>
                                                                                                                                                                             <Text style={styles.resultMessage}>
                              Défi déjà relevé avec succès!
                            </Text>
                            <Text style={styles.completedQuizPoints}>
                              +{dailyQuiz.points} XP
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </LinearGradient>
              </View>
            )}
            
            {/* Section d'inspiration quotidienne */}
            <View style={{ marginTop: 28, alignItems: 'center' }}>
              <LinearGradient
                colors={['#23265a', '#3a3e7c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  width: '100%',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.13,
                  shadowRadius: 5,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: 'rgba(78,84,200,0.13)',
                  alignItems: 'center',
                }}
              >
                <Icon name="flame" size={22} color="#ff7f50" style={{ marginBottom: 6 }} />
                <Text style={{
                  color: '#fff',
                  fontSize: 15,
                  fontStyle: 'italic',
                  textAlign: 'center',
                  marginBottom: 6,
                  lineHeight: 20,
                  textShadowColor: 'rgba(0,0,0,0.13)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}>
                  "Un héros est quelqu'un qui a réussi à surmonter ses limites."
                </Text>
                <Text style={{
                  color: '#a3aed0',
                  fontSize: 12,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  letterSpacing: 0.5,
                }}>
                  - Confrérie des Gamers
                </Text>
              </LinearGradient>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Animation de récompense surprise */}
      {showReward && (
        <TouchableWithoutFeedback onPress={hideReward}>
          <View style={styles.rewardOverlay}>
            <BlurView intensity={80} style={styles.blurContainer}>
              <Animated.View style={[
                styles.rewardContainer,
                {
                  opacity: rewardOpacityAnim,
                  transform: [{ scale: rewardScaleAnim }]
                }
              ]}>
                <LinearGradient
                  colors={['#1e2146', '#272b52']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: 25,
                  }}
                />
                <View style={styles.starBurst}>
                  <Icon name="trophy" size={40} color="#ffd700" />
                </View>
                <Text style={styles.rewardTitle}>Quête Accomplie!</Text>
                <Text style={styles.rewardText}>
                  Vous avez triomphé d'un nouveau défi!
                </Text>
                <View style={styles.pointsAwarded}>
                  <Icon name="flash" size={24} color="#f39c12" />
                  <Text style={styles.pointsAwardedText}>+{dailyTask?.points || 20} XP</Text>
                </View>
                <TouchableOpacity 
                  style={styles.rewardButton}
                  onPress={hideReward}
                >
                  <Text style={styles.rewardButtonText}>Continuer l'aventure</Text>
                </TouchableOpacity>
              </Animated.View>
            </BlurView>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Modal pour les défis de localisation */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseMapModal}
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <Text style={styles.mapModalTitle}>Défis autour de moi</Text>
            <TouchableOpacity onPress={handleCloseMapModal} style={styles.closeButton}>
              <Icon name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {location ? (
            <View style={styles.mapContentContainer}>
              {/* Input for new activity details */}
              <View style={styles.newActivityDetails}>
                <TextInput
                  style={styles.input}
                  placeholder="Titre de l'activité"
                  value={newActivity.title}
                  onChangeText={(text) =>
                    setNewActivity((prev) => ({ ...prev, title: text }))
                  }
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description de l'activité"
                  value={newActivity.description}
                  onChangeText={(text) =>
                    setNewActivity((prev) => ({ ...prev, description: text }))
                  }
                  multiline
                />
                <TouchableOpacity
                  style={styles.addActivityButton}
                  onPress={handleAddChallenge}
                >
                  <Text style={styles.addActivityButtonText}>Ajouter l'activité</Text>
                </TouchableOpacity>
              </View>

              {/* Map at the bottom */}
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.03,
                  longitudeDelta: 0.03,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                onPress={(e) => {
                  const { coordinate } = e.nativeEvent;
                  if (coordinate) {
                    setNewActivity((prev) => ({
                      ...prev,
                      coordinate: coordinate, // Set the coordinate when a point is selected
                    }));
                  }
                }}
              >
                {/* Markers for nearby challenges */}
                {nearbyChallenges.map((challenge) => (
                  <Marker
                    key={challenge.id}
                    coordinate={{
                      latitude: challenge.latitude,
                      longitude: challenge.longitude,
                    }}
                    title={challenge.title}
                    description={challenge.description}
                    tracksViewChanges={false}
                    tappable={true}
                    onPress={() => setActivityToNavigate(challenge)}
                  >
                    <View pointerEvents="none" style={[styles.challengeMarker, getCategoryStyle(challenge.category)]}>
                      <Icon
                        name={getCategoryIcon(challenge.category)}
                        size={20}
                        color={COLORS.white}
                      />
                    </View>
                  </Marker>
                ))}

                {/* Marker for the new activity */}
                {newActivity.coordinate && (
                  <Marker
                    coordinate={newActivity.coordinate}
                    pinColor="blue"
                    title={newActivity.title}
                    description={newActivity.description || "Description de l'activité"}
                    tracksViewChanges={false}
                    tappable={true}
                    onPress={() =>
                      setActivityToNavigate({
                        ...newActivity,
                        id: newActivity.id || generateUniqueId(),
                        category: "CUSTOM",
                        points: 10,
                      })
                    }
                  />
                )}
              </MapView>
            </View>
          ) : (
            <View style={styles.locationLoadingContainer}>
              <Icon name="location" size={60} color={COLORS.primary} style={styles.locationIcon} />
              <Text style={styles.locationText}>
                {locationPermissionStatus === 'granted'
                  ? 'Récupération de votre position...'
                  : 'Autorisation de localisation requise'}
              </Text>
              {locationPermissionStatus !== 'granted' && (
                <TouchableOpacity
                  style={styles.authLocationButton}
                                   onPress={ requestLocationPermission}
                >
                  <Text style={styles.authLocationButtonText}>Autoriser la localisation</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Modal for activity details and navigation */}
      {activityToNavigate && (
        <Modal
          visible={!!activityToNavigate}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setActivityToNavigate(null)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <View style={{
              backgroundColor: '#1e2146',
              borderRadius: 20,
              padding: 24,
              width: '85%',
              borderWidth: 1,
              borderColor: '#4e54c8',
              // Décale le contenu vers le haut
              marginBottom: 40
            }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 10 }}>
                {activityToNavigate.title}
              </Text>
              <Text style={{ fontSize: 15, color: '#a3aed0', marginBottom: 16, marginTop: 4 }}>
                {activityToNavigate.description}
              </Text>
              <Text style={{ fontSize: 14, color: '#ffd700', marginBottom: 10 }}>
                {activityToNavigate.points} XP
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#4e54c8',
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    alignItems: 'center',
                    marginRight: 8,
                    flex: 1
                  }}
                  onPress={() => setActivityToNavigate(null)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Fermer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#32cd32',
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    alignItems: 'center',
                    flex: 1
                  }}
                  onPress={() => {
                    navigateToActivity(activityToNavigate);
                    setActivityToNavigate(null);
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>S'y rendre</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modale de détail de progression */}
      <Modal
        visible={showProgressDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProgressDetail(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: '#1e2146',
            borderRadius: 20,
            padding: 24,
            width: '85%',
            maxHeight: '70%',
            borderWidth: 1,
            borderColor: '#4e54c8'
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#fff', textAlign: 'center' }}>
              Progression des Compétences
            </Text>
            <Text style={{ fontSize: 15, color: '#a3aed0', marginBottom: 12, textAlign: 'center' }}>
              XP par domaine de compétence
            </Text>
            <ScrollView style={{ maxHeight: 250 }}>
              {Object.keys(categoryPoints).length === 0 && (
                <Text style={{ color: '#6d7192', textAlign: 'center', marginVertical: 20 }}>
                  Aucune quête accomplie pour le moment.
                </Text>
              )}
              {Object.entries(categoryPoints).map(([cat, pts]) => (
                <View key={cat} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#292b45' }}>
                  <Text style={{ fontSize: 16, color: '#fff' }}>
                    {CATEGORY_LABELS_FR[cat] || cat}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4e54c8' }}>
                    {pts} XP
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={{ borderTopWidth: 1, borderTopColor: '#292b45', marginTop: 16, paddingTop: 12 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#a3d8f5', textAlign: 'right' }}>
                Total : {categoryTotal} XP
              </Text>
            </View>
            <TouchableOpacity
              style={{
                marginTop: 18,
                backgroundColor: '#4e54c8',
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)'
              }}
              onPress={() => setShowProgressDetail(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({  safeArea: {
    flex: 1,
    backgroundColor: '#151736',
    // Ne pas mettre de paddingTop ici, le StatusBar est déjà géré ailleurs
  },
  container: {
    flex: 1,
    backgroundColor: '#151736',
  },
  headerContainer: {
    height: 220,
    width: '100%',
    overflow: 'hidden',
  },
  headerBackground: {
    height: '100%',
    width: '100%',
  },
  imageOverlay: {
    resizeMode: 'cover',
    opacity: 0.15,
  },
  gradient: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 60 : 40,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
  },
  greetingContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  appTitle: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  taglineContainer: {
    marginTop: 5,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 16,
    color: '#a3d8f5',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  contentContainer: {
    flex: 1,
    marginTop: -40,
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  contentCard: {
    backgroundColor: '#1e2146',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#292b45',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#21254c',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#4e54c8',
  },
  statIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffd700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  trophyIconContainer: {
    backgroundColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#a3aed0',
    marginTop: 4,
    fontWeight: '500',
  },
  levelCard: {
    marginBottom: 25,
    backgroundColor: '#21254c',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#4e54c8',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  levelProgress: {
    fontSize: 14,
    color: '#a3d8f5',
  },
  categoryProgressContainer: {
    marginBottom: 25,
    backgroundColor: '#21254c',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#4e54c8',
  },
  categoryProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryProgressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoryProgressItem: {
    marginBottom: 15,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dedede',
    marginBottom: 5,
  },
  noCategoriesText: {
    fontSize: 14,
    color: '#6d7192',
    textAlign: 'center',
    marginVertical: 10,
  },
  viewAllCategoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 5,
  },
  viewAllCategoriesText: {
    fontSize: 14,
    color: '#4e54c8',
    marginRight: 5,
    fontWeight: '500',
  },
  dailyChallengeContainer: {
    backgroundColor: '#21254c',
    borderRadius: 20,
    marginBottom: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#4e54c8',
  },
  dailyChallengeSmallContainer: {
    backgroundColor: '#272b52',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#4e54c8',
  },
  dailyChallengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyChallengeHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dailyChallengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  dailyChallengeTitleSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4e54c8',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 5,
  },
  comebackTomorrowContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  comebackText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4e54c8',
    marginBottom: 4,
  },
  comebackSubText: {
    fontSize: 14,
    color: '#a3aed0',
    marginBottom: 2,
  },
  comebackTimer: {
    fontWeight: 'bold',
    color: '#a3d8f5',
    fontVariant: ['tabular-nums'],
  },
  challengeStatusContainer: {
    flexDirection: 'column',
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: '#292b45',
    padding: 10,
  },
  challengeCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  challengeCountText: {
    fontSize: 14,
    color: '#a3aed0',
    marginLeft: 5,
    fontWeight: '500',
  },
  dailyChallengeContent: {
    backgroundColor: '#272b52',
    borderRadius: 15,
    padding: 15,
  },
  challengeDetails: {
    marginBottom: 15,
  },
  challengeTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  completedChallengeTitle: {
    textDecorationLine: 'line-through',
    color: '#32cd32',
    fontWeight: 'bold',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#a3aed0',
    marginBottom: 10,
    lineHeight: 20,
  },
  completedChallengeDescription: {
    textDecorationLine: 'line-through',
    color: '#32cd32',
  },
  challengeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  pointsText: {
    fontSize: 13,
    color: '#dedede',
    fontWeight: '600',
    marginLeft: 4,
  },
  difficultyContainer: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#4e54c8',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#4e54c8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  completedButton: {
    backgroundColor: '#32cd32',
  },
  disabledButton: {
    backgroundColor: '#5d6080',
    opacity: 0.7,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  dailyQuizContainer: {
    backgroundColor: '#21254c',
    borderRadius: 20,
    marginBottom: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#4e54c8',
  },
  dailyQuizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dailyQuizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  quizContent: {
    backgroundColor: '#272b52',
    borderRadius: 15,
    padding: 15,
  },
  quizQuestion: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(142, 68, 173, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  quizDescription: {
    fontSize: 14,
    color: '#bdc8f0',
    marginBottom: 15,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  quizStreakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 156, 18, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(243, 156, 18, 0.4)',
  },
  quizStreakText: {
    color: '#f39c12',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quizProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  quizProgressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#292b45',
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(142, 68, 173, 0.3)',
  },
  quizProgressFill: {
    height: '100%',
    backgroundColor: '#8e44ad',
    borderRadius: 4,
    shadowColor: '#8e44ad',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  quizProgressText: {
    fontSize: 14,
    color: '#a3aed0',
    fontWeight: '500',
  },
  answerButton: {
    backgroundColor: '#292b45',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#384066',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedAnswerButton: {
    backgroundColor: 'rgba(78, 84, 200, 0.2)',
    borderColor: '#4e54c8',
    borderWidth: 2,
    shadowColor: '#4e54c8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  answerText: {
    fontSize: 15,
    color: '#dedede',
  },
  selectedAnswerText: {
    color: '#a3d8f5',
    fontWeight: '600',
  },
  submitAnswerButton: {
    backgroundColor: '#8e44ad',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#8e44ad',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  submitAnswerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quizResultContainer: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resultIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  correctResultIcon: {
    backgroundColor: '#32cd32',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  incorrectResultIcon: {
    backgroundColor: '#e74c3c',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  resultMessage: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#a3aed0',
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  completedQuizPoints: {
    fontSize: 16,
    color: '#32cd32',
    fontWeight: 'bold',
    marginBottom: 15,
    textShadowColor: 'rgba(50, 205, 50, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pointsEarnedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd700',
    marginTop: 10,
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  correctAnimation: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    borderRadius: 12,
    transform: [{scale: 1.02}],
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.4)',
  },
  incorrectAnimation: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderRadius: 12,
    transform: [{scale: 1.02}],
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.4)',
  },
  quizCooldownContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  cooldownIcon: {
    marginBottom: 20,
    opacity: 0.8,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  cooldownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
    textShadowColor: 'rgba(231, 76, 60, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cooldownDescription: {
    fontSize: 16,
    color: '#a3aed0',
    marginBottom: 15,
    textAlign: 'center',
  },
  cooldownTimerContainer: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  cooldownTimer: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e74c3c',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  cooldownHintButton: {
    borderWidth: 1,
    borderColor: '#4e54c8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(78, 84, 200, 0.1)',
  },
  cooldownHintText: {
    color: '#4e54c8',
    fontSize: 14,
    fontWeight: '500',
  },
  rewardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  blurContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 17, 35, 0.7)',
  },
  rewardContainer: {
    backgroundColor: '#1e2146',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 2,
    borderColor: '#4e54c8',
  },
  starBurst: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    width: 85,
    height: 85,
    borderRadius: 42.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  rewardTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rewardText: {
    fontSize: 16,
    color: '#a3d8f5',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  pointsAwarded: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  pointsAwardedText: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd700',
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  rewardButton: {
    backgroundColor: '#4e54c8',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#4e54c8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  rewardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Add any missing styles for map modal and input components
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#151736',
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#21254c',
    borderBottomWidth: 1,
    borderBottomColor: '#292b45',
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  mapContentContainer: {
    flex: 1,
  },
  newActivityDetails: {
    padding: 15,
    backgroundColor: '#21254c',
    borderBottomWidth: 1,
    borderBottomColor: '#292b45',
  },
  input: {
    backgroundColor: '#272b52',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#4e54c8',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addActivityButton: {
    backgroundColor: '#4e54c8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#4e54c8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  addActivityButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  map: {
    flex: 1,
  },
  locationLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  locationIcon: {
    marginBottom: 15,
  },
  locationText: {
    fontSize: 16,
    color: '#a3aed0',
    textAlign: 'center',
    marginBottom: 20,
  },
  authLocationButton: {
    backgroundColor: '#4e54c8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#4e54c8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  authLocationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  pointModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
  },
  pointModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  pointModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#4e54c8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  navigateButton: {
    backgroundColor: '#8e44ad',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  challengeMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4e54c8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waitingText: {
    color: COLORS.white,
    marginLeft: 5,
    fontWeight: 'bold',
  },
});


const getCategoryStyle = (category) => {
  switch (category) {
    case "FITNESS":
      return { backgroundColor: "#e74c3c" };
    case "CULTURE":
      return { backgroundColor: "#9b59b6" };
    case "WELLBEING":
      return { backgroundColor: "#3498db" };
    case "NUTRITION":
      return { backgroundColor: "#2ecc71" };
    case "CREATIVITY":
      return { backgroundColor: "#f39c12" };
    case "CUSTOM":
      return { backgroundColor: "#1abc9c" };
    default:
      return { backgroundColor: "#4e54c8" };
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case "FITNESS":
      return "fitness";
    case "CULTURE":
      return "book";
    case "WELLBEING":
      return "heart";
    case "NUTRITION":
      return "restaurant";
    case "CREATIVITY":
      return "brush";
    case "CUSTOM":
      return "star";
    default:
      return "flag";
  }
};
