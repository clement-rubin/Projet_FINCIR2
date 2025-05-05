import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  Animated,
  Easing,
  StatusBar,
  SafeAreaView
} from 'react-native';
import * as ReactNative from 'react-native';
const Platform = ReactNative.Platform;
import Icon, { COLORS } from '../components/common/Icon';
import { 
  getMessages, 
  sendMessage, 
  markAsRead 
} from '../services/messagingService';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from '@react-navigation/native';
import { SCREEN } from '../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';

const ConversationScreen = ({ route, navigation }) => {
  const { conversationId, friendName, friendAvatar } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isTyping, setIsTyping] = useState(false); // État pour "en train d'écrire"
  const [lastRead, setLastRead] = useState(null); // État pour le dernier message lu
  const flatListRef = useRef(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;

  // Personnaliser l'en-tête avec un design plus moderne
  useEffect(() => {
    navigation.setOptions({
      headerShown: false, // Cacher l'en-tête par défaut pour utiliser notre propre en-tête
    });
    
    // Animation d'entrée pour l'écran
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(inputAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true
      })
    ]).start();
    
    // Simuler le statut "en train d'écrire"
    const typingInterval = setInterval(() => {
      // Montrer aléatoirement l'indicateur "en train d'écrire"
      const shouldType = Math.random() > 0.7;
      if (shouldType && messages.length > 0) {
        setIsTyping(true);
        
        // Animation de l'indicateur "en train d'écrire"
        Animated.timing(typingAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }).start();
        
        // Masquer après un délai aléatoire
        setTimeout(() => {
          Animated.timing(typingAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          }).start(() => setIsTyping(false));
        }, 2000 + Math.random() * 3000);
      }
    }, 10000); // Vérifier toutes les 10 secondes
    
    return () => clearInterval(typingInterval);
  }, [navigation, friendName, messages]);

  // Effet d'animation pour le bouton d'envoi
  useEffect(() => {
    if (newMessage.trim()) {
      Animated.spring(sendButtonScale, {
        toValue: 1.1,
        friction: 5,
        tension: 40,
        useNativeDriver: true
      }).start();
    } else {
      Animated.spring(sendButtonScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true
      }).start();
    }
  }, [newMessage]);

  // Charger les messages au chargement et lors de la mise au point
  useFocusEffect(
    useCallback(() => {
      loadMessages();
      markConversationAsRead();
    }, [conversationId])
  );

  // Charger les messages
  const loadMessages = async (beforeMessageId = null) => {
    try {
      if (!beforeMessageId) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }

      const messageData = await getMessages(
        conversationId, 
        beforeMessageId ? beforeMessageId : null
      );
      
      if (messageData.length === 0) {
        setHasMore(false);
      } else if (!beforeMessageId) {
        setMessages(messageData);
        // Simuler un message "lu" pour le premier message
        if (messageData.length > 0 && messageData[0].senderId === 'currentUser') {
          setLastRead(messageData[0]._id);
        }
      } else {
        setMessages(prev => [...prev, ...messageData]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  // Marquer la conversation comme lue
  const markConversationAsRead = async () => {
    try {
      await markAsRead(conversationId);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const sentMessage = await sendMessage(conversationId, newMessage.trim());
      setMessages(prev => [sentMessage, ...prev]);
      setNewMessage('');
      
      // Scroll au premier message
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
      
      // Simuler une réponse automatique avec l'indicateur "en train d'écrire"
      setTimeout(() => {
        setIsTyping(true);
        Animated.timing(typingAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }).start();
        
        // Après un délai, masquer l'indicateur et simuler une réponse
        setTimeout(() => {
          Animated.timing(typingAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          }).start(() => {
            setIsTyping(false);
            
            // Simuler une réponse
            if (Math.random() > 0.5) {
              const autoResponses = [
                "D'accord, je comprends !",
                "Merci pour ton message !",
                "C'est noté !",
                "Super, à plus tard !",
                "Je vais y réfléchir."
              ];
              
              const response = {
                _id: `auto-${Date.now()}`,
                conversationId,
                content: autoResponses[Math.floor(Math.random() * autoResponses.length)],
                senderId: 'friend',
                createdAt: new Date().toISOString(),
                read: true
              };
              
              setMessages(prev => [response, ...prev]);
              
              // Marquer comme lu avec un délai
              setTimeout(() => {
                setLastRead(sentMessage._id);
              }, 1000);
            }
          });
        }, 1500 + Math.random() * 2000);
      }, 500);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Charger plus de messages
  const handleLoadMore = () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    
    const oldestMessage = messages[messages.length - 1];
    loadMessages(oldestMessage._id);
  };

  // Rendu d'un message
  const renderMessage = ({ item, index }) => {
    // Vérifier que le message est valide pour éviter les erreurs
    if (!item || !item._id) {
      console.warn("Message invalide:", item);
      return null;
    }
    
    const isMyMessage = item.senderId === 'currentUser';
    const showReadReceipt = isMyMessage && lastRead === item._id && index === 0;
    
    // Vérifier si on doit afficher la date
    const showDate = index === messages.length - 1 || 
      new Date(item.createdAt).toDateString() !== 
      new Date(messages[index + 1]?.createdAt || 0).toDateString();
    
    const showAvatar = !isMyMessage && (index === messages.length - 1 || 
      messages[index + 1]?.senderId === 'currentUser');
      
    return (
      <>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString([], {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </Text>
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage
        ]}>
          {!isMyMessage && showAvatar && (
            <View style={styles.avatarContainer}>
              {friendAvatar ? (
                <Image source={{ uri: friendAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{friendName ? friendName.charAt(0) : '?'}</Text>
                </View>
              )}
            </View>
          )}
          {!isMyMessage && !showAvatar && <View style={styles.avatarSpacer} />}
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
          ]}>
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText
            ]}>
              {item.content}
            </Text>
            <Text style={styles.messageTime}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {showReadReceipt && (
              <View style={styles.readReceiptContainer}>
                <Icon name="checkmark-done" size={14} color="#34B7F1" />
              </View>
            )}
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* En-tête personnalisée */}
      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={28} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.headerAvatar}>
              {friendAvatar ? (
                <Image source={{ uri: friendAvatar }} style={styles.headerAvatarImage} />
              ) : (
                <View style={styles.headerAvatarPlaceholder}>
                  <Text style={styles.headerAvatarText}>
                    {friendName ? friendName.charAt(0) : '?'}
                  </Text>
                </View>
              )}
              <View style={[
                styles.statusIndicator,
                styles.statusOnline
              ]} />
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{friendName}</Text>
              <Text style={styles.headerStatus}>
                {isTyping ? 'En train d\'écrire...' : 'En ligne'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="ellipsis-vertical" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </LinearGradient>
      </View>
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, index) => {
                if (!item || !item._id) return `empty-message-${index}`;
                return `message-${item._id}-${index}`;
              }}
              contentContainerStyle={styles.messagesList}
              inverted
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="chatbubble-ellipses-outline" size={60} color={COLORS.textLight} />
                  <Text style={styles.emptyText}>Aucun message</Text>
                  <Text style={styles.emptySubText}>
                    Envoyez un message pour démarrer la conversation
                  </Text>
                </View>
              }
            />
            
            {isTyping && (
              <Animated.View 
                style={[
                  styles.typingContainer,
                  { opacity: typingAnim }
                ]}
              >
                <View style={styles.typingBubble}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </Animated.View>
            )}
          </>
        )}

        <Animated.View style={[styles.inputContainer, { opacity: inputAnim }]}>
          <View style={styles.inputActions}>
            <TouchableOpacity style={styles.attachButton}>
              <Icon name="attach" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Tapez un message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            
            {!newMessage.trim() && (
              <TouchableOpacity style={styles.emojiButton}>
                <Icon name="happy" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                newMessage.trim() ? styles.sendButtonActive : styles.sendButtonInactive
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Icon 
                name="send"
                size={22} 
                color={COLORS.white} 
              />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 60,
    width: '100%',
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingLeft: 5,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    position: 'relative',
  },
  headerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  headerAvatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  statusOnline: {
    backgroundColor: '#4CAF50',
  },
  statusOffline: {
    backgroundColor: '#9E9E9E',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerButton: {
    padding: 8,
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingVertical: 4,
  },
  myMessage: {
    alignSelf: 'flex-end',
    marginLeft: 50,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    marginRight: 50,
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatarSpacer: {
    width: 40,
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '80%',
    position: 'relative',
  },
  myMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: COLORS.white,
  },
  theirMessageText: {
    color: COLORS.textPrimary,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
    marginTop: 2,
    marginLeft: 6,
  },
  readReceiptContainer: {
    position: 'absolute',
    right: 4,
    bottom: -18,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    width: 65,
    justifyContent: 'space-around',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  inputActions: {
    marginRight: 5,
  },
  attachButton: {
    padding: 5,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 5,
    position: 'relative',
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingRight: 30,
    paddingVertical: 6,
  },
  emojiButton: {
    position: 'absolute',
    right: 5,
    padding: 5,
  },
  sendButton: {
    marginLeft: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sendButtonInactive: {
    backgroundColor: COLORS.lightPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMore: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default ConversationScreen;