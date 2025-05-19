import { Platform, Vibration } from 'react-native';
import * as webFallback from './webHapticsFallback';

// Définir des constantes locales qui seront toujours disponibles
export const ImpactFeedbackStyle = {
  Light: 'light',
  Medium: 'medium',
  Heavy: 'heavy'
};

export const NotificationFeedbackType = {
  Success: 'success',
  Warning: 'warning',
  Error: 'error'
};

// Wrapper sécurisé pour expo-haptics
const getHaptics = () => {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      return require('expo-haptics');
    }
  } catch (err) {
    // Ignorer silencieusement l'erreur si expo-haptics n'est pas disponible
  }
  return null;
};

const haptics = {
  impactAsync: async (style = 'medium') => {
    if (Platform.OS === 'web') {
      return webFallback.impactAsync(style);
    }
    
    try {
      const Haptics = getHaptics();
      
      // Fallback pour les valeurs numériques directement
      const fallbackValues = {
        'light': 0,
        'medium': 1,
        'heavy': 2
      };
      
      // Simplifier la logique en utilisant directement des strings
      const styleValue = typeof style === 'string' ? style : 'medium';
      const numericValue = fallbackValues[styleValue.toLowerCase()] || 1;
      
      if (Haptics && typeof Haptics.impactAsync === 'function') {
        // Tenter d'utiliser la méthode avec un argument numérique
        return await Haptics.impactAsync(numericValue);
      } else {
        // Fallback sur une vibration
        if (Platform.OS === 'android') {
          Vibration.vibrate(numericValue === 0 ? 10 : numericValue === 2 ? 50 : 20);
        }
      }
    } catch (err) {
      // Fallback sur une vibration en cas d'erreur
      if (Platform.OS === 'android') {
        Vibration.vibrate(20);
      }
    }
    
    return Promise.resolve();
  },
  
  notificationAsync: async (type = 'success') => {
    if (Platform.OS === 'web') {
      return webFallback.notificationAsync(type);
    }
    
    try {
      const Haptics = getHaptics();
      
      // Fallback pour les valeurs numériques directement
      const fallbackValues = {
        'success': 0,
        'warning': 1,
        'error': 2
      };
      
      // Simplifier la logique en utilisant directement des strings
      const typeValue = typeof type === 'string' ? type : 'success';
      const numericValue = fallbackValues[typeValue.toLowerCase()] || 0;
      
      if (Haptics && typeof Haptics.notificationAsync === 'function') {
        // Tenter d'utiliser la méthode avec un argument numérique
        return await Haptics.notificationAsync(numericValue);
      } else {
        // Fallback sur une vibration
        if (Platform.OS === 'android') {
          if (numericValue === 0) {
            Vibration.vibrate([0, 50, 50, 50]);
          } else if (numericValue === 1) {
            Vibration.vibrate([0, 50, 50, 50, 50, 50]);
          } else {
            Vibration.vibrate([0, 100, 100, 100]);
          }
        }
      }
    } catch (err) {
      // Fallback sur une vibration en cas d'erreur
      if (Platform.OS === 'android') {
        Vibration.vibrate([0, 50, 100, 50]);
      }
    }
    
    return Promise.resolve();
  },
  
  selectionAsync: async () => {
    if (Platform.OS === 'web') {
      return webFallback.selectionAsync();
    }
    
    try {
      const Haptics = getHaptics();
      
      if (Haptics && typeof Haptics.selectionAsync === 'function') {
        return await Haptics.selectionAsync();
      } else {
        if (Platform.OS === 'android') {
          Vibration.vibrate(10);
        }
      }
    } catch (err) {
      if (Platform.OS === 'android') {
        Vibration.vibrate(10);
      }
    }
    
    return Promise.resolve();
  }
};

export default haptics;