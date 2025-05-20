import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Platform, 
  Animated, 
  SafeAreaView, 
  StatusBar, 
  ScrollView, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  Modal, 
  KeyboardAvoidingView, 
  TouchableWithoutFeedback, 
  TextInput, 
  ActivityIndicator, 
  Pressable, 
  Alert,
  Keyboard, // Ajouté ici pour corriger l'erreur
  Easing // Ajoutez ceci pour corriger l'erreur Easing
} from 'react-native';
import { SCREEN, calculateLevel, LEVEL_CONFIG } from '../utils/constants';
import { retrievePoints, retrieveCompletedTasks, storeUserProfile, retrieveUserProfile } from '../utils/storage';
import ProgressBar from '../components/ProgressBar';
import Icon, { COLORS } from '../components/common/Icon';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import CameraScreen from '../components/CameraScreen';
import { logoutUser } from '../services/authService';
import { useFocusEffect } from '@react-navigation/native';

// Suppression du composant CustomNavBar

// Redéfinition des badges avec des termes plus gaming
const BADGES = {
  FIRST_CHALLENGE: {
    name: "Première Quête",
    description: "Vous avez accompli votre première quête!",
    icon: "trophy",
    color: COLORS.secondary,
    unlockedAt: 1 // Nombre de défis complétées pour débloquer
  },
  FIVE_CHALLENGES: {
    name: "Aventurier",
    description: "Vous avez accompli 5 quêtes!",
    icon: "star",
    color: COLORS.warning, 
    unlockedAt: 5
  },
  LEVEL_5: {
    name: "Champion",
    description: "Vous avez atteint le rang 5!",
    icon: "arrow-up",
    color: COLORS.success,
    unlockedAt: 0, // Utiliser le niveau pour débloquer
    levelRequired: 5
  },
  LEVEL_8: {
    name: "Maître",
    description: "Vous avez atteint le rang 8!",
    icon: "medal",
    color: "#f7b731",
    unlockedAt: 0,
    levelRequired: 8
  },
  LEVEL_10: {
    name: "Élite",
    description: "Vous avez atteint le rang 10!",
    icon: "crown",
    color: "#9b59b6",
    unlockedAt: 0,
    levelRequired: 10
  },
  LEVEL_12: {
    name: "Légendaire",
    description: "Vous avez atteint le rang 12!",
    icon: "dragon",
    color: "#00b894",
    unlockedAt: 0,
    levelRequired: 12
  },
  LEVEL_15: {
    name: "Mythique",
    description: "Vous avez atteint le rang 15!",
    icon: "gem",
    color: "#00cec9",
    unlockedAt: 0,
    levelRequired: 15
  },
  LEVEL_18: {
    name: "Immortel",
    description: "Vous avez atteint le rang 18!",
    icon: "infinity",
    color: "#fdcb6e",
    unlockedAt: 0,
    levelRequired: 18
  },
  LEVEL_20: {
    name: "Dieu du Jeu",
    description: "Vous avez atteint le rang 20!",
    icon: "bolt",
    color: "#e17055",
    unlockedAt: 0,
    levelRequired: 20
  },
  CONSISTENT: {
    name: "Guerrier Fidèle",
    description: "Accomplissez 3 quêtes en moins de 7 jours",
    icon: "checkmark-circle", // Remplacer calendar-check par checkmark-circle
    color: COLORS.error,
    locked: true // Toujours verrouillé pour la démo
  }
};

