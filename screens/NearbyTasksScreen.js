import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon, { COLORS } from '../components/common/Icon';
import { generateUniqueId, SCREEN } from '../utils/constants';
import haptics from '../utils/haptics';

export default function NearbyTasksScreen() {
  // États pour la fonctionnalité de carte
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [nearbyChallenges, setNearbyChallenges] = useState([]);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState('undetermined');
  
  // État pour le défi sélectionné et les informations de route
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for the new activity being added
  const [newActivity, setNewActivity] = useState({
    title: "Nouvelle activité",
    description: "",
    coordinate: null,
  });
  
  // State for selected point details
  const [selectedPoint, setSelectedPoint] = useState(null);
  
  // State for showing add activity form
  const [showAddForm, setShowAddForm] = useState(false);
  
  useEffect(() => {
    // Request location permission when component mounts
    requestLocationPermission();
    
    // Load custom challenges
    loadCustomChallenges();
  }, []);
  
  // Request location permission
  const requestLocationPermission = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status);
      
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(location);
        loadNearbyChallenges(location.coords);
      } else {
        setErrorMsg('Permission de localisation non accordée');
        Alert.alert(
          "Localisation requise",
          "Pour découvrir les défis autour de vous, vous devez autoriser l'accès à votre position.",
          [{ text: "OK", onPress: () => console.log("Permission refusée") }]
        );
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur lors de la demande de permission de localisation:', error);
      setErrorMsg('Impossible d\'accéder à la localisation');
      setIsLoading(false);
    }
  };

  // Load nearby challenges
  const loadNearbyChallenges = (coords) => {
    // Generate mock challenges around the user's location
    const mockChallenges = generateMockChallengesAroundLocation(coords);
    setNearbyChallenges(mockChallenges);
  };

  // Generate mock challenges around user location
  const generateMockChallengesAroundLocation = (coords) => {
    // Create mock challenges with random positions in a 5km radius
    const challenges = [];
    const challengeTypes = [
      { title: "Course matinale", description: "Faites un jogging de 2km", points: 30, category: "FITNESS" },
      { title: "Visite culturelle", description: "Visitez un monument historique", points: 25, category: "CULTURE" },
      { title: "Détox digitale", description: "Profitez de la nature sans smartphone pendant 1h", points: 20, category: "WELLBEING" },
      { title: "Déjeuner healthy", description: "Mangez dans un restaurant bio", points: 15, category: "NUTRITION" },
      { title: "Photographe urbain", description: "Prenez 5 photos créatives de la ville", points: 20, category: "CREATIVITY" }
    ];

    // Generate 5 random challenges around the user
    for (let i = 0; i < 5; i++) {
      // Generate a random position in a 5km radius
      const randomDistance = Math.random() * 5 * 1000; // Distance in meters
      const randomAngle = Math.random() * 2 * Math.PI; // Angle in radians
      
      // Calculate approximate deltas (simplified method, not accurate for large distances)
      const latOffset = randomDistance / 111000 * Math.cos(randomAngle);
      const lngOffset = randomDistance / (111000 * Math.cos(coords.latitude * Math.PI / 180)) * Math.sin(randomAngle);
      
      // Select a random challenge type
      const challenge = { ...challengeTypes[Math.floor(Math.random() * challengeTypes.length)] };
      
      // Add coordinates and a unique ID
      challenge.id = `challenge-${i}-${Date.now()}`;
      challenge.latitude = coords.latitude + latOffset;
      challenge.longitude = coords.longitude + lngOffset;
      challenge.distance = Math.round(randomDistance) / 1000; // Distance in km
      
      challenges.push(challenge);
    }
    
    return challenges;
  };
  
  // Calculate estimated time to reach the challenge
  const calculateRouteInfo = (challenge) => {
    if (!location || !challenge) return null;

    // Average walking speed in km/h
    const walkingSpeed = 5;
    
    // Distance in km
    const distance = challenge.distance;
    
    // Time in minutes (distance / speed in km/h * 60)
    const duration = Math.round((distance / walkingSpeed) * 60);
    
    return {
      distance,
      duration,
      mode: 'walking'
    };
  };

  // Select a challenge and calculate the route
  const handleSelectChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    const routeDetails = calculateRouteInfo(challenge);
    setRouteInfo(routeDetails);
  };
  
  // Open native maps app with directions
  const navigateToActivity = (activity) => {
    if (!activity) return;

    const lat = activity.latitude;
    const lng = activity.longitude;
    const label = encodeURIComponent(activity.title);

    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${lat},${lng}&q=${label}`
        : `geo:0,0?q=${lat},${lng}(${label})`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert("Erreur", "Impossible d'ouvrir l'application de cartographie.");
        }
      })
      .catch((err) => console.error("Erreur lors d'ouverture de la carte :", err));
  };
  
  // Function to handle selecting a point (existing or new)
  const handleSelectPoint = (point) => {
    setSelectedPoint(point);
  };
  
  // Function to handle saving changes to a point
  const handleSavePoint = async () => {
    if (!selectedPoint) return;

    try {
      const updatedChallenges = nearbyChallenges.map((challenge) =>
        challenge.id === selectedPoint.id ? selectedPoint : challenge
      );
      setNearbyChallenges(updatedChallenges);

      // Save updated challenges to AsyncStorage if it's a custom point
      if (selectedPoint.category === "CUSTOM") {
        await AsyncStorage.setItem('@custom_challenges', JSON.stringify(updatedChallenges));
      }

      Alert.alert("Succès", "Les modifications ont été enregistrées !");
      setSelectedPoint(null);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du point :", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications.");
    }
  };
  
  // Load custom challenges from AsyncStorage
  const loadCustomChallenges = async () => {
    try {
      const savedChallenges = await AsyncStorage.getItem('@custom_challenges');
      if (savedChallenges) {
        const parsedChallenges = JSON.parse(savedChallenges);
        setNearbyChallenges((prevChallenges) => [
          ...prevChallenges,
          ...parsedChallenges,
        ]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des défis personnalisés :", error);
    }
  };
  
  // Function to handle adding a new challenge
  const handleAddChallenge = async () => {
    if (!newActivity.coordinate) {
      Alert.alert("Erreur", "Veuillez sélectionner un emplacement sur la carte.");
      return;
    }

    try {
      const newChallenge = {
        id: generateUniqueId(),
        title: newActivity.title || "Nouvelle activité",
        description: newActivity.description || "Description de l'activité",
        points: 10,
        difficulty: "EASY",
        category: "CUSTOM",
        latitude: newActivity.coordinate.latitude,
        longitude: newActivity.coordinate.longitude,
        distance: 0, // Distance is irrelevant for custom challenges
      };

      // Add the new challenge to the list of nearby challenges
      setNearbyChallenges((prevChallenges) => [...prevChallenges, newChallenge]);

      // Save the new challenge to AsyncStorage
      const savedChallenges = await AsyncStorage.getItem('@custom_challenges');
      const challenges = savedChallenges ? JSON.parse(savedChallenges) : [];
      challenges.push(newChallenge);
      await AsyncStorage.setItem('@custom_challenges', JSON.stringify(challenges));

      Alert.alert("Succès", "Nouvelle activité ajoutée à la carte !");
      setNewActivity({ title: "Nouvelle activité", description: "", coordinate: null });
      setShowAddForm(false);
      
      try {
        haptics.notificationAsync('success');
      } catch (err) {
        console.warn('Haptics error:', err);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'activité :", error);
      Alert.alert("Erreur", "Impossible d'ajouter l'activité.");
    }
  };
  
  // Refresh user location and nearby challenges
  const refreshLocation = async () => {
    try {
      setIsLoading(true);
      
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(location);
      loadNearbyChallenges(location.coords);
      
      // Load custom challenges again
      await loadCustomChallenges();
      
      setIsLoading(false);
      
      try {
        haptics.impactAsync('light');
      } catch (err) {
        console.warn('Haptics error:', err);
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de la localisation:', error);
      setIsLoading(false);
      Alert.alert("Erreur", "Impossible de rafraîchir votre position.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#151736" translucent />
      
      {/* Header - updated for better navbar integration */}
      <LinearGradient
        colors={['#1a2151', '#151736']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Explorer</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={refreshLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="refresh" size={20} color="#fff" />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddForm(!showAddForm)}
            >
              <Icon name={showAddForm ? "close" : "add"} size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Défis et activités à proximité</Text>
      </LinearGradient>
      
      {/* Add Activity Form */}
      {showAddForm && (
        <View style={styles.addFormContainer}>
          <TextInput
            style={styles.input}
            placeholder="Titre de l'activité"
            placeholderTextColor="#a3aed0"
            value={newActivity.title}
            onChangeText={(text) =>
              setNewActivity((prev) => ({ ...prev, title: text }))
            }
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description de l'activité"
            placeholderTextColor="#a3aed0"
            value={newActivity.description}
            onChangeText={(text) =>
              setNewActivity((prev) => ({ ...prev, description: text }))
            }
            multiline
          />
          <TouchableOpacity
            style={styles.addActivityButton}
            onPress={handleAddChallenge}
          >
            <Text style={styles.addActivityButtonText}>Ajouter l'activité</Text>
          </TouchableOpacity>
          <Text style={styles.tapInstructionText}>
            Appuyez sur la carte pour choisir l'emplacement de votre activité
          </Text>
        </View>
      )}
      
      {/* Main Content */}
      <View style={styles.content}>
        {isLoading && !location ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4e54c8" />
            <Text style={styles.loadingText}>Localisation en cours...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={50} color="#e74c3c" />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={requestLocationPermission}
            >
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : location ? (
          <>
            {/* Map */}
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
              onPress={(e) => {
                if (showAddForm) {
                  const { coordinate } = e.nativeEvent;
                  if (coordinate) {
                    setNewActivity((prev) => ({
                      ...prev,
                      coordinate: coordinate,
                    }));
                  }
                }
              }}
            >
              {/* Markers for nearby challenges */}
              {nearbyChallenges.map((challenge) => (
                <Marker
                  key={challenge.id}
                  coordinate={{
                    latitude: challenge.latitude,
                    longitude: challenge.longitude,
                  }}
                  title={challenge.title}
                  description={challenge.description}
                  onPress={() => {
                    handleSelectChallenge(challenge);
                    if (!showAddForm) {
                      navigateToActivity(challenge);
                    }
                  }}
                >
                  <View style={[styles.challengeMarker, getCategoryStyle(challenge.category)]}>
                    <Icon
                      name={getCategoryIcon(challenge.category)}
                      size={20}
                      color={COLORS.white}
                    />
                  </View>
                </Marker>
              ))}

              {/* Marker for the new activity */}
              {newActivity.coordinate && showAddForm && (
                <Marker
                  coordinate={newActivity.coordinate}
                  pinColor="blue"
                  title={newActivity.title}
                  description={newActivity.description || "Description de l'activité"}
                >
                  <View style={styles.newActivityMarker}>
                    <Icon name="add-circle" size={22} color="#fff" />
                  </View>
                </Marker>
              )}
            </MapView>
            
            {/* Selected Challenge Info */}
            {selectedChallenge && routeInfo && (
              <View style={styles.challengeInfoCard}>
                <View style={styles.challengeInfoHeader}>
                  <View style={[styles.categoryTag, getCategoryStyle(selectedChallenge.category)]}>
                    <Icon name={getCategoryIcon(selectedChallenge.category)} size={14} color="#fff" />
                    <Text style={styles.categoryText}>
                      {getCategoryLabel(selectedChallenge.category)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.closeInfoButton}
                    onPress={() => setSelectedChallenge(null)}
                  >
                    <Icon name="close" size={18} color="#a3aed0" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.challengeInfoTitle}>{selectedChallenge.title}</Text>
                <Text style={styles.challengeInfoDescription}>{selectedChallenge.description}</Text>
                <View style={styles.routeInfoContainer}>
                  <View style={styles.routeInfoItem}>
                    <Icon name="walk" size={18} color="#4e54c8" />
                    <Text style={styles.routeInfoText}>{routeInfo.distance.toFixed(1)} km</Text>
                  </View>
                  <View style={styles.routeInfoItem}>
                    <Icon name="time" size={18} color="#4e54c8" />
                    <Text style={styles.routeInfoText}>{routeInfo.duration} min</Text>
                  </View>
                  <View style={styles.routeInfoItem}>
                    <Icon name="star" size={18} color="#ffd700" />
                    <Text style={styles.routeInfoText}>{selectedChallenge.points} XP</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.navigateButton}
                  onPress={() => navigateToActivity(selectedChallenge)}
                >
                  <Icon name="navigate" size={18} color="#fff" />
                  <Text style={styles.navigateButtonText}>S'y rendre</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="map" size={60} color="#4e54c8" style={{opacity: 0.6}} />
            <Text style={styles.emptyText}>Recherche des défis près de votre position...</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={requestLocationPermission}
            >
              <Text style={styles.retryButtonText}>Localiser</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Modal for editing a selected point */}
      {selectedPoint && (
        <Modal
          visible={!!selectedPoint}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedPoint(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pointModalContainer}>
              <Text style={styles.pointModalTitle}>Modifier le point</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Titre"
                placeholderTextColor="#a3aed0"
                value={selectedPoint.title}
                onChangeText={(text) =>
                  setSelectedPoint((prev) => ({ ...prev, title: text }))
                }
              />
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Description"
                placeholderTextColor="#a3aed0"
                value={selectedPoint.description}
                onChangeText={(text) =>
                  setSelectedPoint((prev) => ({ ...prev, description: text }))
                }
                multiline
              />
              <View style={styles.pointModalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setSelectedPoint(null)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSavePoint}
                >
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navigateButton}
                  onPress={() => {
                    navigateToActivity(selectedPoint);
                    setSelectedPoint(null);
                  }}
                >
                  <Text style={styles.navigateButtonText}>S'y rendre</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// Get style based on category
const getCategoryStyle = (category) => {
  switch (category) {
    case "FITNESS":
      return { backgroundColor: "#e74c3c" };
    case "CULTURE":
      return { backgroundColor: "#9b59b6" };
    case "WELLBEING":
      return { backgroundColor: "#3498db" };
    case "NUTRITION":
      return { backgroundColor: "#2ecc71" };
    case "CREATIVITY":
      return { backgroundColor: "#f39c12" };
    case "CUSTOM":
      return { backgroundColor: "#1abc9c" };
    default:
      return { backgroundColor: "#4e54c8" };
  }
};

// Get icon based on category
const getCategoryIcon = (category) => {
  switch (category) {
    case "FITNESS":
      return "fitness";
    case "CULTURE":
      return "book";
    case "WELLBEING":
      return "heart";
    case "NUTRITION":
      return "restaurant";
    case "CREATIVITY":
      return "brush";
    case "CUSTOM":
      return "star";
    default:
      return "flag";
  }
};

// Get French label for category
const getCategoryLabel = (category) => {
  switch (category) {
    case "FITNESS":
      return "Sport";
    case "CULTURE":
      return "Culture";
    case "WELLBEING":
      return "Bien-être";
    case "NUTRITION":
      return "Nutrition";
    case "CREATIVITY":
      return "Créativité";
    case "CUSTOM":
      return "Personnalisé";
    default:
      return "Autre";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151736',
  },
  header: {
    paddingTop: StatusBar.currentHeight + 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a3aed0',
    marginTop: 5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(78, 84, 200, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(78, 84, 200, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFormContainer: {
    padding: 15,
    backgroundColor: '#21254c',
    borderBottomWidth: 1,
    borderBottomColor: '#292b45',
    zIndex: 10,
  },
  input: {
    backgroundColor: '#272b52',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#4e54c8',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addActivityButton: {
    backgroundColor: '#4e54c8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#4e54c8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  addActivityButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tapInstructionText: {
    color: '#a3aed0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#a3aed0',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4e54c8',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  challengeMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4e54c8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  newActivityMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1abc9c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  challengeInfoCard: {
    position: 'absolute',
    bottom: 80, // Updated to leave space for the navbar
    left: 20,
    right: 20,
    backgroundColor: '#21254c',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#4e54c8',
  },
  challengeInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4e54c8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  closeInfoButton: {
    padding: 5,
  },
  challengeInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  challengeInfoDescription: {
    fontSize: 14,
    color: '#a3aed0',
    marginBottom: 15,
    lineHeight: 20,
  },
  routeInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  navigateButton: {
    backgroundColor: '#4e54c8',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4e54c8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  navigateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginVertical: 15,
    fontSize: 16,
    color: '#a3aed0',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pointModalContainer: {
    backgroundColor: '#1e2146',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
  },
  pointModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#272b52',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#4e54c8',
  },
  modalTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pointModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#5d6080',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4e54c8',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
