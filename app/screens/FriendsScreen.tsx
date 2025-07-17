import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, StatusBar, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Text, Avatar, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, UserPlus, UserCheck, X } from 'lucide-react-native';
import { pillNavHeight } from '../constants/navigation';
import { User, FriendRequest, MutualFriend } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  searchUsersByUsername, 
  sendFriendRequest, 
  acceptFriendRequest, 
  declineFriendRequest,
  getUserFriends,
  getFriendRequests,
  subscribeToFriendRequests,
  subscribeToUserFriends,
  subscribeToAcceptedFriendRequests,
  getMutualFriends
} from '../services/firebaseService';

interface FriendsScreenProps {
  navigation: any;
}

const FriendItem = ({ friend, theme }: { friend: User, theme: any }) => (
  <View style={[
    styles.friendItem,
    { 
      backgroundColor: theme['background-basic-color-2'],
      borderBottomColor: theme['border-basic-color-3']
    }
  ]}>
    <Avatar
      size='medium'
      source={{ uri: friend.avatar || 'https://via.placeholder.com/50' }}
      style={styles.friendAvatar}
    />
    <View style={styles.friendInfo}>
      <Text category='s1' style={[
        styles.friendName,
        { color: theme['text-primary-color'] }
      ]}>
        {friend.displayName}
      </Text>
      <Text category='c1' style={[
        styles.friendUsername,
        { color: theme['text-secondary-color'] }
      ]}>
        @{friend.username}
      </Text>
    </View>
  </View>
);

const FriendRequestItem = ({ 
  request, 
  theme, 
  onAccept, 
  onDecline,
  type 
}: { 
  request: FriendRequest, 
  theme: any,
  onAccept: (requestId: string) => void,
  onDecline: (requestId: string) => void,
  type: 'incoming' | 'outgoing'
}) => (
  <View style={[
    styles.requestItem,
    { 
      backgroundColor: theme['background-basic-color-2'],
      borderBottomColor: theme['border-basic-color-3']
    }
  ]}>
    <Avatar
      size='medium'
      source={{ uri: 'https://via.placeholder.com/50' }}
      style={styles.friendAvatar}
    />
    <View style={styles.friendInfo}>
      <Text category='s1' style={[
        styles.friendName,
        { color: theme['text-primary-color'] }
      ]}>
        {type === 'incoming' ? request.fromUsername : request.toUsername}
      </Text>
      <Text category='c1' style={[
        styles.requestStatus,
        { color: theme['text-secondary-color'] }
      ]}>
        {type === 'incoming' ? 'Wants to be friends' : 'Friend request sent'}
      </Text>
    </View>
    {type === 'incoming' && (
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[
            styles.acceptButton,
            { backgroundColor: theme['color-primary-500'] }
          ]}
          onPress={() => onAccept(request.id)}
        >
          <UserCheck size={18} color={theme['text-on-primary-color']} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.declineButton,
            { backgroundColor: theme['color-basic-400'] }
          ]}
          onPress={() => onDecline(request.id)}
        >
          <X size={18} color={theme['text-on-primary-color']} />
        </TouchableOpacity>
      </View>
    )}
  </View>
);

const SearchResultItem = ({ 
  user, 
  theme, 
  onAddFriend 
}: { 
  user: User, 
  theme: any,
  onAddFriend: (username: string) => void
}) => (
  <View style={[
    styles.searchResultItem,
    { 
      backgroundColor: theme['background-basic-color-2'],
      borderBottomColor: theme['border-basic-color-3']
    }
  ]}>
    <Avatar
      size='medium'
      source={{ uri: user.avatar || 'https://via.placeholder.com/50' }}
      style={styles.friendAvatar}
    />
    <View style={styles.friendInfo}>
      <Text category='s1' style={[
        styles.friendName,
        { color: theme['text-primary-color'] }
      ]}>
        {user.displayName}
      </Text>
      <Text category='c1' style={[
        styles.friendUsername,
        { color: theme['text-secondary-color'] }
      ]}>
        @{user.username}
      </Text>
    </View>
    <TouchableOpacity
      style={[
        styles.addButton,
        { backgroundColor: theme['color-primary-500'] }
      ]}
      onPress={() => onAddFriend(user.username)}
    >
      <UserPlus size={18} color={theme['text-on-primary-color']} />
    </TouchableOpacity>
  </View>
);

