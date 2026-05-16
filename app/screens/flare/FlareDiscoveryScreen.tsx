import React, { useState, useEffect } from 'react';
import { Layout, Text, Card, Button, Input, Spinner } from '@ui-kitten/components';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, TrendingUp, Users, MapPin, Filter, Star, Clock, UserPlus } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { discoveryService } from '../../services/discoveryService';
import { promptService } from '../../services/promptService';
import { sendFriendRequest } from '../../services/firebaseService';
import { DiscoveryData, TrendingPrompt, SuggestedUser, PopularChain, NearbyUser, SearchFilters, UserSearchResult, ChainSearchResult, ChainPrompt } from '../../types';
import { PromptCategoryType } from '../../types/flare';

export const FlareDiscoveryScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'people' | 'chains' | 'nearby'>('trending');
  const [searchMode, setSearchMode] = useState<'trending' | 'people' | 'chains' | 'nearby' | null>(null);
  const [searching, setSearching] = useState(false);
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [searchPromptResults, setSearchPromptResults] = useState<ChainPrompt[]>([]);
  const [searchUserResults, setSearchUserResults] = useState<UserSearchResult[]>([]);
  const [searchChainResults, setSearchChainResults] = useState<ChainSearchResult[]>([]);
  const [searchNearbyResults, setSearchNearbyResults] = useState<NearbyUser[]>([]);
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);
  const [selectedChainCategory, setSelectedChainCategory] = useState<PromptCategoryType | undefined>(undefined);

  const currentUserId = user?.id;
  const tabs: Array<{
    key: 'trending' | 'people' | 'chains' | 'nearby';
    label: string;
    icon: typeof TrendingUp;
  }> = [
    { key: 'trending', label: 'Trending', icon: TrendingUp },
    { key: 'people', label: 'People', icon: Users },
    { key: 'chains', label: 'Chains', icon: Star },
    { key: 'nearby', label: 'Nearby', icon: MapPin },
  ];
  const chainCategoryOptions = ['all', ...Object.values(PromptCategoryType)] as const;
  const userLevelFilters = ['beginner', 'intermediate', 'expert'] as const;
  const responseTimeFilters = ['fast', 'medium', 'relaxed'] as const;

  useEffect(() => {
    if (currentUserId) {
      loadDiscoveryData();
    } else {
      setDiscoveryData(null);
      setLoading(false);
    }
  }, [currentUserId]);

  const loadDiscoveryData = async () => {
    try {
      setLoading(true);
      if (!currentUserId) return;
      const data = await discoveryService.getDiscoveryData(currentUserId);
      setDiscoveryData(data);
    } catch (error) {
      console.error('Error loading discovery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearchResultState = () => {
    setSearchPromptResults([]);
    setSearchUserResults([]);
    setSearchChainResults([]);
    setSearchNearbyResults([]);
  };

  const buildSearchFilters = (tab: 'trending' | 'people' | 'chains' | 'nearby', filters?: SearchFilters) => {
    const baseFilters = { ...searchFilters, ...(filters || {}) };
    if (tab === 'chains' && selectedChainCategory) {
      baseFilters.category = selectedChainCategory;
    }

    return baseFilters;
  };

  const runSearch = async (query: string, tab: 'trending' | 'people' | 'chains' | 'nearby', filters?: SearchFilters) => {
    const normalizedQuery = query.trim();
    if (!discoveryData) return;

    const searchContextFilters = buildSearchFilters(tab, filters);

    setSearching(true);
    setSearchMode(tab);
    clearSearchResultState();

    try {
      if (tab === 'trending') {
        const promptResults = await promptService.searchPrompts(normalizedQuery);
        const categoryFilteredResults = searchContextFilters.category
          ? promptResults.filter((prompt) => prompt.category === searchContextFilters.category)
          : promptResults;
        setSearchPromptResults(categoryFilteredResults);
      }

      if (tab === 'people') {
        const userResults = await discoveryService.searchUsers(normalizedQuery, searchContextFilters, 20);
        setSearchUserResults(userResults);
      }

      if (tab === 'chains') {
        const chainResults = await discoveryService.searchChains(normalizedQuery, searchContextFilters, 20);
        setSearchChainResults(chainResults);
      }

      if (tab === 'nearby') {
        const lowerQuery = normalizedQuery.toLowerCase();
        const nearbyUsers = discoveryData.nearbyUsers.filter((nearbyUser) =>
          nearbyUser.username.toLowerCase().includes(lowerQuery)
        );
        setSearchNearbyResults(nearbyUsers);
      }
    } catch (error) {
      console.error('Error searching:', error);
      throw error;
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchMode(null);
      clearSearchResultState();
      return;
    }
    if (!discoveryData) return;

    try {
      await runSearch(searchQuery, activeTab);
    } catch (error) {
      console.error('Error searching:', error);
      Alert.alert('Search failed', 'Unable to run that search right now.');
    }
  };

  const setChainCategoryFilter = (category: PromptCategoryType | undefined) => {
    const nextCategory = selectedChainCategory === category ? undefined : category;
    setSelectedChainCategory(nextCategory);

    const filters = {
      ...searchFilters,
      category: nextCategory,
    };

    setSearchFilters(filters);
    if (searchMode === 'chains' && searchQuery.trim()) {
      runSearch(searchQuery, activeTab, filters).catch(() => {
        Alert.alert('Search failed', 'Unable to refresh chain search with new filters.');
      });
    }
  };

  const setPeopleFilter = (filter: Partial<SearchFilters>) => {
    const nextFilters = { ...searchFilters, ...filter };
    Object.entries(nextFilters).forEach(([key]) => {
      const castKey = key as keyof SearchFilters;
      const providedValue = filter[castKey];
      if (providedValue === undefined) {
        delete nextFilters[castKey];
      }
    });

    setSearchFilters(nextFilters);

    if (searchMode === activeTab && searchQuery.trim()) {
      runSearch(searchQuery, activeTab, nextFilters).catch(() => {
        Alert.alert('Search failed', 'Unable to refresh search with new filters.');
      });
    }
  };

  const toggleFilterValue = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K] extends undefined ? never : NonNullable<SearchFilters[K]>
  ) => {
    const normalizedValue = searchFilters[key] === value ? undefined : value;
    const nextFilters: Partial<SearchFilters> = { [key]: normalizedValue };
    setPeopleFilter(nextFilters);
  };

  const handleUserSuggestion = async (userId: string, username: string) => {
    if (!currentUserId) {
      Alert.alert('Sign in required', 'You need to be signed in to connect with people.');
      return;
    }

    try {
      setConnectingUserId(userId);
      await sendFriendRequest(currentUserId, username);
      Alert.alert('Friend request sent', `Request sent to ${username}`);
    } catch (error) {
      Alert.alert('Connection failed', error instanceof Error ? error.message : 'Unable to send request');
    } finally {
      setConnectingUserId(null);
    }
  };

  const handleJoinChain = async (chainId: string) => {
    if (!currentUserId) {
      Alert.alert('Sign in required', 'You need to be signed in to join chains.');
      return;
    }

    const canJoin = await discoveryService.canUserJoinChain(currentUserId, chainId);
    if (!canJoin) {
      Alert.alert('Unable to join', 'You cannot join this chain at the moment.');
      return;
    }

    navigation.navigate('FlareChainView' as never, { chainId } as never);
  };

  const handleUsePrompt = (promptId: string) => {
    navigation.navigate('FlareCreation' as never, { prompt: { id: promptId } } as never);
  };

  const clearSearchResults = () => {
    setSearchMode(null);
    setSearchQuery('');
    setSearchPromptResults([]);
    setSearchUserResults([]);
    setSearchChainResults([]);
    setSearchNearbyResults([]);
    setShowSearchFilters(false);
  };

  const switchTab = (tab: 'trending' | 'people' | 'chains' | 'nearby') => {
    setActiveTab(tab);
    clearSearchResults();
  };

  const isSearchResultActive = (tab: 'trending' | 'people' | 'chains' | 'nearby') => searchMode === tab;

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

  const renderPromptSearchResult = ({ item }: { item: ChainPrompt }) => (
    <Card style={styles.searchResultCard}>
      <TouchableOpacity onPress={() => handleUsePrompt(item.id)}>
        <Layout style={styles.promptHeader}>
          <Text style={styles.promptEmoji}>{item.emoji || '💬'}</Text>
          <Layout style={styles.promptInfo}>
            <Text category="s2" style={styles.promptTitle}>
              {item.title}
            </Text>
            <Text category="c1" appearance="hint" numberOfLines={2}>
              {item.description}
            </Text>
          </Layout>
        </Layout>

        <Layout style={styles.promptStats}>
          <Text category="c1" appearance="hint">
            {item.popularity} people
          </Text>
        </Layout>
      </TouchableOpacity>
    </Card>
  );

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
          onPress={() => handleUserSuggestion(item.userId, item.username)}
          disabled={connectingUserId === item.userId}
          accessoryLeft={(props) => <UserPlus {...props} size={16} />}
        >
          {connectingUserId === item.userId ? 'Sending' : 'Connect'}
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
          onPress={() => handleUserSuggestion(item.userId, item.username)}
          disabled={connectingUserId === item.userId}
        >
          {connectingUserId === item.userId ? 'Sending' : 'Connect'}
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
            onChangeText={(value) => {
              if (!value.trim()) {
                setSearchMode(null);
                clearSearchResultState();
              }
              setSearchQuery(value);
            }}
            onSubmitEditing={handleSearch}
            accessoryLeft={(props) => <Search {...props} size={20} />}
            accessoryRight={(props) => (
              <TouchableOpacity onPress={() => setShowSearchFilters((prev) => !prev)}>
                <Filter {...props} size={20} />
              </TouchableOpacity>
            )}
          />
          {searching ? <Text category="c1" appearance="hint">Searching…</Text> : null}
        </Layout>

        {showSearchFilters && activeTab !== 'nearby' && (
          <Layout style={styles.filterPanel}>
            {activeTab === 'chains' && (
              <Layout style={styles.filterSection}>
                <Text category="s2" style={styles.filterLabel}>
                  Category
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {chainCategoryOptions.map((category) => {
                    const isActive =
                      category === 'all'
                        ? selectedChainCategory === undefined
                        : selectedChainCategory === category;
                    return (
                      <TouchableOpacity
                        key={category}
                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                        onPress={() =>
                          setChainCategoryFilter(
                            category === 'all' ? undefined : category
                          )
                        }
                      >
                        <Text
                          category="c2"
                          style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </Layout>
            )}

            {activeTab === 'trending' && (
              <Layout style={styles.filterSection}>
                <Text category="s2" style={styles.filterLabel}>
                  Filter by category
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {chainCategoryOptions.map((category) => {
                    const isActive =
                      category === 'all'
                        ? searchFilters.category === undefined
                        : searchFilters.category === category;
                    return (
                      <TouchableOpacity
                        key={`trend-${category}`}
                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                        onPress={() =>
                          setPeopleFilter({
                            category: category === 'all' ? undefined : category,
                          })
                        }
                      >
                        <Text
                          category="c2"
                          style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </Layout>
            )}

            {activeTab === 'people' && (
              <Layout style={styles.filterSection}>
                <Text category="s2" style={styles.filterLabel}>
                  People filters
                </Text>
                <Layout style={styles.filterRow}>
                  {userLevelFilters.map((level) => {
                    const isActive = searchFilters.userLevel === level;
                    return (
                      <TouchableOpacity
                        key={`level-${level}`}
                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                        onPress={() => toggleFilterValue('userLevel', level)}
                      >
                        <Text
                          category="c2"
                          style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {responseTimeFilters.map((time) => {
                    const isActive = searchFilters.responseTime === time;
                    return (
                      <TouchableOpacity
                        key={`response-${time}`}
                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                        onPress={() => toggleFilterValue('responseTime', time)}
                      >
                        <Text
                          category="c2"
                          style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </Layout>
              </Layout>
            )}
          </Layout>
        )}

        {/* Tab Navigation */}
        <Layout style={styles.tabSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Layout style={styles.tabContainer}>
              {tabs.map(({ key, label, icon: Icon }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.tab,
                    activeTab === key && styles.activeTab
                  ]}
                  onPress={() => switchTab(key)}
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
          {activeTab === 'trending' && (
            <Layout>
              {isSearchResultActive('trending') ? (
                <>
                  {searchPromptResults.length > 0 ? (
                    <FlatList
                      data={searchPromptResults}
                      renderItem={renderPromptSearchResult}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                      ItemSeparatorComponent={() => <Layout style={styles.separator} />}
                    />
                  ) : (
                    <Text category="s1" appearance="hint" style={styles.emptyText}>
                      No matching prompts
                    </Text>
                  )}
                </>
              ) : (
                <FlatList
                  data={discoveryData?.trendingPrompts || []}
                  renderItem={renderTrendingPrompt}
                  keyExtractor={(item) => item.prompt.id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <Layout style={styles.separator} />}
                />
              )}
            </Layout>
          )}

          {activeTab === 'people' && (
            <Layout>
              {isSearchResultActive('people') ? (
                <>
                  {searchUserResults.length > 0 ? (
                    <FlatList
                      data={searchUserResults}
                      renderItem={({ item }) => (
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
                                  {item.statistics.chainsCompleted} chains completed
                                </Text>
                                <Text category="c2" appearance="hint">
                                  {item.isOnline ? 'Online' : 'Offline'}
                                </Text>
                              </Layout>
                            </Layout>
                            
                            <Button
                              size="small"
                              appearance="outline"
                              onPress={() => handleUserSuggestion(item.userId, item.username)}
                              disabled={connectingUserId === item.userId}
                              accessoryLeft={(props) => <UserPlus {...props} size={16} />}
                            >
                              {connectingUserId === item.userId ? 'Sending' : 'Connect'}
                            </Button>
                          </Layout>
                        </Card>
                      )}
                      keyExtractor={(item) => item.userId}
                      scrollEnabled={false}
                      ItemSeparatorComponent={() => <Layout style={styles.separator} />}
                    />
                  ) : (
                    <Text category="s1" appearance="hint" style={styles.emptyText}>
                      No matching users
                    </Text>
                  )}
                </>
              ) : (
                <FlatList
                  data={discoveryData?.suggestedUsers || []}
                  renderItem={renderSuggestedUser}
                  keyExtractor={(item) => item.userId}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <Layout style={styles.separator} />}
                />
              )}
            </Layout>
          )}

          {activeTab === 'chains' && (
            <Layout>
              {isSearchResultActive('chains') ? (
                <>
                      {searchChainResults.length > 0 ? (
                      <FlatList
                      data={searchChainResults}
                      renderItem={({ item }) => (
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
                                <Text category="c2" appearance="hint">
                                  {item.spotsAvailable} spots left
                                </Text>
                                {!!item.tags.length && (
                                  <Text category="c2" appearance="hint">
                                    {item.tags.join(', ')}
                                  </Text>
                                )}
                              </Layout>
                            </Layout>
                          </Layout>

                          <Button
                            size="small"
                            status={item.status === 'active' ? 'primary' : 'basic'}
                            disabled={item.status !== 'active'}
                            onPress={() => handleJoinChain(item.chainId)}
                          >
                            {item.status === 'active' ? 'Join Chain' : 'Join request unavailable'}
                          </Button>
                        </Card>
                      )}
                      keyExtractor={(item) => item.chainId}
                      scrollEnabled={false}
                      ItemSeparatorComponent={() => <Layout style={styles.separator} />}
                    />
                  ) : (
                    <Text category="s1" appearance="hint" style={styles.emptyText}>
                      No matching chains
                    </Text>
                  )}
                </>
              ) : (
                <FlatList
                  data={discoveryData?.popularChains || []}
                  renderItem={renderPopularChain}
                  keyExtractor={(item) => item.chainId}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <Layout style={styles.separator} />}
                />
              )}
            </Layout>
          )}

          {activeTab === 'nearby' && (
            <Layout>
              {isSearchResultActive('nearby') ? (
                <>
                  {searchNearbyResults.length > 0 ? (
                    <FlatList
                      data={searchNearbyResults}
                      renderItem={renderNearbyUser}
                      keyExtractor={(item) => item.userId}
                      scrollEnabled={false}
                      ItemSeparatorComponent={() => <Layout style={styles.separator} />}
                    />
                  ) : (
                    <Text category="s1" appearance="hint" style={styles.emptyText}>
                      No matching users nearby
                    </Text>
                  )}
                </>
              ) : (
                <FlatList
                  data={discoveryData?.nearbyUsers || []}
                  renderItem={renderNearbyUser}
                  keyExtractor={(item) => item.userId}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <Layout style={styles.separator} />}
                />
              )}
            </Layout>
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
  filterPanel: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    color: '#444444',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  filterChipActive: {
    backgroundColor: '#FF4D4D',
  },
  filterChipText: {
    color: '#444444',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  searchResultCard: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
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
