import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Image,
  Animated,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon, { COLORS } from './common/Icon';
import CameraScreen from './CameraScreen';
import { storeUserProfile, retrieveUserProfile } from '../utils/storage';

// Liste des questions à poser à l'utilisateur lors de la première utilisation
const QUESTIONS = [
  {
    id: 'username',
    question: "Comment souhaitez-vous qu'on vous appelle ?",
    subtitle: "C'est le nom qui sera affiché sur votre profil.",
    type: 'text',
    placeholder: "Votre nom d'utilisateur",
    minLength: 3,
    required: true
  },
  {
    id: 'interests',
    question: "Quels sont vos centres d'intérêt ?",
    subtitle: "Sélectionnez au moins 3 sujets qui vous intéressent.",
    type: 'multiselect',
    options: [
      { id: 'sport', label: 'Sport', icon: 'fitness' },
      { id: 'music', label: 'Musique', icon: 'musical-notes' },
      { id: 'travel', label: 'Voyage', icon: 'airplane' },
      { id: 'cooking', label: 'Cuisine', icon: 'restaurant' },
      { id: 'reading', label: 'Lecture', icon: 'book' },
      { id: 'tech', label: 'Technologie', icon: 'hardware-chip' },
      { id: 'art', label: 'Art', icon: 'color-palette' },
      { id: 'games', label: 'Jeux Vidéo', icon: 'game-controller' }
    ],
    minSelection: 3,
    required: true
  },
  {
    id: 'profilePicture',
    question: "Ajoutez une photo de profil",
    subtitle: "Prenez une belle photo pour vous présenter aux autres utilisateurs.",
    type: 'camera',
    required: false
  },
  {
    id: 'bio',
    question: "Parlez-nous un peu de vous",
    subtitle: "Ajoutez une courte biographie pour votre profil (optionnel).",
    type: 'textarea',
    placeholder: "Je suis passionné par...",
    maxLength: 150,
    required: false
  }
];

// Couleurs gaming
const GAMING_COLORS = {
  background: '#151736',
  cardBackground: '#1e2146',
  secondary: '#4e54c8',
  accent: '#a3d8f5',
  darkBlue: '#21254c',
  headerBg: '#0f1123',
  neon: '#00ffff',
  purple: '#9933ff',
  gold: '#ffd700',
};

const { width } = Dimensions.get('window');

