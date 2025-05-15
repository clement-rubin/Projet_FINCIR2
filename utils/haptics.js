import { Platform, Vibration } from 'react-native';
import * as webFallback from './webHapticsFallback';

// Toujours définir les constantes, même si expo-haptics n'est pas chargé
export const ImpactFeedbackStyle = webFallback.ImpactFeedbackStyle;
export const NotificationFeedbackType = webFallback.NotificationFeedbackType;

const haptics = {
  impactAsync: async (style = ImpactFeedbackStyle.Medium) => {
    if (Platform.OS === 'web') {
      return webFallback.impactAsync(style);
    }
    try {
      const Haptics = Platform.OS === 'ios' || Platform.OS === 'android'
        ? require('expo-haptics')
        : null;
      if (Haptics && Haptics.impactAsync && Haptics.ImpactFeedbackStyle) {
        let nativeStyle = Haptics.ImpactFeedbackStyle.Medium;
        if (style === ImpactFeedbackStyle.Light) nativeStyle = Haptics.ImpactFeedbackStyle.Light;
        if (style === ImpactFeedbackStyle.Heavy) nativeStyle = Haptics.ImpactFeedbackStyle.Heavy;
        return await Haptics.impactAsync(nativeStyle);
      }
    } catch (e) {
      if (Platform.OS === 'android') {
        Vibration.vibrate(30);
      }
    }
    return Promise.resolve();
  },
  notificationAsync: async (type = NotificationFeedbackType.Success) => {
    if (Platform.OS === 'web') {
      return webFallback.notificationAsync(type);
    }
    try {
      const Haptics = Platform.OS === 'ios' || Platform.OS === 'android'
        ? require('expo-haptics')
        : null;
      // Correction ici : toujours fallback sur les constantes locales si undefined
      const notifTypes = (Haptics && Haptics.NotificationFeedbackType) || NotificationFeedbackType;
      if (Haptics && Haptics.notificationAsync && notifTypes) {
        let nativeType = notifTypes.Success;
        if (type === NotificationFeedbackType.Warning) nativeType = notifTypes.Warning;
        if (type === NotificationFeedbackType.Error) nativeType = notifTypes.Error;
        return await Haptics.notificationAsync(nativeType);
      }
    } catch (e) {
      if (Platform.OS === 'android') {
        Vibration.vibrate([0, 20, 40, 30]);
      }
    }
    return Promise.resolve();
  },
  selectionAsync: async () => {
    if (Platform.OS === 'web') {
      return webFallback.selectionAsync();
    }
    try {
      const Haptics = Platform.OS === 'ios' || Platform.OS === 'android'
        ? require('expo-haptics')
        : null;
      if (Haptics && Haptics.selectionAsync) {
        return await Haptics.selectionAsync();
      }
    } catch (e) {
      if (Platform.OS === 'android') {
        Vibration.vibrate(10);
      }
    }
    return Promise.resolve();
  }
};

export default haptics;
