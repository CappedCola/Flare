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
} from 'react-native';
import { Text, Avatar, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Send, Heart } from 'lucide-react-native';
import { Comment, Post } from '../types';
import { addComment } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

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
        size="small"
        source={{ uri: comment.userAvatar || 'https://via.placeholder.com/32' }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text
            category="s2"
            style={[styles.commentUsername, { color: theme['text-primary-color'] }]}
          >
            {comment.username}
          </Text>
          <Text
            category="c2"
            style={[styles.commentTime, { color: theme['text-secondary-color'] }]}
          >
            {comment.createdAt instanceof Date 
              ? comment.createdAt.toLocaleDateString() 
              : new Date(comment.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text
          category="p2"
          style={[styles.commentText, { color: theme['text-primary-color'] }]}
        >
          {comment.text}
        </Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentLikeButton} onPress={handleLike}>
            <Heart
              size={14}
              color={isLiked ? theme['color-primary-500'] : theme['color-basic-600']}
              fill={isLiked ? theme['color-primary-500'] : 'none'}
            />
            <Text
              category="c2"
              style={[
                styles.commentLikeText,
                {
                  color: isLiked
                    ? theme['color-primary-500']
                    : theme['color-basic-600'],
                },
              ]}
            >
              {comment.likes.length > 0 ? comment.likes.length : ''}
            </Text>
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

  useEffect(() => {
    setComments(post.comments || []);
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

    setIsSubmitting(true);
    try {
      const newComment = await addComment(post.id, user.id, commentText.trim());
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      onCommentAdded?.(newComment);
    } catch (error) {
      if (__DEV__) console.error('Error adding comment:', error);
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
              <Text category="h6" style={[styles.headerTitle, { color: theme['text-primary-color'] }]}>
                Comments
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <X size={24} color={theme['text-primary-color']} />
              </TouchableOpacity>
            </View>

            {/* Post Preview */}
            <View style={[styles.postPreview, { borderBottomColor: theme['border-basic-color-4'] }]}>
              <Avatar
                size="small"
                source={{ uri: post.userAvatar || 'https://via.placeholder.com/32' }}
                style={styles.postAvatar}
              />
              <View style={styles.postInfo}>
                <Text category="s2" style={[styles.postUsername, { color: theme['text-primary-color'] }]}>
                  {post.username}
                </Text>
                <Text category="p2" style={[styles.postCaption, { color: theme['text-secondary-color'] }]}>
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
                  <Text category="p1" style={[styles.emptyText, { color: theme['text-secondary-color'] }]}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              }
            />

            {/* Comment Input */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.inputContainer, { borderTopColor: theme['border-basic-color-4'] }]}
            >
              <Avatar
                size="small"
                source={{ uri: user?.avatar || 'https://via.placeholder.com/32' }}
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
                placeholder="Add a comment..."
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
                <Send size={16} color="#FFFFFF" />
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
    height: '90%',
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  postPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  postAvatar: {
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
  },
  postUsername: {
    fontWeight: '600',
    marginBottom: 2,
  },
  postCaption: {
    lineHeight: 18,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  commentAvatar: {
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: '600',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    lineHeight: 18,
    marginBottom: 6,
  },
  commentActions: {
    flexDirection: 'row',
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentLikeText: {
    marginLeft: 4,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputAvatar: {
    marginRight: 12,
    marginBottom: 4,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});