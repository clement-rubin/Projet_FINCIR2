import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const FRIENDS_STORAGE_KEY = '@challengr_friends';
export const PENDING_REQUESTS_KEY = '@challengr_pending_requests';
export const USERS_STORAGE_KEY = '@challengr_users';

// Generate a truly unique ID
const generateId = () => {
  return Date.now().toString() + '-' + Math.random().toString(36).substring(2, 15) + '-' + Math.random().toString(36).substring(2, 15);
};

// Get some sample users if none exist yet
const getSampleUsers = () => [
  {
    _id: 'user1',
    username: 'john_doe',
    name: 'John Doe',
    avatar: null,
    bio: 'Challenge enthusiast'
  },
  {
    _id: 'user2',
    username: 'sarah_smith',
    name: 'Sarah Smith',
    avatar: null,
    bio: 'Love completing challenges'
  },
  {
    _id: 'user3',
    username: 'alex_jones',
    name: 'Alex Jones',
    avatar: null,
    bio: 'Here to compete'
  },
  {
    _id: 'user4',
    username: 'emma_wilson',
    name: 'Emma Wilson',
    avatar: null,
    bio: 'Join me in challenges'
  }
];

// Initialize data if needed
export const initializeData = async () => {
  try {
    // Check if we already have data
    const friends = await AsyncStorage.getItem(FRIENDS_STORAGE_KEY);
    const requests = await AsyncStorage.getItem(PENDING_REQUESTS_KEY);
    const users = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    
    // If not, initialize with sample data
    if (!friends) {
      await AsyncStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify([]));
    }
    
    if (!requests) {
      await AsyncStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify([]));
    }
    
    if (!users) {
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(getSampleUsers()));
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing friendship data:', error);
    return false;
  }
};

// Search users
export const retrieveUsers = async (query) => {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    if (!usersJson) return [];
    
    const users = JSON.parse(usersJson);
    
    // If no query, return all users
    if (!query || query.trim() === '') {
      return users;
    }
    
    // Search by name or username
    query = query.toLowerCase();
    return users.filter(
      user => user.name.toLowerCase().includes(query) || 
              user.username.toLowerCase().includes(query)
    );
  } catch (error) {
    console.error('Error retrieving users:', error);
    return [];
  }
};

// Add a new user (for testing)
export const addUser = async (user) => {
  try {
    const users = await retrieveUsers();
    const newUser = {
      _id: generateId(),
      ...user
    };
    
    const updatedUsers = [...users, newUser];
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
    return newUser;
  } catch (error) {
    console.error('Error adding user:', error);
    return null;
  }
};

// Get friends
export const retrieveFriends = async () => {
  try {
    const friendsJson = await AsyncStorage.getItem(FRIENDS_STORAGE_KEY);
    if (!friendsJson) return [];
    
    const friends = JSON.parse(friendsJson);
    
    // Déduplication agressive des amis
    const uniqueFriends = [];
    const seenIds = new Set();
    const seenNames = new Map();
    
    for (const friend of friends) {
      // Vérifier si l'ami est valide
      if (!friend.friend || !friend.friend._id) continue;
      
      // Utiliser l'ID de l'ami comme identifiant unique
      const uniqueId = friend.friend._id;
      
      // Si cet ID a déjà été vu, ignorer cet ami
      if (seenIds.has(uniqueId)) {
        console.log(`Ami dupliqué détecté et ignoré: ${friend.friend.name || friend.friend.username}`);
        continue;
      }
      
      // Vérifier si un ami avec le même nom existe déjà
      const friendName = friend.friend.name || friend.friend.username;
      if (seenNames.has(friendName)) {
        // Si un doublon de nom est trouvé, garder l'ami avec l'interaction la plus récente
        const existingIndex = seenNames.get(friendName);
        const existingFriend = uniqueFriends[existingIndex];
        
        // Comparer les dates de dernière interaction
        const existingDate = new Date(existingFriend.lastInteraction);
        const currentDate = new Date(friend.lastInteraction);
        
        if (currentDate > existingDate) {
          // Cet ami est plus récent, remplacer l'ancien
          uniqueFriends[existingIndex] = friend;
        }
        
        continue;
      }
      
      // Ajouter cet ami comme unique
      seenIds.add(uniqueId);
      seenNames.set(friendName, uniqueFriends.length);
      uniqueFriends.push(friend);
    }
    
    return uniqueFriends;
  } catch (error) {
    console.error('Error retrieving friends:', error);
    return [];
  }
};

