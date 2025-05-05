import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Icon from './common/Icon';
import { CHALLENGE_TYPES, CHALLENGE_CATEGORIES } from '../utils/constants';

const Task = ({ 
  title, 
  description, 
  points, 
  difficulty, 
  difficultyColor = '#3498db',
  category,
  type = CHALLENGE_TYPES.REGULAR,
  completed, 
  expiresAt,
  streak,
  onComplete, 
  onDelete,
  index = 0 // Nouvel indice pour animer l'entrée en cascade
}) => {
  // Animation d'entrée de la tâche
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Animation d'entrée avec délai basé sur l'index pour effet cascade
    const delay = index * 100; // Délai progressif basé sur l'indice de l'élément
    
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: delay,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        delay: delay,
        useNativeDriver: true
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 400,
        delay: delay,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  // Calcul du temps restant pour les défis temporaires
  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expireDate = new Date(expiresAt);
    const diffMs = expireDate - now;
    
    if (diffMs <= 0) return 'Expiré';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}j ${diffHrs}h restants`;
    } else {
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHrs}h ${diffMins}m restants`;
    }
  };
  
  // Style spécifique selon le type de défi
  const getTaskTypeStyle = () => {
    switch (type) {
      case CHALLENGE_TYPES.DAILY:
        return {
          borderLeftWidth: 5,
          borderLeftColor: '#f39c12',
          backgroundColor: '#fffbef'
        };
      case CHALLENGE_TYPES.TIMED:
        return {
          borderLeftWidth: 5,
          borderLeftColor: '#e74c3c',
          backgroundColor: '#fef5f5'
        };
      case CHALLENGE_TYPES.STREAK:
        return {
          borderLeftWidth: 5,
          borderLeftColor: '#9b59b6',
          backgroundColor: '#f9f0fc'
        };
      case CHALLENGE_TYPES.COMMUNITY:
        return {
          borderLeftWidth: 5,
          borderLeftColor: '#27ae60',
          backgroundColor: '#f0fcf5'
        };
      default:
        return completed ? {
          backgroundColor: '#e8f5e9',
          borderLeftWidth: 5,
          borderLeftColor: '#4caf50',
        } : {};
    }
  };
  
  // Récupérer l'icône et la couleur de la catégorie (si définie)
  const getCategoryInfo = () => {
    if (!category) return null;
    
    let categoryInfo = null;
    Object.values(CHALLENGE_CATEGORIES).forEach(cat => {
      if (cat.id === category.toLowerCase() || cat.id === category) {
        categoryInfo = cat;
      }
    });
    
    return categoryInfo || null;
  };
  
  const categoryInfo = getCategoryInfo();
  const timeRemaining = getTimeRemaining();
  
  return (
    <Animated.View style={[styles.container, getTaskTypeStyle(), { transform: [{ scale: scaleAnim }, { translateY: translateYAnim }], opacity: opacityAnim }]}>
      {/* Badges de type et catégorie */}
      <View style={styles.badgeContainer}>
        {type === CHALLENGE_TYPES.DAILY && (
          <View style={[styles.typeBadge, { backgroundColor: '#f39c12' }]}>
            <Icon name="today" size={12} color="#fff" style={styles.badgeIcon} />
            <Text style={styles.typeBadgeText}>Quotidien</Text>
          </View>
        )}
        
        {type === CHALLENGE_TYPES.TIMED && (
          <View style={[styles.typeBadge, { backgroundColor: '#e74c3c' }]}>
            <Icon name="timer" size={12} color="#fff" style={styles.badgeIcon} />
            <Text style={styles.typeBadgeText}>Temporaire</Text>
          </View>
        )}
        
        {type === CHALLENGE_TYPES.STREAK && (
          <View style={[styles.typeBadge, { backgroundColor: '#9b59b6' }]}>
            <Icon name="flame" size={12} color="#fff" style={styles.badgeIcon} />
            <Text style={styles.typeBadgeText}>Série: {streak || 0}</Text>
          </View>
        )}
        
        {categoryInfo && (
          <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '20', borderColor: categoryInfo.color }]}>
            <Icon name={categoryInfo.icon} size={12} color={categoryInfo.color} style={styles.badgeIcon} />
            <Text style={[styles.categoryBadgeText, { color: categoryInfo.color }]}>{categoryInfo.name}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.taskInfo}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        
        <View style={styles.metaContainer}>
          <View style={[styles.pointsContainer, { backgroundColor: difficultyColor + '20', borderColor: difficultyColor }]}>
            <Icon name="star" size={14} color={difficultyColor} style={styles.pointsIcon} />
            <Text style={[styles.pointsText, { color: difficultyColor }]}>+{points} points</Text>
          </View>
          
          {timeRemaining && (
            <View style={styles.timeContainer}>
              <Icon name="time" size={14} color="#e74c3c" style={styles.timeIcon} />
              <Text style={styles.timeText}>{timeRemaining}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        {!completed && (
          <TouchableOpacity 
            style={styles.completeButton} 
            onPress={onComplete}
          >
            <Icon name="checkmark" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Terminer</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={onDelete}
        >
          <Icon name="trash" size={16} color="#e74c3c" style={styles.buttonIcon} />
          <Text style={styles.deleteButtonText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 5,
  },
  badgeIcon: {
    marginRight: 4,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 5,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskInfo: {
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 5,
  },
  pointsIcon: {
    marginRight: 4,
  },
  pointsText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe5e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 5,
  },
  timeIcon: {
    marginRight: 4,
  },
  timeText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  completeButton: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: '#e74c3c',
  },
});

export default Task;