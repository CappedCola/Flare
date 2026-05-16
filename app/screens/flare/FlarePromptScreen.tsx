import { useEffect, useState } from 'react';
import { Layout, Text, Card, Button, Spinner, Input, Modal } from '@ui-kitten/components';
import { StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Calendar, Heart, TrendingUp, Plus, Search, Clock, Star, X } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { usePrompts } from '../../hooks/usePrompts';
import { ChainPrompt, CustomPromptData, DailyPrompt } from '../../types';
import { PromptCategoryType } from '../../types/flare';
import { promptService } from '../../services/promptService';

export const FlarePromptScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    categories,
    trendingPrompts,
    loading,
    error,
    getTodaysPrompt,
    createCustomPrompt,
  } = usePrompts();
  const [todaysPrompt, setTodaysPrompt] = useState<DailyPrompt | null>(null);
  const [activeTab, setActiveTab] = useState<'trending' | 'categories' | 'favorites' | 'custom'>('trending');
  const [favoritePrompts, setFavoritePrompts] = useState<ChainPrompt[]>([]);
  const [customPrompts, setCustomPrompts] = useState<CustomPromptData[]>([]);
  const [personalizedPrompts, setPersonalizedPrompts] = useState<ChainPrompt[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [newPromptDescription, setNewPromptDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategoryType | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [searchResults, setSearchResults] = useState<ChainPrompt[]>([]);
  const [searchMode, setSearchMode] = useState(false);
  const [searchTitle, setSearchTitle] = useState('Search Results');
  const [isSearching, setIsSearching] = useState(false);
  const [newPromptTagsInput, setNewPromptTagsInput] = useState('');

  const tabs: Array<{
    key: 'trending' | 'categories' | 'favorites' | 'custom';
    label: string;
    icon: typeof Calendar;
  }> = [
    { key: 'trending', label: 'Recommended', icon: TrendingUp },
    { key: 'categories', label: 'Categories', icon: Calendar },
    { key: 'favorites', label: 'Favorites', icon: Heart },
    { key: 'custom', label: 'Community', icon: Plus },
  ];

  const currentUserId = user?.id;

  useEffect(() => {
    loadTodaysPrompt();
    loadCustomPrompts();
    loadPersonalizedPrompts();
    if (currentUserId) {
      loadFavoritePrompts(currentUserId);
    } else {
      setFavoritePrompts([]);
    }
  }, [currentUserId]);

  const loadTodaysPrompt = async () => {
    const prompt = await getTodaysPrompt();
    setTodaysPrompt(prompt);
  };

  const loadFavoritePrompts = async (userId: string) => {
    try {
      const favorites = await promptService.getUserFavorites(userId);
      setFavoritePrompts(favorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadCustomPrompts = async () => {
    try {
      const custom = await promptService.getCustomPrompts();
      setCustomPrompts(custom);
    } catch (error) {
      console.error('Error loading custom prompts:', error);
    }
  };

  const loadPersonalizedPrompts = async () => {
    try {
      if (!currentUserId) {
        setPersonalizedPrompts([]);
        return;
      }

      const personalized = await promptService.getPersonalizedRecommendations(currentUserId, 8);
      setPersonalizedPrompts(personalized);
    } catch (error) {
      console.error('Error loading personalized prompts:', error);
    }
  };

  const handleSelectPrompt = async (prompt: ChainPrompt | DailyPrompt) => {
    if (currentUserId) {
      await promptService.recordPromptUsage(currentUserId, prompt.id);
    }

    navigation.navigate('FlareCreation' as never, { prompt } as never);
  };

  const handleToggleFavorite = async (prompt: ChainPrompt) => {
    if (!currentUserId) {
      Alert.alert('Sign in required', 'Sign in to save prompts to favorites.');
      return;
    }

    try {
      const isFavorite = favoritePrompts.some(f => f.id === prompt.id);
      
      if (isFavorite) {
        await promptService.removeFromFavorites(currentUserId, prompt.id);
        setFavoritePrompts(prev => prev.filter(f => f.id !== prompt.id));
        Alert.alert('Removed', 'Prompt removed from favorites');
      } else {
        await promptService.addToFavorites(currentUserId, prompt.id);
        setFavoritePrompts(prev => [...prev, prompt]);
        Alert.alert('Added', 'Prompt added to favorites');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleCreateCustomPrompt = async () => {
    if (!newPromptTitle.trim() || !newPromptDescription.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!currentUserId) {
      Alert.alert('Sign in required', 'Sign in to create custom prompts.');
      return;
    }
    
    try {
      setIsCreatingPrompt(true);
      const customPrompt = await createCustomPrompt(
        newPromptTitle,
        newPromptDescription,
        selectedCategory,
        parseTagsInput(newPromptTagsInput),
      );
      
      setCustomPrompts(prev => [customPrompt, ...prev]);
      setShowCreateModal(false);
      setNewPromptTitle('');
      setNewPromptDescription('');
      setNewPromptTagsInput('');
      setSelectedCategory(undefined);
      
      Alert.alert(
        'Prompt Created!', 
        'Your custom prompt has been submitted for review. It will be available after moderation.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create custom prompt');
    } finally {
      setIsCreatingPrompt(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchMode(false);
      return;
    }

    try {
      setIsSearching(true);
      const searchResults = await promptService.searchPrompts(searchQuery);
      setSearchResults(searchResults);
      setSearchTitle(`Search results for "${searchQuery}"`);
      setSearchMode(true);
    } catch (error) {
      Alert.alert('Error', 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const parseTagsInput = (value: string): string[] =>
    value
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0)
      .slice(0, 8);

  const handleBrowseCategory = async (categoryType: PromptCategoryType) => {
    try {
      const categoryPrompts = await promptService.getPromptsByCategory(categoryType);
      const categoryName = categories.find((category) => category.type === categoryType)?.name ?? 'Category';
      setSearchResults(categoryPrompts);
      setSearchTitle(`${categoryName} prompts`);
      setSearchMode(true);
      setSearchQuery(categoryName);
    } catch (err) {
      Alert.alert('Error', 'Failed to load category prompts');
    }
  };

  const clearSearchMode = () => {
    setSearchMode(false);
    setSearchResults([]);
    setSearchTitle('Search Results');
    setSearchQuery('');
  };

  const isPromptFavorite = (promptId: string) => favoritePrompts.some((item) => item.id === promptId);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Layout style={styles.loadingContainer}>
          <Spinner size="large" />
          <Text category="s1" style={styles.loadingText}>
            Loading prompts...
          </Text>
        </Layout>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Layout style={styles.errorContainer}>
          <Text category="h6" style={styles.errorText}>
            Failed to load prompts
          </Text>
          <Text category="s1" appearance="hint">
            {error}
          </Text>
        </Layout>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Layout style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Layout style={styles.header}>
            <Text category="h4" style={styles.title}>Choose a Prompt</Text>
            <Text category="s1" appearance="hint" style={styles.subtitle}>
              Pick a theme for your chain
            </Text>
          </Layout>

          {/* Today's Special */}
          {todaysPrompt && (
            <Layout style={styles.section}>
              <Text category="h6" style={styles.sectionTitle}>Today's Special</Text>
              <Card
                style={[styles.specialCard, { borderTopColor: '#FF4D4D' }]}
                onPress={() => handleSelectPrompt(todaysPrompt)}
              >
                <Layout style={styles.specialContent}>
                  <Layout style={styles.specialHeader}>
                    <Layout style={styles.specialIcon}>
                      <Text style={styles.specialEmoji}>{todaysPrompt.emoji}</Text>
                    </Layout>
                    <Layout style={styles.specialText}>
                      <Text category="h6" style={styles.specialTitle}>
                        {todaysPrompt.theme}
                      </Text>
                      <Text category="c1" appearance="hint">
                        {todaysPrompt.title}
                      </Text>
                    </Layout>
                    <Layout style={styles.specialBadge}>
                      <Clock size={16} color="#FF4D4D" />
                    </Layout>
                  </Layout>
                  <Text category="s1" style={styles.promptText}>
                    "{todaysPrompt.description}"
                  </Text>
                </Layout>
              </Card>
            </Layout>
          )}

          {/* Trending Prompts */}
          {trendingPrompts.length > 0 && (
            <Layout style={styles.section}>
              <Text category="h6" style={styles.sectionTitle}>Trending This Week</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
                {trendingPrompts.slice(0, 5).map((prompt) => (
                  <Card
                    key={prompt.id}
                    style={styles.trendingCard}
                    onPress={() => handleSelectPrompt(prompt)}
                  >
                    <Layout style={styles.trendingContent}>
                      <Text style={styles.trendingEmoji}>{prompt.emoji}</Text>
                      <Text category="s2" style={styles.trendingTitle}>
                        {prompt.title}
                      </Text>
                      <Text category="c2" appearance="hint" style={styles.trendingPop}>
                        {prompt.popularity} users
                      </Text>
                    </Layout>
                  </Card>
                ))}
              </ScrollView>
            </Layout>
          )}

          {/* Prompt Categories */}
          <Layout style={styles.section}>
            <Text category="h6" style={styles.sectionTitle}>Browse Categories</Text>
            {categories.map((category) => {
              return (
                <Card
                  key={category.id}
                  style={[styles.categoryCard, { borderLeftColor: category.color }]}
                  onPress={() => handleBrowseCategory(category.type)}
                >
                  <Layout style={styles.categoryContent}>
                    <Layout style={styles.categoryHeader}>
                      <Layout style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
                        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      </Layout>
                      <Layout style={styles.categoryText}>
                        <Text category="h6" style={styles.categoryTitle}>
                          {category.name}
                        </Text>
                        <Text category="c1" appearance="hint">
                          {category.description}
                        </Text>
                      </Layout>
                      <Layout style={styles.categoryCount}>
                        <Text category="c2" appearance="hint">
                          {category.promptCount} prompts
                        </Text>
                      </Layout>
                    </Layout>
                  </Layout>
                </Card>
              );
            })}
          </Layout>

          {/* Search Bar */}
          <Layout style={styles.section}>
            <Input
              style={styles.searchInput}
              placeholder="Search prompts..."
              value={searchQuery}
              onChangeText={(value) => {
                if (!value.trim()) {
                  setSearchResults([]);
                  setSearchMode(false);
                }
                setSearchQuery(value);
              }}
              onSubmitEditing={handleSearch}
              accessoryLeft={(props) => <Search {...props} size={20} />}
              accessoryRight={(props) => (
                <TouchableOpacity onPress={handleSearch}>
                  <Search {...props} size={20} />
                </TouchableOpacity>
              )}
            />
            {isSearching ? (
              <Layout style={styles.searchBusyState}>
                <Text category="c1" appearance="hint">
                  Searching...
                </Text>
              </Layout>
            ) : null}
          </Layout>

          {searchMode ? (
            <Layout style={styles.section}>
              <Layout style={styles.searchHeader}>
                <Text category="h6" style={styles.sectionTitle}>
                  {searchTitle}
                </Text>
                <TouchableOpacity onPress={clearSearchMode}>
                  <Text category="s2" style={styles.clearSearchText}>
                    Clear
                  </Text>
                </TouchableOpacity>
              </Layout>

              {searchResults.length > 0 ? (
                <Layout style={styles.searchResultContainer}>
                  {searchResults.map((prompt) => (
                    <Card
                      key={prompt.id}
                      style={styles.searchResultCard}
                      onPress={() => handleSelectPrompt(prompt)}
                    >
                      <Layout style={styles.searchResultContent}>
                        <Layout style={styles.searchResultHeader}>
                          <Text style={styles.searchResultEmoji}>{prompt.emoji || '💭'}</Text>
                          <TouchableOpacity
                            style={styles.favoriteButton}
                            onPress={() => handleToggleFavorite(prompt)}
                          >
                            <Heart
                              size={14}
                              color={isPromptFavorite(prompt.id) ? '#FF4D4D' : '#CCCCCC'}
                              fill={isPromptFavorite(prompt.id) ? '#FF4D4D' : 'transparent'}
                            />
                          </TouchableOpacity>
                        </Layout>
                        <Text category="s2" style={styles.searchResultTitle}>
                          {prompt.title}
                        </Text>
                        <Text
                          category="c2"
                          appearance="hint"
                          style={styles.searchResultDescription}
                          numberOfLines={2}
                        >
                          {prompt.description}
                        </Text>
                      </Layout>
                    </Card>
                  ))}
                </Layout>
              ) : (
                <Card style={styles.emptyCard}>
                  <Layout style={styles.emptyContent}>
                    <Text category="s1" style={styles.emptyText}>
                      No prompts found
                    </Text>
                  </Layout>
                </Card>
              )}
            </Layout>
          ) : null}

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
                    onPress={() => setActiveTab(key)}
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

          {/* Tab Content */}
          {activeTab === 'trending' && (
            <Layout style={styles.section}>
              {/* Personalized Recommendations */}
              {personalizedPrompts.length > 0 && (
                <Layout style={styles.subsection}>
                  <Text category="h6" style={styles.sectionTitle}>Just for You</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
                    {personalizedPrompts.map((prompt) => (
                      <Card
                        key={prompt.id}
                        style={styles.recommendedCard}
                        onPress={() => handleSelectPrompt(prompt)}
                      >
                        <Layout style={styles.recommendedContent}>
                          <Layout style={styles.recommendedHeader}>
                            <Text style={styles.recommendedEmoji}>{prompt.emoji}</Text>
                            <TouchableOpacity
                              style={styles.favoriteButton}
                              onPress={() => handleToggleFavorite(prompt)}
                            >
                              <Heart 
                                size={16} 
                                color={favoritePrompts.some(f => f.id === prompt.id) ? '#FF4D4D' : '#CCCCCC'}
                                fill={favoritePrompts.some(f => f.id === prompt.id) ? '#FF4D4D' : 'transparent'}
                              />
                            </TouchableOpacity>
                          </Layout>
                          <Text category="s2" style={styles.recommendedTitle}>
                            {prompt.title}
                          </Text>
                          <Text category="c2" appearance="hint" style={styles.recommendedDescription} numberOfLines={2}>
                            {prompt.description}
                          </Text>
                        </Layout>
                      </Card>
                    ))}
                  </ScrollView>
                </Layout>
              )}

              {/* Trending Prompts */}
              {trendingPrompts.length > 0 && (
                <Layout style={styles.subsection}>
                  <Text category="h6" style={styles.sectionTitle}>Trending This Week</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
                    {trendingPrompts.slice(0, 5).map((prompt) => (
                      <Card
                        key={prompt.id}
                        style={styles.trendingCard}
                        onPress={() => handleSelectPrompt(prompt)}
                      >
                        <Layout style={styles.trendingContent}>
                          <Layout style={styles.trendingHeader}>
                            <Text style={styles.trendingEmoji}>{prompt.emoji}</Text>
                            <TouchableOpacity
                              style={styles.favoriteButton}
                              onPress={() => handleToggleFavorite(prompt)}
                            >
                              <Heart 
                                size={14} 
                                color={favoritePrompts.some(f => f.id === prompt.id) ? '#FF4D4D' : '#CCCCCC'}
                                fill={favoritePrompts.some(f => f.id === prompt.id) ? '#FF4D4D' : 'transparent'}
                              />
                            </TouchableOpacity>
                          </Layout>
                          <Text category="s2" style={styles.trendingTitle}>
                            {prompt.title}
                          </Text>
                          <Text category="c2" appearance="hint" style={styles.trendingPop}>
                            {prompt.popularity} users
                          </Text>
                        </Layout>
                      </Card>
                    ))}
                  </ScrollView>
                </Layout>
              )}
            </Layout>
          )}

          {activeTab === 'categories' && (
              <Layout style={styles.section}>
              <Text category="h6" style={styles.sectionTitle}>Browse Categories</Text>
              {categories.map((category) => {
                return (
                  <Card
                    key={category.id}
                    style={[styles.categoryCard, { borderLeftColor: category.color }]}
                    onPress={() => handleBrowseCategory(category.type)}
                  >
                    <Layout style={styles.categoryContent}>
                      <Layout style={styles.categoryHeader}>
                        <Layout style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
                          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                        </Layout>
                        <Layout style={styles.categoryText}>
                          <Text category="h6" style={styles.categoryTitle}>
                            {category.name}
                          </Text>
                          <Text category="c1" appearance="hint">
                            {category.description}
                          </Text>
                        </Layout>
                        <Layout style={styles.categoryCount}>
                          <Text category="c2" appearance="hint">
                            {category.promptCount} prompts
                          </Text>
                        </Layout>
                      </Layout>
                    </Layout>
                  </Card>
                );
              })}
            </Layout>
          )}

          {activeTab === 'favorites' && (
            <Layout style={styles.section}>
              <Text category="h6" style={styles.sectionTitle}>Your Favorites</Text>
              {favoritePrompts.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Layout style={styles.emptyContent}>
                    <Heart size={48} color="#CCCCCC" />
                    <Text category="s1" style={styles.emptyText}>
                      No favorite prompts yet
                    </Text>
                    <Text category="c1" appearance="hint" style={styles.emptySubtext}>
                      Tap the heart icon to save prompts you love
                    </Text>
                  </Layout>
                </Card>
              ) : (
                favoritePrompts.map((prompt) => (
                  <Card
                    key={prompt.id}
                    style={styles.favoriteCard}
                    onPress={() => handleSelectPrompt(prompt)}
                  >
                    <Layout style={styles.favoriteContent}>
                      <Layout style={styles.favoriteHeader}>
                        <Text style={styles.favoriteEmoji}>{prompt.emoji}</Text>
                        <Layout style={styles.favoriteText}>
                          <Text category="s2" style={styles.favoriteTitle}>
                            {prompt.title}
                          </Text>
                          <Text category="c1" appearance="hint">
                            {prompt.description}
                          </Text>
                        </Layout>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleToggleFavorite(prompt)}
                        >
                          <X size={20} color="#CCCCCC" />
                        </TouchableOpacity>
                      </Layout>
                    </Layout>
                  </Card>
                ))
              )}
            </Layout>
          )}

          {activeTab === 'custom' && (
            <Layout style={styles.section}>
              <Layout style={styles.customHeader}>
                <Text category="h6" style={styles.sectionTitle}>Community Prompts</Text>
                <Button
                  size="small"
                  appearance="outline"
                  onPress={() => setShowCreateModal(true)}
                  accessoryLeft={(props) => <Plus {...props} size={16} />}
                >
                  Create
                </Button>
              </Layout>
              
              {customPrompts.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Layout style={styles.emptyContent}>
                    <Plus size={48} color="#CCCCCC" />
                    <Text category="s1" style={styles.emptyText}>
                      No community prompts yet
                    </Text>
                    <Text category="c1" appearance="hint" style={styles.emptySubtext}>
                      Be the first to create a custom prompt!
                    </Text>
                  </Layout>
                </Card>
              ) : (
                customPrompts.map((prompt) => (
                  <Card
                    key={prompt.id}
                    style={styles.customPromptCard}
                    onPress={() => handleSelectPrompt(prompt)}
                  >
                    <Layout style={styles.customPromptContent}>
                      <Layout style={styles.customPromptHeader}>
                        <Text style={styles.customPromptEmoji}>{prompt.emoji || '💭'}</Text>
                        <Layout style={styles.customPromptText}>
                          <Text category="s2" style={styles.customPromptTitle}>
                            {prompt.title}
                          </Text>
                          <Text category="c1" appearance="hint">
                            by {prompt.createdByUsername}
                          </Text>
                          <Text category="c1" appearance="hint">
                            {prompt.description}
                          </Text>
                        </Layout>
                        <Layout style={styles.customPromptMeta}>
                          <Layout style={styles.ratingContainer}>
                            <Star size={12} color="#FFD93D" fill="#FFD93D" />
                            <Text category="c2" style={styles.ratingText}>
                              {prompt.averageRating.toFixed(1)}
                            </Text>
                          </Layout>
                          <Text category="c2" appearance="hint">
                            {prompt.usageCount} uses
                          </Text>
                        </Layout>
                      </Layout>
                    </Layout>
                  </Card>
                ))
              )}
            </Layout>
          )}

          {/* Create Custom Prompt Modal */}
          <Modal
            visible={showCreateModal}
            backdropStyle={styles.backdrop}
            onBackdropPress={() => setShowCreateModal(false)}
          >
            <Card disabled={true} style={styles.modalCard}>
              <Layout style={styles.modalHeader}>
                <Text category="h6">Create Custom Prompt</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <X size={24} color="#666666" />
                </TouchableOpacity>
              </Layout>
              
              <Layout style={styles.modalContent}>
                <Input
                  style={styles.modalInput}
                  label="Title"
                  placeholder="Enter prompt title..."
                  value={newPromptTitle}
                  onChangeText={setNewPromptTitle}
                  maxLength={50}
                />
                
                <Input
                  style={styles.modalInput}
                  label="Description"
                  placeholder="Describe what people should show..."
                  value={newPromptDescription}
                  onChangeText={setNewPromptDescription}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />

                <Input
                  style={styles.modalInput}
                  label="Tags (optional)"
                  placeholder="Add up to 8 tags separated by commas"
                  value={newPromptTagsInput}
                  onChangeText={setNewPromptTagsInput}
                  maxLength={120}
                />
                
                <Text category="label" style={styles.categoryLabel}>Category (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        selectedCategory === category.type && styles.selectedCategoryChip
                      ]}
                      onPress={() => setSelectedCategory(
                        selectedCategory === category.type ? undefined : category.type
                      )}
                    >
                      <Text style={styles.categoryChipEmoji}>{category.emoji}</Text>
                      <Text 
                        category="c1" 
                        style={[
                          styles.categoryChipText,
                          selectedCategory === category.type && styles.selectedCategoryChipText
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Layout>
              
              <Layout style={styles.modalActions}>
                <Button
                  style={styles.modalButton}
                  appearance="ghost"
                  onPress={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  style={styles.modalButton}
                  status="primary"
                  onPress={handleCreateCustomPrompt}
                  disabled={isCreatingPrompt || !newPromptTitle.trim() || !newPromptDescription.trim()}
                >
                  {isCreatingPrompt ? 'Creating...' : 'Create Prompt'}
                </Button>
              </Layout>
            </Card>
          </Modal>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  // Today's Special Styles
  specialCard: {
    marginVertical: 8,
    borderTopWidth: 4,
  },
  specialContent: {
    padding: 12,
  },
  specialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  specialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  specialEmoji: {
    fontSize: 24,
  },
  specialText: {
    flex: 1,
  },
  specialTitle: {
    marginBottom: 4,
    color: '#FF4D4D',
  },
  specialBadge: {
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  // Trending Styles
  trendingScroll: {
    paddingVertical: 8,
  },
  trendingCard: {
    width: 120,
    marginRight: 12,
  },
  trendingContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  trendingEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  trendingTitle: {
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  trendingPop: {
    textAlign: 'center',
  },
  // Category Styles
  categoryCard: {
    marginVertical: 8,
    borderLeftWidth: 4,
  },
  categoryContent: {
    padding: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryText: {
    flex: 1,
  },
  categoryTitle: {
    marginBottom: 4,
  },
  categoryCount: {
    alignItems: 'flex-end',
  },
  promptText: {
    fontStyle: 'italic',
    marginTop: 8,
  },
  // Search Styles
  searchInput: {
    marginBottom: 8,
  },
  searchBusyState: {
    marginTop: 6,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearSearchText: {
    color: '#FF4D4D',
  },
  searchResultContainer: {
    gap: 8,
  },
  searchResultCard: {
    marginBottom: 8,
  },
  searchResultContent: {
    padding: 12,
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  searchResultEmoji: {
    fontSize: 24,
  },
  searchResultTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  searchResultDescription: {
    textAlign: 'left',
  },
  // Tab Styles
  tabSection: {
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0,
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
  // Subsection Styles
  subsection: {
    marginBottom: 24,
  },
  // Recommended Prompt Styles
  recommendedCard: {
    width: 160,
    marginRight: 12,
  },
  recommendedContent: {
    paddingVertical: 16,
  },
  recommendedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendedEmoji: {
    fontSize: 28,
  },
  recommendedTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendedDescription: {
    textAlign: 'left',
  },
  // Trending Styles Updates
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  removeButton: {
    padding: 4,
  },
  // Favorites Styles
  favoriteCard: {
    marginVertical: 6,
  },
  favoriteContent: {
    padding: 12,
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  favoriteText: {
    flex: 1,
  },
  favoriteTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  // Empty State Styles
  emptyCard: {
    marginVertical: 8,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: 'center',
  },
  // Custom Prompt Styles
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customPromptCard: {
    marginVertical: 6,
  },
  customPromptContent: {
    padding: 12,
  },
  customPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customPromptEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  customPromptText: {
    flex: 1,
  },
  customPromptTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  customPromptMeta: {
    alignItems: 'flex-end',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '600',
  },
  // Modal Styles
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    margin: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalContent: {
    marginBottom: 20,
  },
  modalInput: {
    marginBottom: 16,
  },
  categoryLabel: {
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  selectedCategoryChip: {
    backgroundColor: '#FFE8E8',
  },
  categoryChipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 12,
  },
  selectedCategoryChipText: {
    color: '#FF4D4D',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 12,
  },
});
