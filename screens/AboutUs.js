import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Image
} from 'react-native';
import Icon, { COLORS } from '../components/common/Icon';
import { LinearGradient } from 'expo-linear-gradient';

const AboutUsScreen = ({ navigation }) => {
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
        {/* Section Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bienvenue sur ChallengR</Text>
          <Text style={styles.description}>
            ChallengR est votre compagnon de développement personnel qui transforme vos objectifs en défis stimulants et amusants. Notre application vous aide à progresser chaque jour en relevant des défis adaptés à vos intérêts et à votre niveau.
          </Text>
        </View>

        {/* Section Fonctionnement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comment ça marche ?</Text>
          <View style={styles.featureContainer}>
            <View style={styles.feature}>
              <Icon name="calendar" size={40} color={COLORS.primary} />
              <Text style={styles.featureTitle}>Défis Quotidiens</Text>
              <Text style={styles.featureDescription}>
                Recevez des défis personnalisés chaque jour pour maintenir votre motivation
              </Text>
            </View>

            <View style={styles.feature}>
              <Icon name="trophy" size={40} color={COLORS.warning} />
              <Text style={styles.featureTitle}>Gagnez des Points</Text>
              <Text style={styles.featureDescription}>
                Complétez des défis pour gagner des points et monter de niveau
              </Text>
            </View>

            <View style={styles.feature}>
              <Icon name="people" size={40} color={COLORS.success} />
              <Text style={styles.featureTitle}>Communauté</Text>
              <Text style={styles.featureDescription}>
                Connectez-vous avec d'autres utilisateurs et partagez vos succès
              </Text>
            </View>
          </View>
        </View>

        {/* Section Avantages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pourquoi ChallengR ?</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Icon name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.benefitText}>Progression personnalisée</Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.benefitText}>Défis variés et adaptés</Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.benefitText}>Suivi de vos performances</Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.benefitText}>Interface intuitive</Text>
            </View>
          </View>
        </View>

        {/* Section Contact/Version */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.copyright}>© 2024 ChallengR. Tous droits réservés.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerRight: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  featureContainer: {
    marginTop: 20,
  },
  feature: {
    alignItems: 'center',
    marginBottom: 30,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 12,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  benefitsList: {
    marginTop: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  lastSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  version: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  copyright: {
    fontSize: 14,
    color: COLORS.textLight,
  }
});

export default AboutUsScreen;
