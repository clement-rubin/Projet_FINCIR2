import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../components/common/Icon';

// Clé pour stocker l'ID du calendrier ChallengR
const CALENDAR_ID_KEY = '@challengr_calendar_id';

/**
 * Demande les permissions d'accès au calendrier
 * @returns {Promise<boolean>} true si les permissions sont accordées
 */
export const requestCalendarPermissions = async () => {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Erreur lors de la demande des permissions calendrier:', error);
    return false;
  }
};

/**
 * Obtient ou crée le calendrier ChallengR
 * @returns {Promise<string|null>} L'ID du calendrier ChallengR
 */
export const getOrCreateChallengrCalendar = async () => {
  try {
    // Vérifier si l'ID du calendrier est déjà enregistré
    const savedCalendarId = await AsyncStorage.getItem(CALENDAR_ID_KEY);
    if (savedCalendarId) {
      // Vérifier si le calendrier existe toujours
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const calendarExists = calendars.some(cal => cal.id === savedCalendarId);
      if (calendarExists) {
        return savedCalendarId;
      }
    }

    // Créer un objet source par défaut selon la plateforme
    let defaultCalendarSource;
    if (Platform.OS === 'ios') {
      defaultCalendarSource = await getDefaultCalendarSource();
    } else {
      // Pour Android, il faut une source locale
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      defaultCalendarSource = calendars.find(cal => cal.source && cal.source.isLocalAccount) 
        ? calendars.find(cal => cal.source && cal.source.isLocalAccount).source
        : { isLocalAccount: true, name: 'ChallengR', id: 'local' };
    }

    // Assurer que l'objet source est valide
    if (!defaultCalendarSource || typeof defaultCalendarSource !== 'object') {
      defaultCalendarSource = { isLocalAccount: true, name: 'ChallengR', id: 'local' };
    }
    
    // Assurer que l'ID de la source est défini
    if (!defaultCalendarSource.id) {
      defaultCalendarSource.id = 'local';
    }

    const calendarOptions = {
      title: 'ChallengR',
      color: COLORS.primary,
      entityType: Calendar.EntityTypes.EVENT,
      name: Platform.OS === 'android' ? 'ChallengR' : 'challengr',
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
      source: defaultCalendarSource, // Toujours fournir la source
      sourceId: defaultCalendarSource.id // Toujours fournir l'id de la source
    };

    console.log('Création du calendrier avec options:', JSON.stringify(calendarOptions));
    
    const newCalendar = await Calendar.createCalendarAsync(calendarOptions);
    console.log('Calendrier créé avec ID:', newCalendar);

    // Enregistrer l'ID du nouveau calendrier
    await AsyncStorage.setItem(CALENDAR_ID_KEY, newCalendar);
    return newCalendar;
  } catch (error) {
    console.error('Erreur lors de la création du calendrier:', error);
    Alert.alert(
      "Erreur calendrier", 
      "Impossible de créer le calendrier: " + error.message
    );
    return null;
  }
};

/**
 * Obtient la source du calendrier par défaut sur iOS
 */
const getDefaultCalendarSource = async () => {
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    // Filtrer les calendriers qui ont une source valide
    const validCalendars = calendars.filter(cal => cal && cal.source);
    
    if (validCalendars.length === 0) {
      // Aucun calendrier avec source valide trouvé
      return { isLocalAccount: true, name: 'Local', id: 'local' };
    }
    
    // Essayer de trouver un calendrier par défaut
    const defaultCalendars = validCalendars.filter(cal => cal.source.name === 'Default');
    
    if (defaultCalendars.length > 0) {
      return defaultCalendars[0].source;
    }
    
    // Si aucun calendrier par défaut n'est trouvé, utiliser le premier calendrier disponible
    return validCalendars[0].source;
  } catch (error) {
    console.error('Erreur lors de la récupération de la source du calendrier:', error);
    // Retourner un objet source par défaut en cas d'erreur
    return { isLocalAccount: true, name: 'Local', id: 'local' };
  }
};

