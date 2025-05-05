import React from 'react';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Composant unifié pour gérer les icônes de l'application
 * Simplifie l'utilisation des icônes et facilite les changements globaux
 */
export const Icon = ({ type = 'ionicons', name, size = 24, color = '#000', style = {} }) => {
  switch (type.toLowerCase()) {
    case 'ionicons':
      return <Ionicons name={name} size={size} color={color} style={style} />;
    case 'fontawesome5':
    case 'fa5':
      return <FontAwesome5 name={name} size={size} color={color} style={style} />;
    case 'materialcommunity':
    case 'material':
      return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
    default:
      return <Ionicons name={name} size={size} color={color} style={style} />;
  }
};

// Couleurs communes utilisées dans l'application
export const COLORS = {
  primary: '#3498db',
  primaryDark: '#2980b9',
  secondary: '#4a66f7',
  accent: '#f39c12',
  success: '#27ae60',
  warning: '#f39c12',
  error: '#e74c3c',
  info: '#3498db',
  light: '#ecf0f1',
  dark: '#2c3e50',
  white: '#ffffff',
  black: '#000000',
  background: '#f5f8fa',
  card: '#ffffff',
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  textLight: '#95a5a6',
};

export default Icon;