import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Icon from './common/Icon';
import { CHALLENGE_TYPES, CHALLENGE_CATEGORIES } from '../utils/constants';
import { formatDate, getTimeRemaining, getRelativeTime } from '../utils/dateUtils';

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
  onRate,
  userRating = 0,
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
  const getRemainingTimeText = () => {
    if (!expiresAt) return null;
    
    // Utiliser notre fonction utilitaire pour obtenir un texte convivial
    return getTimeRemaining(expiresAt);
  };
  
  // Formater la date d'expiration pour l'affichage
  const getExpirationDateText = () => {
    if (!expiresAt) return null;
    
    const expireDate = new Date(expiresAt);
    
    // Utiliser notre fonction de formatage avec des options adaptées
    return formatDate(expireDate, { 
      showWeekday: true, 
      showTime: true, 
      showYear: false 
    });
  };
  
  // Style spécifique selon le type de défi et la catégorie
  const getTaskTypeStyle = () => {
    const baseStyle = {
      borderLeftWidth: 5,
    };

    if (completed) {
      return {
        ...baseStyle,
        backgroundColor: '#e8f5e9',
        borderLeftColor: '#4caf50',
      };
    }

    // Si c'est un défi quotidien, on garde le style orange
    if (type === CHALLENGE_TYPES.DAILY) {
      return {
        ...baseStyle,
        borderLeftColor: '#f39c12',
        backgroundColor: '#fffbef'
      };
    }

    // Pour les défis standards, on utilise la couleur de la catégorie
    const categoryInfo = getCategoryInfo();
    if (categoryInfo) {
      return {
        ...baseStyle,
        borderLeftColor: categoryInfo.color,
        backgroundColor: `${categoryInfo.color}10`, // Très légère teinte de la couleur de la catégorie
      };
    }

    // Style par défaut si pas de catégorie
    return baseStyle;
  };
  
  // Récupérer l'icône et la couleur de la catégorie (si définie)
  const getCategoryInfo = () => {
    if (!category) return null;
    
    const categoryKey = Object.keys(CHALLENGE_CATEGORIES).find(
      key => CHALLENGE_CATEGORIES[key].id.toLowerCase() === category.toLowerCase()
    );
    
    return categoryKey ? CHALLENGE_CATEGORIES[categoryKey] : null;
  };
  
  const categoryInfo = getCategoryInfo();
  const timeRemainingText = getRemainingTimeText();
  const expirationDateText = getExpirationDateText();

  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);

  const handleComplete = () => {
    // Valider directement le défi
    onComplete();
    // Afficher l'option de notation
    setShowRating(true);
  };

  const handleRateSubmit = () => {
    if (onRate) {
      onRate(rating);
    }
    setShowRating(false);
  };

  const handleSkipRating = () => {
    setShowRating(false);
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
        >
          <Icon
            name={i <= rating ? "star" : "star-outline"}
            size={30}
            color={i <= rating ? "#FFD700" : "#bbb"}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const renderCompletedRating = () => {
    if (!completed || !userRating) return null;
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Icon
          key={i}
          name={i <= userRating ? "star" : "star-outline"}
          size={16}
          color={i <= userRating ? "#FFD700" : "#bbb"}
          style={{ marginRight: 2 }}
        />
      );
    }
    
    return (
      <View style={styles.completedRatingContainer}>
        <Text style={styles.completedRatingLabel}>Difficulté évaluée :</Text>
        <View style={styles.completedStarsContainer}>
          {stars}
        </View>
      </View>
    );
  };
  
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
          
          {timeRemainingText && (
            <View style={styles.timeContainer}>
              <Icon name="time" size={14} color="#e74c3c" style={styles.timeIcon} />
              <Text style={styles.timeText}>{timeRemainingText}</Text>
            </View>
          )}
          
          {renderCompletedRating()}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        {!completed && !showRating && (
          <TouchableOpacity 
            style={styles.completeButton} 
            onPress={handleComplete}
          >
            <Icon name="checkmark" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Terminer</Text>
          </TouchableOpacity>
        )}
        
        {showRating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>Comment avez-vous trouvé ce défi ?</Text>
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>
            <View style={styles.ratingButtons}>
              <TouchableOpacity 
                style={[styles.submitRatingButton, styles.skipButton]}
                onPress={handleSkipRating}
              >
                <Text style={styles.skipButtonText}>Passer</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitRatingButton}
                onPress={handleRateSubmit}
              >
                <Text style={styles.submitRatingText}>Valider la note</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!completed && !showRating && (
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={onDelete}
          >
            <Icon name="trash" size={16} color="#e74c3c" style={styles.buttonIcon} />
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
        )}
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
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  starButton: {
    padding: 5,
  },
  submitRatingButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  submitRatingText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  completedRatingContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  completedRatingLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  completedStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  skipButton: {
    backgroundColor: '#f8f8f8',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  skipButtonText: {
    color: '#666',
  }
});

export default Task;