import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StyleSheet,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Text, Avatar, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Send, Heart, ChevronDown } from 'lucide-react-native';
import { Comment, Post } from '../types';
import { addComment } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

// Helper function to format relative time (e.g., "17h", "3d", "1w")
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h`;
  } else if (diffInSeconds < 604800) {
    return `${Math.floor(diffInSeconds / 86400)}d`;
  } else {
    return `${Math.floor(diffInSeconds / 604800)}w`;
  }
};

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  post: Post;
  onCommentAdded?: (comment: Comment) => void;
}

interface CommentItemProps {
  comment: Comment;
  onLike: (commentId: string) => void;
}

const CommentItem = ({ comment, onLike }: CommentItemProps) => {
  const theme = useTheme();
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(comment.id);
  };

  return (
    <View style={styles.commentItem}>
      <Avatar
        size="medium"
        source={{ uri: comment.userAvatar || 'https://via.placeholder.com/40' }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text
            category="s1"
            style={[styles.commentUsername, { color: theme['text-primary-color'] }]}
          >
            {comment.username}
          </Text>
          <Text
            category="c1"
            style={[styles.commentTime, { color: theme['text-secondary-color'] }]}
          >
            {comment.createdAt instanceof Date 
              ? getTimeAgo(comment.createdAt) 
              : getTimeAgo(new Date(comment.createdAt))}
          </Text>
        </View>
        <Text
          category="p1"
          style={[styles.commentText, { color: theme['text-primary-color'] }]}
        >
          {comment.text}
        </Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.replyButton}>
            <Text
              category="c1"
              style={[styles.replyText, { color: theme['text-secondary-color'] }]}
            >
              Reply
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.commentLikeButton} onPress={handleLike}>
            <Heart
              size={16}
              color={isLiked ? theme['color-primary-500'] : theme['color-basic-600']}
              fill={isLiked ? theme['color-primary-500'] : 'none'}
            />
            {comment.likes.length > 0 && (
              <Text
                category="c1"
                style={[
                  styles.commentLikeText,
                  {
                    color: isLiked
                      ? theme['color-primary-500']
                      : theme['color-basic-600'],
                  },
                ]}
              >
                {comment.likes.length.toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export const CommentModal = ({ visible, onClose, post, onCommentAdded }: CommentModalProps) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: Dimensions.get('window').height,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }).start();
    }
  }, [visible]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Helper function to deduplicate comments by ID with additional safety
  const deduplicateComments = (comments: Comment[]): Comment[] => {
    if (!comments || comments.length === 0) return [];
    
    const seen = new Set<string>();
    const uniqueComments = comments.filter(comment => {
      // Skip comments without valid IDs
      if (!comment?.id) return false;
      
      if (seen.has(comment.id)) {
        if (__DEV__) console.log('🔍 [DEBUG] Filtering duplicate comment:', comment.id);
        return false;
      }
      seen.add(comment.id);
      return true;
    });
    
    if (__DEV__ && uniqueComments.length !== comments.length) {
      console.log('🔧 [DEBUG] Deduplicated comments:', {
        original: comments.length,
        unique: uniqueComments.length,
        duplicatesRemoved: comments.length - uniqueComments.length
      });
    }
    
    return uniqueComments;
  };

  useEffect(() => {
    const newComments = deduplicateComments(post.comments || []);
    
    setComments(prevComments => {
      // Get any temporary comments (optimistic UI)
      const tempComments = prevComments.filter(comment => comment.id.startsWith('temp_'));
      
      // Merge real comments with temp comments, avoiding duplicates
      const mergedComments = [...newComments];
      
      // Add temp comments that don't have real counterparts yet
      tempComments.forEach(tempComment => {
        const hasRealComment = newComments.some(comment => 
          comment.text === tempComment.text && 
          comment.userId === tempComment.userId &&
          Math.abs(new Date(comment.createdAt).getTime() - tempComment.createdAt.getTime()) < 5000 // Within 5 seconds
        );
        if (!hasRealComment) {
          mergedComments.push(tempComment);
        }
      });
      
      // Sort by creation date
      mergedComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      // Only update if there's actually a change
      if (JSON.stringify(prevComments) === JSON.stringify(mergedComments)) {
        return prevComments;
      }
      
      return mergedComments;
    });
  }, [post.comments]);

  const handleClose = () => {
    Animated.spring(slideAnim, {
      toValue: Dimensions.get('window').height,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start(() => {
      onClose();
    });
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !user || isSubmitting) return;

    const commentToSubmit = commentText.trim();
    
    const tempComment: Comment = {
      id: `temp_${Date.now()}`, // Temporary ID for optimistic UI
      postId: post.id,
      userId: user.id,
      username: user.username || user.displayName,
      userAvatar: user.avatar,
      text: commentToSubmit,
      createdAt: new Date(),
      likes: [],
    };

    // Optimistic UI - add comment immediately
    setComments(prevComments => [...prevComments, tempComment]);
    setCommentText('');
    
    setIsSubmitting(true);
    try {
      const newComment = await addComment(post.id, user.id, commentToSubmit);
      
      // Replace temp comment with real comment from server
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === tempComment.id ? newComment : comment
        )
      );
      
      onCommentAdded?.(newComment);
    } catch (error) {
      if (__DEV__) console.error('Error adding comment:', error);
      
      // Remove temp comment on error
      setComments(prevComments => 
        prevComments.filter(comment => comment.id !== tempComment.id)
      );
      
      // Restore the comment text so user can try again
      setCommentText(tempComment.text);
      
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentLike = (commentId: string) => {
    // TODO: Implement comment liking
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <CommentItem comment={item} onLike={handleCommentLike} />
  );

  const renderFooter = () => (
    <View style={[styles.listFooter, { height: isKeyboardVisible ? 20 : 120 }]} />
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            { backgroundColor: theme['background-basic-color-1'] },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme['border-basic-color-4'] }]}>
              <View style={styles.headerLeft}>
                <Text category="h5" style={[styles.commentCount, { color: theme['text-primary-color'] }]}>
                  {comments.length} comment{comments.length !== 1 ? 's' : ''}
                </Text>
                <ChevronDown size={18} color={theme['text-primary-color']} style={styles.dropdownIcon} />
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <X size={26} color={theme['text-primary-color']} />
              </TouchableOpacity>
            </View>

            {/* Post Preview */}
            <View style={[styles.postPreview, { borderBottomColor: theme['border-basic-color-4'] }]}>
              <Avatar
                size="medium"
                source={{ uri: post.userAvatar || 'https://via.placeholder.com/40' }}
                style={styles.postAvatar}
              />
              <View style={styles.postInfo}>
                <Text category="s1" style={[styles.postUsername, { color: theme['text-primary-color'] }]}>
                  {post.username}
                </Text>
                <Text category="p1" style={[styles.postCaption, { color: theme['text-secondary-color'] }]}>
                  {post.caption || 'No caption'}
                </Text>
              </View>
            </View>

            {/* Comments List */}
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              style={styles.commentsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text category="s1" style={[styles.emptyText, { color: theme['text-secondary-color'] }]}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              }
              ListFooterComponent={renderFooter}
            />

            {/* Comment Input */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 45 : 0}
              style={[styles.inputContainer, { borderTopColor: theme['border-basic-color-4'] }]}
            >
              <Avatar
                size="medium"
                source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }}
                style={styles.inputAvatar}
              />
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme['background-basic-color-2'],
                    color: theme['text-primary-color'],
                    borderColor: theme['border-basic-color-4'],
                  },
                ]}
                placeholder="Add comment..."
                placeholderTextColor={theme['text-secondary-color']}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: commentText.trim()
                      ? theme['color-primary-500']
                      : theme['color-basic-300'],
                  },
                ]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || isSubmitting}
              >
                <Send size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '95%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    fontWeight: '700',
    fontSize: 20,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  postPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  postAvatar: {
    marginRight: 16,
  },
  postInfo: {
    flex: 1,
  },
  postUsername: {
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 16,
  },
  postCaption: {
    lineHeight: 20,
    fontSize: 15,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listFooter: {
    width: '100%',
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  commentAvatar: {
    marginRight: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentUsername: {
    fontWeight: '700',
    marginRight: 12,
    fontSize: 16,
  },
  commentTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  commentText: {
    lineHeight: 22,
    marginBottom: 10,
    fontSize: 15,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  replyButton: {
    paddingVertical: 4,
  },
  replyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  commentLikeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  inputAvatar: {
    marginRight: 12,
    marginBottom: 4,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    lineHeight: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});