import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  FlatList
} from 'react-native';
import Icon, { COLORS } from './common/Icon';
import { LEVEL_CONFIG } from '../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Fonction pour déterminer la couleur du niveau
const getLevelColor = (level) => {
  const colors = {
    2: ['#4e54c8', '#8a8ee8'],
    3: ['#3f7bd9', '#62a6f7'],
    4: ['#2e9eb0', '#43c9db'],
    5: ['#26ab5c', '#3dd980'],
    6: ['#d4af37', '#f0cd5d'],
    7: ['#e74c3c', '#ff7566'],
    8: ['#9b59b6', '#c27ddb'],
    9: ['#2c3e50', '#45617d'],
    10: ['#ffa500', '#ffc457'],
  };
  return colors[level] || ['#4e54c8', '#8a8ee8']; // Couleur par défaut
};

// Map des icônes par type d'avantage
const advantageIcons = {
  finance: "dollar-sign",
  trading: "trending-up",
  access: "unlock",
  badge: "award",
  community: "users",
  support: "life-buoy",
  exclusive: "star",
  vip: "crown",
  default: "check-circle"
};

// Fonction pour déterminer l'icône d'un avantage
const getAdvantageIcon = (advantage) => {
  const lowerAdvantage = advantage.toLowerCase();
  
  for (const [type, icon] of Object.entries(advantageIcons)) {
    if (lowerAdvantage.includes(type)) {
      return icon;
    }
  }
  
  return advantageIcons.default;
};

