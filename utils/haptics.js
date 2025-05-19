import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';
import { ImpactFeedbackStyle } from './webHapticsFallback';

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

// Fonction améliorée pour un retour haptique plus immersif (style gaming)
const impactAsync = async (style = 'medium') => {
  try {
    switch (style) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      // Nouveau: Double impact pour effet gaming
      case 'doubleLight':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 80);
        break;
      case 'doubleMedium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
        break;
      case 'doubleHeavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 120);
        break;
      // Nouveau: Pattern de vibration pour "achievement"
      case 'achievement':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 80);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 250);
        break;
      // Nouveau: Pattern pour "game over"
      case 'gameOver':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch (error) {
    console.warn('Haptics not supported or error:', error);
  }
};

// Fonction améliorée pour un retour de notification plus expressif
const notificationAsync = async (type = 'success') => {
  try {
    switch (type) {
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      // Nouveau: Style gaming spécifique
      case 'levelUp':
        // Combinaison de vibrations pour effet de "level up"
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
        setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 300);
        break;
      case 'reward':
        // Série de vibrations rapides pour effet de "récompense"
        for (let i = 0; i < 3; i++) {
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), i * 80);
        }
        setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 300);
        break;
      default:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (error) {
    console.warn('Haptics not supported or error:', error);
  }
};

// Nouvelle fonction pour créer des patterns de vibration personnalisés
const patternAsync = async (pattern = []) => {
  try {
    // pattern est un tableau d'objets {type: 'impact' ou 'notification', style: '...', delay: ms}
    if (pattern.length === 0) return;
    
    let delay = 0;
    for (const item of pattern) {
      setTimeout(() => {
        if (item.type === 'impact') {
          impactAsync(item.style);
        } else if (item.type === 'notification') {
          notificationAsync(item.style);
        }
      }, delay);
      
      delay += (item.delay || 100);
    }
  } catch (error) {
    console.warn('Haptics pattern error:', error);
  }
};

const haptics = {
  impactAsync,
  notificationAsync,
  patternAsync
};

export default haptics;