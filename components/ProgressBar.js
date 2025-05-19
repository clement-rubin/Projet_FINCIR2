import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const ProgressBar = ({ 
  progress, 
  total, 
  label, 
  onPress, 
  height = 12, 
  barColor = '#3498db', 
  backgroundColor = '#e0e0e0',
  gaming = false,
  steps = [],
  showShine = false
}) => {
  // Calcul du pourcentage de progression
  const percentage = total > 0 ? (progress / total) * 100 : 0;
  
  // Références aux valeurs animées
  const widthAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(-50)).current;
  
  useEffect(() => {
    // Animation de la barre de progression
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false // Doit être false pour width
    }).start();
    
    // Animation de l'effet brillance si activé
    if (showShine && percentage > 10) {
      Animated.loop(
        Animated.timing(shineAnim, {
          toValue: 100,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: false
        })
      ).start();
    }
  }, [percentage, widthAnim, showShine]);
  
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Animated.View>
        <View style={[
          styles.progressBackground, 
          { 
            height, 
            backgroundColor,
            borderRadius: gaming ? height / 2 : 6
          }
        ]}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: widthAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%']
                }),
                backgroundColor: barColor,
                height,
                borderRadius: gaming ? height / 2 : 6
              },
              gaming && styles.gamingProgressFill
            ]} 
          />
          
          {/* Effet de brillance animé */}
          {showShine && (
            <Animated.View 
              style={[
                styles.shine,
                {
                  left: shineAnim.interpolate({
                    inputRange: [-50, 100],
                    outputRange: ['-10%', '100%']
                  }),
                  height: height * 2,
                  top: -height / 2
                }
              ]}
            />
          )}
          
          {/* Marqueurs d'étapes */}
          {steps.map((step, index) => (
            <View 
              key={index}
              style={[
                styles.stepMarker,
                {
                  left: `${(step.value / total) * 100}%`,
                  backgroundColor: step.color || '#fff',
                  height: height * 1.5,
                  top: -height / 4
                }
              ]}
            >
              {step.label && (
                <Text style={styles.stepLabel}>{step.label}</Text>
              )}
            </View>
          ))}
        </View>
        
        {onPress && (
          <View style={StyleSheet.absoluteFill}>
            <Text
              accessibilityRole="button"
              onPress={onPress}
              style={{ width: '100%', height: '100%', opacity: 0 }}
            >{''}</Text>
          </View>
        )}
      </Animated.View>
      
      <Text style={[
        styles.progressText,
        gaming && styles.gamingProgressText
      ]}>
        {progress} / {total} ({percentage.toFixed(0)}%)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555',
  },
  progressBackground: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  // Styles gaming
  gamingProgressFill: {
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  gamingProgressText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4e54c8',
    textShadowColor: 'rgba(78, 84, 200, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Effet de brillance
  shine: {
    position: 'absolute',
    width: '20%',
    height: '200%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
    borderRadius: 10,
  },
  // Marqueurs d'étapes
  stepMarker: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  stepLabel: {
    position: 'absolute',
    top: -16,
    left: -10,
    fontSize: 10,
    color: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    borderRadius: 4,
  }
});

export default ProgressBar;