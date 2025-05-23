import React, { useState, useRef } from 'react';
import { StyleSheet, Platform, StatusBar, SafeAreaView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Animated, ActivityIndicator, Alert, Image, ScrollView, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { SCREEN } from '../utils/constants';
import Icon, { COLORS } from '../components/common/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { loginUser, registerUser } from '../services/authService';

const GAMING_COLORS = {
  background: '#151736',
  cardBackground: '#1e2146',
  secondary: '#4e54c8',
  accent: '#a3d8f5',
  darkBlue: '#21254c',
  headerBg: '#0f1123',
};

const LoginScreen = ({ onLoginSuccess, onGuestLogin }) => {
  // États du formulaire
  const [isLogin, setIsLogin] = useState(true); // true pour connexion, false pour inscription
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // États de validation
  const [errors, setErrors] = useState({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  // Animations
  const formTranslateY = useRef(new Animated.Value(50)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  // Référence aux champs pour naviguer entre eux avec le clavier
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const emailRef = useRef(null);
  
  // Fonction pour basculer entre connexion et inscription
  const toggleMode = () => {
    // Animation de sortie
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Basculer le mode
      setIsLogin(!isLogin);
      
      // Réinitialiser les formulaires et erreurs
      setErrors({});
      
      // Animation d'entrée
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };
  
  // Animation pour le bouton au moment du clic
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    // Valider le nom d'utilisateur
    if (!username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis";
    } else if (username.length < 3) {
      newErrors.username = "Le nom d'utilisateur doit comporter au moins 3 caractères";
    }
    
    // Valider le mot de passe
    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      newErrors.password = "Le mot de passe doit comporter au moins 6 caractères";
    }
    
    // Si mode inscription, valider les champs supplémentaires
    if (!isLogin) {
      // Valider la confirmation du mot de passe
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
      }
      
      // Valider l'email si fourni
      if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        newErrors.email = "Format d'email invalide";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    // Masquer le clavier
    Keyboard.dismiss();
    
    // Valider le formulaire
    if (!validateForm()) return;
    
    // Animation du bouton
    animateButton();
    
    try {
      setIsLoading(true);
      
      if (isLogin) {
        // Connexion
        const result = await loginUser(username, password);
        
        if (result.success) {
          // Appeler le callback de succès avec le statut de première connexion
          onLoginSuccess(result.user, result.isFirstLogin);
        } else {
          Alert.alert("Erreur de connexion", result.message || "Identifiants incorrects");
        }
      } else {
        // Inscription
        const result = await registerUser(username, password, email);
        
        if (result.success) {
          // Appeler le callback de succès, c'est toujours une première connexion pour un nouvel utilisateur
          onLoginSuccess(result.user, true);
          
          // Afficher un message de bienvenue
          Alert.alert(
            "Bienvenue sur ChallengR!",
            "Votre compte a été créé avec succès. Vous êtes maintenant connecté."
          );
        } else {
          Alert.alert("Erreur d'inscription", result.message || "Impossible de créer le compte");
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'authentification:", error);
      Alert.alert(
        "Erreur",
        "Une erreur s'est produite lors de " + (isLogin ? "la connexion" : "l'inscription")
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Animation initiale
  React.useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* En-tête et Logo */}
            <View style={styles.headerContainer}>
              <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
                <Image 
                  source={require('../assets/newicon.png')} 
                  style={styles.logo}
                />
              </Animated.View>
              <Text style={styles.appTitle}>ChallengR</Text>
              <Text style={styles.appSlogan}>Relevez des défis, transformez-vous</Text>
            </View>
            
            {/* Formulaire de connexion/inscription */}
            <Animated.View 
              style={[
                styles.formContainer,
                {
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }]
                }
              ]}
            >
              <Text style={styles.formTitle}>
                {isLogin ? "Connexion" : "Créer un compte"}
              </Text>
              
              {/* Champ nom d'utilisateur */}
              <View style={styles.inputContainer}>
                <Icon 
                  name="person-outline" 
                  size={20} 
                  color={COLORS.textSecondary} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[
                    styles.input,
                    errors.username && styles.inputError
                  ]}
                  placeholder="Nom d'utilisateur"
                  placeholderTextColor="#a3aed0"
                  value={username}
                  onChangeText={text => {
                    setUsername(text);
                    if (errors.username) {
                      setErrors({ ...errors, username: null });
                    }
                  }}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
              
              {/* Champ mot de passe */}
              <View style={styles.inputContainer}>
                <Icon 
                  name="lock-closed-outline" 
                  size={20} 
                  color={COLORS.textSecondary} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  ref={passwordRef}
                  style={[
                    styles.input,
                    errors.password && styles.inputError
                  ]}
                  placeholder="Mot de passe"
                  placeholderTextColor="#a3aed0"
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({ ...errors, password: null });
                    }
                  }}
                  secureTextEntry={!passwordVisible}
                  returnKeyType={isLogin ? "done" : "next"}
                  onSubmitEditing={() => {
                    if (isLogin) {
                      handleSubmit();
                    } else {
                      confirmPasswordRef.current?.focus();
                    }
                  }}
                />
                <TouchableOpacity 
                  style={styles.visibilityToggle}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                >
                  <Icon 
                    name={passwordVisible ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={COLORS.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
              
              {/* Champs supplémentaires pour l'inscription */}
              {!isLogin && (
                <>
                  {/* Champ confirmation mot de passe */}
                  <View style={styles.inputContainer}>
                    <Icon 
                      name="shield-checkmark-outline" 
                      size={20} 
                      color={COLORS.textSecondary} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      ref={confirmPasswordRef}
                      style={[
                        styles.input,
                        errors.confirmPassword && styles.inputError
                      ]}
                      placeholder="Confirmer le mot de passe"
                      value={confirmPassword}
                      onChangeText={text => {
                        setConfirmPassword(text);
                        if (errors.confirmPassword) {
                          setErrors({ ...errors, confirmPassword: null });
                        }
                      }}
                      secureTextEntry={!passwordVisible}
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                    />
                  </View>
                  {errors.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  )}
                  
                  {/* Champ email (optionnel) */}
                  <View style={styles.inputContainer}>
                    <Icon 
                      name="mail-outline" 
                      size={20} 
                      color={COLORS.textSecondary} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      ref={emailRef}
                      style={[
                        styles.input,
                        errors.email && styles.inputError
                      ]}
                      placeholder="Email (optionnel)"
                      value={email}
                      onChangeText={text => {
                        setEmail(text);
                        if (errors.email) {
                          setErrors({ ...errors, email: null });
                        }
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                  </View>
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </>
              )}
              
              {/* Lien mot de passe oublié */}
              {isLogin && (
                <TouchableOpacity style={styles.forgotPasswordLink}>
                  <Text style={styles.forgotPasswordText}>Mot de passe oublié?</Text>
                </TouchableOpacity>
              )}
              
              {/* Bouton de soumission */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitButtonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {isLogin ? "Se connecter" : "S'inscrire"}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
              
              {/* Lien pour basculer entre connexion et inscription */}
              <View style={styles.switchModeContainer}>
                <Text style={styles.switchModeText}>
                  {isLogin ? "Pas encore de compte?" : "Déjà un compte?"}
                </Text>
                <TouchableOpacity onPress={toggleMode}>
                  <Text style={styles.switchModeLink}>
                    {isLogin ? "S'inscrire" : "Se connecter"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
        {/* Bouton mode invité en bas à droite */}
        {onGuestLogin && (
          <TouchableOpacity
            style={styles.guestButton}
            onPress={onGuestLogin}
            activeOpacity={0.8}
          >
            <Icon name="person-circle-outline" size={28} color={COLORS.primary} />
            <Text style={styles.guestButtonText}>Mode invité</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GAMING_COLORS.headerBg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: GAMING_COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerContainer: {
    backgroundColor: GAMING_COLORS.headerBg,
    paddingTop: 40,
    paddingBottom: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderBottomWidth: 2,
    borderColor: GAMING_COLORS.secondary,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: GAMING_COLORS.cardBackground,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: GAMING_COLORS.secondary,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GAMING_COLORS.accent,
    marginBottom: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 1.5,
  },
  appSlogan: {
    fontSize: 16,
    color: '#a3aed0',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  formContainer: {
    backgroundColor: GAMING_COLORS.cardBackground,
    margin: 20,
    marginTop: -30,
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: GAMING_COLORS.secondary,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GAMING_COLORS.accent,
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GAMING_COLORS.darkBlue,
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#292b45',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: GAMING_COLORS.accent, // Même couleur que "Mot de passe oublié?"
    height: '100%',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  visibilityToggle: {
    padding: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginLeft: 16,
    marginTop: -5,
    marginBottom: 12,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 6,
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: GAMING_COLORS.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginVertical: 24,
    shadowColor: GAMING_COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  submitButtonGradient: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  switchModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchModeText: {
    color: '#a3aed0',
    fontSize: 15,
  },
  switchModeLink: {
    color: GAMING_COLORS.accent,
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 5,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  guestButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GAMING_COLORS.cardBackground,
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: GAMING_COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: GAMING_COLORS.secondary,
  },
  guestButtonText: {
    color: GAMING_COLORS.accent,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
});

export default LoginScreen;