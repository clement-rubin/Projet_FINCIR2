import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Icon from './common/Icon';
import { getRelativeTime } from '../utils/dateUtils';

const Task = ({ 
  title, 
  description, 
  points, 
  difficulty, 
  difficultyColor,
  completed,
  type,
  category,
  expiresAt,
  dueDate,
  completedAt,
  streak,
  onComplete,
  onDelete,
  onRate,
  userRating,
  index = 0
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [rating, setRating] = useState(userRating || 0);
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true
        })
      ]).start();
    }, 100);
    
    return () => clearTimeout(timeout);
  }, []);
  
  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };
  
  const toggleDescription = () => {
    setShowDescription(!showDescription);
  };
  
  const handleRate = (value) => {
    setRating(value);
    if (onRate) onRate(value);
  };
  
  // Détermine si une date d'échéance arrive bientôt (dans les 24 heures)
  const isUrgent = () => {
    if (!dueDate) return false;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffInHours = (due - now) / (1000 * 60 * 60);
    
    return diffInHours > 0 && diffInHours < 24;
  };
  
  // Formatage de l'expiration
  const getExpiryInfo = () => {
    if (!expiresAt) return null;
    
    return getRelativeTime(expiresAt);
  };
  
  // Formatage de la date d'échéance
  const getDueDateInfo = () => {
    if (!dueDate) return null;
    
    return getRelativeTime(dueDate);
  };

  return (
    <Animated.View 
      style={[
        styles.taskContainer, 
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      {/* Badges spéciaux et indicateurs */}
      {type === 'DAILY' && (
        <View style={styles.typeIndicator}>
          <Icon name="calendar" size={12} color="#fff" />
          <Text style={styles.typeText}>Quotidien</Text>
        </View>
      )}
      
      {streak > 0 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>{streak}🔥</Text>
        </View>
      )}
      
      {/* Effet de brillance pour les tâches urgentes */}
      {dueDate && isUrgent() && <View style={styles.glowEffect} />}
      
      {/* Contenu principal de la tâche */}
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <Text 
            style={styles.taskTitle}
            numberOfLines={showDescription ? undefined : 1}
          >
            {title}
          </Text>
          <View style={styles.pointsContainer}>
            <Text style={styles.points}>+{points}</Text>
          </View>
        </View>
        
        {showDescription && (
          <Text style={styles.taskDescription}>
            {description}
          </Text>
        )}
        
        <View style={styles.taskMeta}>
          <View style={styles.taskInfo}>
            {category && (
              <View style={styles.taskCategory}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            )}
            <View 
              style={[
                styles.taskDifficulty,
                { backgroundColor: difficultyColor }
              ]}
            >
              <Text style={styles.difficultyText}>{difficulty}</Text>
            </View>
          </View>
          
          <View style={styles.taskActions}>
            {!completed && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.completeButton]}
                onPress={onComplete}
              >
                <Icon name="checkmark" size={18} color="#2ecc71" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={toggleDescription}
            >
              <Icon name={showDescription ? "chevron-up" : "chevron-down"} size={18} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={onDelete}
            >
              <Icon name="trash" size={18} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Informations supplémentaires */}
        {dueDate && (
          <View style={styles.dueDateContainer}>
            <Icon name="time" size={14} color="#a3d8f5" />
            <Text style={[
              styles.dueDateText,
              isUrgent() && styles.expiryWarning
            ]}>
              {isUrgent() ? "Urgent! " : ""}
              À faire {getDueDateInfo()}
            </Text>
          </View>
        )}
        
        {expiresAt && (
          <View style={styles.dueDateContainer}>
            <Icon name="alarm" size={14} color="#a3d8f5" />
            <Text style={styles.dueDateText}>
              Expire {getExpiryInfo()}
            </Text>
          </View>
        )}
        
        {/* Options de notation pour les tâches complétées */}
        {completed && (
          <>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  style={[
                    styles.ratingButton,
                    rating >= star && styles.ratingButtonActive
                  ]}
                  onPress={() => handleRate(star)}
                >
                  <Icon 
                    name={rating >= star ? "star" : "star-outline"} 
                    size={20} 
                    color={rating >= star ? "#ffd700" : "#7f8c8d"} 
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.completedInfo}>
              <Text style={styles.completedAt}>
                Complété {completedAt ? getRelativeTime(completedAt) : "récemment"}
              </Text>
            </View>
          </>
        )}
      </View>
      
      {/* Overlay pour les tâches complétées */}
      {completed && (
        <View style={styles.completedOverlay}>
          <Text style={styles.completedText}>Accompli</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  taskContainer: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e2146',
    borderWidth: 1,
    borderColor: '#292b45',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  taskContent: {
    padding: 15,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  taskDescription: {
    fontSize: 14,
    color: '#a3aed0',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDifficulty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  taskCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    backgroundColor: 'rgba(78, 84, 200, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  categoryText: {
    color: '#a3d8f5',
    fontSize: 12,
    fontWeight: '500',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    backgroundColor: 'rgba(78, 84, 200, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  completeButton: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
  },
  deleteButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
  },
  pointsContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#4e54c8',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#21254c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  points: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  completedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(46, 204, 113, 0.8)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    transform: [{ rotate: '-15deg' }],
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(78, 84, 200, 0.1)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(78, 84, 200, 0.2)',
  },
  dueDateText: {
    fontSize: 12,
    color: '#a3d8f5',
    marginLeft: 5,
  },
  expiryWarning: {
    color: '#ff7675',
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  ratingButton: {
    padding: 5,
    marginHorizontal: 2,
  },
  ratingButtonActive: {
    // No change needed
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  completedAt: {
    fontSize: 11,
    color: '#a3aed0',
    fontStyle: 'italic',
  },
  // Animations and effects
  streakBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#ff9f43',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#21254c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 2,
  },
  streakText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(78, 84, 200, 0.5)',
  },
  typeIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(52, 152, 219, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
});

export default Task;