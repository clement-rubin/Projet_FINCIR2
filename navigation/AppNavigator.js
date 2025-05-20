import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Text, Platform, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { CardStyleInterpolators } from '@react-navigation/stack';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// Importer vos écrans
import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ConversationScreen from '../screens/ConversationScreen';
import AboutUsScreen from '../screens/AboutUs';
import NearbyTasksScreen from '../screens/NearbyTasksScreen';
import Icon, { COLORS } from '../components/common/Icon';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

function CustomTabBar({ state, descriptors, navigation }) {
  // Animation de focus pour les onglets
  const animatedValues = React.useRef(state.routes.map(() => new Animated.Value(0))).current;
  
  React.useEffect(() => {
    // Animer l'onglet actif
    const focusedTab = state.index;
    Animated.parallel([
      // Réduire l'échelle des autres onglets
      ...animatedValues.map((anim, index) => 
        Animated.spring(anim, {
          toValue: index === focusedTab ? 1 : 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true
        })
      )
    ]).start();
  }, [state.index]);
  return (
    <View style={styles.tabBarContainer}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0)" translucent={true} hidden={Platform.OS === 'android'} />
      <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={['#1a2151', '#2d3a8c']} // Couleurs plus cohérentes avec le thème gaming
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        >
          <View style={styles.tabBar}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              
              let iconName;
              let title;
              let iconColor;
              
              // Configuration spécifique par route
              if (route.name === 'Home') {
                iconName = isFocused ? 'home' : 'home-outline';
                title = 'Accueil';
                iconColor = isFocused ? '#a3d8f5' : '#fff'; // Couleur bleu clair pour actif
              } else if (route.name === 'Tasks') {
                iconName = isFocused ? 'list' : 'list-outline';
                title = 'Quêtes';
                iconColor = isFocused ? '#a3d8f5' : '#fff';
              } else if (route.name === 'NearbyTasks') {
                iconName = isFocused ? 'location' : 'location-outline';
                title = 'Autour de moi';
                iconColor = isFocused ? '#a3d8f5' : '#fff';
              } else if (route.name === 'Profile') {
                iconName = isFocused ? 'person' : 'person-outline';
                title = 'Profil';
                iconColor = isFocused ? '#a3d8f5' : '#fff';
              } else if (route.name === 'Friends') {
                iconName = isFocused ? 'people' : 'people-outline';
                title = 'Amis';
                iconColor = isFocused ? '#a3d8f5' : '#fff';
              }
              
              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                
                if (!isFocused && !event.defaultPrevented) {
                  // Animation du tap feedback améliorée
                  Animated.sequence([
                    Animated.timing(animatedValues[index], {
                      toValue: 0.7,
                      duration: 50,
                      useNativeDriver: true
                    }),
                    Animated.spring(animatedValues[index], {
                      toValue: 1,
                      friction: 3,
                      tension: 40,
                      useNativeDriver: true
                    })
                  ]).start();
                  
                  navigation.navigate(route.name);
                }
              };
              
              // Interpolations pour les animations
              const tabScale = animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1.15]
              });
              
              // Utiliser scaleX au lieu de width pour l'animation de l'indicateur
              const indicatorScale = animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 1]
              });
              
              // Animation de luminosité pour l'effet "glow"
              const glowOpacity = animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.7]
              });
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={onPress}
                  style={[
                    styles.tabItem,
                    isFocused ? styles.activeTabItem : null
                  ]}
                  activeOpacity={0.7}
                >
                  {isFocused && (
                    <>
                      {/* Indicateur d'onglet actif amélioré */}
                      <Animated.View style={[
                        styles.activeTabIndicator,
                        { 
                          transform: [{ scaleX: indicatorScale }]
                        }
                      ]} />
                      
                      {/* Effet de glow sous l'icône active */}
                      <Animated.View 
                        style={[
                          styles.iconGlow,
                          { opacity: glowOpacity }
                        ]} 
                      />
                    </>
                  )}
                  
                  <Animated.View style={{ 
                    transform: [{ scale: isFocused ? tabScale : 1 }]
                  }}>
                    <Ionicons 
                      name={iconName} 
                      size={24} 
                      color={iconColor} 
                      style={{ 
                        opacity: isFocused ? 1 : 0.7,
                        textShadowColor: isFocused ? 'rgba(163, 216, 245, 0.8)' : 'transparent',
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: isFocused ? 8 : 0,
                      }}
                    />
                  </Animated.View>
                  
                  <Animated.Text style={[
                    styles.tabTitle,
                    { 
                      color: iconColor,
                      opacity: isFocused ? 1 : 0.7,
                      transform: [{ scale: isFocused ? tabScale : 1 }],
                      textShadowColor: isFocused ? 'rgba(163, 216, 245, 0.5)' : 'transparent',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: isFocused ? 3 : 0,
                    }
                  ]}>
                    {title}
                  </Animated.Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