// Add a friend
export const saveFriend = async (friend) => {
  try {
    // Récupérer les amis avec la déduplication déjà appliquée
    const friends = await retrieveFriends();
    
    // Vérification complète pour éviter les doublons
    // 1. Vérifier par l'ID de l'ami
    // 2. Vérifier par le friendshipId
    // 3. Vérifier par le nom de l'ami
    const existingFriendById = friends.find(f => f.friend && f.friend._id === friend._id);
    const existingFriendByFriendshipId = friend.friendshipId && friends.find(f => f.friendshipId === friend.friendshipId);
    const existingFriendByName = friends.find(f => 
      f.friend && 
      (f.friend.name || f.friend.username) === (friend.name || friend.username)
    );
    
    const existingFriend = existingFriendById || existingFriendByFriendshipId || existingFriendByName;
    
    if (existingFriend) {
      console.log(`Ami existant trouvé, mise à jour : ${existingFriend.friend.name || existingFriend.friend.username}`);
      // Si l'ami existe déjà, mettre à jour la date de dernière interaction
      existingFriend.lastInteraction = new Date().toISOString();
      
      // Si l'ami a été trouvé par nom mais a des IDs différents, conserver l'ID original mais mettre à jour les autres informations
      if (existingFriendByName && !existingFriendById && !existingFriendByFriendshipId) {
        Object.assign(existingFriend.friend, friend);
      }
      
      // Récupérer tous les amis originaux et les dédupliquer à nouveau
      const originalFriends = JSON.parse(await AsyncStorage.getItem(FRIENDS_STORAGE_KEY) || '[]');
      const deduplicatedFriends = [...originalFriends.filter(f => 
        !f.friend || 
        (existingFriend.friend._id && f.friend._id !== existingFriend.friend._id) &&
        (existingFriend.friendshipId && f.friendshipId !== existingFriend.friendshipId)
      ), existingFriend];
      
      await AsyncStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(deduplicatedFriends));
      return friends;
    }
    
    // Vérifier que l'ami est valide
    if (!friend._id && (!friend.friend || !friend.friend._id)) {
      console.error("Tentative d'ajout d'un ami invalide sans ID");
      return friends;
    }
    
    // Créer un nouvel ami avec un ID unique
    const newFriend = {
      friendshipId: generateId(),
      friend: friend.friend || friend,  // Accepter les deux formats
      since: new Date().toISOString(),
      lastInteraction: new Date().toISOString()
    };
    
    const updatedFriends = [...friends, newFriend];
    await AsyncStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(updatedFriends));
    
    console.log(`Nouvel ami ajouté: ${newFriend.friend.name || newFriend.friend.username}`);
    return updatedFriends;
  } catch (error) {
    console.error('Error saving friend:', error);
    return [];
  }
};

// Remove a friend
export const removeFriendById = async (friendshipId) => {
  try {
    const friends = await retrieveFriends();
    const updatedFriends = friends.filter(f => f.friendshipId !== friendshipId);
    
    await AsyncStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(updatedFriends));
    
    return updatedFriends;
  } catch (error) {
    console.error('Error removing friend:', error);
    return [];
  }
};

// Get pending requests
export const retrievePendingRequests = async () => {
  try {
    const requestsJson = await AsyncStorage.getItem(PENDING_REQUESTS_KEY);
    if (!requestsJson) return [];
    
    return JSON.parse(requestsJson);
  } catch (error) {
    console.error('Error retrieving pending requests:', error);
    return [];
  }
};

// Send a friend request
export const sendRequest = async (userId) => {
  try {
    const users = await retrieveUsers();
    const requests = await retrievePendingRequests();
    
    // Find the user
    const user = users.find(u => u._id === userId);
    if (!user) return null;
    
    // Check if request already exists
    const exists = requests.some(r => r.requesterId._id === userId);
    if (exists) return requests;
    
    // Create a new request (as if the other user sent it)
    const newRequest = {
      _id: generateId(),
      requesterId: user,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    const updatedRequests = [...requests, newRequest];
    await AsyncStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(updatedRequests));
    
    return newRequest;
  } catch (error) {
    console.error('Error sending friend request:', error);
    return null;
  }
};

// Accept a friend request
export const acceptRequest = async (requestId) => {
  try {
    const requests = await retrievePendingRequests();
    
    // Find the request
    const request = requests.find(r => r._id === requestId);
    if (!request) return { success: false };
    
    // Add to friends
    await saveFriend(request.requesterId);
    
    // Remove from requests
    const updatedRequests = requests.filter(r => r._id !== requestId);
    await AsyncStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(updatedRequests));
    
    return { success: true };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return { success: false };
  }
};

// Reject a friend request
export const rejectRequest = async (requestId) => {
  try {
    const requests = await retrievePendingRequests();
    
    // Remove from requests
    const updatedRequests = requests.filter(r => r._id !== requestId);
    await AsyncStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(updatedRequests));
    
    return { success: true };
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return { success: false };
  }
};

// Format friends data to match API format
export const formatFriendsData = async (page = 1, limit = 20) => {
  try {
    const friends = await retrieveFriends();
    
    // Garantir que chaque ami a un ID unique et retirer les doublons
    const uniqueFriends = [];
    const seenFriendIds = new Set();
    
    for (const friend of friends) {
      // Vérifier si le friendshipId est défini
      if (!friend.friendshipId) {
        friend.friendshipId = generateId();
      }
      
      // Utiliser l'ID de l'ami ou le friendshipId comme clé unique
      const uniqueKey = friend.friend?._id || friend.friendshipId;
      
      // Ne pas ajouter les doublons
      if (!seenFriendIds.has(uniqueKey)) {
        seenFriendIds.add(uniqueKey);
        uniqueFriends.push(friend);
      }
    }
    
    // Trier les amis par lastInteraction (du plus récent au plus ancien)
    uniqueFriends.sort((a, b) => new Date(b.lastInteraction) - new Date(a.lastInteraction));
    
    // Appliquer la pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFriends = uniqueFriends.slice(startIndex, endIndex);
    
    return {
      friends: paginatedFriends,
      pagination: {
        total: uniqueFriends.length,
        page: page,
        limit: limit,
        pages: Math.ceil(uniqueFriends.length / limit)
      }
    };
  } catch (error) {
    console.error('Error formatting friends data:', error);
    return { friends: [], pagination: { total: 0, page: 1, limit, pages: 0 } };
  }
};