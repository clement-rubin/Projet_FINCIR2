/**
 * Provides fallback implementations of Haptics functions for web environments
 * where expo-haptics is not supported.
 */

// Emulate the same constants from expo-haptics

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

export const impactAsync = () => Promise.resolve();
export const notificationAsync = () => Promise.resolve();
export const selectionAsync = () => Promise.resolve();