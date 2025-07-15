import React, { useState, useEffect } from 'react';
import { Layout, Text, Card, Button, Input, Spinner, Avatar } from '@ui-kitten/components';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, TrendingUp, Users, MapPin, Filter, Star, Clock, UserPlus } from 'lucide-react-native';
import { discoveryService } from '../../services/discoveryService';
import { DiscoveryData, TrendingPrompt, SuggestedUser, PopularChain, NearbyUser, SearchFilters } from '../../types';

export const FlareDiscoveryScreen = () => {
  const navigation = useNavigation();
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'people' | 'chains' | 'nearby'>('trending');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  const currentUserId = 'current-user-id'; // TODO: Get from auth context

  useEffect(() => {
    loadDiscoveryData();
  }, []);

  const loadDiscoveryData = async () => {
    try {
      setLoading(true);
      const data = await discoveryService.getDiscoveryData(currentUserId);
      setDiscoveryData(data);
    } catch (error) {
      console.error('Error loading discovery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      // Implement search based on active tab
      console.log(`Searching for: ${searchQuery} in ${activeTab}`);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleUserSuggestion = (userId: string) => {
    console.log('View user profile:', userId);
    // TODO: Navigate to user profile or send friend request
  };

  const handleJoinChain = (chainId: string) => {
    navigation.navigate('FlareChainView' as never, { chainId } as never);
  };

  const handleUsePrompt = (promptId: string) => {
    navigation.navigate('FlareCreation' as never, { prompt: { id: promptId } } as never);
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) return `${Math.round(distance * 1000)}m away`;
    return `${distance.toFixed(1)}km away`;
  };

  const formatCompletionRate = (rate: number): string => {
    return `${rate}% completion`;
  };

  const getSuggestionReasonText = (reason: SuggestedUser['suggestionReason']): string => {
    switch (reason) {
      case 'mutual_friends': return 'Mutual friends';
      case 'shared_interests': return 'Similar interests';
      case 'geographic': return 'Nearby';
      case 'chain_participation': return 'Chain connections';
      default: return 'Suggested';
    }
  };

  const renderTrendingPrompt = ({ item }: { item: TrendingPrompt }) => (
    <Card style={styles.trendingCard}>
      <TouchableOpacity onPress={() => handleUsePrompt(item.prompt.id)}>
        <Layout style={styles.promptHeader}>
          <Text style={styles.promptEmoji}>{item.prompt.emoji}</Text>
          <Layout style={styles.promptInfo}>
            <Text category="s2" style={styles.promptTitle}>
              {item.prompt.title}
            </Text>
            <Text category="c1" appearance="hint">
              {item.prompt.description}
            </Text>
          </Layout>
          <Layout style={styles.trendingBadge}>
            <TrendingUp size={12} color="#FF4D4D" />
            <Text category="c2" style={styles.trendingScore}>
              {item.trendScore}
            </Text>
          </Layout>
        </Layout>
        
        <Layout style={styles.promptStats}>
          <Text category="c1" appearance="hint">
            {item.participantCount} participants • {formatCompletionRate(item.completionRate)}
          </Text>
        </Layout>
      </TouchableOpacity>
    </Card>
  );

  const renderSuggestedUser = ({ item }: { item: SuggestedUser }) => (
    <Card style={styles.userCard}>
      <Layout style={styles.userHeader}>
        <Layout style={styles.userInfo}>
          <Layout style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{item.avatar || '👤'}</Text>
          </Layout>
          <Layout style={styles.userDetails}>
            <Text category="s2" style={styles.username}>
              {item.username}
            </Text>
            <Text category="c1" appearance="hint">
              {getSuggestionReasonText(item.suggestionReason)}
            </Text>
            {item.mutualFriends.length > 0 && (
              <Text category="c2" appearance="hint">
                {item.mutualFriends.length} mutual friends
              </Text>
            )}
            {item.distance && (
              <Text category="c2" appearance="hint">
                {formatDistance(item.distance)}
              </Text>
            )}
          </Layout>
        </Layout>
        
        <Button
          size="small"
          appearance="outline"
          onPress={() => handleUserSuggestion(item.userId)}
          accessoryLeft={(props) => <UserPlus {...props} size={16} />}
        >
          Connect
        </Button>
      </Layout>
    </Card>
  );

  const renderPopularChain = ({ item }: { item: PopularChain }) => (
    <Card style={styles.chainCard}>
      <Layout style={styles.chainHeader}>
        <Layout style={styles.chainInfo}>
          <Text style={styles.chainEmoji}>{item.prompt.emoji}</Text>
          <Layout style={styles.chainDetails}>
            <Text category="s2" style={styles.chainTitle}>
              {item.prompt.title}
            </Text>
            <Text category="c1" appearance="hint">
              by {item.creator}
            </Text>
            <Text category="c1" appearance="hint">
              {item.prompt.description}
            </Text>
          </Layout>
        </Layout>
        
        <Layout style={styles.chainMeta}>
          <Star size={14} color="#FFD93D" />
          <Text category="c2" style={styles.chainRating}>
            {formatCompletionRate(item.completionRate)}
          </Text>
        </Layout>
      </Layout>

      <Layout style={styles.chainStats}>
        <Layout style={styles.chainStat}>
          <Users size={14} color="#666666" />
          <Text category="c1" style={styles.chainStatText}>
            {item.participantCount} participants
          </Text>
        </Layout>
        <Layout style={styles.chainStat}>
          <Clock size={14} color="#666666" />
          <Text category="c1" style={styles.chainStatText}>
            ~{item.averageResponseTime}m avg
          </Text>
        </Layout>
      </Layout>

      <Layout style={styles.chainTags}>
        {item.tags.slice(0, 3).map((tag, index) => (
          <Layout key={index} style={styles.tag}>
            <Text category="c2" style={styles.tagText}>
              #{tag}
            </Text>
          </Layout>
        ))}
      </Layout>

      <Button
        size="small"
        status={item.isJoinable ? 'primary' : 'basic'}
        disabled={!item.isJoinable}
        onPress={() => handleJoinChain(item.chainId)}
      >
        {item.isJoinable ? 'Join Chain' : 'Chain Full'}
      </Button>
    </Card>
  );

  const renderNearbyUser = ({ item }: { item: NearbyUser }) => (
    <Card style={styles.nearbyCard}>
      <Layout style={styles.nearbyHeader}>
        <Layout style={styles.nearbyInfo}>
          <Layout style={styles.nearbyAvatar}>
            <Text style={styles.nearbyAvatarText}>{item.avatar || '👤'}</Text>
          </Layout>
          <Layout style={styles.nearbyDetails}>
            <Text category="s2" style={styles.nearbyUsername}>
              {item.username}
            </Text>
            <Layout style={styles.nearbyMeta}>
              <MapPin size={12} color="#666666" />
              <Text category="c1" style={styles.nearbyDistance}>
                {formatDistance(item.distance)}
              </Text>
            </Layout>
            <Text category="c2" appearance="hint">
              Active {new Date(item.lastSeen).toLocaleTimeString()}
            </Text>
          </Layout>
        </Layout>
        
        <Button
          size="tiny"
          appearance="ghost"
          onPress={() => handleUserSuggestion(item.userId)}
        >
          Connect
        </Button>
      </Layout>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Layout style={styles.loadingContainer}>
          <Spinner size="large" />
          <Text category="s1" style={styles.loadingText}>
            Discovering amazing chains...
          </Text>
        </Layout>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Layout style={styles.container}>
        {/* Header */}
        <Layout style={styles.header}>
          <Text category="h5" style={styles.headerTitle}>
            Discover
          </Text>
          <Text category="s1" appearance="hint" style={styles.headerSubtitle}>
            Find new chains and connect with friends
          </Text>
        </Layout>

        {/* Search Bar */}
        <Layout style={styles.searchSection}>
          <Input
            style={styles.searchInput}
            placeholder="Search prompts, people, or chains..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            accessoryLeft={(props) => <Search {...props} size={20} />}
            accessoryRight={(props) => (
              <TouchableOpacity onPress={() => console.log('Open filters')}>
                <Filter {...props} size={20} />
              </TouchableOpacity>
            )}
          />
        </Layout>

        {/* Tab Navigation */}
        <Layout style={styles.tabSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Layout style={styles.tabContainer}>
              {[
                { key: 'trending', label: 'Trending', icon: TrendingUp },
                { key: 'people', label: 'People', icon: Users },
                { key: 'chains', label: 'Chains', icon: Star },
                { key: 'nearby', label: 'Nearby', icon: MapPin },
              ].map(({ key, label, icon: Icon }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.tab,
                    activeTab === key && styles.activeTab
                  ]}
                  onPress={() => setActiveTab(key as any)}
                >
                  <Icon size={16} color={activeTab === key ? '#FF4D4D' : '#666666'} />
                  <Text
                    category="s2"
                    style={[
                      styles.tabText,
                      activeTab === key && styles.activeTabText
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </Layout>
          </ScrollView>
        </Layout>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'trending' && discoveryData?.trendingPrompts && (
            <FlatList
              data={discoveryData.trendingPrompts}
              renderItem={renderTrendingPrompt}
              keyExtractor={(item) => item.prompt.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <Layout style={styles.separator} />}
            />
          )}

          {activeTab === 'people' && discoveryData?.suggestedUsers && (
            <FlatList
              data={discoveryData.suggestedUsers}
              renderItem={renderSuggestedUser}
              keyExtractor={(item) => item.userId}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <Layout style={styles.separator} />}
            />
          )}

          {activeTab === 'chains' && discoveryData?.popularChains && (
            <FlatList
              data={discoveryData.popularChains}
              renderItem={renderPopularChain}
              keyExtractor={(item) => item.chainId}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <Layout style={styles.separator} />}
            />
          )}

          {activeTab === 'nearby' && discoveryData?.nearbyUsers && (
            <FlatList
              data={discoveryData.nearbyUsers}
              renderItem={renderNearbyUser}
              keyExtractor={(item) => item.userId}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <Layout style={styles.separator} />}
            />
          )}
        </ScrollView>
      </Layout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerSubtitle: {
    marginTop: 4,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
  },
  tabSection: {
    paddingBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    backgroundColor: '#FFE8E8',
  },
  tabText: {
    marginLeft: 6,
    color: '#666666',
  },
  activeTabText: {
    color: '#FF4D4D',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  separator: {
    height: 12,
  },
  trendingCard: {
    padding: 16,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  promptEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  promptInfo: {
    flex: 1,
  },
  promptTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendingScore: {
    marginLeft: 4,
    color: '#FF4D4D',
    fontWeight: '600',
    fontSize: 11,
  },
  promptStats: {
    marginTop: 8,
  },
  userCard: {
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontWeight: '600',
    marginBottom: 2,
  },
  chainCard: {
    padding: 16,
  },
  chainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  chainInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  chainEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  chainDetails: {
    flex: 1,
  },
  chainTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  chainMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chainRating: {
    marginLeft: 4,
    color: '#FFD93D',
    fontWeight: '600',
    fontSize: 11,
  },
  chainStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chainStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  chainStatText: {
    marginLeft: 4,
    fontSize: 12,
  },
  chainTags: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#666666',
  },
  nearbyCard: {
    padding: 12,
  },
  nearbyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nearbyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nearbyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  nearbyAvatarText: {
    fontSize: 14,
  },
  nearbyDetails: {
    flex: 1,
  },
  nearbyUsername: {
    fontWeight: '600',
    marginBottom: 2,
    fontSize: 14,
  },
  nearbyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  nearbyDistance: {
    marginLeft: 4,
    fontSize: 11,
  },
});