import React, { useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Image,
  Linking,
  Dimensions,
  Platform
} from 'react-native';
import Icon, { COLORS } from '../components/common/Icon';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const AboutUsScreen = ({ navigation }) => {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    // Animation séquentielle pour l'entrée des éléments
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true
        })
      ]),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const handleOpenLink = (url) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log("Don't know how to open URI: " + url);
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header avec gradient */}
      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>À propos</Text>
          <View style={styles.headerRight} />
        </LinearGradient>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Logo et introduction animés */}
        <Animated.View 
          style={[
            styles.logoContainer, 
            { 
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ] 
            }
          ]}
        >
          <Image 
            source={require('../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>ChallengR</Text>
          <Text style={styles.tagline}>Relevez des défis, progressez, excellez !</Text>
        </Animated.View>

        {/* Section Introduction */}
        <Animated.View 
          style={[
            styles.card, 
            styles.shadowCard, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Bienvenue sur ChallengR</Text>
          <Text style={styles.description}>
            ChallengR est votre compagnon de développement personnel qui transforme vos objectifs en défis stimulants et amusants. Notre application vous aide à progresser chaque jour en relevant des défis adaptés à vos intérêts et à votre niveau.
          </Text>
        </Animated.View>

        {/* Section Fonctionnement */}
        <View style={[styles.card, styles.shadowCard]}>
          <Text style={styles.sectionTitle}>Comment ça marche ?</Text>
          <View style={styles.featureContainer}>
            <View style={styles.feature}>
              <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
                <Icon name="today" size={30} color={COLORS.primary} />
              </View>
              <Text style={styles.featureTitle}>Défis Quotidiens</Text>
              <Text style={styles.featureDescription}>
                Recevez des défis personnalisés chaque jour pour maintenir votre motivation
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={[styles.iconCircle, { backgroundColor: '#fff8e1' }]}>
                <Icon name="trophy" size={30} color={COLORS.warning} />
              </View>
              <Text style={styles.featureTitle}>Gagnez des Points</Text>
              <Text style={styles.featureDescription}>
                Complétez des défis pour gagner des points et monter de niveau
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
                <Icon name="people" size={30} color={COLORS.success} />
              </View>
              <Text style={styles.featureTitle}>Communauté</Text>
              <Text style={styles.featureDescription}>
                Connectez-vous avec d'autres utilisateurs et partagez vos succès
              </Text>
            </View>
          </View>
        </View>

        {/* Section Avantages */}
        <View style={[styles.card, styles.shadowCard]}>
          <Text style={styles.sectionTitle}>Pourquoi ChallengR ?</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Icon name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.benefitText}>Progression personnalisée en fonction de votre niveau</Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.benefitText}>Défis variés dans différentes catégories</Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.benefitText}>Suivi détaillé de vos performances</Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.benefitText}>Interface intuitive et expérience utilisateur fluide</Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.benefitText}>Système de badges et de récompenses motivant</Text>
            </View>
          </View>
        </View>

        {/* Section Notre équipe */}
        <View style={[styles.card, styles.shadowCard]}>
          <Text style={styles.sectionTitle}>Notre Équipe</Text>
          <Text style={styles.teamIntro}>
            ChallengR est développé par une équipe passionnée d'ingénieurs et de designers dédiés à créer la meilleure expérience pour vous.
          </Text>
          
          <View style={styles.teamGrid}>
            <View style={styles.teamMember}>
              <View style={styles.avatarContainer}>
                <Icon name="person-circle" size={60} color={COLORS.primary} />
              </View>
              <Text style={styles.memberName}>Emile DUMONT</Text>
              <Text style={styles.memberRole}> Developer</Text>
            </View>
            
            <View style={styles.teamMember}>
              <View style={styles.avatarContainer}>
                <Icon name="person-circle" size={60} color={COLORS.secondary} />
              </View>
              <Text style={styles.memberName}>Bryan OLOT</Text>
              <Text style={styles.memberRole}> Developer</Text>
            </View>
            
            <View style={styles.teamMember}>
              <View style={styles.avatarContainer}>
                <Icon name="person-circle" size={60} color={COLORS.success} />
              </View>
              <Text style={styles.memberName}>Valentin LEWANDOSKI</Text>
              <Text style={styles.memberRole}> Developer</Text>
            </View>
            
            <View style={styles.teamMember}>
              <View style={styles.avatarContainer}>
                <Icon name="person-circle" size={60} color={COLORS.warning} />
              </View>
              <Text style={styles.memberName}>Erwan GRAIRE</Text>
              <Text style={styles.memberRole}> Developer</Text>
            </View>
            <View style={styles.teamMember}>
              <View style={styles.avatarContainer}>
                <Icon name="person-circle" size={60} color={COLORS.warning} />
              </View>
              <Text style={styles.memberName}>Ilian EL-MAHI</Text>
              <Text style={styles.memberRole}> Developer</Text>
            </View>
            <View style={styles.teamMember}>
              <View style={styles.avatarContainer}>
                <Icon name="person-circle" size={60} color={COLORS.warning} />
              </View>
              <Text style={styles.memberName}>Clément RUBIN</Text>
              <Text style={styles.memberRole}> Developer</Text>
            </View>
          </View>
        </View>

        {/* Section FAQ */}
        <View style={[styles.card, styles.shadowCard]}>
          <Text style={styles.sectionTitle}>Questions fréquentes</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Comment gagner plus de points ?</Text>
            <Text style={styles.faqAnswer}>
              Vous pouvez gagner des points en complétant des défis quotidiens, des défis à long terme, ou en maintenant une série de défis complétés sur plusieurs jours consécutifs.
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Puis-je créer mes propres défis ?</Text>
            <Text style={styles.faqAnswer}>
              Oui ! Vous pouvez créer des défis personnalisés depuis l'écran "Mes Défis" en appuyant sur le bouton "+ Nouveau défi".
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Comment débloquer des badges ?</Text>
            <Text style={styles.faqAnswer}>
              Les badges sont débloqués en atteignant certains objectifs, comme compléter un nombre spécifique de défis ou atteindre un certain niveau.
            </Text>
          </View>
        </View>

        {/* Section Contact et réseaux sociaux */}
        <View style={[styles.card, styles.shadowCard]}>
          <Text style={styles.sectionTitle}>Nous contacter</Text>
          <Text style={styles.contactText}>
            Vous avez des questions ou des suggestions ? N'hésitez pas à nous contacter !
          </Text>
          
          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: '#3b5998' }]}
              onPress={() => handleOpenLink('https://facebook.com')}
            >
              <Icon name="logo-facebook" size={24} color={COLORS.white} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: '#1da1f2' }]}
              onPress={() => handleOpenLink('https://twitter.com')}
            >
              <Icon name="logo-twitter" size={24} color={COLORS.white} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: '#c32aa3' }]}
              onPress={() => handleOpenLink('https://instagram.com')}
            >
              <Icon name="logo-instagram" size={24} color={COLORS.white} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: '#0a66c2' }]}
              onPress={() => handleOpenLink('https://linkedin.com')}
            >
              <Icon name="logo-linkedin" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.emailButton}
            onPress={() => handleOpenLink('mailto:contact@challengr.app')}
          >
            <Icon name="mail" size={20} color={COLORS.white} style={styles.emailIcon} />
            <Text style={styles.emailButtonText}>contact@challengr.app</Text>
          </TouchableOpacity>
        </View>

        {/* Section Version */}
        <View style={[styles.card, styles.shadowCard, styles.lastSection]}>
          <Text style={styles.version}>Version 1.2.0</Text>
          <Text style={styles.releaseNotes}>Dernière mise à jour : 10 mai 2025</Text>
          <Text style={styles.copyright}>© 2025 ChallengR. Tous droits réservés.</Text>
          
          <TouchableOpacity 
            style={styles.privacyLink}
            onPress={() => handleOpenLink('https://www.challengr.app/privacy')}
          >
            <Text style={styles.privacyText}>Politique de confidentialité</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <Text style={styles.madeLove}>
            Fait avec <Icon name="heart" size={14} color="red" /> en France
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#151736', // Updated to match dark theme
  },
  header: {
    height: 60,
    backgroundColor: COLORS.primary,
  },
  headerGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerRight: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#151736', // Updated to match app theme
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4e54c8',
    shadowColor: '#4e54c8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#a3d8f5',
    marginTop: 8,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#1e2146', // Updated to match ProfileScreen
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#4e54c8',
  },
  shadowCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: 16,
    color: '#dedede',
    lineHeight: 24,
  },
  featureContainer: {
    marginTop: 20,
  },
  feature: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 15,
    color: '#a3aed0',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  benefitsList: {
    marginTop: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  benefitText: {
    fontSize: 16,
    color: '#dedede',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  teamIntro: {
    fontSize: 16,
    color: '#a3aed0',
    marginBottom: 24,
    lineHeight: 24,
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  teamMember: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#272b52',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(78, 84, 200, 0.3)',
  },
  avatarContainer: {
    marginBottom: 12,
    shadowColor: '#4e54c8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
  },
  memberRole: {
    fontSize: 14,
    color: '#a3d8f5',
    textAlign: 'center',
  },
  faqItem: {
    marginBottom: 20,
    backgroundColor: '#272b52',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4e54c8',
  },
  faqQuestion: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  faqAnswer: {
    fontSize: 15,
    color: '#dedede',
    lineHeight: 22,
  },
  contactText: {
    fontSize: 16,
    color: '#a3aed0',
    marginBottom: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4e54c8',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#4e54c8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emailIcon: {
    marginRight: 10,
  },
  emailButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
  lastSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 15,
  },
  version: {
    fontSize: 15,
    fontWeight: '500',
    color: '#a3aed0',
    marginBottom: 8,
  },
  releaseNotes: {
    fontSize: 14,
    color: '#a3aed0',
    marginBottom: 12,
  },
  copyright: {
    fontSize: 14,
    color: '#6d7192',
    marginBottom: 15,
  },
  privacyLink: {
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(78, 84, 200, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(78, 84, 200, 0.4)',
  },
  privacyText: {
    fontSize: 14,
    color: '#a3d8f5',
    fontWeight: '500',
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 20,
  },
  madeLove: {
    fontSize: 14,
    color: '#a3aed0',
    flexDirection: 'row',
    alignItems: 'center',
  }
});

export default AboutUsScreen;