function TabNavigator({ isGuest, onLogout }) {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen} 
      />
      <Tab.Screen 
        name="NearbyTasks" 
        component={NearbyTasksScreen} 
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsScreen} 
      />
      <Tab.Screen 
        name="Profile" 
        // Passer onLogout et isGuest à ProfileScreen
        children={props => <ProfileScreen {...props} isGuest={isGuest} onLogout={onLogout} />}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ isGuest = false, onLogout }) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: {
              animation: 'spring',
              config: { 
                stiffness: 1000,
                damping: 80,
                mass: 3,
                overshootClamping: false,
                restDisplacementThreshold: 0.01,
                restSpeedThreshold: 0.01
              },
            },
            close: {
              animation: 'spring',
              config: { 
                stiffness: 1000,
                damping: 80,
                mass: 3,
                overshootClamping: false,
                restDisplacementThreshold: 0.01,
                restSpeedThreshold: 0.01
              },
            },
          },
          cardShadowEnabled: true,
          cardOverlayEnabled: true,
          detachPreviousScreen: false,
        }}
      >
        <Stack.Screen 
          name="Main" 
          // Passer isGuest et onLogout au TabNavigator
          children={props => <TabNavigator {...props} isGuest={isGuest} onLogout={onLogout} />}
          options={{
            cardStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen 
          name="Conversation" 
          component={ConversationScreen} 
          options={{
            headerShown: true,
            headerTitleAlign: 'center',
            headerStyle: {
              backgroundColor: COLORS.primary,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            },
            headerTintColor: COLORS.white,
            headerTitle: props => (
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationHeaderTitle}>{props.children}</Text>
              </View>
            ),
            headerBackImage: () => (
              <View style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.white} />
              </View>
            ),
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateY: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.height, 0],
                      }),
                    },
                  ],
                  opacity: current.progress,
                  shadowOpacity: current.progress.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.3, 0.7],
                  }),
                },
                overlayStyle: {
                  opacity: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5],
                  }),
                },
              };
            },
          }}
        />
        <Stack.Screen 
          name="AboutUs" 
          component={AboutUsScreen} 
          options={{
            headerShown: false,
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateY: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.height, 0],
                      }),
                    },
                  ],
                  opacity: current.progress,
                  shadowOpacity: current.progress.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.3, 0.7],
                  }),
                },
                overlayStyle: {
                  opacity: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5],
                  }),
                },
              };
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const STATUSBAR_HEIGHT = StatusBar.currentHeight || 25;
const NAV_HEIGHT = 80;

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: NAV_HEIGHT,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  blurContainer: {
    flex: 1,
    overflow: 'hidden',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  gradientOverlay: {
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(78, 84, 200, 0.3)',
    borderBottomWidth: 0,
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    justifyContent: 'space-around',
    paddingTop: 5,
    paddingBottom: Platform.OS === 'ios' ? 25 : 5,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 8,
  },
  activeTabItem: {
    backgroundColor: 'transparent',
  },
  activeTabIndicator: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#4e54c8',
    borderRadius: 3,
    shadowColor: '#4e54c8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  iconGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(78, 84, 200, 0.2)',
    top: 15,
    alignSelf: 'center',
  },
  tabTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationHeaderTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    marginLeft: 10,
  },
});
