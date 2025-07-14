import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@ui-kitten/components';
import {
  X,
  Heart,
  MessageCircle,
  Send,
  Check,
  Trash2,
} from 'lucide-react-native';
import { PersonalPost } from '../types';
import { updatePersonalPostStatus } from '../services/firebaseService';

interface NotificationModalProps {
  post: PersonalPost | null;
  isVisible: boolean;
  onClose: () => void;
  onViewed: (postId: string) => void;
  onDismissed: (postId: string) => void;
}

export const NotificationModal = ({ 
  post, 
  isVisible, 
  onClose, 
  onViewed, 
  onDismissed 
}: NotificationModalProps) => {
  const theme = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isVisible && post) {
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: Dimensions.get('window').height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, post]);
  
  const handleView = async () => {
    if (!post || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await updatePersonalPostStatus(post.id, 'viewed');
      onViewed(post.id);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as viewed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDismiss = async () => {
    if (!post || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await updatePersonalPostStatus(post.id, 'dismissed');
      onDismissed(post.id);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to dismiss. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };
  
  if (!post) return null;
  
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.modalOverlay,
          { opacity: opacityAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            { 
              backgroundColor: theme['background-basic-color-1'],
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <SafeAreaView style={styles.modalContent} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme['border-basic-color-2'] }]}>
              <View style={styles.headerLeft}>
                <View style={styles.senderInfo}>
                  <View style={styles.senderAvatar}>
                    <Text style={styles.senderAvatarText}>
                      {post.senderInfo.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.senderName, { color: theme['text-primary-color'] }]}>
                      {post.senderInfo.username}
                    </Text>
                    <Text style={[styles.timeAgo, { color: theme['text-hint-color'] }]}>
                      {formatTimeAgo(post.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={theme['text-primary-color']} />
              </TouchableOpacity>
            </View>
            
            {/* Notification Message */}
            <View style={styles.notificationMessage}>
              <Text style={[styles.messageText, { color: theme['text-primary-color'] }]}>
                📸 <Text style={styles.messageHighlight}>{post.senderInfo.username}</Text> sent you a photo!
              </Text>
              {post.caption && (
                <Text style={[styles.captionText, { color: theme['text-hint-color'] }]}>
                  "{post.caption}"
                </Text>
              )}
            </View>
            
            {/* Photo Preview */}
            <View style={styles.photoContainer}>
              <Image 
                source={{ uri: post.photoUrl }} 
                style={styles.photo}
                resizeMode="cover"
              />
              
              {/* Photo Overlay */}
              <View style={styles.photoOverlay}>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>Day {post.streakDay}</Text>
                </View>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.dismissButton]}
                onPress={handleDismiss}
                disabled={isProcessing}
              >
                <Trash2 size={20} color="#FF6B6B" />
                <Text style={[styles.actionButtonText, { color: '#FF6B6B' }]}>
                  {isProcessing ? 'Dismissing...' : 'Dismiss'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton, { backgroundColor: '#FF4D4D' }]}
                onPress={handleView}
                disabled={isProcessing}
              >
                <Check size={20} color="#FFFFFF" />
                <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                  {isProcessing ? 'Opening...' : 'View Photo'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Bottom Safe Area */}
            <SafeAreaView edges={['bottom']} />
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    maxHeight: screenHeight * 0.9,
  },
  modalContent: {
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  senderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF4D4D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 12,
    fontWeight: '400',
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  notificationMessage: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  messageHighlight: {
    fontWeight: '600',
    color: '#FF4D4D',
  },
  captionText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 20,
  },
  photoContainer: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  photo: {
    width: '100%',
    height: screenWidth * 0.8,
    borderRadius: 16,
  },
  photoOverlay: {
    position: 'absolute',
    top: 16,
    right: 32,
    zIndex: 1,
  },
  streakBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  streakText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  dismissButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  viewButton: {
    backgroundColor: '#FF4D4D',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});