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
  SectionList
} from 'react-native';
import * as ReactNative from 'react-native';
const Platform = ReactNative.Platform;
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
  createTimedTask
} from '../utils/storage';
import { 
  DIFFICULTY_LEVELS, 
  SCREEN, 
  calculateLevel, 
  generateUniqueId, 
  CHALLENGE_CATEGORIES, 
  CHALLENGE_TYPES 
} from '../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Suppression du composant CustomNavBar

const TasksScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [timedTasks, setTimedTasks] = useState([]);
  const [streak, setStreak] = useState({ count: 0, lastCompletionDate: null });
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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

  const [filterAnims] = useState({
    all: new Animated.Value(filter === 'all' ? 1 : 0.7),
    active: new Animated.Value(filter === 'active' ? 1 : 0.7),
    completed: new Animated.Value(filter === 'completed' ? 1 : 0.7)
  });

  useEffect(() => {
    // Charger les données en premier
    loadUserData();
    
    // Ajouter un léger délai avant de lancer les animations
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
    }, 300); // Délai de 300ms pour laisser le temps aux données de se charger
    
    // Configurer l'écouteur de focus pour recharger les données quand on revient sur cet écran
    const unsubscribe = navigation.addListener('focus', () => {
      // Recharger les données à chaque fois que l'écran retrouve le focus
      loadUserData();
    });
    
    // Nettoyer les timeouts et écouteurs quand le composant est démonté
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [navigation]);
  
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
  
  // Organiser les défis en sections pour l'affichage
  const organizeTasks = (regularTasks, dailyTasks, timedTasks) => {
    const sections = [];
    
    // Section pour les séries si l'utilisateur a une série en cours
    if (streak.count > 0) {
      sections.push({
        title: `🔥 Série de ${streak.count} jour${streak.count > 1 ? 's' : ''}`,
        data: [],
        info: `Maintenez votre série en complétant au moins un défi chaque jour. Votre dernière activité: ${new Date(streak.lastCompletionDate).toLocaleDateString()}`
      });
    }
    
    // Filtrer les tâches selon le filtre actuel
    const filterTask = (task) => {
      if (filter === 'all') return true;
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    };
    
    // Section pour les défis quotidiens (filtrés)
    const filteredDailyTasks = dailyTasks.filter(filterTask);
    if (filteredDailyTasks.length > 0) {
      sections.push({
        title: "📅 Défis quotidiens",
        data: filteredDailyTasks,
        info: "Ces défis se renouvellent chaque jour. Complétez-les pour maintenir votre série!"
      });
    }
    
    // Section pour les défis temporaires (filtrés)
    const filteredTimedTasks = timedTasks.filter(filterTask);
    if (filteredTimedTasks.length > 0) {
      sections.push({
        title: "⏱️ Défis à durée limitée",
        data: filteredTimedTasks,
        info: "Attention! Ces défis expirent bientôt. Relevez-les avant qu'il ne soit trop tard."
      });
    }
    
    // Section pour les défis standards
    if (regularTasks.length > 0) {
      // Filtrer selon le filtre actif
      const filteredRegularTasks = regularTasks.filter(filterTask);
      
      if (filter === 'all' || filter === 'active') {
        const activeRegularTasks = filteredRegularTasks.filter(task => !task.completed);
        if (activeRegularTasks.length > 0) {
          sections.push({
            title: "📝 Mes défis en cours",
            data: activeRegularTasks
          });
        }
      }
      
      if (filter === 'all' || filter === 'completed') {
        const completedRegularTasks = filteredRegularTasks.filter(task => task.completed);
        if (completedRegularTasks.length > 0) {
          sections.push({
            title: "✅ Défis complétés",
            data: completedRegularTasks
          });
        }
      }
    }
    
    setTaskSections(sections);
  };
  
  const applyFilter = (filterType, tasksList = tasks) => {
    setFilter(filterType);
    
    // Mettre à jour les tâches filtrées pour l'affichage
    const allTasksArray = [...dailyTasks, ...timedTasks, ...tasks];
    
    if (filterType === 'all') {
      setFilteredTasks(allTasksArray);
    } else if (filterType === 'active') {
      setFilteredTasks(allTasksArray.filter(task => !task.completed));
    } else if (filterType === 'completed') {
      setFilteredTasks(allTasksArray.filter(task => task.completed));
    }
    
    // Ensuite mettre à jour les sections avec le nouveau filtre
    organizeTasks(tasks, dailyTasks, timedTasks);
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
      // Chercher dans tous les types de défis
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
      
      // Si la tâche n'est pas trouvée ou déjà complétée, arrêter
      if (!task || task.completed) return;
      
      // Récupérer les informations du niveau actuel pour calculer le bonus
      const levelInfo = calculateLevel(points);
      const currentLevel = levelInfo.level;
      
      // Calculer les points à ajouter en tenant compte du bonus de niveau
      const basePoints = task.points;
      const bonusMultiplier = levelInfo.bonusMultiplier;
      const pointsToAdd = Math.floor(basePoints * bonusMultiplier);
      
      // Ajouter les points et mettre à jour la tâche selon son type
      await addPoints(pointsToAdd);
      
      let updatedTasks = [...tasks];
      
      if (taskType === 'standard') {
        // Mise à jour des défis standards
        updatedTasks = await completeTask(id);
        setTasks(updatedTasks);
      } else if (taskType === 'daily') {
        // Mise à jour des défis quotidiens
        const updatedDailyTasks = dailyTasks.map(t => 
          t.id === id ? { ...t, completed: true } : t
        );
        await AsyncStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(updatedDailyTasks));
        setDailyTasks(updatedDailyTasks);
        // Mettre à jour la série quotidienne
        const updatedStreak = await updateStreak();
        setStreak(updatedStreak);
      } else if (taskType === 'timed') {
        // Mise à jour des défis temporaires
        const updatedTimedTasks = timedTasks.map(t => 
          t.id === id ? { ...t, completed: true } : t
        );
        await AsyncStorage.setItem(TIMED_TASKS_KEY, JSON.stringify(updatedTimedTasks));
        setTimedTasks(updatedTimedTasks);
      }
      
      // Recalculer le niveau après l'ajout des points
      const newPoints = points + pointsToAdd;
      const newLevelInfo = calculateLevel(newPoints);
      
      // Vérifier si l'utilisateur a monté de niveau
      if (newLevelInfo.level > currentLevel) {
        // Récupérer les avantages débloqués pour ce niveau
        const advantages = newLevelInfo.advantages || [];
        
        // Préparer les informations pour l'animation de passage de niveau
        setLevelUpInfo({
          newLevel: newLevelInfo.level,
          previousTitle: levelInfo.title,
          newTitle: newLevelInfo.title,
          advantages: advantages
        });
        
        // Mettre à jour les points et le niveau dans l'état
        setPoints(newPoints);
        setLevel(newLevelInfo.level);
        
        // Afficher l'animation de passage de niveau
        setTimeout(() => {
          setShowLevelUpAnimation(true);
        }, 500);
      } else {
        // Si pas de nouveau niveau, afficher le message normal
        let successMessage = `Félicitations ! Vous avez gagné ${pointsToAdd} points.`;
        
        // Ajouter un message sur le bonus si applicable
        if (bonusMultiplier > 1) {
          const bonusPoints = pointsToAdd - basePoints;
          successMessage += `\n(Inclut un bonus de niveau de +${bonusPoints} points)`;
        }
        
        // Animation et feedback
        Alert.alert(
          "Défi complété !",
          successMessage,
          [{ text: "Super !" }]
        );
        
        // Mettre à jour les points
        setPoints(newPoints);
      }
      
      // Réorganiser tous les défis en sections
      organizeTasks(updatedTasks, dailyTasks, timedTasks);
      
      // Appliquer le filtre actuel à tous les défis
      const allTasks = [...dailyTasks, ...timedTasks, ...updatedTasks];
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
    
    const difficultyInfo = DIFFICULTY_LEVELS[difficulty];
    
    const newTask = {
      id: generateUniqueId(),
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || 'Aucune description',
      points: difficultyInfo.points,
      difficulty: difficulty,
      difficultyLabel: difficultyInfo.name,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    
    try {
      const updatedTasks = [...tasks, newTask];
      await saveTasks(updatedTasks);
      
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
      
      // Fermer le formulaire
      toggleAddTaskForm();
      
      // Confirmation
      Alert.alert("Défi créé !", "Votre nouveau défi a été ajouté avec succès.");
    } catch (error) {
      console.error("Error adding task:", error);
      Alert.alert("Erreur", "Impossible d'ajouter ce défi");
    }
  };
  
  const toggleAddTaskForm = () => {
    if (showAddTask) {
      // Animation de fermeture
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowAddTask(false);
      });
    } else {
      // Ouvrir le formulaire puis lancer l'animation
      setShowAddTask(true);
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
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
  
  const renderItem = ({ item }) => {
    const difficultyInfo = DIFFICULTY_LEVELS[item.difficulty] || DIFFICULTY_LEVELS.MEDIUM;
    
    return (
      <Task
        title={item.title}
        description={item.description}
        points={item.points}
        difficulty={item.difficultyLabel || difficultyInfo.name}
        difficultyColor={difficultyInfo.color}
        completed={item.completed}
        onComplete={() => handleCompleteTask(item.id)}
        onDelete={() => handleDeleteTask(item.id)}
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Mes Défis</Text>
              <Text style={styles.headerSubtitle}>
                Niveau {level} • {points} points
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
                  {showAddTask ? 'Annuler' : '+ Nouveau défi'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {showAddTask && (
          <Animated.View 
            style={[
              styles.addTaskForm,
              {opacity: opacityAnim}
            ]}
          >
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
            
            {renderDifficultySelector()}
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddTask}
            >
              <Text style={styles.submitButtonText}>Ajouter le défi</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterButtons}
          >
            {renderFilterButton('all', 'apps', 'Tous')}
            {renderFilterButton('active', 'time', 'En cours')}
            {renderFilterButton('completed', 'checkmark-circle', 'Complétés')}
          </ScrollView>
        </View>
        
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Animated.View style={{opacity: opacityAnim}}>
              <Icon name="list" size={60} color="#d1d8e0" />
              <Text style={styles.emptyText}>Aucun défi {filter !== 'all' ? 'dans cette catégorie' : ''}</Text>
              <Text style={styles.emptySubText}>
                {filter === 'all' 
                  ? 'Créez votre premier défi en appuyant sur "+ Nouveau défi"'
                  : filter === 'active'
                    ? 'Vous avez complété tous vos défis !'
                    : 'Complétez des défis pour les voir ici'
                }
              </Text>
              
              {filter !== 'all' && (
                <TouchableOpacity 
                  style={styles.emptyActionButton}
                  onPress={() => applyFilter('all')}
                >
                  <Text style={styles.emptyActionButtonText}>Voir tous les défis</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>
        ) : (
          <SectionList
            sections={taskSections}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index, section, separators }) => {
              const difficultyInfo = DIFFICULTY_LEVELS[item.difficulty] || DIFFICULTY_LEVELS.MEDIUM;
              
              // Calcul de l'index global en tenant compte des sections précédentes
              const sectionIndex = taskSections.indexOf(section);
              let globalIndex = index;
              
              // Ajouter les longueurs des sections précédentes
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
                  streak={streak?.count}
                  onComplete={() => handleCompleteTask(item.id)}
                  onDelete={() => handleDeleteTask(item.id)}
                  index={globalIndex} // Passage de l'index global pour l'animation en cascade
                />
              );
            }}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.info && (
                  <Text style={styles.sectionInfo}>{section.info}</Text>
                )}
              </View>
            )}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.tasksList}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Icon name="list" size={60} color="#d1d8e0" />
                <Text style={styles.emptyText}>Aucun défi disponible</Text>
                <TouchableOpacity 
                  style={styles.emptyActionButton}
                  onPress={() => toggleAddTaskForm()}
                >
                  <Text style={styles.emptyActionButtonText}>Créer un défi</Text>
                </TouchableOpacity>
              </View>
            )}
          />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.secondary, // Changement de blanc (#fff) à la couleur du bandeau (COLORS.secondary)
    paddingTop: Platform.OS === 'android' ? SCREEN.statusBarHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.secondary,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  addTaskForm: {
    backgroundColor: COLORS.white,
    margin: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e8f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f8faff',
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
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f8',
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
    backgroundColor: COLORS.background,
    borderWidth: 0,
  },
  filterIcon: {
    marginRight: 6,
  },
  activeFilter: {
    backgroundColor: COLORS.secondary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
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
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textLight,
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
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
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
  },
  bonusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
    textAlign: 'center',
    marginBottom: 5,
  },
  bonusDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  sectionInfo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default TasksScreen;
