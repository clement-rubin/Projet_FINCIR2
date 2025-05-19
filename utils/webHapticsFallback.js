/**
 * Provides fallback implementations of Haptics functions for web environments
 * where expo-haptics is not supported.
 */

// Emulate the same constants from expo-haptics

export const ImpactFeedbackStyle = {
  Light: 'light',
  Medium: 'medium',
  Heavy: 'heavy',
  // Nouveaux styles gaming
  DoubleLight: 'doubleLight',
  DoubleMedium: 'doubleMedium',
  DoubleHeavy: 'doubleHeavy',
  Achievement: 'achievement',
  GameOver: 'gameOver'
};

export const NotificationFeedbackType = {
  Success: 'success',
  Warning: 'warning',
  Error: 'error',
  // Nouveaux types gaming
  LevelUp: 'levelUp',
  Reward: 'reward'
};

// Patterns de vibration prédéfinis pour effets gaming
export const VibrationPatterns = {
  // Effet de victoire
  VICTORY: [
    {type: 'impact', style: 'light', delay: 0},
    {type: 'impact', style: 'medium', delay: 100},
    {type: 'impact', style: 'heavy', delay: 200},
    {type: 'notification', style: 'success', delay: 300}
  ],
  
  // Effet d'échec
  DEFEAT: [
    {type: 'impact', style: 'heavy', delay: 0},
    {type: 'impact', style: 'medium', delay: 200},
    {type: 'impact', style: 'light', delay: 100},
    {type: 'notification', style: 'error', delay: 200}
  ],
  
  // Effet de montée en puissance
  POWER_UP: [
    {type: 'impact', style: 'light', delay: 0},
    {type: 'impact', style: 'light', delay: 70},
    {type: 'impact', style: 'medium', delay: 70},
    {type: 'impact', style: 'medium', delay: 70},
    {type: 'impact', style: 'heavy', delay: 70},
    {type: 'notification', style: 'success', delay: 150}
  ],
  
  // Effet de pulsation
  HEARTBEAT: [
    {type: 'impact', style: 'medium', delay: 0},
    {type: 'impact', style: 'heavy', delay: 100},
    {type: 'impact', style: 'medium', delay: 500},
    {type: 'impact', style: 'heavy', delay: 100}
  ]
};

export const impactAsync = () => Promise.resolve();
export const notificationAsync = () => Promise.resolve();
export const selectionAsync = () => Promise.resolve();