const ProfileScreen = ({ navigation, isGuest = false, onLogout }) => {
  // État du profil
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [badges, setBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  
  // Info utilisateur
  const [userProfile, setUserProfile] = useState({
    username: 'Utilisateur',
    bio: 'Passionné de défis et aventures!',
    profileImage: null,
    email: 'user@example.com'
  });
  
  // États des modales
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showAllBadges, setShowAllBadges] = useState(false);
  
  // États pour l'édition du profil
  const [editedProfile, setEditedProfile] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  
  // Animations
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const profileImageAnim = useRef(new Animated.Value(0.5)).current;
  const statsCardAnim = useRef(new Animated.Value(20)).current;
  const statsCardOpacity = useRef(new Animated.Value(0)).current;
  const badgesAnim = useRef(new Animated.Value(40)).current; 
  const badgesOpacity = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0.9)).current;
  
  // Pour les badges
  const badgeScales = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current
  ];
  
  // Médaille animée dans la modal
  const badgeRotation = useRef(new Animated.Value(0)).current;
  
  // Animation du formulaire d'édition
  const profileFormScale = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    // Charge les données du profil
    loadProfileData();
    
    // Animations séquentielles
    Animated.sequence([
      // Header fade-in
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      
      // Profile image zoom
      Animated.spring(profileImageAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      }),
      
      // Stats card slide up
      Animated.parallel([
        Animated.timing(statsCardOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.spring(statsCardAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        })
      ]),
      
      // Badges section slide up
      Animated.parallel([
        Animated.timing(badgesOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.spring(badgesAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        })
      ]),
      
      // Badges appear one by one
      Animated.stagger(150, [
        ...badgeScales.map(anim => 
          Animated.spring(anim, {
            toValue: 1,
            friction: 7,
            tension: 40,
            useNativeDriver: true
          })
        )
      ]),
      
      // Button pulse
      Animated.spring(buttonAnim, {
        toValue: 1.05,
        friction: 3,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
    
    // Rotation continue pour le badge dans la modal
    Animated.loop(
      Animated.timing(badgeRotation, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  }, []);
  
  useFocusEffect(
    React.useCallback(() => {
      loadProfileData();
    }, [])
  );
  
  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Récupère le profil utilisateur existant
      const profile = await retrieveUserProfile();
      if (profile) {
        setUserProfile(profile);
      }
      
      // Récupère les points et calcule le niveau
      const points = await retrievePoints() || 0;
      setTotalPoints(points);
      
      // Utilisation de la fonction centralisée pour calculer le niveau
      const levelInfo = calculateLevel(points);
      setLevel(levelInfo.level);
      setProgress(levelInfo.progress);
      
      // Récupère le nombre de tâches complétées
      const tasks = await retrieveCompletedTasks();
      const completedCount = tasks?.length || 0;
      setCompletedTasks(completedCount);
      
      // Détermine quels badges sont débloqués
      const unlockedBadges = [
        { ...BADGES.FIRST_CHALLENGE, unlocked: completedCount >= BADGES.FIRST_CHALLENGE.unlockedAt },
        { ...BADGES.FIVE_CHALLENGES, unlocked: completedCount >= BADGES.FIVE_CHALLENGES.unlockedAt },
        { ...BADGES.LEVEL_5, unlocked: levelInfo.level >= BADGES.LEVEL_5.levelRequired },
        { ...BADGES.LEVEL_8, unlocked: levelInfo.level >= BADGES.LEVEL_8.levelRequired },
        { ...BADGES.LEVEL_10, unlocked: levelInfo.level >= BADGES.LEVEL_10.levelRequired },
        { ...BADGES.LEVEL_12, unlocked: levelInfo.level >= BADGES.LEVEL_12.levelRequired },
        { ...BADGES.LEVEL_15, unlocked: levelInfo.level >= BADGES.LEVEL_15.levelRequired },
        { ...BADGES.LEVEL_18, unlocked: levelInfo.level >= BADGES.LEVEL_18.levelRequired },
        { ...BADGES.LEVEL_20, unlocked: levelInfo.level >= BADGES.LEVEL_20.levelRequired },
        { ...BADGES.CONSISTENT, unlocked: !BADGES.CONSISTENT.locked }
      ];
      
      setBadges(unlockedBadges);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      Alert.alert("Erreur", "Impossible de charger les données du profil");
    } finally {
      setIsLoading(false);
    }
  };
  
  // ... autres fonctions inchangées ...
  
  const handleBadgePress = (badge, index) => {
    setSelectedBadge(badge);
    setShowBadgeModal(true);
  };
  
  const openEditProfileModal = () => {
    // Prépare le formulaire d'édition avec les valeurs actuelles
    setEditedProfile({...userProfile});
    setValidationErrors({});
    setShowEditProfileModal(true);
    
    // Animation du formulaire
    Animated.spring(profileFormScale, {
      toValue: 1,
      friction: 7,
      tension: 40,
      useNativeDriver: true
    }).start();
  };
  
  const validateProfileForm = () => {
    let errors = {};
    
    if (!editedProfile.username?.trim()) {
      errors.username = "Le nom d'utilisateur est requis";
    } else if (editedProfile.username.length < 3) {
      errors.username = "Le nom d'utilisateur doit comporter au moins 3 caractères";
    }
    
    if (editedProfile.email && !editedProfile.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = "Format d'email invalide";
    }
    
    if (editedProfile.bio && editedProfile.bio.length > 150) {
      errors.bio = "La bio ne doit pas dépasser 150 caractères";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSaveProfile = async () => {
    try {
      if (!validateProfileForm()) return;
      
      setIsLoading(true);
      
      // Sauvegarde le profil modifié
      await storeUserProfile(editedProfile);
      
      // Met à jour l'état
      setUserProfile(editedProfile);
      
      // Ferme le modal
      setShowEditProfileModal(false);
      
      // Affiche une confirmation
      Alert.alert("Succès", "Votre profil a été mis à jour avec succès!");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du profil:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications");
    } finally {
      setIsLoading(false);
    }
  };
  
  const pickImage = async () => {
    try {
      // Demande à l'utilisateur s'il veut prendre une photo ou utiliser la galerie
      Alert.alert(
        "Photo de profil",
        "Comment souhaitez-vous ajouter une photo ?",
        [
          {
            text: "Annuler",
            style: "cancel"
          },
          {
            text: "Prendre une photo",
            onPress: () => setShowCamera(true)
          },
          {
            text: "Galerie",
            onPress: () => selectFromGallery()
          }
        ]
      );
    } catch (error) {
      console.error("Erreur lors de la sélection d'image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner une image");
    }
  };
  
  const selectFromGallery = async () => {
    try {
      // Demande les permissions pour accéder à la galerie
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission requise", "Vous devez autoriser l'accès à la galerie pour changer votre photo");
        return;
      }
      
      // Lance le sélecteur d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        // Met à jour l'image dans le formulaire d'édition
        setEditedProfile({
          ...editedProfile,
          profileImage: result.assets[0].uri
        });
      }
    } catch (error) {
      console.error("Erreur lors de la sélection d'image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner cette image");
    }
  };
  
  const handlePhotoCapture = (photoUri) => {
    // Met à jour l'image dans le formulaire d'édition
    setEditedProfile({
      ...editedProfile,
      profileImage: photoUri
    });
    setShowCamera(false);
  };
  
  const closeCamera = () => {
    setShowCamera(false);
  };
  
  const renderBadgeModal = () => {
    if (!selectedBadge) return null;
    
    const interpolatedRotation = badgeRotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    });
    
    return (
      <Modal
        visible={showBadgeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBadgeModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowBadgeModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Animated.View 
                  style={[
                    styles.modalBadgeContainer,
                    { transform: [{ rotate: interpolatedRotation }] }
                  ]}
                >
                  <View style={[
                    styles.modalBadgeCircle,
                    selectedBadge.unlocked 
                      ? { backgroundColor: selectedBadge.color }
                      : { backgroundColor: COLORS.textLight }
                  ]}>
                    <Icon 
                      type="fa5"
                      name={selectedBadge.icon}
                      size={36} 
                      color={selectedBadge.unlocked ? COLORS.white : COLORS.textLight} 
                    />
                  </View>
                </Animated.View>
                
                <Text style={styles.modalBadgeTitle}>
                  {selectedBadge.name}
                </Text>
                
                <Text style={styles.modalBadgeDescription}>
                  {selectedBadge.unlocked 
                    ? selectedBadge.description
                    : "Ce badge est encore verrouillé. Continuez à progresser pour le débloquer!"
                  }
                </Text>
                
                {!selectedBadge.unlocked && (
                  <View style={styles.unlockInfoContainer}>
                    <Icon name="lock-closed" size={20} color={COLORS.textLight} style={styles.unlockIcon} />
                    <Text style={styles.unlockText}>
                      {selectedBadge.levelRequired 
                        ? `Atteignez le niveau ${selectedBadge.levelRequired} pour débloquer`
                        : selectedBadge.unlockedAt
                          ? `Complétez ${selectedBadge.unlockedAt} défis pour débloquer`
                          : "Poursuivez votre progression pour débloquer"
                      }
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowBadgeModal(false)}
                >
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };
  
  const renderEditProfileModal = () => {
    return (
      <Modal
        visible={showEditProfileModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.editProfileModalOverlay}>
              <Animated.View 
                style={[
                  styles.editProfileModalContent,
                  { transform: [{ scale: profileFormScale }] }
                ]}
              >
                <View style={styles.editProfileHeader}>
                  <TouchableOpacity 
                    onPress={() => setShowEditProfileModal(false)}
                    style={styles.editProfileCloseButton}
                  >
                    <Icon name="close" size={24} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                  <Text style={styles.editProfileTitle}>Modifier le profil</Text>
                  <TouchableOpacity 
                    onPress={handleSaveProfile}
                    style={styles.editProfileSaveButton}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={styles.editProfileSaveText}>Sauvegarder</Text>
                    )}
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.editProfileForm}>
                  <View style={styles.profileImageEditContainer}>
                    {/* Suppression de la possibilité de cliquer sur la photo */}
                    <View style={styles.profileImageEdit}>
                      {editedProfile.profileImage ? (
                        <Image 
                          source={{ uri: editedProfile.profileImage }} 
                          style={styles.profileImagePreview}
                        />
                      ) : (
                        <Image 
                          source={require('../assets/icon.png')} 
                          style={styles.profileImagePreview}
                        />
                      )}
                      <View style={styles.cameraIconContainer}>
                        <Icon name="camera" size={18} color={COLORS.white} />
                      </View>
                    </View>
                    {/* Le bouton "Changer la photo" reste cliquable */}
                    <TouchableOpacity onPress={pickImage}>
                      <Text style={styles.changePhotoText}>Changer la photo</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Nom d'utilisateur</Text>
                    <TextInput
                      style={[
                        styles.formInput,
                        validationErrors.username && styles.inputError
                      ]}
                      value={editedProfile.username}
                      onChangeText={(text) => setEditedProfile({...editedProfile, username: text})}
                      placeholder="Votre nom d'utilisateur"
                      maxLength={20}
                    />
                    {validationErrors.username && (
                      <Text style={styles.errorText}>{validationErrors.username}</Text>
                    )}
                  </View>
                  
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Email</Text>
                    <TextInput
                      style={[
                        styles.formInput,
                        validationErrors.email && styles.inputError
                      ]}
                      value={editedProfile.email}
                      onChangeText={(text) => setEditedProfile({...editedProfile, email: text})}
                      placeholder="Votre email"
                      keyboardType="email-address"
                    />
                    {validationErrors.email && (
                      <Text style={styles.errorText}>{validationErrors.email}</Text>
                    )}
                  </View>
                  
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Bio <Text style={styles.optionalText}>(optional)</Text></Text>
                    <TextInput
                      style={[
                        styles.formTextarea,
                        validationErrors.bio && styles.inputError
                      ]}
                      value={editedProfile.bio}
                      onChangeText={(text) => setEditedProfile({...editedProfile, bio: text})}
                      placeholder="Parlez-nous de vous"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      maxLength={150}
                    />
                    {validationErrors.bio && (
                      <Text style={styles.errorText}>{validationErrors.bio}</Text>
                    )}
                    <Text style={styles.charCounter}>
                      {(editedProfile.bio?.length || 0)}/150
                    </Text>
                  </View>
                </ScrollView>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Titre du profil basé sur le niveau - termes plus gaming
  const getUserTitle = () => {
    if (level < 3) return 'Novice';
    if (level < 5) return 'Apprenti';
    if (level < 8) return 'Guerrier';
    if (level < 12) return 'Héros';
    if (level < 18) return 'Légende';
    return 'Dieu du Gaming';
  };
  
  // Calcul des points pour le niveau suivant
  const getPointsForNextLevel = () => {
    // Utilisation de la fonction utilitaire pour obtenir les informations du niveau
    const levelInfo = calculateLevel(totalPoints);
    return levelInfo.pointsForNextLevel;
  };

  const handleShareProfile = async () => {
    // Afficher un indicateur de chargement
    setIsLoading(true);
    try {
      console.log("Tentative de partage de profil...");
      
      // Créer un contenu de partage plus simple pour garantir la compatibilité
      const shareContent = {
        message: `🌟 Découvrez mon profil sur l'application Défis! 🌟\n\nUtilisateur: ${userProfile.username}\nNiveau: ${level} (${getUserTitle()})\nPoints: ${totalPoints}\nDéfis complétés: ${completedTasks}\n\nRejoignez-moi et relevons des défis ensemble!`,
        title: "Mon Profil de Défis" // Pour les plateformes Android
      };
      
      console.log("Contenu de partage préparé:", shareContent);
      
      // Utilisation d'un bloc try/catch spécifique pour l'appel Share.share
      try {
        const result = await Share.share(shareContent);
        
        if (result.action === Share.sharedAction) {
          console.log("Profil partagé avec succès");
          Alert.alert("Succès", "Votre profil a été partagé avec succès!");
        } else if (result.action === Share.dismissedAction) {
          console.log("Partage annulé par l'utilisateur");
        }
      } catch (shareError) {
        console.error("Erreur spécifique au partage:", shareError);
        throw shareError; // Remonter l'erreur pour la traiter dans le bloc catch principal
      }
    } catch (error) {
      console.error("Erreur lors du partage du profil:", error);
      Alert.alert(
        "Erreur de partage", 
        "Impossible de partager votre profil. " + 
        (error.message ? `Erreur: ${error.message}` : "Veuillez réessayer.")
      );
    } finally {
      // S'assurer que l'indicateur de chargement est toujours désactivé
      setIsLoading(false);
    }
  };

  if (isLoading && !userProfile.username) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 100}}>
        <LinearGradient
          colors={['#1a2151', '#2d3a8c']}
          style={styles.profileHeader}
        >
          <Animated.View style={[
            styles.profileImageContainer, 
            {transform: [{scale: profileImageAnim}]}
          ]}>
            {userProfile.profileImage ? (
              <Image 
                source={{ uri: userProfile.profileImage }} 
                style={styles.profileImage}
              />
            ) : (
              <Image 
                source={require('../assets/icon.png')}  
                style={styles.profileImage}
                onError={(e) => console.log('Image non trouvée, utilisation de l\'image par défaut')}
              />
            )}
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{level}</Text>
            </View>
          </Animated.View>
          
          <Text style={styles.username}>{userProfile.username}</Text>
          <Text style={styles.userTitle}>Rang: {getUserTitle()}</Text>
          
          {userProfile.bio && (
            <Text style={styles.userBio}>{userProfile.bio}</Text>
          )}
          
          <View style={styles.headerStatsContainer}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{completedTasks}</Text>
              <Text style={styles.headerStatLabel}>Quêtes</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{totalPoints}</Text>
              <Text style={styles.headerStatLabel}>XP</Text>
            </View>
          </View>
        </LinearGradient>
        
        <Animated.View 
          style={[
            styles.levelCard, 
            {
              opacity: statsCardOpacity,
              transform: [{translateY: statsCardAnim}]
            }
          ]}
        >
          <View style={styles.levelCardHeader}>
            <View>
              <Text style={styles.levelCardTitle}>Progression</Text>
              <Text style={styles.levelCardSubtitle}>Rang {level} • {LEVEL_CONFIG[level]?.title || getUserTitle()}</Text>
            </View>
            <View style={styles.nextLevelPoints}>
              <Text style={styles.nextLevelPointsText}>{getPointsForNextLevel()} XP requis</Text>
            </View>
          </View>
          
          <ProgressBar 
            progress={Number(progress.toFixed(1))} 
            total={100} 
            height={12}
            barColor="#4e54c8"
            backgroundColor="#292b45"
          />
          
          <View style={styles.levelAdvantagesContainer}>
            <Text style={styles.levelAdvantagesTitle}>Pouvoirs débloqués :</Text>
            
            {LEVEL_CONFIG[level]?.advantages.map((advantage, index) => (
              <View key={index} style={styles.levelAdvantageItem}>
                <Icon name="checkmark-circle" size={18} color="#32cd32" style={styles.levelAdvantageIcon} />
                <Text style={styles.levelAdvantageText}>{advantage}</Text>
              </View>
            ))}
            
            {level < 15 && (
              <TouchableOpacity style={styles.viewMoreLevelsButton}>
                <Text style={styles.viewMoreLevelsText}>Voir les pouvoirs des rangs supérieurs</Text>
                <Icon name="chevron-forward" size={16} color={COLORS.secondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.levelTipsContainer}>
            <Icon name="flame-outline" size={18} color="#ff7f50" style={styles.tipIcon} />
            <Text style={styles.levelTips}>
              {completedTasks < 5 
                ? "Accomplissez des quêtes pour gagner de l'XP et monter de rang!" 
                : level < 5
                  ? "Essayez des quêtes plus difficiles pour progresser plus vite!"
                  : "Votre puissance est impressionnante. Continuez votre aventure!"
              }
            </Text>
          </View>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.badgesSection, 
            {
              opacity: badgesOpacity,
              transform: [{translateY: badgesAnim}]
            }
          ]}
        >
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Mes Trophées</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => setShowAllBadges(!showAllBadges)}
            >
              <Text style={styles.seeAllButtonText}>
                {showAllBadges ? "Réduire" : "Tous voir"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.badgesGrid}>
            {(showAllBadges ? badges : badges.slice(0, 4)).map((badge, index) => (
              <Animated.View 
                key={index} 
                style={[
                  styles.badge, 
                  {transform: [{scale: badgeScales[index % badgeScales.length] || 1}]}
                ]}
              >
                <Pressable
                  onPress={() => handleBadgePress(badge, index)}
                  style={({pressed}) => [
                    styles.badgePressable,
                    {transform: [{scale: pressed ? 0.95 : 1}]}
                  ]}
                >
                  <View style={[
                    styles.badgeIconContainer,
                    badge.unlocked 
                      ? { backgroundColor: badge.color } 
                      : { backgroundColor: '#292b45' }
                  ]}>
                    {!badge.unlocked && (
                      <View style={styles.badgeLockOverlay}>
                        <Icon name="lock-closed" size={16} color={COLORS.textLight} />
                      </View>
                    )}
                    <Icon 
                      type="fa5"
                      name={badge.icon} 
                      size={28} 
                      color={badge.unlocked ? COLORS.white : COLORS.textLight} 
                    />
                    {badge.unlocked && (
                      <View style={styles.badgeGlow} />
                    )}
                  </View>
                  
                  <Text 
                    style={[
                      styles.badgeName,
                      !badge.unlocked && styles.badgeNameLocked
                    ]}
                  >
                    {badge.name}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
        
        <View style={styles.actionsSection}>
          <Animated.View style={{transform: [{scale: buttonAnim}]}}>
            <TouchableOpacity 
              style={styles.mainActionButton}
              activeOpacity={0.8}
              onPress={openEditProfileModal}
            >
              <Icon name="person-outline" size={20} color={COLORS.white} style={{marginRight: 8}} />
              <Text style={styles.mainActionButtonText}>Modifier le profil</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <View style={styles.secondaryActionsContainer}>
            <TouchableOpacity 
              style={styles.secondaryActionButton}
              onPress={handleShareProfile}
            >
              <Icon name="share-social-outline" size={20} color={COLORS.secondary} style={styles.actionIcon} />
              <Text style={styles.secondaryActionText}>Partager</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryActionButton}
              onPress={() => navigation.navigate('AboutUs')}
            >
              <Icon name="information-circle-outline" size={20} color={COLORS.secondary} style={styles.actionIcon} />
              <Text style={styles.secondaryActionText}>À propos</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.secondaryActionButton, styles.logoutButton, {marginTop: 12}]}
            onPress={() => {
              if (onLogout) {
                onLogout();
              } else {
                logoutUser().then(() => navigation.replace('Home'));
              }
            }}
          >
            <Icon name="log-out-outline" size={20} color={COLORS.error} style={styles.actionIcon} />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {renderBadgeModal()}
      {renderEditProfileModal()}
      
      {/* Modal pour la caméra */}
      {showCamera && (
        <Modal
          visible={showCamera}
          animationType="slide"
          transparent={false}
        >
          <CameraScreen
            onPhotoCapture={handlePhotoCapture}
            onClose={closeCamera}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f1123',
    paddingTop: Platform.OS === 'android' ? SCREEN.statusBarHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#151736',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#151736',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#a3aed0',
    fontWeight: '500',
  },
  profileHeader: {
    paddingTop: 30,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  profileImageContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#4e54c8',
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  userTitle: {
    fontSize: 16,
    color: '#a3d8f5',
    marginBottom: 10,
  },
  userBio: {
    fontSize: 14,
    color: '#dedede',
    textAlign: 'center',
    maxWidth: '80%',
    marginBottom: 15,
  },
  headerStatsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerStat: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerStatLabel: {
    fontSize: 14,
    color: '#a3d8f5',
    marginTop: 2,
  },
  headerStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 5,
  },
  levelCard: {
    backgroundColor: '#1e2146',
    margin: 16,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#4e54c8',
  },
  levelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  levelCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  levelCardSubtitle: {
    fontSize: 14,
    color: '#a3aed0',
    marginTop: 2,
  },
  nextLevelPoints: {
    backgroundColor: '#292b45',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4e54c8',
  },
  nextLevelPointsText: {
    color: '#a3d8f5',
    fontSize: 12,
    fontWeight: '600',
  },
  levelAdvantagesContainer: {
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: '#21254c',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#4e54c8',
  },
  levelAdvantagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  levelAdvantageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#292b45',
  },
  levelAdvantageText: {
    fontSize: 14,
    color: '#dedede',
    flex: 1,
  },
  viewMoreLevelsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  viewMoreLevelsText: {
    fontSize: 14,
    color: '#4e54c8',
    fontWeight: '500',
    marginRight: 5,
  },
  levelTipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#272b52',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ff7f50',
  },
  tipIcon: {
    marginRight: 10,
  },
  levelTips: {
    flex: 1,
    fontSize: 13,
    color: '#dedede',
  },
  badgesSection: {
    backgroundColor: '#1e2146',
    margin: 16,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#4e54c8',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  seeAllButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  seeAllButtonText: {
    color: '#4e54c8',
    fontSize: 14,
    fontWeight: '600',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badge: {
    width: '48%',
    marginBottom: 15,
  },
  badgePressable: {
    alignItems: 'center',
  },
  badgeIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeLockOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    opacity: 0.6,
    transform: [{ scale: 1.2 }],
  },
  badgeName: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    color: '#fff',
  },
  badgeNameLocked: {
    color: '#6d7192',
  },
  actionsSection: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  mainActionButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ff8c8c',
  },
  mainActionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  secondaryActionButton: {
    backgroundColor: COLORS.background,
    flex: 0.48,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e9ed',
  },
  actionIcon: {
    marginRight: 8,
  },
  secondaryActionText: {
    color: COLORS.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  // Modal - Badge
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalBadgeContainer: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBadgeCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalBadgeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalBadgeDescription: {
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  unlockInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  unlockIcon: {
    marginRight: 8,
  },
  unlockText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  closeButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Edit Profile Modal
  editProfileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfileModalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
  },
  editProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  editProfileTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  editProfileCloseButton: {
    padding: 5,
  },
  editProfileSaveButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editProfileSaveText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  editProfileForm: {
    flex: 1,
    padding: 20,
  },
  profileImageEditContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageEdit: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  profileImagePreview: {
    width: '100%',
    height: '100%',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(74, 102, 247, 0.9)',
    padding: 8,
    borderRadius: 20,
  },
  changePhotoText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  optionalText: {
    fontWeight: 'normal',
    color: COLORS.textLight,
  },
  formInput: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: '#e6e9ed',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  formTextarea: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    color: COLORS.dark,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e6e9ed',
  },
  charCounter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  logoutButton: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(231, 76, 60, 0.05)',
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ProfileScreen;