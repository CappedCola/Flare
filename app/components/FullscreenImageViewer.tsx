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
import { X, Heart, MessageCircle, Share, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Post, Comment, ChainPhoto } from '../types';
import { PhotoReactions } from './PhotoReactions';

// Helper function to safely count unique comments
const getUniqueCommentCount = (comments: Comment[]): number => {
  if (!comments || comments.length === 0) return 0;
  const uniqueIds = new Set(comments.map(comment => comment.id).filter(Boolean));
  return uniqueIds.size;
};

interface FullscreenImageViewerProps {
  visible: boolean;
  onClose: () => void;
  post?: Post;
  chainPhoto?: ChainPhoto;
  chainPhotos?: ChainPhoto[];
  currentPhotoIndex?: number;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (post: Post | ChainPhoto) => void;
  onReactionAdd?: (photoId: string, emoji: string) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  currentUserId?: string | null;
  currentUsername?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const FullscreenImageViewer = ({
  visible,
  onClose,
  post,
  chainPhoto,
  chainPhotos,
  currentPhotoIndex = 0,
  onLike,
  onComment,
  onShare,
  onReactionAdd,
  onNavigate,
  currentUserId,
  currentUsername = 'Current User',
}: FullscreenImageViewerProps) => {
  const theme = useTheme();
  
  // Determine which data to use - post or chainPhoto
  const displayData = chainPhoto || post;
  const isChainPhoto = !!chainPhoto;
  
  // Initialize like state based on whether current user has liked this post/photo
  const [isLiked, setIsLiked] = React.useState(
    currentUserId && displayData ? displayData.likes.includes(currentUserId) : false
  );
  const [showOverlay, setShowOverlay] = React.useState(true);
  
  // Update like state when data changes (from Firebase real-time updates)
  React.useEffect(() => {
    if (!displayData || !currentUserId) return;
    const userHasLiked = displayData.likes.includes(currentUserId);
    setIsLiked(userHasLiked);
  }, [displayData?.likes, currentUserId]);

  // Navigation helpers for chain photos
  const canNavigatePrev = isChainPhoto && chainPhotos && currentPhotoIndex > 0;
  const canNavigateNext = isChainPhoto && chainPhotos && currentPhotoIndex < chainPhotos.length - 1;

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (onNavigate) {
      onNavigate(direction);
    }
  };

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
    if (!displayData) return;
    // Don't do optimistic updates - let Firebase real-time listener handle UI updates
    onLike?.(displayData.id);
  };

  const handleComment = () => {
    if (!displayData) return;
    onComment?.(displayData.id);
  };

  const handleShare = () => {
    if (!displayData) return;
    onShare?.(displayData);
  };

  if (!displayData) {
    return null;
  }

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
            <Image source={{ uri: displayData.photoUrl }} style={styles.image} resizeMode="contain" />
          </TouchableOpacity>

          {/* Navigation arrows for chain photos */}
          {isChainPhoto && (
            <>
              {canNavigatePrev && (
                <Animated.View style={[styles.navigationButton, styles.prevButton, { opacity: fadeAnim }]}>
                  <TouchableOpacity onPress={() => handleNavigate('prev')} style={styles.navButtonTouchable}>
                    <ChevronLeft size={32} color="#FFFFFF" />
                  </TouchableOpacity>
                </Animated.View>
              )}
              
              {canNavigateNext && (
                <Animated.View style={[styles.navigationButton, styles.nextButton, { opacity: fadeAnim }]}>
                  <TouchableOpacity onPress={() => handleNavigate('next')} style={styles.navButtonTouchable}>
                    <ChevronRight size={32} color="#FFFFFF" />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </>
          )}
        </Animated.View>

        {/* Top Overlay */}
        <Animated.View style={[styles.topOverlay, { opacity: fadeAnim }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.topControls}>
              <View style={styles.userInfo}>
                <Avatar
                  size="small"
                  source={{ uri: displayData.userAvatar || 'https://via.placeholder.com/32' }}
                  style={styles.avatar}
                />
                <View>
                  <Text category="s1" style={styles.username}>
                    {displayData.username}
                  </Text>
                  <Text category="c2" style={styles.timeAgo}>
                    {isChainPhoto ? `Position #${(chainPhoto as ChainPhoto).position}` : (post as Post).timeAgo}
                  </Text>
                  {isChainPhoto && chainPhotos && (
                    <Text category="c2" style={styles.photoCounter}>
                      {currentPhotoIndex + 1} of {chainPhotos.length}
                    </Text>
                  )}
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
            {/* Caption/Interpretation */}
            {((post as Post)?.caption || (chainPhoto as ChainPhoto)?.interpretation) && (
              <View style={styles.captionContainer}>
                <Text category="p1" style={styles.caption}>
                  {isChainPhoto ? (chainPhoto as ChainPhoto).interpretation : (post as Post).caption}
                </Text>
              </View>
            )}

            {/* Chain Photo Reactions */}
            {isChainPhoto && onReactionAdd && chainPhoto && currentUserId && (
              <View style={styles.reactionsContainer}>
                <PhotoReactions
                  photoId={chainPhoto.id}
                  currentUserId={currentUserId}
                  currentUsername={currentUsername}
                  reactions={chainPhoto.reactions}
                  onReactionChange={() => {
                    // Trigger refresh if needed
                  }}
                />
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
                  {displayData.likes.length > 0 && (
                    <Text style={styles.actionText}>{displayData.likes.length}</Text>
                  )}
                </TouchableOpacity>

                {!isChainPhoto && (
                  <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
                    <MessageCircle size={28} color="#FFFFFF" />
                    {getUniqueCommentCount((post as Post).comments) > 0 && (
                      <Text style={styles.actionText}>{getUniqueCommentCount((post as Post).comments)}</Text>
                    )}
                  </TouchableOpacity>
                )}
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
  photoCounter: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  navigationButton: {
    position: 'absolute',
    top: '50%',
    zIndex: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  navButtonTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  reactionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
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