const OnboardingQuestions = ({ isVisible, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [progress, setProgress] = useState(0);
  const slideAnim = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Mettre à jour la progression
  useEffect(() => {
    setProgress((currentQuestion + 1) / QUESTIONS.length);
  }, [currentQuestion]);

  // Animation lors du changement de question
  const animateTransition = (direction = 'next') => {
    // Faire disparaître la question actuelle
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => {
      // Réinitialiser la position
      slideAnim.setValue(direction === 'next' ? width : -width);
      
      // Passer à la question suivante/précédente
      setCurrentQuestion(prev => 
        direction === 'next' ? prev + 1 : prev - 1
      );
      
      // Animer l'entrée de la nouvelle question
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    });
  };

  const handleNextQuestion = () => {
    const question = QUESTIONS[currentQuestion];
    
    // Validation
    if (question.required) {
      if (question.type === 'text' && (!answers[question.id] || answers[question.id].length < (question.minLength || 1))) {
        setError(`Ce champ doit contenir au moins ${question.minLength || 1} caractères.`);
        return;
      }
      
      if (question.type === 'multiselect' && (!answers[question.id] || answers[question.id].length < question.minSelection)) {
        setError(`Veuillez sélectionner au moins ${question.minSelection} options.`);
        return;
      }
    }
    
    setError(null);
    
    if (currentQuestion < QUESTIONS.length - 1) {
      animateTransition('next');
    } else {
      // Toutes les questions sont complétées
      saveUserProfile();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      animateTransition('prev');
    }
  };

  const handleTextInput = (text, questionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
    setError(null);
  };

  const handleMultiSelect = (optionId, questionId) => {
    setAnswers(prev => {
      const currentSelections = prev[questionId] || [];
      if (currentSelections.includes(optionId)) {
        return { 
          ...prev, 
          [questionId]: currentSelections.filter(id => id !== optionId) 
        };
      } else {
        return { 
          ...prev, 
          [questionId]: [...currentSelections, optionId] 
        };
      }
    });
    setError(null);
  };

  const handleCameraCapture = () => {
    setShowCamera(true);
  };

  const handlePhotoCapture = (photoUri) => {
    setAnswers(prev => ({ ...prev, profilePicture: photoUri }));
    setShowCamera(false);
  };

  const closeCamera = () => {
    setShowCamera(false);
  };

  const saveUserProfile = async () => {
    try {
      // Récupérer le profil actuel pour y ajouter les nouvelles données
      let currentProfile = await retrieveUserProfile();
      if (!currentProfile) {
        currentProfile = {
          username: 'Utilisateur',
          bio: '',
          interests: [],
          profileImage: null,
          isFirstLogin: false
        };
      }
      // Créer un objet profil avec les réponses
      const profileData = {
        ...currentProfile,
        username: answers.username || currentProfile.username || 'Utilisateur',
        bio: answers.bio || currentProfile.bio || '',
        interests: answers.interests || currentProfile.interests || [],
        profileImage: answers.profilePicture || currentProfile.profileImage || null,
        isFirstLogin: false,  // Marquer que le processus d'onboarding est terminé
      };
      // Sauvegarder dans le stockage
      await storeUserProfile(profileData);
      // Terminer l'onboarding
      onComplete && onComplete(profileData);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du profil:", error);
      setError("Une erreur est survenue lors de la sauvegarde de votre profil.");
    }
  };

  const renderQuestion = () => {
    const question = QUESTIONS[currentQuestion];
    const isLastQuestion = currentQuestion === QUESTIONS.length - 1;
    
    return (
      <Animated.View 
        style={[
          styles.questionContainer,
          { 
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <View style={styles.questionHeader}>
          <Text style={styles.questionTitle}>{question.question}</Text>
          <Text style={styles.questionSubtitle}>{question.subtitle}</Text>
        </View>
        
        {question.type === 'text' && (
          <TextInput
            style={styles.textInput}
            placeholder={question.placeholder}
            placeholderTextColor="#a3aed0"
            value={answers[question.id] || ''}
            onChangeText={(text) => handleTextInput(text, question.id)}
            maxLength={question.maxLength}
          />
        )}
        
        {question.type === 'textarea' && (
          <View style={styles.textareaContainer}>
            <TextInput
              style={styles.textarea}
              placeholder={question.placeholder}
              placeholderTextColor="#a3aed0"
              value={answers[question.id] || ''}
              onChangeText={(text) => handleTextInput(text, question.id)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={question.maxLength}
            />
            {question.maxLength && (
              <Text style={styles.charCounter}>
                {(answers[question.id]?.length || 0)}/{question.maxLength}
              </Text>
            )}
          </View>
        )}
        
        {question.type === 'multiselect' && (
          <View style={styles.optionsContainer}>
            {question.options.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionItem,
                  (answers[question.id] || []).includes(option.id) && styles.optionSelected
                ]}
                onPress={() => handleMultiSelect(option.id, question.id)}
              >
                <Icon 
                  name={option.icon} 
                  size={24} 
                  color={(answers[question.id] || []).includes(option.id) ? COLORS.white : GAMING_COLORS.accent} 
                />
                <Text 
                  style={[
                    styles.optionText,
                    (answers[question.id] || []).includes(option.id) && styles.optionTextSelected
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {question.type === 'camera' && (
          <View style={styles.cameraSection}>
            {answers.profilePicture ? (
              <View style={styles.profilePreviewContainer}>
                <Image
                  source={{ uri: answers.profilePicture }}
                  style={styles.profilePreview}
                />
                <TouchableOpacity 
                  style={styles.changePhotoButton}
                  onPress={handleCameraCapture}
                >
                  <Text style={styles.changePhotoText}>Changer la photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.cameraTrigger}
                onPress={handleCameraCapture}
              >
                <View style={styles.cameraIconContainer}>
                  <Icon name="camera" size={40} color={COLORS.white} />
                </View>
                <Text style={styles.cameraTriggerText}>
                  Appuyez pour prendre une photo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        <View style={styles.buttonContainer}>
          {currentQuestion > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handlePreviousQuestion}
            >
              <Icon name="arrow-back" size={24} color={GAMING_COLORS.accent} />
              <Text style={styles.backButtonText}>Précédent</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextQuestion}
          >
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? "Terminer" : "Suivant"}
            </Text>
            <Icon name={isLastQuestion ? "checkmark" : "arrow-forward"} size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={false}
    >
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[GAMING_COLORS.background, GAMING_COLORS.darkBlue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        />
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
        
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headerTitle}>Personnalisez votre aventure</Text>
          {renderQuestion()}
        </ScrollView>
        
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GAMING_COLORS.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GAMING_COLORS.accent,
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(163, 216, 245, 0.4)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  progressBarContainer: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(78, 84, 200, 0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: GAMING_COLORS.secondary,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    shadowColor: GAMING_COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  questionContainer: {
    backgroundColor: GAMING_COLORS.cardBackground,
    borderRadius: 20,
    padding: 24,
    marginVertical: 20,
    shadowColor: GAMING_COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(78, 84, 200, 0.4)',
  },
  questionHeader: {
    marginBottom: 25,
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GAMING_COLORS.accent,
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  questionSubtitle: {
    fontSize: 16,
    color: '#a3aed0',
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: GAMING_COLORS.darkBlue,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(78, 84, 200, 0.3)',
    color: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  textareaContainer: {
    marginBottom: 20,
  },
  textarea: {
    backgroundColor: GAMING_COLORS.darkBlue,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(78, 84, 200, 0.3)',
    color: '#fff',
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  charCounter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#a3aed0',
    marginTop: 5,
    marginRight: 2,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  optionItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GAMING_COLORS.darkBlue,
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(78, 84, 200, 0.3)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  optionSelected: {
    backgroundColor: GAMING_COLORS.secondary,
    borderColor: GAMING_COLORS.accent,
    shadowColor: GAMING_COLORS.secondary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  optionText: {
    fontSize: 15,
    color: '#dedede',
    marginLeft: 10,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: COLORS.white,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  cameraSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  cameraTrigger: {
    alignItems: 'center',
  },
  cameraIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: GAMING_COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: GAMING_COLORS.accent,
    shadowColor: GAMING_COLORS.secondary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  cameraTriggerText: {
    fontSize: 15,
    color: GAMING_COLORS.accent,
    marginTop: 5,
    fontWeight: '500',
  },
  profilePreviewContainer: {
    alignItems: 'center',
  },
  profilePreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: GAMING_COLORS.accent,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  changePhotoButton: {
    backgroundColor: 'rgba(78, 84, 200, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GAMING_COLORS.secondary,
  },
  changePhotoText: {
    color: GAMING_COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff5252',
    fontSize: 14,
    marginBottom: 15,
    marginLeft: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: GAMING_COLORS.accent,
    marginLeft: 5,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: GAMING_COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: GAMING_COLORS.secondary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nextButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
    marginRight: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});

export default OnboardingQuestions;