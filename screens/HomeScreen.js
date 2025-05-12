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
  TextInput // Add this import
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
// Fix the MapView import to work with react-native-maps v1.18.0
import MapView from 'react-native-maps';
import { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { retrievePoints, retrieveDailyTasks } from '../utils/storage';
import ProgressBar from '../components/ProgressBar';
import Icon, { COLORS } from '../components/common/Icon';
import { SCREEN, calculateLevel, generateUniqueId } from '../utils/constants';
import { addTaskToCalendar } from '../services/calendarService';

const { width, height } = Dimensions.get('window');

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

  // Charger les données utilisateur
  useEffect(() => {
    loadUserData();
    startAnimations();
    startPulseAnimation();

    // Charger un défi quotidien pour l'afficher en évidence
    loadDailyChallenge();
    
    // Charger le nombre de défis complétés et le temps du prochain défi
    loadChallengeCompletion();
  }, []);

  // Animation de pulsation continue pour attirer l'attention
  const startPulseAnimation = () => {
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
  };

  // Charger les points et calculer le niveau
  const loadUserData = async () => {
    try {
      const userPoints = await retrievePoints() || 0;
      setPoints(userPoints);
      
      // Utiliser la fonction de calcul de niveau centralisée
      const levelInfo = calculateLevel(userPoints);
      setLevel(levelInfo.level);
      setProgress(levelInfo.progress);
    } catch (error) {
      console.error('Erreur lors du chargement des points utilisateur:', error);
      Alert.alert('Erreur', 'Impossible de charger les données utilisateur.');
    }
  };

  // Charger un défi quotidien
  const loadDailyChallenge = async () => {
    try {
      const dailyTasks = await retrieveDailyTasks() || [];
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
          
          // Si un prochain défi est programmé et que le délai n'est pas encore passé
          if (dailyCompleted.nextChallengeTime && dailyCompleted.nextChallengeTime > now.getTime()) {
            setNextChallengeTime(dailyCompleted.nextChallengeTime);
            setIsButtonDisabled(true);
            startCountdown(dailyCompleted.nextChallengeTime);
          }
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
  
  // Démarre le compte à rebours
  const startCountdown = (targetTime) => {
    if (!targetTime) return;
    
    // Calculer le temps restant en secondes
    const updateCountdown = () => {
      const now = new Date().getTime();
      const timeRemaining = Math.max(0, targetTime - now);
      
      if (timeRemaining <= 0) {
        // Le délai est passé, réactiver le bouton
        clearInterval(countdownTimer);
        setCountdownTimer(null);
        setIsButtonDisabled(false);
        setNextChallengeTime(null);
        return;
      }
      
      // Convertir en heures:minutes:secondes
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      
      setNextChallengeTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    
    // Mettre à jour immédiatement puis toutes les secondes
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    setCountdownTimer(timer);
    
    // Nettoyer l'intervalle lorsque le composant est démonté
    return () => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    };
  };
  
  // Mettre à jour le compteur de défis complétés
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
      
      // Si l'utilisateur a déjà complété 2 défis, verrouiller jusqu'au lendemain
      if (newCount >= 2) {
        // Définir le délai jusqu'à minuit
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        dailyCompleted.nextChallengeTime = tomorrow.getTime();
        setNextChallengeTime(tomorrow.getTime());
        setIsButtonDisabled(true);
        
        // Afficher un message indiquant que l'utilisateur a atteint la limite
        Alert.alert(
          "Limite atteinte",
          "Vous avez complété votre maximum de 2 défis quotidiens. Revenez demain pour relever de nouveaux défis!",
          [{ text: "Compris" }]
        );
      } else {
        // Sinon, définir un délai de 12 heures
        const nextTime = now.getTime() + (12 * 60 * 60 * 1000); // 12 heures en millisecondes
        dailyCompleted.nextChallengeTime = nextTime;
        setNextChallengeTime(nextTime);
        setIsButtonDisabled(true);
        startCountdown(nextTime);
      }
      
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
    // Vérifier si l'utilisateur a atteint sa limite quotidienne ou est en période d'attente
    if (isButtonDisabled) {
      if (dailyChallengesCompleted >= 2) {
        Alert.alert(
          "Limite atteinte",
          "Vous avez déjà complété 2 défis aujourd'hui. Revenez demain pour de nouveaux défis!",
          [{ text: "Compris" }]
        );
      } else {
        Alert.alert(
          "Temps d'attente",
          `Vous devez attendre ${nextChallengeTime} avant de pouvoir compléter un nouveau défi.`,
          [{ text: "OK" }]
        );
      }
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
      await AsyncStorage.setItem('@challengr_points_storage_key', newPoints.toString());
      
      // Mettre à jour les points dans l'interface utilisateur
      setPoints(newPoints);
      
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

  // State for new activity details
  const [newActivity, setNewActivity] = useState({
    title: "Nouvelle activité",
    description: "",
    coordinate: { latitude: 0, longitude: 0 }, // Initialize with default coordinates
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
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
            source={require('../assets/icon.png')}
            style={styles.headerBackground}
            imageStyle={styles.imageOverlay}
          >
            <LinearGradient
              colors={['rgba(52, 152, 219, 0.95)', 'rgba(155, 89, 182, 0.95)']}
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
                  <Text style={styles.tagline}>Relevez des défis, progressez, excellez !</Text>
                </View>
                
                <View style={styles.levelBadgeContainer}>
                  <Animated.View style={[
                    styles.levelBadge,
                    { transform: [{ scale: pulseAnim }] }
                  ]}>
                    <Text style={styles.levelBadgeText}>{level}</Text>
                  </Animated.View>
                  <View style={styles.userLevelInfo}>
                    <Text style={styles.userLevelText}>NIVEAU {level}</Text>
                    <Text style={styles.userPointsText}>{points} points</Text>
                  </View>
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
                <Text style={styles.statLabel}>Points</Text>
              </Animated.View>

              <Animated.View style={[
                styles.statCard, 
                { transform: [{ translateX: statCardAnim2 }] }
              ]}>
                <View style={[styles.statIconContainer, styles.trophyIconContainer]}>
                  <Icon name="trophy" size={28} color={COLORS.white} style={styles.statIcon} />
                </View>
                <Text style={styles.statValue}>{level}</Text>
                <Text style={styles.statLabel}>Niveau</Text>
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
                <Text style={styles.levelTitle}>Niveau {level}</Text>
                <Text style={styles.levelProgress}>Prochain niveau : {level + 1}</Text>
              </View>
              <ProgressBar 
                progress={progress} 
                total={100} 
                height={12}
                barColor={COLORS.secondary}
                backgroundColor="#eef2fd"
              />
            </Animated.View>

            {/* Défi du jour mis en évidence */}
            {dailyTask && (
              <View style={styles.dailyChallengeContainer}>
                <View style={styles.dailyChallengeHeader}>
                  <View style={styles.headerLeft}>
                    <Icon name="calendar" size={22} color={COLORS.primary} />
                    <Text style={styles.dailyChallengeTitle}>Défi du jour</Text>
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
                        <Icon name="refresh" size={18} color={COLORS.tertiary} />
                      </Animated.View>
                    ) : (
                      <Icon name="refresh" size={18} color={COLORS.secondary} />
                    )}
                  </TouchableOpacity>
                </View>
                
                {/* Compteur de défis complétés et délai */}
                <View style={styles.challengeStatusContainer}>
                  <View style={styles.challengeCountContainer}>
                    <Icon name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.challengeCountText}>
                      {dailyChallengesCompleted}/2 défis complétés aujourd'hui
                    </Text>
                  </View>
                  
                  {isButtonDisabled && nextChallengeTime && (
                    <View style={styles.countdownContainer}>
                      <Icon name="time" size={16} color={COLORS.warning} />
                      <Text style={styles.countdownText}>
                        {typeof nextChallengeTime === 'string' 
                          ? `Prochain défi dans: ${nextChallengeTime}`
                          : 'Attente du prochain défi...'}
                      </Text>
                    </View>
                  )}
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
                        <Icon name="star" size={14} color={COLORS.warning} />
                        <Text style={styles.pointsText}>{dailyTask.points} points</Text>
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
                            ? 'Facile' 
                            : dailyTask.difficulty === 'MEDIUM'
                              ? 'Moyen'
                              : 'Difficile'
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
                      <Text style={styles.completeButtonText}>Compléter</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Actions rapides */}
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <Animated.View style={[
              styles.buttonsContainer, 
              { 
                opacity: actionButtonsOpacity, 
                transform: [{ translateY: actionButtonsAnim }] 
              }
            ]}>
              {/* Bouton Mes Défis */}
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => navigation.navigate('Tasks')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#3498db', '#2980b9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.actionContent}>
                    <View style={styles.actionIconContainer}>
                      <Icon name="list" size={22} color={COLORS.white} style={styles.buttonIcon} />
                    </View>
                    <Text style={styles.buttonText}>Mes Défis</Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <Icon name="chevron-forward" size={22} color={COLORS.white} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Bouton Mon Profil */}
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => navigation.navigate('Profile')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#9b59b6', '#8e44ad']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.actionContent}>
                    <View style={styles.actionIconContainer}>
                      <Icon name="person" size={22} color={COLORS.white} style={styles.buttonIcon} />
                    </View>
                    <Text style={styles.buttonText}>Mon Profil</Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <Icon name="chevron-forward" size={22} color={COLORS.white} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              
              {/* Bouton Mes Amis */}
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => navigation.navigate('Friends')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#2ecc71', '#27ae60']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.actionContent}>
                    <View style={styles.actionIconContainer}>
                      <Icon name="people" size={22} color={COLORS.white} style={styles.buttonIcon} />
                    </View>
                    <Text style={styles.buttonText}>Mes Amis</Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <Icon name="chevron-forward" size={22} color={COLORS.white} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              
              {/* Bouton Défis Autour de Moi */}
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleOpenMapModal}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#e74c3c', '#c0392b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.actionContent}>
                    <View style={styles.actionIconContainer}>
                      <Icon name="map" size={22} color={COLORS.white} style={styles.buttonIcon} />
                    </View>
                    <Text style={styles.buttonText}>Défis Autour de Moi</Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <Icon name="chevron-forward" size={22} color={COLORS.white} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Section d'inspiration quotidienne */}
            <View style={styles.inspirationSection}>
              <View style={styles.quoteContainer}>
                <Icon name="flame" size={18} color={COLORS.warning} style={styles.quoteIcon} />
                <Text style={styles.quoteText}>
                  "Le succès n'est pas définitif, l'échec n'est pas fatal : c'est le courage de continuer qui compte."
                </Text>
              </View>
              <Text style={styles.quoteAuthor}>- Winston Churchill</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Animation de récompense surprise */}
      {showReward && (
        <TouchableWithoutFeedback onPress={hideReward}>
          <View style={styles.rewardOverlay}>
            <BlurView intensity={60} style={styles.blurContainer}>
              <Animated.View style={[
                styles.rewardContainer,
                {
                  opacity: rewardOpacityAnim,
                  transform: [{ scale: rewardScaleAnim }]
                }
              ]}>
                <View style={styles.starBurst}>
                  <Icon name="star" size={40} color="#f1c40f" />
                </View>
                <Text style={styles.rewardTitle}>Félicitations!</Text>
                <Text style={styles.rewardText}>
                  Vous avez complété un défi!
                </Text>
                <View style={styles.pointsAwarded}>
                  <Icon name="trophy" size={24} color="#f39c12" />
                  <Text style={styles.pointsAwardedText}>+{dailyTask?.points || 20} points</Text>
                </View>
                <TouchableOpacity 
                  style={styles.rewardButton}
                  onPress={hideReward}
                >
                  <Text style={styles.rewardButtonText}>Super!</Text>
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
                onPress={(e) =>
                  setNewActivity((prev) => ({
                    ...prev,
                    coordinate: e.nativeEvent.coordinate,
                  }))
                }
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
                    onPress={() => handleSelectPoint(challenge)}
                  >
                    <View style={[styles.challengeMarker, getCategoryStyle(challenge.category)]}>
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
                    onPress={() =>
                      handleSelectPoint({
                        ...newActivity,
                        id: generateUniqueId(),
                        category: "CUSTOM",
                      })
                    }
                  />
                )}
              </MapView>

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
                  onPress={requestLocationPermission}
                >
                  <Text style={styles.authLocationButtonText}>Autoriser la localisation</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Modal for editing or navigating to a selected point */}
      {selectedPoint && (
        <Modal
          visible={!!selectedPoint}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedPoint(null)}
        >
          <View style={styles.pointModalContainer}>
            <Text style={styles.pointModalTitle}>Modifier le point</Text>
            <TextInput
              style={styles.input}
              placeholder="Titre"
              value={selectedPoint.title}
              onChangeText={(text) =>
                setSelectedPoint((prev) => ({ ...prev, title: text }))
              }
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={selectedPoint.description}
              onChangeText={(text) =>
                setSelectedPoint((prev) => ({ ...prev, description: text }))
              }
              multiline
            />
            <View style={styles.pointModalActions}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSavePoint}
              >
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() => navigateToPoint(selectedPoint)}
              >
                <Text style={styles.navigateButtonText}>S'y rendre</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary, // Utilisation de la couleur primaire pour correspondre au dégradé de l'en-tête
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  headerContainer: {
    height: 280,
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
    paddingTop: Platform.OS === 'android' ? 40 : 20,
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
    color: COLORS.white,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  taglineContainer: {
    marginTop: 5,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  levelBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingRight: 15,
  },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  levelBadgeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  userLevelInfo: {
    marginLeft: 10,
  },
  userLevelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 1,
  },
  userPointsText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  contentContainer: {
    flex: 1,
    marginTop: -30,
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  contentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f5f6fa',
  },
  statIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.warning,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  trophyIconContainer: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
  },
  statIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  statValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  levelCard: {
    marginBottom: 25,
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f3f8',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  levelProgress: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dailyChallengeContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginBottom: 25,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f3f8',
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
  dailyChallengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginLeft: 8,
  },
  refreshButton: {
    padding: 5,
  },
  challengeStatusContainer: {
    flexDirection: 'column',
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: '#f0f3f8',
    padding: 10,
  },
  challengeCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  challengeCountText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 5,
    fontWeight: '500',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: COLORS.warning,
    marginLeft: 5,
    fontWeight: '500',
  },
  dailyChallengeContent: {
    backgroundColor: '#f9fafc',
    borderRadius: 15,
    padding: 15,
  },
  challengeDetails: {
    marginBottom: 15,
  },
  challengeTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  completedChallengeTitle: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  challengeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 20,
  },
  completedChallengeDescription: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
    color: COLORS.success,
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
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  completedButton: {
    backgroundColor: COLORS.success,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
    opacity: 0.7,
  },
  completeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waitingText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  sectionTitle: {
    marginBottom: 15,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  buttonsContainer: {
    marginBottom: 25,
    gap: 12,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  arrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    color: COLORS.white,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inspirationSection: {
    backgroundColor: '#f9fafc',
    borderRadius: 20,
    padding: 20,
    marginBottom: 10,
  },
  quoteContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  quoteIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  quoteText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
    flex: 1,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'right',
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
  },
  rewardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    width: '80%',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  starBurst: {
    backgroundColor: '#fff9e5',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 5,
    borderColor: '#fff5d1',
    shadowColor: '#f1c40f',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  rewardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 10,
  },
  rewardText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  pointsAwarded: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  pointsAwardedText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f39c12',
  },
  rewardButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  rewardButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  translucentNavBar: {
    backgroundColor: 'transparent',
  },
  solidNavBar: {
    backgroundColor: COLORS.primary,
  },
  navBarGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
  },
  navBarIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.warning,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  navBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  navBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
    paddingTop: 40,
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mapModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  closeButton: {
    padding: 5,
  },
  locationLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIcon: {
    marginBottom: 20,
  },
  locationText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  authLocationButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  authLocationButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContentContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
    borderRadius: 20,
    marginBottom: 20,
  },
  challengeMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callout: {
    width: 150,
    padding: 10,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  calloutDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  calloutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calloutPoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutPointsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  calloutDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutDistanceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  routeInfoContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation:  5,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  routeInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  closeRouteButton: {
    padding: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
  },
  routeInfoDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 5,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  directionsButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 5,
  },
  newActivityDetails: {
    padding: 10,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  addActivityButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  addActivityButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  pointModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  pointModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 20,
  },
  pointModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  navigateButton: {
    backgroundColor: COLORS.secondary,
    padding: 10,
    borderRadius: 10,
  },
  navigateButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

const getCategoryStyle = (category) => {
  switch (category) {
    case 'FITNESS':
      return { backgroundColor: '#3498db' };
    case 'CULTURE':
      return { backgroundColor: '#9b59b6' };
    case 'WELLBEING':
      return { backgroundColor: '#2ecc71' };
    case 'NUTRITION':
      return { backgroundColor: '#e74c3c' };
    case 'CREATIVITY':
      return { backgroundColor: '#f39c12' };
    default:
      return { backgroundColor: '#bdc3c7' };
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'FITNESS':
      return 'fitness';
    case 'CULTURE':
      return 'book';
    case 'WELLBEING':
      return 'leaf';
    case 'NUTRITION':
      return 'nutrition';
    case 'CREATIVITY':
      return 'color-palette';
    default:
      return 'help';
  }

};
