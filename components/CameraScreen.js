import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform
} from 'react-native';
import * as ExpoCamera from 'expo-camera';
import Icon, { COLORS } from './common/Icon';

const CameraScreen = ({ onPhotoCapture, onClose }) => {
  // États pour la caméra
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(ExpoCamera.Camera.Constants.Type.front);
  const [flashMode, setFlashMode] = useState(ExpoCamera.Camera.Constants.FlashMode.off);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const cameraRef = useRef(null);

  // Vérifier les permissions dans useEffect
  React.useEffect(() => {
    (async () => {
      try {
        const { status } = await ExpoCamera.Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        
        if (status !== 'granted') {
          Alert.alert(
            "Permission refusée",
            "Nous avons besoin de votre permission pour accéder à la caméra.",
            [
              { text: "Annuler", onPress: onClose, style: "cancel" },
              { text: "Paramètres", onPress: () => console.log("Open settings") }
            ]
          );
        }
      } catch (error) {
        console.error("Erreur lors de la demande de permission:", error);
        Alert.alert(
          "Erreur",
          "Une erreur s'est produite lors de l'initialisation de la caméra. Veuillez réessayer.",
          [{ text: "OK", onPress: onClose }]
        );
      }
    })();
  }, []);

  // Fonction pour prendre une photo
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsTakingPicture(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: Platform.OS === 'android',
          base64: false,
        });
        setIsTakingPicture(false);
        setCapturedImage(photo.uri);
      } catch (error) {
        setIsTakingPicture(false);
        Alert.alert("Erreur", "Impossible de prendre une photo. Veuillez réessayer.");
        console.error("Erreur lors de la prise de photo:", error);
      }
    }
  };

  // Fonction pour reprendre une photo
  const retakePicture = () => {
    setCapturedImage(null);
  };

  // Fonction pour confirmer la photo
  const confirmPicture = () => {
    if (capturedImage) {
      onPhotoCapture(capturedImage);
    }
  };

  // Fonction pour basculer entre caméra avant et arrière
  const toggleCameraType = () => {
    setCameraType(current => 
      current === ExpoCamera.Camera.Constants.Type.back
        ? ExpoCamera.Camera.Constants.Type.front
        : ExpoCamera.Camera.Constants.Type.back
    );
  };

  // Fonction pour basculer le flash
  const toggleFlash = () => {
    setFlashMode(current =>
      current === ExpoCamera.Camera.Constants.FlashMode.off
        ? ExpoCamera.Camera.Constants.FlashMode.on
        : ExpoCamera.Camera.Constants.FlashMode.off
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.permissionText}>Vérification des autorisations de la caméra...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Icon name="alert-circle" size={60} color={COLORS.error} />
        <Text style={styles.permissionText}>
          Nous n'avons pas accès à votre caméra.
        </Text>
        <Text style={styles.permissionSubText}>
          Veuillez activer les permissions dans les paramètres de votre appareil.
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Fermer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      
      {!capturedImage ? (
        // Mode caméra
        <View style={styles.cameraContainer}>
          <ExpoCamera.Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            flashMode={flashMode}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.headerBar}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Icon name="close" size={28} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
                  <Icon 
                    name={flashMode === ExpoCamera.Camera.Constants.FlashMode.on ? "flash" : "flash-off"} 
                    size={24} 
                    color={COLORS.white} 
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.captureInstructions}>
                <Text style={styles.instructionText}>
                  Prenez une photo pour votre profil
                </Text>
              </View>
              
              <View style={styles.cameraControls}>
                <TouchableOpacity 
                  style={styles.flipCameraButton} 
                  onPress={toggleCameraType}
                >
                  <Icon name="camera-reverse" size={28} color={COLORS.white} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.captureBtnOuter}
                  onPress={takePicture}
                  disabled={isTakingPicture}
                >
                  {isTakingPicture ? (
                    <ActivityIndicator size="large" color={COLORS.white} />
                  ) : (
                    <View style={styles.captureBtnInner} />
                  )}
                </TouchableOpacity>
                
                <View style={styles.emptySpace} />
              </View>
            </View>
          </ExpoCamera.Camera>
        </View>
      ) : (
        // Mode prévisualisation
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          <View style={styles.previewControls}>
            <TouchableOpacity 
              style={styles.previewButton}
              onPress={retakePicture}
            >
              <Icon name="refresh" size={24} color={COLORS.white} />
              <Text style={styles.previewButtonText}>Reprendre</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.previewButton, styles.confirmButton]}
              onPress={confirmPicture}
            >
              <Icon name="checkmark" size={24} color={COLORS.white} />
              <Text style={styles.previewButtonText}>Utiliser</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  permissionSubText: {
    color: COLORS.textLight,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  permissionButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  closeButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  flashButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  captureInstructions: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  instructionText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 30,
  },
  flipCameraButton: {
    padding: 15,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  captureBtnOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
  },
  emptySpace: {
    width: 50,
  },
  previewContainer: {
    flex: 1,
    width: '100%',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 0.48,
  },
  confirmButton: {
    backgroundColor: COLORS.secondary,
  },
  previewButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default CameraScreen;