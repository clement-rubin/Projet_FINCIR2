import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const CONVERSATIONS_STORAGE_KEY = '@challengr_conversations';
const MESSAGES_STORAGE_KEY = '@challengr_messages';

// Générer un ID vraiment unique
const generateId = () => {
  return Date.now().toString() + '-' + Math.random().toString(36).substring(2, 15) + '-' + Math.random().toString(36).substring(2, 15);
};

// Initialiser le stockage des conversations
const initializeStorage = async () => {
  try {
    const conversations = await AsyncStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    const messages = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
    
    if (!conversations) {
      await AsyncStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify([]));
    }
    
    if (!messages) {
      await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify([]));
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing messaging storage:', error);
    return false;
  }
};

// Initialiser le stockage
initializeStorage();

// Création ou récupération d'une conversation avec un ami
export const getOrCreateConversation = async (friendId) => {
  try {
    // Récupérer les conversations existantes
    const conversationsJson = await AsyncStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    const conversations = JSON.parse(conversationsJson) || [];
    
    // Vérifier si une conversation existe déjà avec cet ami
    let conversation = conversations.find(
      conv => Array.isArray(conv.participants) && conv.participants.includes(friendId)
    );
    
    // Si aucune conversation n'existe, en créer une nouvelle
    if (!conversation) {
      // Vérifier que l'ID ami est valide
      if (!friendId) {
        console.error('Impossible de créer une conversation: ID ami invalide');
        throw new Error('ID ami invalide');
      }
      
      const newConversationId = generateId();
      conversation = {
        _id: newConversationId,
        participants: [friendId],
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: '',
        unreadCount: 0,
        createdAt: new Date().toISOString()
      };
      
      // S'assurer que la conversation n'existe pas déjà avant de l'ajouter
      const exists = conversations.some(c => 
        c._id === newConversationId || 
        (Array.isArray(c.participants) && c.participants.includes(friendId))
      );
      
      if (!exists) {
        await AsyncStorage.setItem(
          CONVERSATIONS_STORAGE_KEY, 
          JSON.stringify([...conversations, conversation])
        );
      }
    }
    
    return conversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

// Récupérer les messages d'une conversation
export const getMessages = async (conversationId, before = null, limit = 20) => {
  try {
    const messagesJson = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
    let messages = JSON.parse(messagesJson);
    
    // Filtrer les messages de cette conversation
    messages = messages.filter(msg => msg.conversationId === conversationId);
    
    // Trier par date de création (du plus récent au plus ancien)
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination si before est fourni
    if (before) {
      messages = messages.filter(
        msg => new Date(msg.createdAt) < new Date(before)
      );
    }
    
    // Limiter le nombre de messages
    messages = messages.slice(0, limit);
    
    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

// Envoyer un message
export const sendMessage = async (conversationId, content) => {
  try {
    if (!conversationId) {
      console.error('Impossible d\'envoyer un message: ID de conversation invalide');
      throw new Error('ID de conversation invalide');
    }
    
    if (!content || content.trim() === '') {
      console.error('Impossible d\'envoyer un message vide');
      throw new Error('Le contenu du message ne peut pas être vide');
    }
    
    const messagesJson = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
    const conversationsJson = await AsyncStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    
    const messages = JSON.parse(messagesJson) || [];
    const conversations = JSON.parse(conversationsJson) || [];
    
    // Vérifier que la conversation existe
    const conversationExists = conversations.some(c => c._id === conversationId);
    if (!conversationExists) {
      console.error(`Conversation ${conversationId} introuvable`);
      throw new Error('Conversation introuvable');
    }
    
    // Création du nouveau message avec un ID vraiment unique
    const messageId = generateId();
    
    // Vérifier que l'ID n'est pas déjà utilisé
    const duplicateMessage = messages.find(m => m._id === messageId);
    if (duplicateMessage) {
      console.warn('ID de message déjà utilisé, génération d\'un nouvel ID');
      return sendMessage(conversationId, content); // Réessayer avec un nouvel ID
    }
    
    const newMessage = {
      _id: messageId,
      conversationId,
      content: content.trim(),
      senderId: 'currentUser', // Simuler l'utilisateur actuel
      createdAt: new Date().toISOString(),
      read: true
    };
    
    // Mise à jour des messages
    const updatedMessages = [...messages, newMessage];
    await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updatedMessages));
    
    // Mise à jour de la conversation
    const conversationIndex = conversations.findIndex(c => c._id === conversationId);
    if (conversationIndex !== -1) {
      conversations[conversationIndex].lastMessageAt = new Date().toISOString();
      conversations[conversationIndex].lastMessagePreview = content.substring(0, 50) + (content.length > 50 ? '...' : '');
      
      await AsyncStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    }
    
    return newMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Marquer les messages comme lus
export const markAsRead = async (conversationId) => {
  try {
    const conversationsJson = await AsyncStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    const conversations = JSON.parse(conversationsJson);
    
    // Rechercher la conversation et mettre à jour le compteur
    const conversationIndex = conversations.findIndex(c => c._id === conversationId);
    if (conversationIndex !== -1) {
      conversations[conversationIndex].unreadCount = 0;
      await AsyncStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    }
    
    return true;
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    throw error;
  }
};

// Récupérer la liste des conversations
export const getConversations = async (page = 1, limit = 20) => {
  try {
    const conversationsJson = await AsyncStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    let conversations = JSON.parse(conversationsJson);
    
    // Trier par dernier message (du plus récent au plus ancien)
    conversations.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    
    // Pagination simple
    const startIndex = (page - 1) * limit;
    const paginatedConversations = conversations.slice(startIndex, startIndex + limit);
    
    return {
      conversations: paginatedConversations,
      pagination: {
        total: conversations.length,
        page,
        limit,
        pages: Math.ceil(conversations.length / limit)
      }
    };
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw error;
  }
};