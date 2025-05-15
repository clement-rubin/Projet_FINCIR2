import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  Animated,
  Easing,
  SafeAreaView // Ajouté ici
} from 'react-native';
import Icon, { COLORS } from '../components/common/Icon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  searchUsers, 
  getFriends, 
  getPendingRequests, 
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  addBotFriends,
  hasAnyFriends
} from '../services/friendshipService';
import { retrieveFriends } from '../utils/friendshipStorage';
import { FRIENDS_STORAGE_KEY } from '../utils/friendshipStorage';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from '@react-navigation/native';
import { SCREEN } from '../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';

// Suppression du composant CustomNavBar

const FriendsScreen = ({ navigation }) => {
  // États et refs inchangés
  const [search, setSearch] = useState('');
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreFriends, setHasMoreFriends] = useState(true);
  const [activeTab, setActiveTab] = useState('friends');
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;

  // Hooks inchangés
  useFocusEffect(
    useCallback(() => {
      // Réinitialiser complètement l'état à chaque retour sur l'écran
      setPage(1);
      setFriends([]);
      setHasMoreFriends(true);
      
      // Charger à nouveau les données
      loadFriendsData(true);
      
      // Animation d'entrée
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        })
      ]).start();
    }, [])
  );

  useEffect(() => {
    // Nettoyage du stockage des amis
    const cleanupFriendsStorage = async () => {
      try {
        const friends = await retrieveFriends();
        const friendsJson = await AsyncStorage.getItem(FRIENDS_STORAGE_KEY);
        const originalFriends = JSON.parse(friendsJson || '[]');
        
        if (originalFriends.length !== friends.length) {
          console.log(`Nettoyage des amis: ${originalFriends.length} → ${friends.length}`);
          await AsyncStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(friends));
        }
      } catch (error) {
        console.error('Erreur lors du nettoyage du stockage des amis:', error);
      }
    };
    
    cleanupFriendsStorage();
  }, []);

  // Animer l'indicateur d'onglet
  useEffect(() => {
    // Calculer la position cible
    let position = 0;
    if (activeTab === 'pending') position = SCREEN.width * 0.22;
    else if (activeTab === 'search') position = SCREEN.width * 0.45;
    
    // Utiliser translateX au lieu de manipuler la largeur
    Animated.spring(tabIndicatorPosition, {
      toValue: position,
      friction: 8,
      tension: 50,
      useNativeDriver: true // Maintenant safe avec translateX
    }).start();
  }, [activeTab]);

  // Fonctions de gestion inchangées
  const loadFriendsData = async (refreshList = false) => {
    try {
      setIsLoading(true);
      
      if (refreshList) {
        setPage(1);
        setHasMoreFriends(true);
        
        const [friendsResponse, requestsResponse] = await Promise.all([
          getFriends(1),
          getPendingRequests()
        ]);
        
        // Vérifier si la réponse est valide
        if (friendsResponse && friendsResponse.friends) {
          // Utiliser la déduplication
          setFriends(deduplicateFriends(friendsResponse.friends));
          
          // Mettre à jour le statut de pagination
          if (friendsResponse.pagination) {
            setHasMoreFriends(
              friendsResponse.pagination.page < friendsResponse.pagination.pages
            );
          } else {
            setHasMoreFriends(false);
          }
        }
        
        setPendingRequests(requestsResponse || []);
      } else {
        // Chargement de pagination normale
        const friendsResponse = await getFriends(page);
        
        if (friendsResponse && friendsResponse.friends) {
          // Vérification plus stricte des doublons avant d'ajouter de nouveaux amis
          const existingIds = new Set(friends.map(f => f.friendshipId));
          const existingUserIds = new Set(friends.map(f => f.friend?._id).filter(Boolean));
          
          // Exclure les doublons à la fois par friendshipId ET par l'ID utilisateur
          const newFriends = friendsResponse.friends.filter(
            newFriend => !existingIds.has(newFriend.friendshipId) && 
                        !existingUserIds.has(newFriend.friend?._id)
          );
          
          if (newFriends.length > 0) {
            // Utiliser la déduplication quand on ajoute de nouveaux amis
            setFriends(prev => deduplicateFriends([...prev, ...newFriends]));
          }
          
          // Mettre à jour le statut de pagination
          if (friendsResponse.pagination) {
            setHasMoreFriends(
              friendsResponse.pagination.page < friendsResponse.pagination.pages
            );
          } else {
            setHasMoreFriends(false);
          }
        }
      }
    } catch (error) {
      console.error('Error loading friends data:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger vos amis. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async (text) => {
    setSearch(text);
    
    if (text.length >= 3) {
      setActiveTab('search');
      setIsSearching(true);
      
      try {
        const results = await searchUsers(text);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        Alert.alert(
          'Erreur',
          'Impossible de rechercher des utilisateurs. Veuillez réessayer.'
        );
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      setIsLoading(true);
      await sendFriendRequest(userId);
      
      // Mettre à jour la liste de recherche
      setSearchResults(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, relationStatus: 'pending', sentByMe: true } 
            : user
        )
      );
      
      Alert.alert('Succès', 'Demande d\'ami envoyée');
    } catch (error) {
      console.error('Send request error:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'envoyer la demande d\'ami. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setIsLoading(true);
      await respondToFriendRequest(requestId, 'accepted');
      
      // Mettre à jour les listes
      const acceptedRequest = pendingRequests.find(req => req._id === requestId);
      if (acceptedRequest) {
        setPendingRequests(prev => prev.filter(req => req._id !== requestId));
        
        // Recharger la liste des amis
        loadFriendsData(true);
      }
      
    } catch (error) {
      console.error('Accept request error:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'accepter la demande d\'ami. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setIsLoading(true);
      await respondToFriendRequest(requestId, 'rejected');
      
      // Mettre à jour la liste des demandes
      setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      
    } catch (error) {
      console.error('Reject request error:', error);
      Alert.alert(
        'Erreur',
        'Impossible de rejeter la demande d\'ami. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = (friendshipId, friendName) => {
    Alert.alert(
      'Supprimer un ami',
      `Êtes-vous sûr de vouloir supprimer ${friendName} de vos amis ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await removeFriend(friendshipId);
              
              // Mettre à jour la liste des amis
              setFriends(prev => prev.filter(friend => friend.friendshipId !== friendshipId));
              
            } catch (error) {
              console.error('Remove friend error:', error);
              Alert.alert(
                'Erreur',
                'Impossible de supprimer cet ami. Veuillez réessayer.'
              );
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'friends') {
      setSearch('');
      setSearchResults([]);
    }
  };

  const handleLoadMoreFriends = () => {
    if (hasMoreFriends && !isLoading && !refreshing && activeTab === 'friends') {
      const nextPage = page + 1;
      setPage(nextPage);
      
      // Éviter les appels multiples rapprochés
      const timer = setTimeout(() => {
        loadFriendsData();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFriendsData(true);
  };

  const handleOpenChat = async (friendId) => {
    try {
      setIsLoading(true);
      
      // Récupérer ou créer une conversation avec cet ami
      const { getOrCreateConversation } = require('../services/messagingService');
      const conversation = await getOrCreateConversation(friendId);
      
      // Trouver les informations de l'ami
      const friend = friends.find(f => f.friend._id === friendId);
      if (!friend) {
        throw new Error('Ami non trouvé');
      }
      
      // Naviguer vers l'écran de conversation
      navigation.navigate('Conversation', {
        conversationId: conversation._id,
        friendName: friend.friend.name || friend.friend.username,
        friendAvatar: friend.friend.avatar
      });
    } catch (error) {
      console.error('Error opening chat:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir la conversation. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBotFriends = async () => {
    try {
      setIsLoading(true);
      
      // Vérifier si l'utilisateur a déjà des amis
      const hasExistingFriends = await hasAnyFriends();
      const botCount = hasExistingFriends ? 3 : 5; // Ajouter plus d'amis s'il n'en a pas encore
      
      // Ajouter des amis bots
      const addedBots = await addBotFriends(botCount);
      
      if (addedBots && addedBots.length > 0) {
        Alert.alert(
          'Succès',
          `${addedBots.length} amis bots ont été ajoutés avec succès !`,
          [{ text: 'OK', onPress: () => loadFriendsData(true) }]
        );
      } else {
        Alert.alert('Info', 'Aucun ami bot n\'a pu être ajouté.');
      }
    } catch (error) {
      console.error('Error adding bot friends:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'ajouter des amis bots. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour éviter les doublons dans la liste d'amis
  const deduplicateFriends = (friendsList) => {
    const uniqueFriends = new Map();
    
    // Utiliser Map pour conserver uniquement la dernière version de chaque ami
    friendsList.forEach(friend => {
      if (friend && friend.friend && friend.friendshipId) {
        // Utiliser l'ID d'amitié comme clé
        uniqueFriends.set(friend.friendshipId, friend);
      }
    });
    
    return Array.from(uniqueFriends.values());
  };

  // Fonctions de rendu avec composants optimisés
  const renderFriendItem = ({ item, index }) => {
    if (!item || !item.friend || !item.friendshipId) {
      console.warn("Élément ami invalide trouvé:", item);
      return null;
    }
    
    return (
      <View style={styles.friendItem}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {item.friend.avatar ? (
              <Image source={{ uri: item.friend.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{item.friend.name ? item.friend.name.charAt(0) : item.friend.username.charAt(0)}</Text>
            )}
          </View>
          <View>
            <Text style={styles.userName}>{item.friend.name || item.friend.username}</Text>
            <Text style={styles.userHandle}>@{item.friend.username}</Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleOpenChat(item.friend._id)}
          >
            <Icon name="chatbubble-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { marginLeft: 8 }]}
            onPress={() => handleRemoveFriend(item.friendshipId, item.friend.name || item.friend.username)}
          >
            <Icon name="person-remove-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRequestItem = ({ item }) => (
    <View style={styles.friendItem}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          {item.requesterId.avatar ? (
            <Image source={{ uri: item.requesterId.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {item.requesterId.name ? item.requesterId.name.charAt(0) : item.requesterId.username.charAt(0)}
            </Text>
          )}
        </View>
        <View>
          <Text style={styles.userName}>{item.requesterId.name || item.requesterId.username}</Text>
          <Text style={styles.userHandle}>@{item.requesterId.username}</Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item._id)}
        >
          <Icon name="checkmark" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { marginLeft: 8 }]}
          onPress={() => handleRejectRequest(item._id)}
        >
          <Icon name="close" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchItem = ({ item }) => (
    <View style={styles.friendItem}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {item.name ? item.name.charAt(0) : item.username.charAt(0)}
            </Text>
          )}
        </View>
        <View>
          <Text style={styles.userName}>{item.name || item.username}</Text>
          <Text style={styles.userHandle}>@{item.username}</Text>
        </View>
      </View>
      {renderSearchItemAction(item)}
    </View>
  );

  const renderSearchItemAction = (user) => {
    if (!user.relationStatus) {
      return (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleSendRequest(user._id)}
        >
          <Icon name="person-add-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      );
    } else if (user.relationStatus === 'pending') {
      if (user.sentByMe) {
        return (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Demande envoyée</Text>
          </View>
        );
      } else {
        return (
          <View style={styles.requestActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptRequest(user._id)}
            >
              <Icon name="checkmark" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { marginLeft: 8 }]}
              onPress={() => handleRejectRequest(user._id)}
            >
              <Icon name="close" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        );
      }
    } else if (user.relationStatus === 'accepted') {
      return (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>Déjà ami</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Espace blanc en haut pour éviter que la barre de recherche soit coupée */}
      <View style={{ height: 30 }} />
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher des utilisateurs..."
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'friends' && styles.activeTab
          ]}
          onPress={() => handleTabChange('friends')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'friends' && styles.activeTabText
            ]}
          >
            Mes amis
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'pending' && styles.activeTab,
            pendingRequests.length > 0 && styles.tabWithBadge
          ]}
          onPress={() => handleTabChange('pending')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'pending' && styles.activeTabText
            ]}
          >
            Demandes
          </Text>
          {pendingRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {search.length > 0 && (
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'search' && styles.activeTab
            ]}
            onPress={() => handleTabChange('search')}
          >
            <Text 
              style={[
                styles.tabText, 
                activeTab === 'search' && styles.activeTabText
              ]}
            >
              Recherche
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.View 
        style={[
          styles.tabIndicator,
          { transform: [{ translateX: tabIndicatorPosition }] }
        ]}
      />

      {isLoading && !refreshing && (
        <BlurView intensity={50} style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </BlurView>
      )}

      {activeTab === 'friends' && (
        <Animated.FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={(item, index) => {
            if (!item) return `empty-friend-${index}`;
            return `friend-${item.friendshipId || ''}-${item.friend?._id || ''}-${index}`;
          }}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
          onEndReached={handleLoadMoreFriends}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMoreFriends && !isLoading ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadMoreText}>Chargement...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Icon name="people-outline" size={60} color={COLORS.textLight} />
                <Text style={styles.emptyText}>Vous n'avez pas encore d'amis</Text>
                <Text style={styles.emptySubText}>
                  Recherchez des utilisateurs pour les ajouter en amis
                </Text>
                <TouchableOpacity 
                  style={styles.botFriendsButton}
                  onPress={handleAddBotFriends}
                >
                  <Icon name="people" size={18} color={COLORS.white} style={styles.buttonIcon} />
                  <Text style={styles.botFriendsButtonText}>Ajouter des amis bots</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {activeTab === 'pending' && (
        <FlatList
          data={pendingRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item, index) => {
            if (!item) return `empty-request-${index}`;
            return `request-${item._id || ''}-${item.requesterId?._id || ''}-${index}`;
          }}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Icon name="mail-outline" size={60} color={COLORS.textLight} />
                <Text style={styles.emptyText}>Aucune demande en attente</Text>
              </View>
            ) : null
          }
        />
      )}

      {activeTab === 'search' && (
        <FlatList
          data={searchResults}
          renderItem={renderSearchItem}
          keyExtractor={(item, index) => {
            if (!item) return `empty-search-${index}`;
            return `search-${item._id || ''}-${Date.now()}-${index}`;
          }}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : search.length > 2 ? (
              <View style={styles.emptyContainer}>
                <Icon name="search-outline" size={60} color={COLORS.textLight} />
                <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="search-outline" size={60} color={COLORS.textLight} />
                <Text style={styles.emptyText}>
                  Saisissez au moins 3 caractères pour rechercher
                </Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 20,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  userHandle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestActions: {
    flexDirection: 'row',
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pendingBadge: {
    backgroundColor: COLORS.light,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pendingText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    marginLeft: 8,
    color: COLORS.textSecondary,
  },
  botFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 20,
  },
  botFriendsButtonText: {
    color: COLORS.white,
    fontSize: 16,
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
  tabIndicator: {
    height: 2,
    width: '20%', // Largeur fixe
    backgroundColor: COLORS.primary,
    position: 'absolute',
    bottom: 0,
    left: 0, // Ne pas utiliser left pour l'animation, nous utilisons translateX
  },
});

export default FriendsScreen;