const MutualFriendItem = ({ 
  mutualFriend, 
  theme, 
  onAddFriend 
}: { 
  mutualFriend: MutualFriend, 
  theme: any,
  onAddFriend: (username: string) => void
}) => (
  <View style={[
    styles.mutualFriendItem,
    { 
      backgroundColor: theme['background-basic-color-2'],
      borderBottomColor: theme['border-basic-color-3']
    }
  ]}>
    <Avatar
      size='medium'
      source={{ uri: mutualFriend.user.avatar || 'https://via.placeholder.com/50' }}
      style={styles.friendAvatar}
    />
    <View style={styles.friendInfo}>
      <Text category='s1' style={[
        styles.friendName,
        { color: theme['text-primary-color'] }
      ]}>
        {mutualFriend.user.displayName}
      </Text>
      <Text category='c1' style={[
        styles.friendUsername,
        { color: theme['text-secondary-color'] }
      ]}>
        @{mutualFriend.user.username}
      </Text>
      <Text category='c2' style={[
        styles.mutualText,
        { color: theme['text-hint-color'] }
      ]}>
        {mutualFriend.mutualCount} mutual friend{mutualFriend.mutualCount > 1 ? 's' : ''}: {mutualFriend.mutualFriends.slice(0, 2).map(name => `@${name}`).join(', ')}{mutualFriend.mutualFriends.length > 2 ? ` +${mutualFriend.mutualFriends.length - 2} more` : ''}
      </Text>
    </View>
    <TouchableOpacity
      style={[
        styles.addButton,
        { backgroundColor: theme['color-primary-500'] }
      ]}
      onPress={() => onAddFriend(mutualFriend.user.username)}
    >
      <UserPlus size={18} color={theme['text-on-primary-color']} />
    </TouchableOpacity>
  </View>
);

