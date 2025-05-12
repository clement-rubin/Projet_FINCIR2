/**
 * Utilitaires pour la manipulation et le formatage des dates
 */

/**
 * Formate une date en français avec différentes options
 * @param {Date|string|number} date - La date à formater
 * @param {Object} options - Options de formatage
 * @param {boolean} options.showWeekday - Afficher le jour de la semaine
 * @param {boolean} options.showTime - Afficher l'heure
 * @param {boolean} options.showYear - Afficher l'année
 * @param {boolean} options.compact - Format compact (chiffres uniquement)
 * @returns {string} Date formatée
 */
export const formatDate = (date, options = {}) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Date invalide';
  }
  
  const { 
    showWeekday = true, 
    showTime = false, 
    showYear = true,
    compact = false
  } = options;
  
  const now = new Date();
  const isToday = dateObj.toDateString() === now.toDateString();
  const isTomorrow = new Date(now.setDate(now.getDate() + 1)).toDateString() === dateObj.toDateString();
  const isYesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toDateString() === dateObj.toDateString();
  
  // Format relatif pour aujourd'hui/hier/demain
  if (isToday) {
    if (showTime) {
      return `Aujourd'hui à ${formatTime(dateObj)}`;
    }
    return "Aujourd'hui";
  }
  
  if (isTomorrow) {
    if (showTime) {
      return `Demain à ${formatTime(dateObj)}`;
    }
    return "Demain";
  }
  
  if (isYesterday) {
    if (showTime) {
      return `Hier à ${formatTime(dateObj)}`;
    }
    return "Hier";
  }
  
  // Format compact (numérique)
  if (compact) {
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = showYear ? `/${dateObj.getFullYear()}` : '';
    const time = showTime ? ` ${formatTime(dateObj)}` : '';
    
    return `${day}/${month}${year}${time}`;
  }
  
  // Format standard
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: showWeekday ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: showYear ? 'numeric' : undefined,
  });
  
  let formattedDate = formatter.format(dateObj);
  
  // Capitaliser la première lettre
  formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  
  // Ajouter l'heure si demandé
  if (showTime) {
    formattedDate += ` à ${formatTime(dateObj)}`;
  }
  
  return formattedDate;
};

/**
 * Formate l'heure au format 24h ou 12h selon les préférences
 * @param {Date} date - L'objet Date
 * @param {boolean} use24HourFormat - Utiliser le format 24h
 * @returns {string} Heure formatée
 */
export const formatTime = (date, use24HourFormat = true) => {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  if (use24HourFormat) {
    return `${hours}:${minutes}`;
  }
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes} ${period}`;
};

/**
 * Renvoie une description du temps restant jusqu'à une date
 * @param {Date|string|number} date - La date cible
 * @returns {string} Description du temps restant
 */
export const getTimeRemaining = (date) => {
  const targetDate = date instanceof Date ? date : new Date(date);
  const now = new Date();
  
  if (isNaN(targetDate.getTime())) {
    return 'Date invalide';
  }
  
  // Si la date est passée
  if (targetDate < now) {
    return 'Expiré';
  }
  
  const diffMs = targetDate - now;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 30) {
    const diffMonth = Math.floor(diffDay / 30);
    return `${diffMonth} mois`;
  }
  
  if (diffDay > 0) {
    return diffDay === 1 ? '1 jour' : `${diffDay} jours`;
  }
  
  if (diffHour > 0) {
    return diffHour === 1 ? '1 heure' : `${diffHour} heures`;
  }
  
  if (diffMin > 0) {
    return diffMin === 1 ? '1 minute' : `${diffMin} minutes`;
  }
  
  return 'Moins d\'une minute';
};

/**
 * Renvoie une description relative d'une date (il y a X temps)
 * @param {Date|string|number} date - La date à décrire
 * @returns {string} Description relative
 */
export const getRelativeTime = (date) => {
  const targetDate = date instanceof Date ? date : new Date(date);
  const now = new Date();
  
  if (isNaN(targetDate.getTime())) {
    return 'Date invalide';
  }
  
  // Si la date est dans le futur
  if (targetDate > now) {
    const diffMs = targetDate - now;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 30) {
      const diffMonth = Math.floor(diffDay / 30);
      return `Dans ${diffMonth} mois`;
    }
    
    if (diffDay > 0) {
      return diffDay === 1 ? 'Demain' : `Dans ${diffDay} jours`;
    }
    
    if (diffHour > 0) {
      return diffHour === 1 ? 'Dans 1 heure' : `Dans ${diffHour} heures`;
    }
    
    if (diffMin > 0) {
      return diffMin === 1 ? 'Dans 1 minute' : `Dans ${diffMin} minutes`;
    }
    
    return 'Dans un instant';
  }
  
  // Si la date est dans le passé
  const diffMs = now - targetDate;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 30) {
    const diffMonth = Math.floor(diffDay / 30);
    return diffMonth === 1 ? 'Il y a 1 mois' : `Il y a ${diffMonth} mois`;
  }
  
  if (diffDay > 0) {
    return diffDay === 1 ? 'Hier' : `Il y a ${diffDay} jours`;
  }
  
  if (diffHour > 0) {
    return diffHour === 1 ? 'Il y a 1 heure' : `Il y a ${diffHour} heures`;
  }
  
  if (diffMin > 0) {
    return diffMin === 1 ? 'Il y a 1 minute' : `Il y a ${diffMin} minutes`;
  }
  
  return 'À l\'instant';
};