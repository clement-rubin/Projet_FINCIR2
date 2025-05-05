import AsyncStorage from '@react-native-async-storage/async-storage';
import * as friendshipStorage from '../utils/friendshipStorage';

// Initialize data
friendshipStorage.initializeData();

// Générer des utilisateurs bots fictifs
const generateBotUsers = (count = 10) => {
  const avatarColors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#d35400', '#27ae60', '#c0392b'];
  const firstNames = ['Emma', 'Léa', 'Chloé', 'Lucas', 'Hugo', 'Thomas', 'Noah', 'Jade', 'Louise', 'Alice', 'Gabriel', 
                      'Arthur', 'Nathan', 'Raphaël', 'Louis', 'Jules', 'Adam', 'Maël', 'Liam', 'Ethan', 'Paul', 
                      'Inès', 'Camille', 'Lina', 'Manon', 'Zoé', 'Sarah', 'Anna', 'Juliette', 'Lucie'];
  const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 
                     'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 
                     'Morel', 'Girard', 'André', 'Lefevre', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'Martinez', 'Legrand'];
  const interests = ['running', 'fitness', 'yoga', 'cycling', 'swimming', 'cooking', 'reading', 'gaming', 'music', 'photography',
                     'travel', 'hiking', 'painting', 'coding', 'languages', 'chess', 'dance', 'cinema', 'science', 'sports'];
                   
  const botUsers = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const interest1 = interests[Math.floor(Math.random() * interests.length)];
    const interest2 = interests[Math.floor(Math.random() * interests.length)];
    
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}`;
    const points = Math.floor(Math.random() * 500);
    const level = Math.floor(Math.sqrt(points / 100)) + 1;
    const completedChallenges = Math.floor(Math.random() * 25);
    
    botUsers.push({
      username: username,
      name: `${firstName} ${lastName}`,
      avatar: null,
      bio: `Fan de ${interest1} et ${interest2}. Niveau ${level} avec ${completedChallenges} défis complétés.`,
      points: points,
      level: level,
      stats: {
        tasksCompleted: completedChallenges,
        challengesWon: Math.floor(Math.random() * 10),
        challengesLost: Math.floor(Math.random() * 8),
        streakDays: Math.floor(Math.random() * 30),
      }
    });
  }
  
  return botUsers;
};

// Ajouter des amis bots automatiquement
export const addBotFriends = async (count = 5) => {
  try {
    // Générer les utilisateurs bots
    const botUsers = generateBotUsers(count * 2); // Générer plus pour avoir de la marge
    const addedFriends = [];
    
    // Ajouter les bots comme utilisateurs dans le stockage
    for (const botUser of botUsers) {
      const newUser = await friendshipStorage.addUser(botUser);
      if (newUser && addedFriends.length < count) {
        // Ajouter directement comme ami
        await friendshipStorage.saveFriend(newUser);
        addedFriends.push(newUser);
      }
    }
    
    return addedFriends;
  } catch (error) {
    console.error('Error adding bot friends:', error);
    throw error;
  }
};

// Vérifier si l'utilisateur a des amis
export const hasAnyFriends = async () => {
  try {
    const friends = await friendshipStorage.retrieveFriends();
    return friends.length > 0;
  } catch (error) {
    console.error('Error checking if user has friends:', error);
    return false;
  }
};

// Rechercher des utilisateurs
export const searchUsers = async (query) => {
  try {
    return await friendshipStorage.retrieveUsers(query);
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// Envoyer une demande d'amitié
export const sendFriendRequest = async (recipientId) => {
  try {
    return await friendshipStorage.sendRequest(recipientId);
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

// Répondre à une demande d'amitié
export const respondToFriendRequest = async (requestId, status) => {
  try {
    if (status === 'accepted') {
      return await friendshipStorage.acceptRequest(requestId);
    } else {
      return await friendshipStorage.rejectRequest(requestId);
    }
  } catch (error) {
    console.error('Error responding to friend request:', error);
    throw error;
  }
};

// Récupérer la liste d'amis
export const getFriends = async (page = 1, limit = 20, sortBy = 'recent') => {
  try {
    return await friendshipStorage.formatFriendsData(page, limit);
  } catch (error) {
    console.error('Error getting friends:', error);
    throw error;
  }
};

// Récupérer les demandes d'amitié en attente
export const getPendingRequests = async () => {
  try {
    return await friendshipStorage.retrievePendingRequests();
  } catch (error) {
    console.error('Error getting pending requests:', error);
    throw error;
  }
};

// Supprimer un ami
export const removeFriend = async (friendshipId) => {
  try {
    return await friendshipStorage.removeFriendById(friendshipId);
  } catch (error) {
    console.error('Error removing friend:', error);
    throw error;
  }
};

// Récupérer le classement entre amis
export const getFriendsLeaderboard = async (type = 'points', period = 'month') => {
  try {
    // Simple mock leaderboard using friends data
    const friends = await friendshipStorage.retrieveFriends();
    const leaderboard = friends.map((friend, index) => ({
      _id: friend.friend._id,
      totalPoints: Math.floor(Math.random() * 300),
      completedChallenges: Math.floor(Math.random() * 15),
      rank: index + 1,
      user: friend.friend,
      isCurrentUser: false
    }));
    
    // Sort by points or challenges
    return leaderboard.sort((a, b) => 
      type === 'points' 
        ? b.totalPoints - a.totalPoints 
        : b.completedChallenges - a.completedChallenges
    );
  } catch (error) {
    console.error('Error getting friends leaderboard:', error);
    throw error;
  }
};

// Partager un défi avec des amis
export const shareChallenge = async (challengeId, friendIds) => {
  try {
    return {
      shared: true,
      count: friendIds.length,
      challenge: { id: challengeId, name: "Challenge partagé" }
    };
  } catch (error) {
    console.error('Error sharing challenge:', error);
    throw error;
  }
};