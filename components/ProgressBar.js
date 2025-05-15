import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const ProgressBar = ({ progress, total, label, onPress, height = 12, barColor = '#3498db', backgroundColor = '#e0e0e0' }) => {
  // Calcul du pourcentage de progression
  const percentage = total > 0 ? (progress / total) * 100 : 0;
  
  // Référence à la valeur animée
  const widthAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animation de la barre de progression
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false // Doit être false pour width
    }).start();
  }, [percentage, widthAnim]);
  
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      {/* Rendre la barre cliquable si onPress est fourni */}
      <Animated.View>
        <View style={[styles.progressBackground, { height, backgroundColor }]}
        >
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: widthAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%']
                }),
                backgroundColor: barColor,
                height
              }
            ]} 
          />
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
      <Text style={styles.progressText}>
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
});

export default ProgressBar;