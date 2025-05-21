const DAILY_TASKS_KEY = '@challengr_daily_tasks';
const TIMED_TASKS_KEY = '@challengr_timed_tasks';

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Animated, 
  Modal,
  StatusBar,
  ScrollView,
  SafeAreaView,
  Alert,
  SectionList,
  Switch,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Task from '../components/Task';
import Icon, { COLORS } from '../components/common/Icon';
import LevelUpAnimation from '../components/LevelUpAnimation';
import { 
  retrieveTasks, 
  saveTasks, 
  completeTask, 
  deleteTask, 
  addPoints,
  retrievePoints,
  retrieveDailyTasks,
  retrieveTimedTasks,
  updateStreak,
  retrieveStreak,
  createTimedTask,
  createTask,
  addCategoryPoints
} from '../utils/storage';
import { 
  CHALLENGE_TYPES, 
  CHALLENGE_CATEGORIES,
  calculateLevel,
  DIFFICULTY_LEVELS,
  generateUniqueId,
  SCREEN 
} from '../utils/constants';
import { 
  requestCalendarPermissions, 
  addTaskToCalendar
} from '../services/calendarService';
import {
  formatDate,
  formatTime,
  getTimeRemaining,
  getRelativeTime
} from '../utils/dateUtils';

// Ajout de constantes de couleur gaming
const GAMING_COLORS = {
  background: '#151736',
  cardBackground: '#1e2146',
  secondary: '#4e54c8',
  accent: '#a3d8f5',
  darkBlue: '#21254c',
  headerBg: '#0f1123',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GAMING_COLORS.headerBg, // Couleur sombre comme sur HomeScreen
    paddingTop: Platform.OS === 'android' ? SCREEN.statusBarHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: GAMING_COLORS.background, // Même fond que HomeScreen
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: GAMING_COLORS.headerBg, // Fond sombre pour le header
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelInfoButton: {
    marginRight: 10,
    padding: 5,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  addTaskForm: {
    position: 'absolute',
    left: '5%',
    right: '5%',
    top: '10%',
    maxHeight: '80%',
    backgroundColor: GAMING_COLORS.cardBackground, // Couleur de carte comme HomeScreen
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#292b45',
  },
  addTaskFormScroll: {
    width: '100%',
  },
  addTaskFormContent: {
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff', // Texte blanc pour les titres
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#292b45',
    borderRadius: 15,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#272b52', // Couleur légèrement plus claire
    color: '#fff', // Texte blanc
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  difficultyContainer: {
    marginBottom: 16,
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  difficultyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f4f8',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  difficultyButtonText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  activeDifficultyText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  filterContainer: {
    paddingVertical: 12,
    paddingLeft: 12,
    backgroundColor: GAMING_COLORS.cardBackground, // Couleur de carte comme HomeScreen
    borderBottomWidth: 1,
    borderBottomColor: '#292b45',
  },
  filterButtonContainer: {
    marginRight: 10,
  },
  filterButtons: {
    paddingRight: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#272b52', // Couleur légèrement plus claire que le fond
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterIcon: {
    marginRight: 6,
  },
  activeFilter: {
    backgroundColor: GAMING_COLORS.secondary, // Bleu/violet accent de HomeScreen
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#a3aed0', // Couleur claire pour le texte
  },
  activeFilterText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  tasksList: {
    padding: 15,
    paddingBottom: 30,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#a3d8f5', // Couleur bleu clair comme HomeScreen
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#a3aed0', // Couleur claire pour le texte secondaire
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyActionButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  emptyActionButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    width: '85%',
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 1,
    borderColor: `${COLORS.secondary}40`,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: COLORS.secondary,
  },
  modalText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 15,
  },
  levelInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f8',
  },
  levelInfoLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  levelInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  difficultyInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#f8faff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  difficultyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexDirection: 'row',
  },
  difficultyInfoContent: {
    flex: 1,
  },
  difficultyInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  difficultyInfoPoints: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  modalCloseButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  levelTitleContainer: {
    marginBottom: 15,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  levelDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 5,
  },
  advantagesContainer: {
    marginBottom: 15,
  },
  advantageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  advantageIcon: {
    marginRight: 10,
  },
  advantageText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  bonusContainer: {
    marginBottom: 15,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  bonusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(46, 204, 113, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bonusDescription: {
    fontSize: 14,
    color: '#32ac66',
    textAlign: 'center',
    lineHeight: 20,
  },
  navBar: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? SCREEN.statusBarHeight : 0,
  },
  navBarGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  navBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navBarButton: {
    padding: 10,
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
  backButton: {
    padding: 10,
  },
  translucentNavBar: {
    backgroundColor: 'transparent',
  },
  solidNavBar: {
    backgroundColor: COLORS.primary,
  },
  sectionHeader: {
    backgroundColor: '#21254c',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4e54c8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionInfo: {
    fontSize: 12,
    color: '#a3aed0',
    marginTop: 4,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8f0',
    backgroundColor: '#f8faff',
    minWidth: '45%',
  },
  categoryButtonActive: {
    borderColor: COLORS.secondary,
    backgroundColor: `${COLORS.secondary}20`,
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  categoryTextActive: {
    color: COLORS.secondary,
    fontWeight: '600',
  },
  twoColumnsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  columnContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 8,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 999,
  },
  calendarOptionContainer: {
    marginBottom: 16,
  },
  calendarOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  datePickerContainer: {
    marginTop: 12,
    backgroundColor: '#f8faff',
    borderRadius: 12,
    padding: 12,
  },
  datePickerLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e8f0',
    borderRadius: 10,
    padding: 12,
  },
  datePickerIcon: {
    marginRight: 8,
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  datePickerModalContainer: {
    position: 'relative',
    top: '2%',
    left: '0%',
    right: '5%',
    maxHeight: '90%',
    backgroundColor: 'rgba(7, 122, 188, 0.16)',
    borderRadius: 12,
    padding: 16,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  datePickerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleDatePicker: {
    width: '100%',
    marginTop: 10,
  },
  quickDateOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickDateButton: {
    backgroundColor: COLORS.secondary + '20',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    minWidth: '30%',
  },
  manualDatePicker: {
    backgroundColor: '#f8faff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateInputLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
    width: 60,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e8f0',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  confirmDateButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmDateButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

const TasksScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [timedTasks, setTimedTasks] = useState([]);
  const [streak, setStreak] = useState({ count: 0, lastCompletionDate: null });
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);  
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  // Ajouter un état pour les défis du CIR Day
  const [cirDayChallenges, setCirDayChallenges] = useState([]);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [selectedCategory, setSelectedCategory] = useState('');  
  const [showAddTask, setShowAddTask] = useState(false);
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarPermissionRequested, setCalendarPermissionRequested] = useState(false);
  const [addDueDate, setAddDueDate] = useState(false);
  const [dueDate, setDueDate] = useState(new Date(new Date().setDate(new Date().getDate() + 7))); // Par défaut dans 7 jours
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  
  // État pour organiser les défis en sections
  const [taskSections, setTaskSections] = useState([]);
  
  // État pour l'animation de passage de niveau
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState({
    newLevel: 2,
    previousTitle: "",
    newTitle: "",
    advantages: []
  });
  
  // Animation properties
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [filterAnims] = useState({
    all: new Animated.Value(filter === 'all' ? 1 : 0.7),
    daily: new Animated.Value(filter === 'daily' ? 1 : 0.7),
    completed: new Animated.Value(filter === 'completed' ? 1 : 0.7),
    cirday: new Animated.Value(filter === 'cirday' ? 1 : 0.7)
  });

  const [taskRatings, setTaskRatings] = useState({});

  // Ajouter la fonction pour charger les notations
  const loadTaskRatings = async () => {
    try {
      const userKey = '@challengr_task_ratings';
      const savedRatings = await AsyncStorage.getItem(userKey);
      if (savedRatings) {
        setTaskRatings(JSON.parse(savedRatings));
      }
    } catch (error) {
      console.error('Error loading task ratings:', error);
    }
  };

  const isFirstRender = useRef(true);

  useEffect(() => {
    // Demander les permissions de calendrier au démarrage
    if (!calendarPermissionRequested) {
      requestCalendarPermissions();
      setCalendarPermissionRequested(true);
    }
    // Charger les données
    loadUserData();
    loadTaskRatings();
    // Charger les défis du CIR Day
    loadCirDayChallenges();

    // Configurer l'écouteur de focus pour recharger les données quand on revient sur cet écran
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
      loadTaskRatings();
      loadCirDayChallenges(); // Ajouter le rechargement des défis CIR Day
      // Réappliquer le filtre actuel à chaque focus
      applyFilter(filter);
    });

    return () => {
      unsubscribe();
    };
  }, [navigation]);

  // Appliquer le filtre "all" après le premier chargement des données
  useEffect(() => {
    if (isFirstRender.current && !isLoading) {
      applyFilter('all');
      isFirstRender.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Effet séparé pour les animations afin d'éviter les mises à jour pendant le rendu initial
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Animation at component mount
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300); // Délai de 300ms
    
    return () => clearTimeout(timeout);
  }, []); // Dépendances vides pour ne l'exécuter qu'une seule fois

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Charger les défis standards
      const savedTasks = await retrieveTasks() || [];
      setTasks(savedTasks);
      
      // Charger les défis quotidiens
      const dailyTasksList = await retrieveDailyTasks() || [];
      setDailyTasks(dailyTasksList);
      
      // Charger les défis temporaires (à durée limitée)
      const timedTasksList = await retrieveTimedTasks() || [];
      setTimedTasks(timedTasksList);
      
      // Charger les informations de série
      const userStreak = await retrieveStreak();
      setStreak(userStreak);
      
      // Charger les points et calculer le niveau
      const userPoints = await retrievePoints() || 0;
      setPoints(userPoints);
      
      // Utiliser la fonction centralisée pour calculer le niveau
      const levelInfo = calculateLevel(userPoints);
      setLevel(levelInfo.level);
      
      // Organiser tous les défis en sections
      organizeTasks(savedTasks, dailyTasksList, timedTasksList);
      
      // Appliquer le filtre actuel à tous les défis
      const allTasks = [...dailyTasksList, ...timedTasksList, ...savedTasks];
      applyFilter(filter, allTasks);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Erreur", "Impossible de charger vos données");
      setIsLoading(false);
    }
  };

  // Charger les défis spécifiques au CIR Day
  const loadCirDayChallenges = async () => {
    try {
      // Vérifier d'abord s'il y a des défis CIR Day enregistrés
      const savedCirDayChallenges = await AsyncStorage.getItem('@challengr_cirday_challenges');
      let cirDayChallengesList = [];
      
      if (savedCirDayChallenges) {
        cirDayChallengesList = JSON.parse(savedCirDayChallenges);
      } else {
        // Si aucun défi n'existe encore, créer les défis par défaut pour CIR Day
        cirDayChallengesList = [
          {
            id: 'cirday-1',
            title: "Raconter une blague",
            description: "Faites nous rire avec une blague",
            points: 10,
            difficulty: "EASY",
            difficultyLabel: "Facile",
            category: "CIR_DAY",
            completed: false,
            createdAt: new Date().toISOString(),
            type: CHALLENGE_TYPES.SPECIAL
          },
          {
            id: 'cirday-2',
            title: "Saboter un autre groupe",
            description: "Aidez notre équipe à gagner en sabotant un autre groupe",
            points: 50,
            difficulty: "HARD",
            difficultyLabel: "Difficile",
            category: "CIR_DAY",
            completed: false,
            createdAt: new Date().toISOString(),
            type: CHALLENGE_TYPES.SPECIAL
          },
          {
            id: 'cirday-3',
            title: "Faire 10 pompes",
            description: "Relevez ce défi sportif pendant l'événement",
            points: 25,
            difficulty: "MEDIUM",
            difficultyLabel: "Moyen",
            category: "CIR_DAY",
            completed: false,
            createdAt: new Date().toISOString(),
            type: CHALLENGE_TYPES.SPECIAL
          },
          {
            id: 'cirday-4',
            title: "Selfie de groupe",
            description: "Prenez un selfie avec au moins 4 autres personnes",
            points: 25,
            difficulty: "MEDIUM",
            difficultyLabel: "Moyen",
            category: "CIR_DAY",
            completed: false,
            createdAt: new Date().toISOString(),
            type: CHALLENGE_TYPES.SPECIAL
          },
          {
            id: 'cirday-5',
            title: "Voter pour nous",
            description: "Aidez notre équipe à gagner en votant pour nous",
            points: 100000,
            difficulty: "EASY",
            difficultyLabel: "Facile",
            category: "CIR_DAY",
            completed: false,
            createdAt: new Date().toISOString(),
            type: CHALLENGE_TYPES.SPECIAL
          }
        ];
        
        // Enregistrer les défis CIR Day par défaut
        await AsyncStorage.setItem('@challengr_cirday_challenges', JSON.stringify(cirDayChallengesList));
      }
      
      setCirDayChallenges(cirDayChallengesList);
      
      // Mettre à jour les sections
      organizeTasks(tasks, dailyTasks, timedTasks);
      
    } catch (error) {
      console.error("Erreur lors du chargement des défis CIR Day:", error);
    }
  };

  // Organiser les défis en sections pour l'affichage
  const organizeTasks = (regularTasks, dailyTasks, timedTasks) => {
    const sections = [];
    
    // Section pour les séries si l'utilisateur a une série en cours
    if (streak.count > 0) {
      sections.push({
        title: `🔥 Combo x${streak.count}`,
        data: [],
        info: `Maintenez votre combo en complétant au moins une quête chaque jour. Dernière activité: ${new Date(streak.lastCompletionDate).toLocaleDateString()}`
      });
    }
    
    // Fonction pour filtrer les défis selon le filtre actif
    const filterTask = (task) => {
      if (filter === 'all') return true;
      if (filter === 'daily') return task.type === CHALLENGE_TYPES.DAILY;
      if (filter === 'completed') return task.completed;
      if (filter === 'cirday') return task.category === 'CIR DAY'; // Filtrer par catégorie pour CIR Day
      return true;
    };
      // Section pour les défis quotidiens
    const filteredDailyTasks = dailyTasks.filter(filterTask);
    if (filteredDailyTasks.length > 0) {
      sections.push({
        title: "📅 Quêtes journalières",
        data: filteredDailyTasks,
        info: "Ces quêtes sont générées automatiquement chaque jour. Accomplissez-les pour maintenir votre combo!"
      });
    }
    
    // Section pour les défis temporaires - seulement affichés dans "Tous" ou dans "En cours" s'ils ne sont pas complétés
    const filteredTimedTasks = timedTasks.filter(filterTask);
    if (filteredTimedTasks.length > 0) {
      sections.push({
        title: "⏱️ Quêtes éphémères",
        data: filteredTimedTasks,
        info: "Attention! Ces quêtes disparaîtront bientôt. Relevez le défi avant qu'il ne soit trop tard."
      });
    }
    
    // Section pour les défis CIR Day
    const filteredCirDayChallenges = cirDayChallenges.filter(filterTask);
    if (filteredCirDayChallenges.length > 0) {
      sections.push({
        title: "🎯 Défis CIR Day",
        data: filteredCirDayChallenges,
        info: "Défis spéciaux pour l'événement CIR Day. Participez et gagnez des points bonus!"
      });
    }
    
    // Section pour les défis standards créés par l'utilisateur
    const filteredRegularTasks = regularTasks.filter(filterTask);
    if (filteredRegularTasks.length > 0) {
      // Si on est dans le filtre "completed", on montre tous les défis complétés dans une seule section
      if (filter === 'completed') {
        sections.push({
          title: "✅ Quêtes accomplies",
          data: filteredRegularTasks,
          info: "Journal de vos victoires et accomplissements"
        });
      } else if (filter === 'all') {
        // Sinon, on sépare les défis actifs 
        const activeRegularTasks = filteredRegularTasks.filter(task => !task.completed);
        if (activeRegularTasks.length > 0) {
          sections.push({
            title: "📝 Aventures en cours",
            data: activeRegularTasks,
            info: "Quêtes personnalisées que vous avez créées. Forgez votre destin avec le bouton '+'"
          });
        }
      }
    }
    
    setTaskSections(sections);
  };
    const applyFilter = (filterType, tasksList = tasks) => {
  setFilter(filterType);
  
  // Récupérer toutes les tâches
  const allTasksArray = [...dailyTasks, ...timedTasks, ...tasks, ...cirDayChallenges];
  
  // Mettre à jour les tâches filtrées pour l'affichage selon le nouveau système de filtrage
  let filtered;
  if (filterType === 'all') {
    // "Tous" montre tous les défis
    filtered = allTasksArray;
  } else if (filterType === 'daily') {
    // "Quotidien" montre uniquement les défis quotidiens
    filtered = dailyTasks;
  } else if (filterType === 'completed') {
    // "Complétés" montre tous les défis complétés
    filtered = allTasksArray.filter(task => task.completed);
  } else if (filterType === 'cirday') {
    // "CIR Day" montre uniquement les défis de l'événement CIR Day
    filtered = cirDayChallenges;
  }
  
  setFilteredTasks(filtered);
  
  // Mettre à jour les sections avec le nouveau filtre
  const sections = [];
  // Section pour les séries si l'utilisateur a une série en cours
  if (streak.count > 0 && filterType !== 'cirday' && filterType !== 'completed') {
    sections.push({
      title: `🔥 Combo x${streak.count}`,
      data: [],
      info: `Maintenez votre combo en complétant au moins une quête chaque jour. Dernière activité: ${new Date(streak.lastCompletionDate).toLocaleDateString()}`
    });
  }
  
  // Section spéciale pour les défis complétés
  if (filterType === 'completed') {
    // Organiser les défis complétés par type
    const completedDailyTasks = dailyTasks.filter(task => task.completed);
    const completedTimedTasks = timedTasks.filter(task => task.completed);
    const completedCirDayTasks = cirDayChallenges.filter(task => task.completed);
    const completedUserTasks = tasks.filter(task => task.completed);
    
    if (completedDailyTasks.length > 0) {
      sections.push({
        title: "📅 Quêtes journalières accomplies",
        data: completedDailyTasks,
        info: "Défis quotidiens que vous avez relevés avec succès"
      });
    }
    
    if (completedTimedTasks.length > 0) {
      sections.push({
        title: "⏱️ Quêtes éphémères accomplies",
        data: completedTimedTasks,
        info: "Défis à durée limitée que vous avez complétés à temps"
      });
    }
    
    if (completedCirDayTasks.length > 0) {
      sections.push({
        title: "🎯 Défis CIR Day accomplis",
        data: completedCirDayTasks,
        info: "Défis spéciaux de l'événement CIR Day que vous avez réussis"
      });
    }
    
    if (completedUserTasks.length > 0) {
      sections.push({
        title: "✅ Aventures accomplies",
        data: completedUserTasks,
        info: "Défis personnalisés que vous avez créés et complétés"
      });
    }
    
    setTaskSections(sections);
    return;
  }
  
  // Section spéciale pour les défis CIR Day
  if (filterType === 'cirday') {
    const activeCirDayChallenges = cirDayChallenges.filter(task => !task.completed);
    const completedCirDayChallenges = cirDayChallenges.filter(task => task.completed);
    
    if (activeCirDayChallenges.length > 0) {
      sections.push({
        title: "🎯 Défis CIR Day",
        data: activeCirDayChallenges,
        info: "Défis spéciaux pour l'événement CIR Day. Participez et gagnez des points bonus!"
      });
    }
    
    if (completedCirDayChallenges.length > 0) {
      sections.push({
        title: "✅ Défis CIR Day complétés",
        data: completedCirDayChallenges,
        info: "Défis que vous avez déjà relevés pendant l'événement"
      });
    }
    
    setTaskSections(sections);
    return;
  }

  // Section pour les défis quotidiens
  if (filterType === 'all' || filterType === 'daily') {
    const filteredDailyTasks = filterType === 'daily' ? dailyTasks : dailyTasks.filter(task => !task.completed);
    if (filteredDailyTasks.length > 0) {
      sections.push({
        title: "📅 Quêtes journalières",
        data: filteredDailyTasks,
        info: "Ces quêtes sont générées automatiquement chaque jour. Accomplissez-les pour maintenir votre combo!"
      });
    }
  }

  // Section pour les défis temporaires (uniquement dans All)
  if (filterType === 'all') {
    const activeTimedTasks = timedTasks.filter(task => !task.completed);
    if (activeTimedTasks.length > 0) {
      sections.push({
        title: "⏱️ Quêtes éphémères",
        data: activeTimedTasks,
        info: "Attention! Ces quêtes disparaîtront bientôt. Relevez le défi avant qu'il ne soit trop tard."
      });
    }
  }
  
  // Section pour les défis CIR Day dans l'onglet "Tous"
  if (filterType === 'all') {
    const filteredCirDayChallenges = cirDayChallenges.filter(task => !task.completed);
    if (filteredCirDayChallenges.length > 0) {
      sections.push({
        title: "🎯 Défis CIR Day",
        data: filteredCirDayChallenges,
        info: "Défis spéciaux pour l'événement CIR Day. Participez et gagnez des points bonus!"
      });
    }
  }

  // Section pour les défis standards
  if (filterType === 'all') {
    const activeRegularTasks = tasks.filter(task => !task.completed);
    if (activeRegularTasks.length > 0) {
      sections.push({
        title: "📝 Aventures en cours",
        data: activeRegularTasks,
        info: "Quêtes personnalisées que vous avez créées. Forgez votre destin avec le bouton '+'"
      });
    }
    
    // Ajouter une section pour montrer quelques tâches complétées récentes dans l'onglet Tous
    const recentCompletedTasks = allTasksArray
      .filter(task => task.completed)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 3); // Montrer seulement les 3 plus récentes
    
    if (recentCompletedTasks.length > 0) {
      sections.push({
        title: "✅ Accomplissements récents",
        data: recentCompletedTasks,
        info: "Vos succès les plus récents. Voir l'onglet 'Accomplies' pour tout afficher."
      });
    }
  }

  setTaskSections(sections);
};

  // Fonction pour animer les filtres lors de la sélection
  const animateFilter = (newFilter) => {
    // Reset all animations
    Object.keys(filterAnims).forEach(key => {
      Animated.spring(filterAnims[key], {
        toValue: key === newFilter ? 1 : 0.7,
        useNativeDriver: true,
        friction: 7,
        tension: 40
      }).start();
    });

    applyFilter(newFilter);
  };

  const renderFilterButton = (filterKey, icon, label) => {
    const isActive = filter === filterKey;
    
    return (
      <Animated.View
        style={[
          styles.filterButtonContainer,
          {
            transform: [{ scale: filterAnims[filterKey] }],
            opacity: filterAnims[filterKey]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            isActive && styles.activeFilter
          ]}
          onPress={() => animateFilter(filterKey)}
        >
          <Icon
            name={icon}
            size={18}
            color={isActive ? '#fff' : '#666'}
            style={styles.filterIcon}
          />
          <Text style={[
            styles.filterText,
            isActive && styles.activeFilterText
          ]}>
            {label}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const handleCompleteTask = async (id) => {
    try {
      // Trouver d'abord le défi dans toutes les catégories
      let task = null;
      let taskType = null;
      
      // Vérifier dans les défis standards
      const standardTask = tasks.find(t => t.id === id);
      if (standardTask) {
        task = standardTask;
        taskType = 'standard';
      }
      
      // Vérifier dans les défis quotidiens
      if (!task) {
        const dailyTask = dailyTasks.find(t => t.id === id);
        if (dailyTask) {
          task = dailyTask;
          taskType = 'daily';
        }
      }
      
      // Vérifier dans les défis temporaires
      if (!task) {
        const timedTask = timedTasks.find(t => t.id === id);
        if (timedTask) {
          task = timedTask;
          taskType = 'timed';
        }
      }
      
      // Vérifier dans les défis CIR Day
      if (!task) {
        const cirDayTask = cirDayChallenges.find(t => t.id === id);
        if (cirDayTask) {
          task = cirDayTask;
          taskType = 'cirday';
        }
      }
      
      if (!task || task.completed) return;

      // Marquer immédiatement le défi comme complété dans l'état local
      const updateTaskLocally = (tasksList, taskId) => {
        return tasksList.map(t => t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t);
      };

      if (taskType === 'standard') {
        setTasks(updateTaskLocally(tasks, id));
      } else if (taskType === 'daily') {
        setDailyTasks(updateTaskLocally(dailyTasks, id));
      } else if (taskType === 'timed') {
        setTimedTasks(updateTaskLocally(timedTasks, id));
      } else if (taskType === 'cirday') {
        const updatedCirDayChallenges = updateTaskLocally(cirDayChallenges, id);
        setCirDayChallenges(updatedCirDayChallenges);
        await AsyncStorage.setItem('@challengr_cirday_challenges', JSON.stringify(updatedCirDayChallenges));
      }
      
      // Calculer les points avec le bonus
      const levelInfo = calculateLevel(points);
      const bonusMultiplier = levelInfo.bonusMultiplier;
      const basePoints = task.points;
      // Points bonus spéciaux pour les défis CIR Day
      const pointsToAdd = taskType === 'cirday' 
        ? Math.floor(basePoints * bonusMultiplier * 1.5) // 50% bonus supplémentaire pour les défis CIR Day
        : Math.floor(basePoints * bonusMultiplier);
      
      // Mettre à jour les points et le défi dans la base de données
      await Promise.all([
        addPoints(pointsToAdd),
        completeTask(id)
      ]);
      
      // Ajouter les points à la catégorie si la tâche a une catégorie
      if (task.category) {
        await addCategoryPoints(task.category, pointsToAdd);
      }

      // Mettre à jour la série si c'est un défi quotidien
      if (taskType === 'daily') {
        const updatedStreak = await updateStreak();
        setStreak(updatedStreak);
      }

      // Mettre à jour l'état avec les nouveaux points
      const newPoints = points + pointsToAdd;
      setPoints(newPoints);

      // Vérifier le passage de niveau
      const newLevelInfo = calculateLevel(newPoints);
      if (newLevelInfo.level > levelInfo.level) {
        setLevelUpInfo({
          newLevel: newLevelInfo.level,
          previousTitle: levelInfo.title,
          newTitle: newLevelInfo.title,
          advantages: newLevelInfo.advantages || []
        });
        setShowLevelUpAnimation(true);
      }

      // Message spécial pour les défis CIR Day
      if (taskType === 'cirday') {
        Alert.alert(
          "Défi CIR Day complété !",
          `Merci pour votre participation ! Vous avez gagné ${pointsToAdd} points (avec bonus spécial CIR Day de 50%)`,
          [{ text: "Super !" }]
        );
      }

      // Réorganiser les sections
      const allTasks = [
        ...updateTaskLocally(dailyTasks, id),
        ...updateTaskLocally(timedTasks, id),
        ...updateTaskLocally(tasks, id),
        ...updateTaskLocally(cirDayChallenges, id)
      ];
      organizeTasks(tasks, dailyTasks, timedTasks);
      applyFilter(filter, allTasks);

    } catch (error) {
      console.error("Error completing task:", error);
      Alert.alert("Erreur", "Impossible de compléter ce défi");
    }
  };
  
  const handleDeleteTask = async (id) => {
    Alert.alert(
      "Supprimer ce défi",
      "Êtes-vous sûr de vouloir supprimer ce défi?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              // Appeler la fonction deleteTask qui gère tous les types de défis
              const updatedStandardTasks = await deleteTask(id);
              setTasks(updatedStandardTasks);
              
              // Recharger également les défis quotidiens et temporaires, juste pour s'assurer 
              // que l'UI est bien synchronisée
              const dailyTasksList = await retrieveDailyTasks() || [];
              const timedTasksList = await retrieveTimedTasks() || [];
              
              setDailyTasks(dailyTasksList);
              setTimedTasks(timedTasksList);
              
              // Réorganiser les défis en sections
              organizeTasks(updatedStandardTasks, dailyTasksList, timedTasksList);
              
              // Appliquer le filtre actuel à tous les défis mis à jour
              const allTasks = [...dailyTasksList, ...timedTasksList, ...updatedStandardTasks];
              applyFilter(filter, allTasks);
              
              // Affichage d'un message de confirmation
              Alert.alert("Défi supprimé", "Le défi a été supprimé avec succès.");
              
            } catch (error) {
              console.error("Error deleting task:", error);
              Alert.alert("Erreur", "Impossible de supprimer ce défi");
            }
          } 
        }
      ]
    );
  };
  
  const handleAddTask = async () => {
    if (newTaskTitle.trim() === '') {
      Alert.alert("Champ requis", "Veuillez donner un titre à votre défi");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Champ requis", "Veuillez sélectionner une catégorie pour votre défi");
      return;
    }
    
    const difficultyInfo = DIFFICULTY_LEVELS[difficulty];
    const newTask = {
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || 'Aucune description',
      points: difficultyInfo.points,
      difficulty: difficulty,
      difficultyLabel: difficultyInfo.name,
      category: selectedCategory,
      dueDate: addDueDate ? dueDate.toISOString() : null, // Ajouter la date d'échéance si activée
    };
    
    try {
      // Créer le défi dans la base de données
      const createdTask = await createTask(newTask);

      if (!createdTask) {
        throw new Error("Échec de la création du défi");
      }

      // Mettre à jour l'état local
      const updatedTasks = [...tasks, createdTask];
      setTasks(updatedTasks);
      
      // Mettre à jour les sections après l'ajout
      organizeTasks(updatedTasks, dailyTasks, timedTasks);
      
      // Appliquer le filtre actuel à tous les défis
      const allTasks = [...dailyTasks, ...timedTasks, ...updatedTasks];
      applyFilter(filter, allTasks);
      
      // Réinitialiser le formulaire
      setNewTaskTitle('');
      setNewTaskDescription('');
      setDifficulty('MEDIUM');
      setSelectedCategory('');
      
      // Fermer le formulaire
      toggleAddTaskForm();
      
      // Confirmation
      let messageConfirmation = "Votre nouveau défi a été ajouté avec succès";
      
      // Ajouter l'info de la date d'échéance si activée
      if (addDueDate) {
        messageConfirmation += `. Il devra être complété avant le ${dueDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}`;
      }
      
      messageConfirmation += ".";
      
      Alert.alert("Défi créé !", messageConfirmation);
    } catch (error) {
      console.error("Error adding task:", error);
      Alert.alert("Erreur", "Impossible d'ajouter ce défi");
    }
  };
  
  const toggleAddTaskForm = () => {
    if (showAddTask) {
      // Animation de fermeture
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.8,
          useNativeDriver: true,
          friction: 5,
          tension: 40
        })
      ]).start(() => {
        setShowAddTask(false);
      });
    } else {
      setShowAddTask(true);
      // Animation d'ouverture
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 40
        })
      ]).start();
    }
  };
  
  const handleLevelInfoPress = () => {
    setShowLevelInfo(true);
  };
  
  const renderLevelInfo = () => {
    // Utiliser la fonction utilitaire pour calculer les informations détaillées du niveau
    const levelInfo = calculateLevel(points);
    
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLevelInfo}
        onRequestClose={() => setShowLevelInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Système de Niveaux</Text>
            
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalSubtitle}>Votre progression</Text>
              
              {/* Titre du niveau */}
              <View style={styles.levelTitleContainer}>
                <Text style={styles.levelTitle}>{levelInfo.title}</Text>
                <Text style={styles.levelDescription}>{levelInfo.description}</Text>
              </View>
              
              <View style={styles.levelInfoRow}>
                <Text style={styles.levelInfoLabel}>Niveau actuel:</Text>
                <Text style={styles.levelInfoValue}>{level}</Text>
              </View>
              <View style={styles.levelInfoRow}>
                <Text style={styles.levelInfoLabel}>Points accumulés:</Text>
                <Text style={styles.levelInfoValue}>{points} points</Text>
              </View>
              <View style={styles.levelInfoRow}>
                <Text style={styles.levelInfoLabel}>Prochain niveau:</Text>
                <Text style={styles.levelInfoValue}>{levelInfo.nextLevelTitle}</Text>
              </View>
              <View style={styles.levelInfoRow}>
                <Text style={styles.levelInfoLabel}>Points pour niveau {level + 1}:</Text>
                <Text style={styles.levelInfoValue}>{levelInfo.pointsForNextLevel} points</Text>
              </View>
              <View style={styles.levelInfoRow}>
                <Text style={styles.levelInfoLabel}>Points restants:</Text>
                <Text style={styles.levelInfoValue}>{levelInfo.remainingPoints} points</Text>
              </View>
              
              {/* Affichage des avantages du niveau */}
              <Text style={styles.modalSubtitle}>Avantages de votre niveau</Text>
              <View style={styles.advantagesContainer}>
                {levelInfo.advantages.map((advantage, index) => (
                  <View key={index} style={styles.advantageItem}>
                    <Icon name="checkmark-circle" size={20} color={COLORS.success} style={styles.advantageIcon} />
                    <Text style={styles.advantageText}>{advantage}</Text>
                  </View>
                ))}
              </View>
              
              {/* Bonus de points */}
              {levelInfo.bonusMultiplier > 1 && (
                <View style={styles.bonusContainer}>
                  <Text style={styles.bonusTitle}>
                    Bonus de points actuel: +{Math.round((levelInfo.bonusMultiplier - 1) * 100)}%
                  </Text>
                  <Text style={styles.bonusDescription}>
                    À votre niveau, vous recevez {Math.round((levelInfo.bonusMultiplier - 1) * 100)}% de points supplémentaires pour chaque défi complété.
                  </Text>
                </View>
              )}
              
              <Text style={styles.modalSubtitle}>Comment gagner des points</Text>
              <View style={styles.difficultyInfoCard}>
                <View style={[styles.difficultyIcon, {backgroundColor: DIFFICULTY_LEVELS.EASY.color}]}>
                  <Icon name="star" size={16} color="#fff" />
                </View>
                <View style={styles.difficultyInfoContent}>
                  <Text style={styles.difficultyInfoTitle}>Défi Facile</Text>
                  <Text style={styles.difficultyInfoPoints}>
                    +{DIFFICULTY_LEVELS.EASY.points} points 
                    {levelInfo.bonusMultiplier > 1 ? 
                      ` (avec bonus: +${Math.floor(DIFFICULTY_LEVELS.EASY.points * levelInfo.bonusMultiplier)} points)` : 
                      ''}
                  </Text>
                </View>
              </View>
              
              <View style={styles.difficultyInfoCard}>
                <View style={[styles.difficultyIcon, {backgroundColor: DIFFICULTY_LEVELS.MEDIUM.color}]}>
                  <Icon name="star" size={16} color="#fff" />
                  <Icon name="star" size={16} color="#fff" />
                </View>
                <View style={styles.difficultyInfoContent}>
                  <Text style={styles.difficultyInfoTitle}>Défi Moyen</Text>
                  <Text style={styles.difficultyInfoPoints}>
                    +{DIFFICULTY_LEVELS.MEDIUM.points}
                    {levelInfo.bonusMultiplier > 1 ? 
                      ` (avec bonus: +${Math.floor(DIFFICULTY_LEVELS.MEDIUM.points * levelInfo.bonusMultiplier)} points)` : 
                      ''}
                  </Text>
                </View>
              </View>
              
              <View style={styles.difficultyInfoCard}>
                <View style={[styles.difficultyIcon, {backgroundColor: DIFFICULTY_LEVELS.HARD.color}]}>
                  <Icon name="star" size={16} color="#fff" />
                  <Icon name="star" size={16} color="#fff" />
                  <Icon name="star" size={16} color="#fff" />
                </View>
                <View style={styles.difficultyInfoContent}>
                  <Text style={styles.difficultyInfoTitle}>Défi Difficile</Text>
                  <Text style={styles.difficultyInfoPoints}>
                    +{DIFFICULTY_LEVELS.HARD.points}
                    {levelInfo.bonusMultiplier > 1 ? 
                      ` (avec bonus: +${Math.floor(DIFFICULTY_LEVELS.HARD.points * levelInfo.bonusMultiplier)} points)` : 
                      ''}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.modalSubtitle}>Avantages des niveaux supérieurs</Text>
              <Text style={styles.modalText}>
                En montant de niveau, vous débloquerez des fonctionnalités exclusives, des badges,
                des bonus de points et des défis spéciaux. Continuez à relever des défis pour progresser !
              </Text>
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowLevelInfo(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.info && <Text style={styles.sectionInfo}>{section.info}</Text>}
    </View>
  );

  const handleRateTask = async (taskId, rating) => {
    try {
      const userKey = '@challengr_task_ratings';
      const updatedRatings = { ...taskRatings, [taskId]: rating };
      
      await AsyncStorage.setItem(userKey, JSON.stringify(updatedRatings));
      setTaskRatings(updatedRatings);
      
      // Mettre à jour la liste des tâches pour refléter la nouvelle notation
      loadUserData();
    } catch (error) {
      console.error("Error saving rating:", error);
    }
  };

  const renderItem = ({ item, section, index }) => {
    const difficultyInfo = DIFFICULTY_LEVELS[item.difficulty] || DIFFICULTY_LEVELS.MEDIUM;
    const sectionIndex = taskSections.indexOf(section);
    let globalIndex = index;
    
    for (let i = 0; i < sectionIndex; i++) {
      globalIndex += taskSections[i].data.length;
    }
      return (
      <Task
        title={item.title}
        description={item.description}
        points={item.points}
        difficulty={item.difficultyLabel || difficultyInfo.name}
        difficultyColor={difficultyInfo.color}
        completed={item.completed}
        type={item.type}
        category={item.category}
        expiresAt={item.expiresAt}
        dueDate={item.dueDate}
        completedAt={item.completedAt}
        streak={streak?.count}
        onComplete={() => handleCompleteTask(item.id)}
        onDelete={() => handleDeleteTask(item.id)}
        onRate={(rating) => handleRateTask(item.id, rating)}
        userRating={taskRatings[item.id]}
        index={globalIndex}
      />
    );
  };
  
  const renderDifficultySelector = () => (
    <View style={styles.difficultyContainer}>
      <Text style={styles.difficultyLabel}>Difficulté:</Text>
      <View style={styles.difficultyButtons}>
        {Object.entries(DIFFICULTY_LEVELS).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.difficultyButton,
              difficulty === key && { backgroundColor: value.color }
            ]}
            onPress={() => setDifficulty(key)}
          >
            <Text style={[
              styles.difficultyButtonText,
              difficulty === key && styles.activeDifficultyText
            ]}>
              {value.name} ({value.points} pts)
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCategorySelector = () => {
    const categories = [
      CHALLENGE_CATEGORIES.SPORT,
      CHALLENGE_CATEGORIES.CUISINE,
      CHALLENGE_CATEGORIES.TRAVAIL,
      CHALLENGE_CATEGORIES.LECTURE,
      CHALLENGE_CATEGORIES.RELAXATION,
    ];

    return (
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryLabel}>Catégorie:</Text>
        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  isSelected && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Icon
                  name={category.icon}
                  size={16}
                  color={isSelected ? category.color : '#666'}
                  style={styles.categoryIcon}
                />
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTasksByType = () => {
    return (
      <SectionList
        sections={taskSections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={styles.tasksList}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={GAMING_COLORS.headerBg} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Mes Quêtes</Text>
              <Text style={styles.headerSubtitle}>
                Rang {level} • {points} XP
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.levelInfoButton}
                onPress={handleLevelInfoPress}
              >
                <Icon name="information-circle-outline" size={24} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={toggleAddTaskForm}
              >
                <Text style={styles.addButtonText}>
                  {showAddTask ? 'Annuler' : '+ Nouvelle quête'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {showAddTask && (
          <>
            <TouchableOpacity 
              style={styles.backdrop}
              activeOpacity={1} 
              onPress={toggleAddTaskForm}
            />
            <Animated.View 
              style={[
                styles.addTaskForm,
                {
                  opacity: opacityAnim,
                  transform: [
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              <ScrollView style={styles.addTaskFormScroll}>
                <View style={styles.addTaskFormContent}>
                  <Text style={styles.formTitle}>Créer un nouveau défi</Text>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Titre du défi"
                    placeholderTextColor="#999"
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                  />
                  
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description (optionnelle)"
                    placeholderTextColor="#999"
                    value={newTaskDescription}
                    onChangeText={setNewTaskDescription}
                    multiline
                    numberOfLines={3}
                  />
                  
                  {renderCategorySelector()}
                  {renderDifficultySelector()}
                  
                  {/* Option d'ajout d'une date d'échéance maximale */}
                  <View style={styles.calendarOptionContainer}>
                    <Text style={styles.difficultyLabel}>Date d'échéance:</Text>
                    <View style={styles.calendarOptionRow}>
                      <Text style={styles.calendarOptionText}>
                        Définir une date limite pour ce défi
                      </Text>
                      <Switch
                        value={addDueDate}
                        onValueChange={setAddDueDate}
                        trackColor={{ false: "#d1d8e0", true: `${COLORS.secondary}80` }}
                        thumbColor={addDueDate ? COLORS.secondary : "#f4f3f4"}
                      />
                    </View>
                    
                    {/* Date picker visible seulement si addDueDate est activé */}
                    {addDueDate && (
                      <View style={styles.datePickerContainer}>
                        <Text style={styles.datePickerLabel}>Date limite de réalisation :</Text>
                        <TouchableOpacity 
                          style={styles.datePickerButton}
                          onPress={() => setShowDueDatePicker(true)}
                        >
                          <Icon name="calendar" size={20} color="#3498db" style={styles.datePickerIcon} />
                          <Text style={styles.datePickerText}>
                            {dueDate.toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </Text>
                          <Icon name="chevron-down" size={18} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        
                        {/* Date Picker modal pour une meilleure expérience utilisateur */}
                        {showDueDatePicker && (
                          <View style={styles.datePickerModalContainer}>
                            <View style={styles.datePickerHeader}>
                              <Text style={styles.datePickerTitle}>Choisir une date d'échéance</Text>
                              <TouchableOpacity onPress={() => setShowDueDatePicker(false)}>
                                <Icon name="close" size={24} color={COLORS.textSecondary} />
                              </TouchableOpacity>
                            </View>
                            <View style={styles.datePickerContent}>
                              {Platform.OS === 'android' ? (
                                <DateTimePicker
                                  testID="dueDateTimePicker"
                                  value={dueDate}
                                  mode="date"
                                  is24Hour={true}
                                  display="calendar"
                                  onChange={(event, date) => {
                                    setShowDueDatePicker(false);
                                    if (date) setDueDate(date);
                                  }}
                                  minimumDate={new Date()}
                                />
                              ) : (
                                <View style={styles.simpleDatePicker}>
                                  {/* Options de date rapides */}
                                  <View style={styles.quickDateOptions}>
                                    <TouchableOpacity
                                      style={styles.quickDateButton}
                                      onPress={() => {
                                        const nextWeek = new Date();
                                        nextWeek.setDate(nextWeek.getDate() + 7);
                                        setDueDate(nextWeek);
                                        setShowDueDatePicker(false);
                                      }}
                                    >
                                      <Text style={styles.quickDateButtonText}>Dans 1 semaine</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                      style={styles.quickDateButton}
                                      onPress={() => {
                                        const twoWeeks = new Date();
                                        twoWeeks.setDate(twoWeeks.getDate() + 14);
                                        setDueDate(twoWeeks);
                                        setShowDueDatePicker(false);
                                      }}
                                    >
                                      <Text style={styles.quickDateButtonText}>Dans 2 semaines</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                      style={styles.quickDateButton}
                                      onPress={() => {
                                        const oneMonth = new Date();
                                        oneMonth.setMonth(oneMonth.getMonth() + 1);
                                        setDueDate(oneMonth);
                                        setShowDueDatePicker(false);
                                      }}
                                    >
                                      <Text style={styles.quickDateButtonText}>Dans 1 mois</Text>
                                    </TouchableOpacity>
                                  </View>
                                  
                                  {/* Sélecteur manuel (simple) */}
                                  <View style={styles.manualDatePicker}>
                                    <View style={styles.dateInputRow}>
                                      <Text style={styles.dateInputLabel}>Jour:</Text>
                                      <TextInput
                                        style={styles.dateInput}
                                        value={dueDate.getDate().toString()}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        onChangeText={(text) => {
                                          const day = parseInt(text) || 1;
                                          const newDate = new Date(dueDate);
                                          newDate.setDate(day);
                                          setDueDate(newDate);
                                        }}
                                      />
                                    </View>
                                    
                                    <View style={styles.dateInputRow}>
                                      <Text style={styles.dateInputLabel}>Mois:</Text>
                                      <TextInput
                                        style={styles.dateInput}
                                        value={(dueDate.getMonth() + 1).toString()}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        onChangeText={(text) => {
                                          const month = parseInt(text) || 1;
                                          const newDate = new Date(dueDate);
                                          newDate.setMonth(month - 1);
                                          setDueDate(newDate);
                                        }}
                                      />
                                    </View>
                                    
                                    <View style={styles.dateInputRow}>
                                      <Text style={styles.dateInputLabel}>Année:</Text>
                                      <TextInput
                                        style={styles.dateInput}
                                        value={dueDate.getFullYear().toString()}
                                        keyboardType="number-pad"
                                        maxLength={4}
                                        onChangeText={(text) => {
                                          const year = parseInt(text) || 2025;
                                          const newDate = new Date(dueDate);
                                          newDate.setFullYear(year);
                                          setDueDate(newDate);
                                        }}
                                      />
                                    </View>
                                  </View>
                                  
                                  <TouchableOpacity
                                    style={styles.confirmDateButton}
                                    onPress={() => setShowDueDatePicker(false)}
                                  >
                                    <Text style={styles.confirmDateButtonText}>Confirmer</Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleAddTask}
                  >
                    <Text style={styles.submitButtonText}>Ajouter le défi</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </>
        )}
        
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterButtons}
          >
            {renderFilterButton('all', 'apps', 'Toutes')}
            {renderFilterButton('daily', 'calendar', 'Journalières')}
            {renderFilterButton('completed', 'checkmark-circle', 'Accomplies')}
            {renderFilterButton('cirday', 'trophy', 'CIR Day')}
          </ScrollView>
        </View>
        
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Animated.View style={{opacity: opacityAnim}}>
              <Icon name="list" size={60} color="#d1d8e0" />
              <Text style={styles.emptyText}>
                Aucune quête{filter !== 'all' ? ' dans cette catégorie' : ''}
              </Text>
              <Text style={styles.emptySubText}>
                {filter === 'all' 
                  ? 'Créez votre première quête en appuyant sur "+ Nouvelle quête"'
                  : filter === 'daily'
                    ? 'Aucune quête journalière disponible pour le moment'
                    : 'Accomplissez des quêtes pour les voir ici'
                }
              </Text>
              {filter !== 'all' && (
                <TouchableOpacity 
                  style={styles.emptyActionButton}
                  onPress={() => applyFilter('all')}
                >
                  <Text style={styles.emptyActionButtonText}>Voir toutes les quêtes</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>
        ) : (
          renderTasksByType()
        )}
        
        {renderLevelInfo()}
        
        {/* Animation de passage de niveau */}
        <LevelUpAnimation
          visible={showLevelUpAnimation}
          level={levelUpInfo.newLevel}
          previousTitle={levelUpInfo.previousTitle}
          newTitle={levelUpInfo.newTitle}
          advantages={levelUpInfo.advantages}
          onClose={() => setShowLevelUpAnimation(false)}
        />
      </View>
      
      {/* Espace blanc ajouté en bas de la page des défis */}
      <View style={{ height: 40 }} />
    </SafeAreaView>
  );
};

export default TasksScreen;