/**
 * Ajoute un défi au calendrier
 * @param {Object} task - L'objet défi à ajouter
 * @param {Date|null} customDate - Date personnalisée pour le défi (optionnel)
 * @returns {Promise<string|null>} L'ID de l'événement créé ou null en cas d'erreur
 */
export const addTaskToCalendar = async (task, customDate = null) => {
  try {
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      Alert.alert(
        "Permission refusée",
        "ChallengR a besoin d'accéder à votre calendrier pour planifier des défis."
      );
      return null;
    }

    const calendarId = await getOrCreateChallengrCalendar();
    if (!calendarId) {
      Alert.alert(
        "Erreur",
        "Impossible de créer ou d'accéder au calendrier ChallengR."
      );
      return null;
    }

    // Déterminer la date de début et de fin
    let startDate = customDate ? new Date(customDate) : new Date();
    let endDate = customDate ? new Date(customDate) : new Date();
    
    // Si c'est un défi à expiration, utiliser sa date d'expiration
    if (task.expiresAt) {
      endDate = new Date(task.expiresAt);
      // Pour un défi quotidien, la date de début est aujourd'hui
      if (task.type === "DAILY") {
        // Si une date personnalisée est fournie, l'utiliser pour le début
        if (!customDate) {
          startDate = new Date();
        }
        startDate.setHours(9, 0, 0, 0); // Par défaut à 9h du matin
        endDate.setHours(23, 59, 59, 999); // Jusqu'à la fin de la journée
      } 
      // Pour les défis temporaires, répartir sur plusieurs jours
      else if (task.type === "TIMED") {
        // Calculer la durée entre maintenant et l'expiration
        const duration = endDate.getTime() - startDate.getTime();
        
        // Si c'est plus d'un jour, définir une heure raisonnable
        if (duration > 24 * 60 * 60 * 1000) {
          startDate.setHours(10, 0, 0, 0);
          endDate.setHours(18, 0, 0, 0);
        }
      }
    } 
    // Pour les défis standards sans date d'expiration
    else {
      // Si une date personnalisée est fournie, l'utiliser
      if (customDate) {
        // Définir une plage horaire par défaut pour la date personnalisée (1 heure)
        startDate.setHours(10, 0, 0, 0);
        endDate.setHours(11, 0, 0, 0);
      } else {
        // Planifier par défaut pour aujourd'hui
        startDate.setHours(startDate.getHours() + 1);
        endDate.setHours(endDate.getHours() + 2);
      }
    }

    // Créer l'événement dans le calendrier
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: task.title,
      notes: task.description,
      startDate,
      endDate,
      timeZone: 'Europe/Paris',
      alarms: [{ relativeOffset: -30 }], // Alerte 30 minutes avant
    });

    return eventId;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du défi au calendrier:', error);
    return null;
  }
};

/**
 * Supprime un défi du calendrier
 * @param {string} eventId - L'ID de l'événement à supprimer
 */
export const removeTaskFromCalendar = async (eventId) => {
  try {
    if (!eventId) return;
    
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) return;

    await Calendar.deleteEventAsync(eventId);
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
  }
};

/**
 * Met à jour un événement existant dans le calendrier
 * @param {string} eventId - L'ID de l'événement à mettre à jour
 * @param {Object} task - Les données mises à jour du défi
 */
export const updateTaskInCalendar = async (eventId, task) => {
  try {
    if (!eventId) return;
    
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) return;

    // Obtenir les détails actuels de l'événement
    const event = await Calendar.getEventAsync(eventId);
    
    // Mettre à jour l'événement avec les nouvelles données
    await Calendar.updateEventAsync(eventId, {
      title: task.title || event.title,
      notes: task.description || event.notes,
      // Conserver les dates d'origine sauf si explicitement modifiées
      startDate: event.startDate,
      endDate: task.expiresAt ? new Date(task.expiresAt) : event.endDate,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
  }
};