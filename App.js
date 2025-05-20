import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Image, Animated, Dimensions, Easing, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import haptics from './utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AppNavigator from './navigation/AppNavigator';
import OnboardingQuestions from './components/OnboardingQuestions';
import { retrieveUserProfile, storeUserProfile } from './utils/storage';
import LoginScreen from './screens/LoginScreen';
import { isUserAuthenticated, getAuthUser } from './services/authService';
import { COLORS } from './components/common/Icon';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Couleurs gaming plus vibrantes
const GAMING_COLORS = {
  primary: '#151736',
  secondary: '#4e54c8',
  accent: '#a3d8f5',
  neon: '#00ffff',
  purple: '#9933ff',
  darkBlue: '#0f1123',
  gold: '#ffd700',
};

export default function App() {
  const [isFirstLogin, setIsFirstLogin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [splashFinished, setSplashFinished] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  
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
  // Animations additionnelles pour style gaming
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glitchAnim = useRef(new Animated.Value(0)).current;
  const explosionScale = useRef(new Animated.Value(0)).current;
  const explosionOpacity = useRef(new Animated.Value(0)).current;
  const pressStartOpacity = useRef(new Animated.Value(0)).current;
  const xpCounterValue = useRef(new Animated.Value(0)).current;
  const [xpValue, setXpValue] = useState(0);
  const [loadingComplete, setLoadingComplete] = useState(false);

  // Fonction d'animation du splash screen
  const animateSplashScreen = () => {
    // Séquence d'effets haptiques - ACCÉLÉRÉE
    const triggerHapticSequence = () => {
      try {
        // Séquence de démarrage type "power on" - temps réduits
        setTimeout(() => haptics.impactAsync('light'), 50);
        setTimeout(() => haptics.impactAsync('light'), 100);
        setTimeout(() => haptics.impactAsync('medium'), 200);
        setTimeout(() => haptics.impactAsync('heavy'), 400);
        // Séquence de "système prêt" - temps réduits
        setTimeout(() => haptics.impactAsync('medium'), 800);
        setTimeout(() => haptics.impactAsync('heavy'), 900);
        setTimeout(() => haptics.notificationAsync('success'), 1000);
      } catch (err) {
        console.warn('Haptics error:', err);
      }
    };

    // Déclencher la séquence haptique
    triggerHapticSequence();

    // Animation de pulsation continue pour le logo (effet gaming) - VITESSE RÉDUITE
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05, // Amplitude réduite
          duration: 800, // Plus lent pour les confettis
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800, // Plus lent pour les confettis
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      ])
    ).start();

    // Effet de glitch aléatoire - MOINS FRÉQUENT
    const startGlitchEffect = () => {
      const randomTiming = 1000 + Math.random() * 1500; // Réduit pour cycle plus rapide
      Animated.sequence([
        Animated.timing(glitchAnim, {
          toValue: 1,
          duration: 80, // Plus rapide
          useNativeDriver: true
        }),
        Animated.timing(glitchAnim, {
          toValue: 0,
          duration: 80, // Plus rapide
          useNativeDriver: true
        })
      ]).start(() => {
        setTimeout(startGlitchEffect, randomTiming);
      });
    };

    setTimeout(startGlitchEffect, 500); // Commence plus tôt

    // Animation du logo - DURÉE TOTALE RÉDUITE À ~4 SECONDES
    Animated.sequence([
      // Phase 1: Apparition du fond (~0.5s)
      Animated.parallel([
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 150, // Réduit de 300 à 150
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 200, // Réduit de 400 à 200
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
        // Activer les particules avec délai
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 200, // Réduit de 400 à 200
          delay: 50, // Réduit de 150 à 50
          useNativeDriver: true
        })
      ]),
      
      // Phase 2: Animation du logo (~0.5s)
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 200, // Réduit de 400 à 200
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5, // Augmenté pour mouvement plus rapide
          tension: 60, // Augmenté pour mouvement plus rapide
          useNativeDriver: true,
        }),
      ]),
      
      // Phase 3: Animation du titre (~0.5s)
      Animated.stagger(40, [ // Réduit de 75 à 40
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 150, // Réduit de 250 à 150
            useNativeDriver: true,
          }),
          Animated.spring(titleTranslateY, {
            toValue: 0,
            friction: 5, // Plus rapide
            tension: 60, // Plus rapide
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(progressBarOpacity, {
            toValue: 1,
            duration: 100, // Réduit de 200 à 100
            useNativeDriver: true,
          }),
          Animated.spring(sloganTranslateY, {
            toValue: 0,
            friction: 5, // Plus rapide
            tension: 60, // Plus rapide
            useNativeDriver: true,
          }),
        ]),
      ]),
      
      // Phase 4: Barre de chargement (~1.5s - la plus longue)
      Animated.parallel([
        Animated.timing(loadingBarWidth, {
          toValue: screenWidth - 80,
          duration: 1300, // Réduit de 1500 à 1300
          easing: Easing.out(Easing.quad),
          useNativeDriver: false
        }),
        // Compteur XP qui monte
        Animated.timing(xpCounterValue, {
          toValue: 1000,
          duration: 1300, // Réduit de 1500 à 1300
          easing: Easing.out(Easing.quad),
          useNativeDriver: false
        })
      ]),
      
      // Phase 5: Effet d'explosion (~0.5s)
      Animated.parallel([
        Animated.timing(explosionScale, {
          toValue: 2,
          duration: 180, // Réduit de 250 à 180
          easing: Easing.out(Easing.back),
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.timing(explosionOpacity, {
            toValue: 1,
            duration: 70, // Réduit de 100 à 70
            useNativeDriver: true
          }),
          Animated.timing(explosionOpacity, {
            toValue: 0,
            duration: 100, // Réduit de 150 à 100
            delay: 50, // Réduit de 100 à 50
            useNativeDriver: true
          })
        ])
      ]),
      
      // Phase 6: Animation finale du logo (~0.5s)
      Animated.spring(logoScale, {
        toValue: 1.3,
        friction: 5, // Plus rapide
        tension: 70, // Plus rapide
        useNativeDriver: true,
      }),
      
      // Phase 7: Retour à la normale (~0.5s)
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5, // Plus rapide
          tension: 60, // Plus rapide
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 300, // Réduit de 600 à 300
          easing: Easing.elastic(1),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Animation terminée, marquer le chargement comme complet
      setLoadingComplete(true);
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

  // Ajout du handler pour le mode invité
  const handleGuestLogin = () => {
    setIsGuest(true);
    setIsAuthenticated(true);
    setAuthUser({ username: 'Invité', isGuest: true });
    setIsFirstLogin(false);
  };

  // Fonction pour déconnexion (invité ou utilisateur normal)
  const handleLogout = async () => {
    if (isGuest) {
      // Suppression de toutes les données locales pour le mode invité
      try {
        await AsyncStorage.clear();
      } catch (e) {
        console.warn('Erreur lors de la suppression des données invité:', e);
      }
    }
    setIsAuthenticated(false);
    setAuthUser(null);
    setIsGuest(false);
    setIsFirstLogin(true);
    // Ne pas remettre les points à zéro ailleurs dans l'app !
  };

  // Mise à jour du compteur XP pour affichage
  useEffect(() => {
    const listener = xpCounterValue.addListener(({value}) => {
      setXpValue(Math.floor(value));
    });
    
    return () => {
      xpCounterValue.removeListener(listener);
    };
  }, []);

  // Fonction pour continuer après le chargement - VERSION CORRIGÉE
  const handlePressStart = () => {
    console.log("Bouton START pressé!");
    
    // Vibration feedback immédiate
    try {
      haptics.impactAsync('heavy');
    } catch (err) {
      console.warn('Haptics error:', err);
    }
    
    // TRANSITION FORCÉE - aucune condition qui pourrait bloquer
    // Utiliser requestAnimationFrame pour garantir que la transition se produit
    requestAnimationFrame(() => {
      // Passer immédiatement à l'écran principal
      setSplashFinished(true);
      setIsLoading(false);
      // Ces instructions garantissent que l'écran change
      console.log("Transition initiée");
    });
  };

  // Ajouter un useEffect pour détecter quand le chargement est terminé
  // avec un délai plus court
  useEffect(() => {
    if (loadingComplete) {
      console.log("Chargement terminé, lancement automatique...");
      
      // Feedback haptique pour indiquer la fin du chargement
      try {
        haptics.impactAsync('heavy');
        setTimeout(() => haptics.notificationAsync('success'), 100); // Réduit de 200 à 100
      } catch (err) {
        console.warn('Haptics error:', err);
      }
      
      // Délai réduit avant transition
      const timer = setTimeout(() => {
        // Transition avec animation de fondu plus rapide
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300, // Réduit de 500 à 300
          useNativeDriver: true,
        }).start(() => {
          // Passer à l'application une fois l'animation terminée
          setSplashFinished(true);
          setIsLoading(false);
        });
      }, 400); // Réduit de 800 à 400

      return () => clearTimeout(timer);
    }
  }, [loadingComplete]);

  // Afficher le splash screen animé
  if (!splashFinished) {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <StatusBar style="light" />
        <Animated.View style={{ opacity: backgroundOpacity }}>
          <LinearGradient
            colors={[GAMING_COLORS.darkBlue, GAMING_COLORS.primary, GAMING_COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          />
        </Animated.View>
        
        {/* Effet d'explosion à la fin du chargement */}
        <Animated.View style={[
          styles.explosionEffect,
          {
            opacity: explosionOpacity,
            transform: [{ scale: explosionScale }]
          }
        ]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.8)', 'rgba(163,216,245,0.4)', 'rgba(78,84,200,0)']}
            style={styles.explosionGradient}
            radial
          />
        </Animated.View>
        
        {/* Effet de particules/étincelles amélioré */}
        <Animated.View 
          style={[
            styles.sparkleContainer,
            { opacity: sparkleAnim }
          ]}
        >
          {[...Array(20)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.sparkle,
                { 
                  top: `${5 + Math.random() * 90}%`, 
                  left: `${5 + Math.random() * 90}%`,
                  width: 2 + Math.random() * 10,
                  height: 2 + Math.random() * 10,
                  backgroundColor: i % 5 === 0 ? GAMING_COLORS.neon : 
                                 i % 4 === 0 ? GAMING_COLORS.purple : 
                                 i % 3 === 0 ? GAMING_COLORS.gold : 
                                 i % 2 === 0 ? GAMING_COLORS.secondary : '#ffffff',
                  transform: [{ 
                    rotate: `${Math.random() * 360}deg` 
                  }]
                }
              ]}
            />
          ))}
        </Animated.View>
        
        {/* Logo avec effet de pulsation et glitch */}
        <Animated.Image 
          source={require('./assets/newicon.png')} 
          style={[
            styles.splashLogo, 
            { 
              opacity: logoOpacity,
              transform: [
                { scale: Animated.multiply(logoScale, pulseAnim) }, 
                { rotate: logoRotate.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })},
                { translateX: glitchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, (Math.random() > 0.5 ? 10 : -10)]
                })},
                { translateY: glitchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, (Math.random() > 0.5 ? 5 : -5)]
                })}
              ]
            }
          ]}
        />
        
        {/* Titre avec effet gaming */}
        <Animated.Text style={[
          styles.appTitle, 
          { 
            opacity: titleOpacity, 
            transform: [
              { translateY: titleTranslateY },
              { translateX: glitchAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, (Math.random() > 0.5 ? 5 : -5)]
              })}
            ] 
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
          LEVEL UP YOUR LIFE
        </Animated.Text>
        
        {/* XP Counter dans style gaming */}
        <Animated.Text style={[
          styles.xpCounter,
          { opacity: progressBarOpacity }
        ]}>
          XP: {xpValue}
        </Animated.Text>
        
        {/* Barre de progression stylisée */}
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
                transform: [{ 
                  translateX: loadingBarWidth.interpolate({
                    inputRange: [0, screenWidth - 80],
                    outputRange: [0, screenWidth - 110]
                  })
                }]
              }
            ]} 
          />
          
          {/* Petits segments pour style gaming */}
          <View style={styles.progressSegments}>
            {[...Array(10)].map((_, i) => (
              <View key={i} style={styles.progressSegment} />
            ))}
          </View>
        </Animated.View>
        
        {/* Message "Loading" ou "Complete" selon l'état */}
        <Animated.Text style={[
          styles.loadingText,
          { opacity: progressBarOpacity }
        ]}>
          {loadingComplete ? "CHARGEMENT TERMINÉ" : "LOADING..."}
        </Animated.Text>
      </Animated.View>
    );
  }

  // Si l'utilisateur n'est pas authentifié, afficher l'écran de connexion
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} onGuestLogin={handleGuestLogin} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator isGuest={isGuest} onLogout={handleLogout} />
      
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
    borderWidth: 2,
    borderColor: GAMING_COLORS.neon,
    shadowColor: GAMING_COLORS.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: GAMING_COLORS.accent,
    marginTop: 15,
    letterSpacing: 2,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: GAMING_COLORS.darkBlue,
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
    color: '#ffffff',
    marginTop: 20,
    letterSpacing: 2,
    textShadowColor: GAMING_COLORS.neon,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    fontFamily: 'System',
  },
  appSlogan: {
    fontSize: 16,
    color: GAMING_COLORS.accent,
    marginTop: 10,
    textAlign: 'center',
    width: '80%',
    letterSpacing: 1,
    fontWeight: '600',
  },
  progressBarContainer: {
    width: '80%',
    height: 15,
    backgroundColor: 'rgba(15, 17, 35, 0.7)',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 25,
    borderWidth: 1,
    borderColor: GAMING_COLORS.neon,
    shadowColor: GAMING_COLORS.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: GAMING_COLORS.neon,
  },
  progressBarShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 5,
    transform: [{ skewX: '-20deg' }],
    zIndex: 2,
  },
  progressSegments: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    zIndex: 3,
  },
  progressSegment: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(15, 17, 35, 0.5)',
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
  xpCounter: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GAMING_COLORS.gold,
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  explosionEffect: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    zIndex: 2,
  },
  explosionGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 150,
  },
  pressStartContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  pressStartButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderWidth: 2,
    borderColor: GAMING_COLORS.neon,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
  },
  pressStartText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GAMING_COLORS.neon,
    textShadowColor: GAMING_COLORS.neon,
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  // Nouveau style pour le texte d'instruction
  tapInstructionText: {
    color: GAMING_COLORS.accent,
    fontSize: 14,
    marginTop: 5,
    opacity: 0.9,
    textShadowColor: GAMING_COLORS.darkBlue,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