export const FriendsScreen: React.FC<FriendsScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [mutualFriends, setMutualFriends] = useState<MutualFriend[]>([]);
  const [loadingMutuals, setLoadingMutuals] = useState(false);

  // Load friends and friend requests when component mounts
  useEffect(() => {
    if (!user) return;
    
    const loadInitialData = async () => {
      try {
        setLoading(true);
        // Load initial friend requests data
        const requestsData = await getFriendRequests(user.id);
        setFriendRequests(requestsData.incoming);
        setOutgoingRequests(requestsData.outgoing);
      } catch (error: any) {
        console.error('Error loading initial friends data:', error);
        
        // Show user-friendly error message for critical failures
        if (error.message && !error.message.includes('permission')) {
          Alert.alert('Error', 'Failed to load friends data. Please try again.');
        }
        
        // Set empty data as fallback
        setFriends([]);
        setFriendRequests([]);
        setOutgoingRequests([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
    
    // Subscribe to real-time updates for friends list
    const unsubscribeFriends = subscribeToUserFriends(user.id, (friendsData) => {
      setFriends(friendsData);
    });
    
    // Subscribe to real-time updates for friend requests
    const unsubscribeRequests = subscribeToFriendRequests(user.id, (requests) => {
      setFriendRequests(requests.incoming);
      setOutgoingRequests(requests.outgoing);
    });
    
    // Subscribe to accepted friend requests to update requester's friends list
    const unsubscribeAccepted = subscribeToAcceptedFriendRequests(user.id, (acceptedUserId) => {
      console.log(`Your friend request was accepted by user: ${acceptedUserId}`);
      // The subscribeToUserFriends will automatically update the UI when the friends array changes
    });
    
    return () => {
      unsubscribeFriends();
      unsubscribeRequests();
      unsubscribeAccepted();
    };
  }, [user]);

  const loadMutualFriends = async () => {
    if (!user) return;
    
    try {
      setLoadingMutuals(true);
      const mutuals = await getMutualFriends(user.id);
      setMutualFriends(mutuals);
    } catch (error: any) {
      console.error('Error loading mutual friends:', error);
      // Only show error for non-permission issues
      if (error.message && !error.message.includes('permission')) {
        Alert.alert('Error', 'Failed to load mutual friends. Please try again.');
      }
      setMutualFriends([]);
    } finally {
      setLoadingMutuals(false);
    }
  };

  // Load mutual friends when search tab is activated
  useEffect(() => {
    if (activeTab === 'search' && user) {
      loadMutualFriends();
    }
  }, [activeTab, user]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const results = await searchUsersByUsername(query);
      // Filter out current user and existing friends
      const filteredResults = results.filter(result => 
        result.id !== user?.id && 
        !user?.friends?.includes(result.id)
      );
      setSearchResults(filteredResults);
    } catch (error: any) {
      console.error('Search error:', error);
      // Only show error for non-permission issues
      if (error.message && !error.message.includes('permission')) {
        Alert.alert('Error', 'Failed to search users. Please try again.');
      }
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (username: string) => {
    if (!user) return;
    
    try {
      await sendFriendRequest(user.id, username);
      Alert.alert('Success', `Friend request sent to @${username}`);
      // Remove from search results since request was sent
      setSearchResults(prev => prev.filter(u => u.username !== username));
      // Remove from mutual friends since request was sent
      setMutualFriends(prev => prev.filter(m => m.user.username !== username));
    } catch (error: any) {
      console.error('Add friend error:', error);
      Alert.alert('Error', error.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      // Real-time subscription will automatically update friends list
      // Refresh mutual friends if on search tab
      if (activeTab === 'search') {
        loadMutualFriends();
      }
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error: any) {
      console.error('Accept request error:', error);
      Alert.alert('Error', error.message || 'Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
      Alert.alert('Request declined');
    } catch (error: any) {
      console.error('Decline request error:', error);
      Alert.alert('Error', error.message || 'Failed to decline friend request');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return (
          <View style={styles.tabContent}>
            {friends.length === 0 ? (
              <View style={styles.emptyState}>
                <Text category='s1' style={[
                  styles.emptyText,
                  { color: theme['text-secondary-color'] }
                ]}>
                  No friends yet
                </Text>
                <Text category='c1' style={[
                  styles.emptySubtext,
                  { color: theme['text-hint-color'] }
                ]}>
                  Start adding friends to see them here
                </Text>
              </View>
            ) : (
              friends.map((friend, index) => (
                <FriendItem key={index} friend={friend} theme={theme} />
              ))
            )}
          </View>
        );

      case 'requests':
        return (
          <View style={styles.tabContent}>
            {friendRequests.length === 0 && outgoingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text category='s1' style={[
                  styles.emptyText,
                  { color: theme['text-secondary-color'] }
                ]}>
                  No friend requests
                </Text>
              </View>
            ) : (
              <>
                {friendRequests.length > 0 && (
                  <View style={styles.requestSection}>
                    <Text category='s1' style={[
                      styles.sectionTitle,
                      { color: theme['text-primary-color'] }
                    ]}>
                      Incoming Requests
                    </Text>
                    {friendRequests.map((request, index) => (
                      <FriendRequestItem
                        key={index}
                        request={request}
                        theme={theme}
                        onAccept={handleAcceptRequest}
                        onDecline={handleDeclineRequest}
                        type="incoming"
                      />
                    ))}
                  </View>
                )}
                {outgoingRequests.length > 0 && (
                  <View style={styles.requestSection}>
                    <Text category='s1' style={[
                      styles.sectionTitle,
                      { color: theme['text-primary-color'] }
                    ]}>
                      Sent Requests
                    </Text>
                    {outgoingRequests.map((request, index) => (
                      <FriendRequestItem
                        key={index}
                        request={request}
                        theme={theme}
                        onAccept={handleAcceptRequest}
                        onDecline={handleDeclineRequest}
                        type="outgoing"
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        );

      case 'search':
        return (
          <View style={styles.tabContent}>
            {/* Mutual Friends Section */}
            {mutualFriends.length > 0 && (
              <View style={styles.mutualsSection}>
                <Text category='s1' style={[
                  styles.sectionTitle,
                  { color: theme['text-primary-color'] }
                ]}>
                  People You May Know
                </Text>
                {mutualFriends.map((mutual, index) => (
                  <MutualFriendItem
                    key={index}
                    mutualFriend={mutual}
                    theme={theme}
                    onAddFriend={handleAddFriend}
                  />
                ))}
              </View>
            )}
            
            {loadingMutuals && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme['color-primary-500']} />
                <Text category='c1' style={[
                  styles.loadingText,
                  { color: theme['text-secondary-color'] }
                ]}>
                  Loading suggestions...
                </Text>
              </View>
            )}
            
            {/* Search Section */}
            <View style={styles.searchSection}>
              <Text category='s1' style={[
                styles.sectionTitle,
                { color: theme['text-primary-color'] }
              ]}>
                Search Users
              </Text>
              <View style={[
                styles.searchContainer,
                { backgroundColor: theme['background-basic-color-2'] }
              ]}>
                <Search size={20} color={theme['text-hint-color']} />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: theme['text-primary-color'] }
                  ]}
                  placeholder="Search by username..."
                  placeholderTextColor={theme['text-hint-color']}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    handleSearch(text);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme['color-primary-500']} />
                </View>
              )}
              
              {searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <SearchResultItem
                    key={index}
                    user={result}
                    theme={theme}
                    onAddFriend={handleAddFriend}
                  />
                ))
              ) : searchQuery.length > 0 && !loading ? (
                <View style={styles.emptyState}>
                  <Text category='s1' style={[
                    styles.emptyText,
                    { color: theme['text-secondary-color'] }
                  ]}>
                    No users found
                  </Text>
                </View>
              ) : null}
            </View>
            
            {/* Show empty state for mutuals if no friends and not loading */}
            {mutualFriends.length === 0 && !loadingMutuals && friends.length === 0 && (
              <View style={styles.emptyState}>
                <Text category='s1' style={[
                  styles.emptyText,
                  { color: theme['text-secondary-color'] }
                ]}>
                  Add some friends to see suggestions
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme['background-basic-color-1']} />
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={theme['text-primary-color']} />
          </TouchableOpacity>
          <Text category='h6' style={[
            styles.headerTitle,
            { color: theme['text-primary-color'] }
          ]}>
            Friends
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'friends' && {
                backgroundColor: theme['color-primary-500']
              }
            ]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'friends' ? theme['text-on-primary-color'] : theme['text-secondary-color'] }
            ]}>
              Friends
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'requests' && {
                backgroundColor: theme['color-primary-500']
              }
            ]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'requests' ? theme['text-on-primary-color'] : theme['text-secondary-color'] }
            ]}>
              Requests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'search' && {
                backgroundColor: theme['color-primary-500']
              }
            ]}
            onPress={() => setActiveTab('search')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'search' ? theme['text-on-primary-color'] : theme['text-secondary-color'] }
            ]}>
              Add Friends
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: pillNavHeight + 20 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {renderTabContent()}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  headerSpacer: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  tabContent: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: 0.5,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: 0.5,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: 0.5,
  },
  friendAvatar: {
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontWeight: '600',
    fontSize: 16,
  },
  friendUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  requestStatus: {
    fontSize: 14,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  requestSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  mutualsSection: {
    marginBottom: 24,
  },
  searchSection: {
    flex: 1,
  },
  mutualFriendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: 0.5,
  },
  mutualText: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
});