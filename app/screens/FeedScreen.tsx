import React, { useState, useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, View, StatusBar, Image, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Avatar, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Expand } from 'lucide-react-native';
import { pillNavHeight } from '../constants/navigation';
import { Post, Comment, FeedItem, ChainFeedItem, PostFeedItem, FlareChain } from '../types';
import { getFeedPosts, likePost, subscribeToPosts } from '../services/firebaseService';
import { flareChainService } from '../services/flareChainService';
import { useAuth } from '../context/AuthContext';
import { CommentModal } from '../components/CommentModal';
import { FullscreenImageViewer } from '../components/FullscreenImageViewer';
import { ChainTurnCard } from '../components/ChainTurnCard';
import { useNavigation } from '@react-navigation/native';

// Helper function to safely count unique comments
const getUniqueCommentCount = (comments: Comment[]): number => {
  if (!comments || comments.length === 0) return 0;
  const uniqueIds = new Set(comments.map(comment => comment.id).filter(Boolean));
  return uniqueIds.size;
};

const FeedPost = ({ post, onLike, onComment, onExpand, currentUserId }: { 
  post: Post; 
  onLike: (postId: string) => void; 
  onComment: (postId: string) => void;
  onExpand: (post: Post) => void;
  currentUserId: string | null;
}) => {
  const theme = useTheme();
  
  // Initialize like state based on whether current user has liked this post
  const [isLiked, setIsLiked] = useState(
    currentUserId ? post.likes.includes(currentUserId) : false
  );
  const [likesCount, setLikesCount] = useState(post.likes.length);
  
  // Update like state when post data changes (from Firebase real-time updates)
  useEffect(() => {
    const userHasLiked = currentUserId ? post.likes.includes(currentUserId) : false;
    setIsLiked(userHasLiked);
    setLikesCount(post.likes.length);
  }, [post.likes, currentUserId]);
  
  const handleLike = () => {
    // Don't do optimistic updates - let Firebase real-time listener handle UI updates
    onLike(post.id);
  };
  
  return (
    <View style={styles.postWrapper}>
      {/* Header */}
      <View style={[
        styles.postContainer,
        styles.postHeaderContainer,
        { backgroundColor: theme['background-basic-color-3'] }
      ]}>
        <View style={styles.postHeader}>
          <Avatar
            size='small'
            source={{ uri: post.userAvatar || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text category='s1' style={[
              styles.username,
              { color: theme['text-primary-color'] }
            ]}>
              {post.username}
            </Text>
            <Text category='c2' style={[
              styles.timeText,
              { color: theme['text-secondary-color'] }
            ]}>
              {post.timeAgo}
            </Text>
          </View>
        </View>
      </View>

      {/* Full-width Image */}
      <View style={[
        styles.imageContainer,
        { backgroundColor: theme['background-basic-color-3'] }
      ]}>
        {post.photoUrl ? (
          <Image
            source={{ uri: post.photoUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
        ) : (
          <>
            <Text category='h6' style={[
              styles.imagePlaceholderText,
              { color: theme['text-primary-color'] }
            ]}>
              Photo Placeholder
            </Text>
            <Text category='c2' style={[
              styles.imageSubtext,
              { color: theme['text-secondary-color'] }
            ]}>
              Streak Day {post.streakDay}
            </Text>
          </>
        )}
      </View>
      
      {/* Footer with caption and actions */}
      <View style={[
        styles.postContainer,
        styles.postFooterContainer,
        { backgroundColor: theme['background-basic-color-3'] }
      ]}>
        {post.caption && (
          <View style={styles.captionContainer}>
            <Text category='p2' style={[
              styles.caption,
              { color: theme['text-primary-color'] }
            ]}>
              {post.caption}
            </Text>
          </View>
        )}
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Heart 
              size={24} 
              color={isLiked ? (theme['color-primary-500'] || '#FF4D4D') : (theme['color-basic-600'] || '#666666')} 
              fill={isLiked ? (theme['color-primary-500'] || '#FF4D4D') : 'none'}
            />
            {likesCount > 0 && (
              <Text category='c2' style={[
                styles.actionText,
                { color: theme['text-secondary-color'] }
              ]}>
                {likesCount}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onComment(post.id)}>
            <MessageCircle size={24} color={theme['color-basic-600'] || '#666666'} />
            {getUniqueCommentCount(post.comments) > 0 && (
              <Text category='c2' style={[
                styles.actionText,
                { color: theme['text-secondary-color'] }
              ]}>
                {getUniqueCommentCount(post.comments)}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onExpand(post)}>
            <Expand size={24} color={theme['color-basic-600'] || '#666666'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export const FeedScreen = () => {
  const theme = useTheme();
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [chains, setChains] = useState<FlareChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [fullscreenImageVisible, setFullscreenImageVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create unified feed from posts and chains
  const feedItems = useMemo((): FeedItem[] => {
    const items: FeedItem[] = [];
    
    console.log(`🔄 Feed: Processing ${chains.length} chains and ${posts.length} posts for user ${user?.id}`);
    
    // Add chains (user's current turns only)
    chains.forEach(chain => {
      const isUserTurn = user && flareChainService.isUserCurrentTurn(chain, user.id);
      console.log(`🔗 Chain ${chain.id}: isUserTurn=${isUserTurn} for user ${user?.id}`);
      
      if (isUserTurn) {
        const now = new Date();
        const timeRemaining = Math.max(0, chain.currentTurnExpiresAt.getTime() - now.getTime());
        
        items.push({
          type: 'chain',
          data: chain,
          priority: 1,
          timestamp: chain.currentTurnExpiresAt,
          timeRemaining,
          isUserTurn: true,
        } as ChainFeedItem);
        
        console.log(`➕ Added chain ${chain.id} to feed (${Math.floor(timeRemaining/60000)}min remaining)`);
      }
    });
    
    // Add posts
    posts.forEach(post => {
      items.push({
        type: 'post',
        data: post,
        priority: 2,
        timestamp: post.createdAt,
      } as PostFeedItem);
    });
    
    // Sort by priority (chains first), then by timestamp
    const sortedItems = items.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
    
    console.log(`📱 Final feed: ${sortedItems.length} items (${sortedItems.filter(i => i.type === 'chain').length} chains, ${sortedItems.filter(i => i.type === 'post').length} posts)`);
    
    return sortedItems;
  }, [posts, chains, user]);

  // Real-time posts subscription
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToPosts(
      (newPosts) => {
        setPosts(newPosts);
        setError(null);
      },
      (err) => {
        setError('Failed to load posts. Please try again.');
        setLoading(false);
        setRefreshing(false);
      }
    );

    return unsubscribe;
  }, [isAuthenticated]);

  // Real-time chains subscription
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // One-time fix for existing chain states (remove after running once)
    flareChainService.fixExistingChainStates().catch(console.error);

    const unsubscribe = flareChainService.subscribeToUserCurrentTurnChains(
      user.id,
      (newChains) => {
        setChains(newChains);
        setLoading(false);
        setRefreshing(false);
        setError(null);
      }
    );

    return unsubscribe;
  }, [isAuthenticated, user]);

  // Load posts from service (fallback)
  const loadPosts = async () => {
    try {
      setError(null);
      const feedPosts = await getFeedPosts();
      setPosts(feedPosts);
    } catch (err) {
      setError('Failed to load posts. Please try again.');
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh posts
  const handleRefresh = async () => {
    setRefreshing(true);
    if (isAuthenticated) {
      // Real-time subscription will handle the refresh
      setTimeout(() => setRefreshing(false), 1000);
    } else {
      await loadPosts();
      setRefreshing(false);
    }
  };

  // Handle post like
  const handleLike = async (postId: string) => {
    if (!user) return;
    
    try {
      await likePost(postId, user.id);
      // Real-time subscription will automatically update the UI
    } catch (err: any) {
      console.error('Error liking post:', err);
      // TODO: Show user-friendly error message in a toast or alert
      // For now, just log the specific error message
      if (__DEV__) {
        console.warn('Like failed with message:', err.message);
      }
    }
  };

  // Handle post comment
  const handleComment = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setCommentModalVisible(true);
    }
  };

  // Handle post expand (fullscreen image)
  const handleExpand = (post: Post) => {
    setSelectedPost(post);
    setFullscreenImageVisible(true);
  };

  // Handle comment added - let Firebase real-time listener handle updates
  const handleCommentAdded = (comment: Comment) => {
    // No manual state update needed - Firebase real-time listener will handle this
    // This prevents duplicate comments and race conditions
  };

  // Handle chain quick response
  const handleChainQuickResponse = (chainId: string) => {
    (navigation as any).navigate('FlareResponse', { chainId });
  };

  // Handle chain skip turn
  const handleChainSkipTurn = async (chainId: string) => {
    if (!user) return;
    
    try {
      await flareChainService.skipTurn(chainId, user.id);
      console.log('Turn skipped successfully for chain:', chainId);
    } catch (err) {
      console.error('Error skipping turn:', err);
      // TODO: Show user-friendly error message
    }
  };

  // Unified feed item renderer
  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    if (item.type === 'chain') {
      const chainItem = item as ChainFeedItem;
      return (
        <ChainTurnCard
          chainItem={chainItem}
          onQuickResponse={handleChainQuickResponse}
          onSkipTurn={handleChainSkipTurn}
        />
      );
    } else {
      const postItem = item as PostFeedItem;
      return (
        <FeedPost
          post={postItem.data}
          onLike={handleLike}
          onComment={handleComment}
          onExpand={handleExpand}
          currentUserId={user?.id || null}
        />
      );
    }
  };

  // Show auth prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[
        styles.container,
        styles.centered,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        <Text category='h5' style={[
          styles.authPromptTitle,
          { color: theme['text-primary-color'] }
        ]}>
          Welcome to Flare
        </Text>
        <Text category='s1' style={[
          styles.authPromptText,
          { color: theme['text-secondary-color'] }
        ]}>
          Sign in to share photos and connect with friends
        </Text>
      </SafeAreaView>
    );
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[
        styles.container,
        styles.centered,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        <ActivityIndicator size="large" color={theme['color-primary-500']} />
        <Text category='s1' style={[
          styles.loadingText,
          { color: theme['text-secondary-color'] }
        ]}>
          Loading posts...
        </Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[
        styles.container,
        styles.centered,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        <Text category='s1' style={[
          styles.errorText,
          { color: theme['text-danger-color'] }
        ]}>
          {error}
        </Text>
        <TouchableOpacity onPress={loadPosts} style={styles.retryButton}>
          <Text category='s1' style={[
            styles.retryText,
            { color: theme['color-primary-500'] }
          ]}>
            Retry
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Empty state
  if (feedItems.length === 0) {
    return (
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        <View style={[
          styles.header,
          { borderBottomColor: theme['border-basic-color-2'] }
        ]}>
          <View style={styles.headerSpacer} />
          <Text category='h4' style={[
            styles.title,
            { color: theme['text-primary-color'] }
          ]}>
            Flare
          </Text>
        </View>
        
        <View style={styles.centered}>
          <Text category='h6' style={[
            styles.emptyStateTitle,
            { color: theme['text-primary-color'] }
          ]}>
            No posts yet
          </Text>
          <Text category='s1' style={[
            styles.emptyStateText,
            { color: theme['text-secondary-color'] }
          ]}>
            Start your streak by taking your first photo!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme['background-basic-color-1']} />
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        <View style={[
          styles.header,
          { borderBottomColor: theme['border-basic-color-2'] }
        ]}>
          <View style={styles.headerSpacer} />
          <Text category='h4' style={[
            styles.title,
            { color: theme['text-primary-color'] }
          ]}>
            Flare
          </Text>
        </View>
      
      <FlatList
        data={feedItems}
        renderItem={renderFeedItem}
        keyExtractor={(item) => `${item.type}-${item.data.id}`}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: pillNavHeight + 16 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme['color-primary-500'] || '#FF4D4D']}
            tintColor={theme['color-primary-500'] || '#FF4D4D'}
          />
        }
      />
      </SafeAreaView>

      {/* Comment Modal */}
      {selectedPost && (
        <CommentModal
          visible={commentModalVisible}
          onClose={() => {
            setCommentModalVisible(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
          onCommentAdded={handleCommentAdded}
        />
      )}

      {/* Fullscreen Image Viewer */}
      {selectedPost && (
        <FullscreenImageViewer
          visible={fullscreenImageVisible}
          onClose={() => {
            setFullscreenImageVisible(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
          onLike={handleLike}
          onComment={handleComment}
          onShare={(post) => {
            // TODO: Implement sharing functionality
          }}
          currentUserId={user?.id || null}
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  headerSpacer: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    letterSpacing: 0.5,
    fontSize: 24,
  },
  content: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  postWrapper: {
    marginBottom: 24,
  },
  postContainer: {
    borderRadius: 12,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  postHeaderContainer: {
    borderRadius: 0,
    paddingBottom: 16,
    paddingHorizontal: 31,
    paddingTop: 16,
  },
  postFooterContainer: {
    borderRadius: 0,
    paddingTop: 16,
    paddingHorizontal: 31,
    paddingBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: '600',
    fontSize: 15,
  },
  timeText: {
    fontSize: 13,
    marginTop: 2,
  },
  imageContainer: {
    aspectRatio: 4/5,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
  },
  imageSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  captionContainer: {
    paddingBottom: 8,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  authPromptTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  authPromptText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});