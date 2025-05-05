import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Image, Animated, Dimensions, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AppNavigator from './navigation/AppNavigator';
import OnboardingQuestions from './components/OnboardingQuestions';
import { retrieveUserProfile, storeUserProfile } from './utils/storage';
import LoginScreen from './screens/LoginScreen';
import { isUserAuthenticated, getAuthUser } from './services/authService';
import { COLORS } from './components/common/Icon';

export default function App() {
  const [isFirstLogin, setIsFirstLogin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [splashFinished, setSplashFinished] = useState(false);
  
  // Animations
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const loadingBarWidth = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const screenWidth = Dimensions.get('window').width;
  // Nouvelles animations
  const logoRotate = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const sloganTranslateY = useRef(new Animated.Value(20)).current;
  const progressBarOpacity = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  // Fonction d'animation du splash screen
  const animateSplashScreen = () => {
    // Séquence d'effets haptiques
    const triggerHapticSequence = () => {
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 600);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 1200);
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 2000);
    };

    // Déclencher la séquence haptique
    triggerHapticSequence();

    // Animation du logo
    Animated.sequence([
      // Apparition fondue du fond avec légère rotation du logo pour un effet dynamique
      Animated.parallel([
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 800,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
      ]),
      
      // Apparition et zoom du logo avec effet d'élasticité plus prononcé
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5, // Moins de friction pour plus de rebond
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      
      // Animation du titre et du slogan avec effet de glissement vers le haut
      Animated.stagger(150, [
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(titleTranslateY, {
            toValue: 0,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(progressBarOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(sloganTranslateY, {
            toValue: 0,
            friction: 7,
            tension: 30,
            useNativeDriver: true,
          }),
        ]),
      ]),
      
      // Animation de la barre de chargement avec effet de pulsation
      Animated.parallel([
        Animated.timing(loadingBarWidth, {
          toValue: screenWidth - 80, // 40px de marge de chaque côté
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false, // Width ne peut pas utiliser native driver
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnim, {
              toValue: 0.6,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 2 }
        ),
      ]),
      
      // Effet de rebond final plus prononcé
      Animated.spring(logoScale, {
        toValue: 1.2,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      
      // Retour à la taille normale avec légère rotation inverse
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 600,
          easing: Easing.elastic(1),
          useNativeDriver: true,
        }),
      ]),
      
      // Fondu sortant de l'écran de démarrage
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        delay: 100,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Animation terminée, masquer le splash screen
      setSplashFinished(true);
    });
  };

  useEffect(() => {
    // Démarrer la vérification d'authentification et l'animation simultanément
    checkAuthAndFirstLogin();
    animateSplashScreen();
  }, []);

  const checkAuthAndFirstLogin = async () => {
    try {
      setIsLoading(true);
      
      // Vérifier si l'utilisateur est connecté
      const authenticated = await isUserAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        // Récupérer les informations utilisateur
        const user = await getAuthUser();
        setAuthUser(user);
      }
      
      // Vérifier si c'est la première connexion
      const userProfile = await retrieveUserProfile();
      
      // Si userProfile est null ou si isFirstLogin n'est pas défini ou est true
      // alors on considère que c'est la première connexion
      const firstLogin = !userProfile || userProfile.isFirstLogin !== false;
      setIsFirstLogin(firstLogin);
      
      // Si c'est la première connexion, initialiser le profil avec isFirstLogin = true
      if (firstLogin && !userProfile) {
        await storeUserProfile({ isFirstLogin: true });
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'authentification:", error);
      // Par défaut, on considère que ce n'est pas authentifié et que c'est la première connexion
      setIsAuthenticated(false);
      setIsFirstLogin(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = async (user, isFirstLogin = false) => {
    // Mettre à jour l'état de l'utilisateur connecté
    setAuthUser(user);
    setIsAuthenticated(true);
    
    // Important: définir correctement si c'est la première connexion
    // en utilisant l'information passée par le service d'authentification
    setIsFirstLogin(isFirstLogin);
  };

  const handleOnboardingComplete = async (profileData) => {
    try {
      // Mettre à jour isFirstLogin à false dans le state
      setIsFirstLogin(false);
    } catch (error) {
      console.error("xErreur lors de la finalisation de l'onboarding:", error);
    }
  };

  // Afficher le splash screen animé
  if (!splashFinished || isLoading) {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <StatusBar style="light" />
        <Animated.View style={{ opacity: backgroundOpacity }}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          />
        </Animated.View>
        
        {/* Effet de particules/étincelles */}
        <Animated.View 
          style={[
            styles.sparkleContainer,
            { opacity: sparkleAnim }
          ]}
        >
          {[...Array(5)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.sparkle,
                { 
                  top: `${15 + Math.random() * 70}%`, 
                  left: `${5 + Math.random() * 90}%`,
                  width: 6 + Math.random() * 10,
                  height: 6 + Math.random() * 10,
                  backgroundColor: i % 2 === 0 ? COLORS.secondary : COLORS.white,
                  transform: [{ 
                    rotate: `${Math.random() * 360}deg` 
                  }]
                }
              ]}
            />
          ))}
        </Animated.View>
        
        <Animated.Image 
          source={require('./assets/icon.png')} 
          style={[
            styles.splashLogo, 
            { 
              opacity: logoOpacity,
              transform: [
                { scale: logoScale }, 
                { rotate: logoRotate.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })}
              ]
            }
          ]}
        />
        
        <Animated.Text style={[
          styles.appTitle, 
          { 
            opacity: titleOpacity, 
            transform: [{ translateY: titleTranslateY }] 
          }
        ]}>
          ChallengR
        </Animated.Text>
        
        <Animated.Text style={[
          styles.appSlogan, 
          { 
            opacity: titleOpacity, 
            transform: [{ translateY: sloganTranslateY }] 
          }
        ]}>
          Relevez des défis, transformez-vous
        </Animated.Text>
        
        <Animated.View style={[
          styles.progressBarContainer,
          { opacity: progressBarOpacity }
        ]}>
          <Animated.View 
            style={[
              styles.progressBar,
              { width: loadingBarWidth }
            ]} 
          />
          {/* Effet de brillance qui suit la progression */}
          <Animated.View 
            style={[
              styles.progressBarShine,
              { 
                left: loadingBarWidth.interpolate({
                  inputRange: [0, screenWidth - 80],
                  outputRange: ['0%', '100%']
                })
              }
            ]} 
          />
        </Animated.View>
      </Animated.View>
    );
  }

  // Si l'utilisateur n'est pas authentifié, afficher l'écran de connexion
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
      
      {/* Afficher les questions d'onboarding si c'est la première connexion */}
      <OnboardingQuestions 
        isVisible={isFirstLogin === true}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#bdc3c7',
    marginBottom: 50,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 120,
    height: 120,
    marginBottom: 25,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#bdc3c7',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  appSlogan: {
    fontSize: 18,
    color: '#ecf0f1',
    marginTop: 10,
    textAlign: 'center',
    width: '80%',
  },
  progressBarContainer: {
    width: '80%',
    height: 10,
    backgroundColor: 'rgba(189, 195, 199, 0.3)',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.secondary,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  sparkle: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#fff',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  progressBarShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
    transform: [{ skewX: '-20deg' }],
    zIndex: 2,
  },
});
