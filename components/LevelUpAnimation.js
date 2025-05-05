import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import * as ReactNative from 'react-native';
const Platform = ReactNative.Platform;
import Icon, { COLORS } from './common/Icon';

const { width, height } = Dimensions.get('window');

const LevelUpAnimation = ({ visible, level, previousTitle, newTitle, advantages, onClose }) => {
  // Animations
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  
  // Positions des particules/étoiles
  const sparklePositions = [
    { top: '30%', left: '20%' },
    { top: '25%', left: '70%' },
    { top: '55%', left: '15%' },
    { top: '60%', left: '80%' },
    { top: '75%', left: '30%' },
    { top: '40%', left: '50%' },
  ];
  
  // Animation de rotation
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  useEffect(() => {
    if (visible) {
      // Réinitialiser les animations
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
      sparkleAnims.forEach(anim => anim.setValue(0));
      
      // Animation séquentielle
      Animated.sequence([
        // Fade in et scale
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          })
        ]),
        
        // Rotation du badge
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
        
        // Animations des particules/étoiles
        Animated.stagger(150, 
          sparkleAnims.map(anim => 
            Animated.spring(anim, {
              toValue: 1,
              friction: 7,
              tension: 40,
              useNativeDriver: true,
            })
          )
        )
      ]).start();
    }
  }, [visible]);
  
  // Arrière-plan pour les particules
  const particleColors = [
    COLORS.secondary,
    COLORS.primary,
    COLORS.warning,
    COLORS.success,
    COLORS.secondary,
    COLORS.warning
  ];
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Particules/étoiles animées */}
          {sparkleAnims.map((anim, index) => (
            <Animated.View 
              key={index}
              style={[
                styles.sparkle,
                {
                  top: sparklePositions[index].top,
                  left: sparklePositions[index].left,
                  backgroundColor: particleColors[index],
                  opacity: anim,
                  transform: [
                    { scale: anim },
                    { translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -30]
                      })
                    }
                  ]
                }
              ]}
            >
              <Icon name="star" size={18} color="#fff" />
            </Animated.View>
          ))}
          
          <Text style={styles.congratsText}>Félicitations!</Text>
          
          <Animated.View 
            style={[
              styles.levelBadge,
              { transform: [{ rotate: rotation }] }
            ]}
          >
            <Text style={styles.levelText}>{level}</Text>
          </Animated.View>
          
          <Text style={styles.levelUpText}>
            Vous avez atteint le <Text style={styles.highlight}>Niveau {level}</Text>
          </Text>
          
          <View style={styles.titleChange}>
            <Text style={styles.oldTitle}>{previousTitle}</Text>
            <View style={styles.arrow}>
              <Icon name="arrow-forward" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.newTitle}>{newTitle}</Text>
          </View>
          
          <View style={styles.advantagesContainer}>
            <Text style={styles.advantagesTitle}>Nouveaux avantages débloqués</Text>
            
            {advantages.map((advantage, index) => (
              <View key={index} style={styles.advantageItem}>
                <Icon name="checkmark-circle" size={20} color={COLORS.success} style={styles.advantageIcon} />
                <Text style={styles.advantageText}>{advantage}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onClose}
          >
            <Text style={styles.continueButtonText}>Continuer</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    backgroundColor: COLORS.white,
    width: width * 0.85,
    maxHeight: height * 0.8,
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    overflow: 'hidden',
  },
  congratsText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Bold' : 'sans-serif-medium',
  },
  levelBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  levelText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  levelUpText: {
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 15,
  },
  highlight: {
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  titleChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  oldTitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  arrow: {
    paddingHorizontal: 10,
  },
  newTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  advantagesContainer: {
    width: '100%',
    marginBottom: 25,
  },
  advantagesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 15,
    textAlign: 'center',
  },
  advantageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f8',
  },
  advantageIcon: {
    marginRight: 10,
  },
  advantageText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  continueButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  sparkle: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LevelUpAnimation;