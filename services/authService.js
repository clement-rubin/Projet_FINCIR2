import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUniqueId } from '../utils/constants';
import { storeUserProfile, retrieveUserProfile } from '../utils/storage';

// Clés de stockage
const AUTH_USERS_KEY = '@challengr_auth_users';
const CURRENT_USER_KEY = '@challengr_current_user';

// Initialiser le stockage des utilisateurs
export const initializeAuthStorage = async () => {
  try {
    const users = await AsyncStorage.getItem(AUTH_USERS_KEY);
    
    if (!users) {
      await AsyncStorage.setItem(AUTH_USERS_KEY, JSON.stringify([]));
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du stockage d\'authentification:', error);
    return false;
  }
};

// Initialiser le service d'authentification
initializeAuthStorage();

// Vérifier si un utilisateur existe déjà
export const checkUserExists = async (username) => {
  try {
    const usersJson = await AsyncStorage.getItem(AUTH_USERS_KEY);
    if (!usersJson) return false;
    
    const users = JSON.parse(usersJson);
    return users.some(user => user.username.toLowerCase() === username.toLowerCase());
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'existence d\'un utilisateur:', error);
    return false;
  }
};

// Inscrire un nouvel utilisateur
export const registerUser = async (username, password, email = '') => {
  try {
    // Vérifier si l'utilisateur existe déjà
    const userExists = await checkUserExists(username);
    if (userExists) {
      return { success: false, message: 'Cet utilisateur existe déjà' };
    }
    
    // Récupérer la liste des utilisateurs
    const usersJson = await AsyncStorage.getItem(AUTH_USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : [];
    
    // Créer un nouvel utilisateur
    const userId = generateUniqueId();
    const newUser = {
      userId,
      username,
      password, // En production, il faudrait hacher ce mot de passe
      email,
      createdAt: new Date().toISOString()
    };
    
    // Ajouter l'utilisateur à la liste
    const updatedUsers = [...users, newUser];
    await AsyncStorage.setItem(AUTH_USERS_KEY, JSON.stringify(updatedUsers));
    
    // Créer un profil utilisateur associé
    const userProfile = {
      userId,
      username,
      email,
      bio: 'Passionné de défis et aventures!',
      profileImage: null,
      isFirstLogin: true // Pour déclencher l'onboarding
    };
    
    // Stocker d'abord l'utilisateur courant pour que storeUserProfile puisse trouver le bon ID
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
      userId,
      username,
      email
    }));
    
    // Sauvegarde directe du profil avec la clé utilisateur spécifique
    // Assurons-nous que le profil est bien enregistré avec la bonne clé
    const userProfileKey = `@challengr_user_profile_${userId}`;
    await AsyncStorage.setItem(userProfileKey, JSON.stringify(userProfile));
    
    // Appeler également storeUserProfile pour cohérence
    await storeUserProfile(userProfile);
    
    return { 
      success: true, 
      user: {
        userId,
        username,
        email
      }
    };
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return { success: false, message: 'Erreur lors de l\'inscription' };
  }
};

// Connecter un utilisateur
export const loginUser = async (username, password) => {
  try {
    // Récupérer la liste des utilisateurs
    const usersJson = await AsyncStorage.getItem(AUTH_USERS_KEY);
    if (!usersJson) return { success: false, message: 'Identifiants incorrects' };
    
    const users = JSON.parse(usersJson);
    
    // Trouver l'utilisateur correspondant
    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    
    if (!user) {
      return { success: false, message: 'Identifiants incorrects' };
    }
    
    // Stocker les informations de l'utilisateur connecté
    const userInfo = {
      userId: user.userId,
      username: user.username,
      email: user.email
    };
    
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userInfo));
    
    // Important: récupérer le profil spécifique à cet utilisateur
    // en utilisant directement la clé avec l'ID utilisateur
    const userProfileKey = `@challengr_user_profile_${user.userId}`;
    const storedProfileJson = await AsyncStorage.getItem(userProfileKey);
    
    let isFirstLogin = false;
    
    // Si l'utilisateur a déjà un profil, l'utiliser
    if (storedProfileJson) {
      const storedProfile = JSON.parse(storedProfileJson);
      // Important: si l'utilisateur a déjà complété l'onboarding,
      // on veut toujours considérer que ce n'est PAS sa première connexion
      isFirstLogin = storedProfile.isFirstLogin === true; // Explicitement vérifier true
    } else {
      // Si l'utilisateur n'a pas encore de profil (cas rare mais possible),
      // créer un profil par défaut avec isFirstLogin à true
      const defaultProfile = {
        userId: user.userId,
        username: user.username,
        email: user.email,
        bio: 'Passionné de défis et aventures!',
        profileImage: null,
        isFirstLogin: true
      };
      
      await AsyncStorage.setItem(userProfileKey, JSON.stringify(defaultProfile));
      isFirstLogin = true;
    }
    
    return { 
      success: true, 
      user: userInfo,
      isFirstLogin: isFirstLogin
    };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return { success: false, message: 'Erreur lors de la connexion' };
  }
};

// Vérifier si l'utilisateur est connecté
export const isUserAuthenticated = async () => {
  try {
    const currentUser = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return currentUser !== null;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    return false;
  }
};

// Récupérer les informations de l'utilisateur connecté
export const getAuthUser = async () => {
  try {
    const currentUser = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (!currentUser) return null;
    
    return JSON.parse(currentUser);
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de l\'utilisateur:', error);
    return null;
  }
};

// Déconnecter l'utilisateur
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    return { success: false, message: 'Erreur lors de la déconnexion' };
  }
};