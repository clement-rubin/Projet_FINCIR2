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

// Fallback implementations that do nothing on web
export const impactAsync = async (style = ImpactFeedbackStyle.Medium) => {
  console.log(`[Haptics Fallback] Impact feedback (${style}) not available on web`);
  return null;
};

export const notificationAsync = async (type = NotificationFeedbackType.Success) => {
  console.log(`[Haptics Fallback] Notification feedback (${type}) not available on web`);
  return null;
};

export const selectionAsync = async () => {
  console.log('[Haptics Fallback] Selection feedback not available on web');
  return null;
};

// Any other methods you might need
export const vibrate = () => {
  console.log('[Haptics Fallback] Vibration not available on web');
  return null;
};