import React, { useRef, useEffect } from 'react';
import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Text, Avatar, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Heart, MessageCircle, Share } from 'lucide-react-native';
import { Post, Comment } from '../types';

// Helper function to safely count unique comments
const getUniqueCommentCount = (comments: Comment[]): number => {
  if (!comments || comments.length === 0) return 0;
  const uniqueIds = new Set(comments.map(comment => comment.id).filter(Boolean));
  return uniqueIds.size;
};

interface FullscreenImageViewerProps {
  visible: boolean;
  onClose: () => void;
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (post: Post) => void;
  currentUserId?: string | null;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const FullscreenImageViewer = ({
  visible,
  onClose,
  post,
  onLike,
  onComment,
  onShare,
  currentUserId,
}: FullscreenImageViewerProps) => {
  const theme = useTheme();
  
  // Initialize like state based on whether current user has liked this post
  const [isLiked, setIsLiked] = React.useState(
    currentUserId ? post.likes.includes(currentUserId) : false
  );
  const [showOverlay, setShowOverlay] = React.useState(true);
  
  // Update like state when post data changes (from Firebase real-time updates)
  React.useEffect(() => {
    const userHasLiked = currentUserId ? post.likes.includes(currentUserId) : false;
    setIsLiked(userHasLiked);
  }, [post.likes, currentUserId]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Pan and pinch gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only handle gestures if they're significant
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Show overlay when user starts interacting
        setShowOverlay(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        // Handle pan gestures for dismissing
        if (scaleAnim._value <= 1) {
          translateX.setValue(gestureState.dx);
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Dismiss if swiped down significantly
        if (gestureState.dy > 100 && Math.abs(gestureState.vx) < 0.5) {
          handleClose();
        } else {
          // Spring back to center
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
          ]).start();
        }

        // Hide overlay after a delay
        setTimeout(() => {
          if (showOverlay) {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start(() => setShowOverlay(false));
          }
        }, 3000);
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      setShowOverlay(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-hide overlay after 3 seconds
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setShowOverlay(false));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: screenHeight,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start(() => {
      onClose();
      // Reset animations
      translateX.setValue(0);
      translateY.setValue(0);
      scaleAnim.setValue(1);
    });
  };

  const handleImageTap = () => {
    setShowOverlay(!showOverlay);
    Animated.timing(fadeAnim, {
      toValue: showOverlay ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleLike = () => {
    // Don't do optimistic updates - let Firebase real-time listener handle UI updates
    onLike?.(post.id);
  };

  const handleComment = () => {
    onComment?.(post.id);
  };

  const handleShare = () => {
    onShare?.(post);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [
                { translateX },
                { translateY },
                { scale: scaleAnim },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity activeOpacity={1} onPress={handleImageTap} style={styles.imageTouchable}>
            <Image source={{ uri: post.photoUrl }} style={styles.image} resizeMode="contain" />
          </TouchableOpacity>
        </Animated.View>

        {/* Top Overlay */}
        <Animated.View style={[styles.topOverlay, { opacity: fadeAnim }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.topControls}>
              <View style={styles.userInfo}>
                <Avatar
                  size="small"
                  source={{ uri: post.userAvatar || 'https://via.placeholder.com/32' }}
                  style={styles.avatar}
                />
                <View>
                  <Text category="s1" style={styles.username}>
                    {post.username}
                  </Text>
                  <Text category="c2" style={styles.timeAgo}>
                    {post.timeAgo}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* Bottom Overlay */}
        <Animated.View style={[styles.bottomOverlay, { opacity: fadeAnim }]}>
          <SafeAreaView edges={['bottom']}>
            {/* Caption */}
            {post.caption && (
              <View style={styles.captionContainer}>
                <Text category="p1" style={styles.caption}>
                  {post.caption}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionBar}>
              <View style={styles.leftActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                  <Heart
                    size={28}
                    color={isLiked ? '#FF4D4D' : '#FFFFFF'}
                    fill={isLiked ? '#FF4D4D' : 'none'}
                  />
                  {post.likes.length > 0 && (
                    <Text style={styles.actionText}>{post.likes.length}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
                  <MessageCircle size={28} color="#FFFFFF" />
                  {getUniqueCommentCount(post.comments) > 0 && (
                    <Text style={styles.actionText}>{getUniqueCommentCount(post.comments)}</Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Share size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTouchable: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  username: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeAgo: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  caption: {
    color: '#FFFFFF',
    lineHeight: 20,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    padding: 8,
  },
  actionText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '500',
  },
});