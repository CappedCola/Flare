import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, View, StatusBar, Image, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Avatar, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Expand } from 'lucide-react-native';
import { pillNavHeight } from '../constants/navigation';
import { Post } from '../types';
import { getFeedPosts, likePost, subscribeToPosts } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

const FeedPost = ({ post, onLike, onComment }: { 
  post: Post; 
  onLike: (postId: string) => void; 
  onComment: (postId: string) => void; 
}) => {
  const theme = useTheme();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes.length);
  
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike(post.id);
  };
  
  return (
    <View style={[
      styles.postContainer,
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
          {post.comments.length > 0 && (
            <Text category='c2' style={[
              styles.actionText,
              { color: theme['text-secondary-color'] }
            ]}>
              {post.comments.length}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Expand size={24} color={theme['color-basic-600'] || '#666666'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const FeedScreen = () => {
  const theme = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time posts subscription
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToPosts(
      (newPosts) => {
        setPosts(newPosts);
        setLoading(false);
        setRefreshing(false);
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
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  // Handle post comment
  const handleComment = (postId: string) => {
    // TODO: Open comment modal or navigate to comment screen
    console.log('Comment on post:', postId);
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
  if (posts.length === 0) {
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
        data={posts}
        renderItem={({ item }) => (
          <FeedPost
            post={item}
            onLike={handleLike}
            onComment={handleComment}
          />
        )}
        keyExtractor={(item) => item.id}
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
  postContainer: {
    marginBottom: 24,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    paddingBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
    marginBottom: 12,
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
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