const LevelPowersModal = ({ visible, onClose, currentLevel, currentPoints }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(bounceAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          })
        ])
      ]).start();
      
      // Auto-scroll pour montrer le niveau actuel après un court délai
      setTimeout(() => {
        if (scrollViewRef.current && currentLevel) {
          const currentLevelIndex = levelKeys.findIndex(level => level === currentLevel);
          if (currentLevelIndex > 0) {
            // Approximation de la position de défilement
            const estimatedPosition = currentLevelIndex * 200;
            scrollViewRef.current.scrollTo({ y: estimatedPosition, animated: true });
          }
        }
      }, 500);
    } else {
      // Reset animations when modal is closed
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      bounceAnim.setValue(0);
    }
  }, [visible]);

  // Déterminer si le contenu est défilable
  useEffect(() => {
    setShowScrollIndicator(contentHeight > scrollViewHeight && scrollViewHeight > 0);
  }, [contentHeight, scrollViewHeight]);

  // Extraire tous les niveaux, y compris le niveau actuel
  const levelKeys = Object.keys(LEVEL_CONFIG)
    .map(level => parseInt(level))
    .filter(level => level >= currentLevel)
    .sort((a, b) => a - b);

  // Calculer la progression vers le niveau suivant
  const calculateProgress = () => {
    if (!currentLevel || !currentPoints) return 0;
    
    const currentLevelConfig = LEVEL_CONFIG[currentLevel] || {};
    const nextLevelConfig = LEVEL_CONFIG[currentLevel + 1] || {};
    
    if (!nextLevelConfig.pointsRequired) return 100;
    
    const pointsForCurrentLevel = currentLevelConfig.pointsRequired || 0;
    const pointsNeededForNextLevel = nextLevelConfig.pointsRequired - pointsForCurrentLevel;
    const userPointsAboveCurrentLevel = currentPoints - pointsForCurrentLevel;
    
    const progressPercentage = (userPointsAboveCurrentLevel / pointsNeededForNextLevel) * 100;
    return Math.min(Math.max(progressPercentage, 0), 100);
  };

  const progressPercentage = calculateProgress();
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <LinearGradient
                colors={['rgba(30, 33, 70, 0.9)', 'rgba(25, 28, 60, 0.95)']}
                style={styles.gradientBackground}
              >
                <View style={styles.headerContainer}>
                  <Text style={styles.modalTitle}>Progression et Pouvoirs</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Icon name="close" size={24} color="#a3aed0" />
                  </TouchableOpacity>
                </View>
                
                {/* Barre de progression vers le niveau suivant */}
                {currentLevel < Math.max(...levelKeys) && (
                  <Animated.View 
                    style={[
                      styles.progressContainer,
                      { transform: [{ scale: Animated.add(1, Animated.multiply(bounceAnim, 0.03)) }] }
                    ]}
                  >
                    <Text style={styles.progressTitle}>Progression vers le niveau {currentLevel + 1}</Text>
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBackground} />
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { width: `${progressPercentage}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
                  </Animated.View>
                )}
                
                <View 
                  style={styles.scrollContainer}
                  onLayout={(event) => {
                    setScrollViewHeight(event.nativeEvent.layout.height);
                  }}
                >
                  <ScrollView
                    ref={scrollViewRef}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                    bouncesZoom={true}
                    alwaysBounceVertical={true}
                    decelerationRate="normal"
                    onScroll={(e) => {
                      setScrollY(e.nativeEvent.contentOffset.y);
                    }}
                    scrollEventThrottle={16}
                    onContentSizeChange={(width, height) => {
                      setContentHeight(height);
                    }}
                    contentContainerStyle={styles.scrollContentContainer}
                  >
                    {levelKeys.map((level) => {
                      const isCurrentLevel = level === currentLevel;
                      const [primaryColor, secondaryColor] = getLevelColor(level);
                      
                      return (
                        <Animated.View 
                          key={level} 
                          style={[
                            styles.levelCard,
                            isCurrentLevel && styles.currentLevelCard,
                            isCurrentLevel && { 
                              transform: [{ scale: Animated.add(1, Animated.multiply(bounceAnim, 0.05)) }] 
                            }
                          ]}
                        >
                          <View style={styles.levelHeader}>
                            <LinearGradient
                              colors={[primaryColor, secondaryColor]}
                              style={styles.levelBadge}
                            >
                              <Text style={styles.levelNumber}>{level}</Text>
                            </LinearGradient>
                            <View style={styles.levelTitleContainer}>
                              <Text style={styles.levelTitle}>
                                {LEVEL_CONFIG[level].title}
                              </Text>
                              <Text style={styles.pointsRequired}>
                                {LEVEL_CONFIG[level].pointsRequired} XP requis
                              </Text>
                            </View>
                            {isCurrentLevel && (
                              <View style={styles.currentLevelBadge}>
                                <Text style={styles.currentLevelText}>Actuel</Text>
                              </View>
                            )}
                          </View>
                          
                          <Text style={styles.levelDescription}>{LEVEL_CONFIG[level].description}</Text>
                          
                          <View style={[styles.advantagesContainer, { borderLeftColor: primaryColor }]}>
                            <Text style={styles.advantagesTitle}>
                              {isCurrentLevel ? 'Vos avantages actuels :' : 'Avantages débloqués :'}
                            </Text>
                            {LEVEL_CONFIG[level].advantages.map((advantage, idx) => {
                              const iconName = getAdvantageIcon(advantage);
                              return (
                                <View key={idx} style={styles.advantageItem}>
                                  <Icon name={iconName} size={16} color={primaryColor} style={styles.advantageIcon} />
                                  <Text style={styles.advantageText}>{advantage}</Text>
                                </View>
                              );
                            })}
                          </View>
                          
                          {level < Math.max(...levelKeys) && (
                            <View style={styles.divider} />
                          )}
                        </Animated.View>
                      );
                    })}
                  </ScrollView>
                  
                  {/* Indicateurs de défilement */}
                  {showScrollIndicator && (
                    <>
                      <Animated.View 
                        style={[
                          styles.scrollIndicatorTop,
                          {opacity: scrollY > 20 ? 1 : 0}
                        ]}
                      >
                        <Icon name="chevron-up" size={20} color="rgba(255,255,255,0.6)" />
                      </Animated.View>
                      
                      <Animated.View 
                        style={[
                          styles.scrollIndicatorBottom,
                          {opacity: scrollY < contentHeight - scrollViewHeight - 20 ? 1 : 0}
                        ]}
                      >
                        <Icon name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
                      </Animated.View>
                    </>
                  )}
                </View>
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.continueButton, { backgroundColor: getLevelColor(currentLevel)[0] }]}
                    onPress={onClose}
                  >
                    <Text style={styles.continueButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e2146',
    width: '90%',
    maxHeight: '85%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
  },
  gradientBackground: {
    padding: 20,
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  progressContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 5,
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4e54c8',
    borderRadius: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'right',
    marginTop: 5,
  },
  scrollContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollContentContainer: {
    paddingBottom: 10,
  },
  scrollIndicatorTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 33, 70, 0.7)',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    zIndex: 10,
  },
  scrollIndicatorBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 33, 70, 0.7)',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    zIndex: 10,
  },
  buttonContainer: {
    marginTop: 15,
  },
  levelCard: {
    marginBottom: 20,
    backgroundColor: 'rgba(30, 33, 70, 0.6)',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(78, 84, 200, 0.3)',
  },
  currentLevelCard: {
    backgroundColor: 'rgba(78, 84, 200, 0.15)',
    borderColor: 'rgba(78, 84, 200, 0.6)',
    transform: [{ scale: 1.03 }],
  },
  currentLevelBadge: {
    backgroundColor: '#4e54c8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  currentLevelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  levelNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  levelTitleContainer: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  pointsRequired: {
    fontSize: 14,
    color: '#a3d8f5',
  },
  levelDescription: {
    fontSize: 15,
    color: '#dedede',
    marginBottom: 15,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  advantagesContainer: {
    backgroundColor: 'rgba(33, 37, 76, 0.7)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  advantagesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  advantageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    padding: 10,
    borderRadius: 10,
  },
  advantageIcon: {
    marginRight: 10,
  },
  advantageText: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 15,
  },
  continueButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default LevelPowersModal;
