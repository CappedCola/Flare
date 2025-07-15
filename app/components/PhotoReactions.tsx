import React, { useState, useEffect } from 'react';
import { Layout, Text, Button, Modal, Card } from '@ui-kitten/components';
import { StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { ChainPhotoReaction, ReactionPickerProps } from '../types';
import { reactionService } from '../services/reactionService';

interface PhotoReactionsProps {
  photoId: string;
  currentUserId: string;
  currentUsername: string;
  reactions: ChainPhotoReaction[];
  onReactionChange?: () => void;
}

export const PhotoReactions: React.FC<PhotoReactionsProps> = ({
  photoId,
  currentUserId,
  currentUsername,
  reactions,
  onReactionChange,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [reactionSummary, setReactionSummary] = useState<{
    [emoji: string]: {
      count: number;
      users: { userId: string; username: string }[];
      hasUserReacted: boolean;
    };
  }>({});

  useEffect(() => {
    updateReactionSummary();
  }, [reactions, currentUserId]);

  const updateReactionSummary = () => {
    const summary: {
      [emoji: string]: {
        count: number;
        users: { userId: string; username: string }[];
        hasUserReacted: boolean;
      };
    } = {};

    reactions.forEach((reaction) => {
      if (!summary[reaction.emoji]) {
        summary[reaction.emoji] = {
          count: 0,
          users: [],
          hasUserReacted: false,
        };
      }

      summary[reaction.emoji].count++;
      summary[reaction.emoji].users.push({
        userId: reaction.userId,
        username: reaction.username,
      });

      if (reaction.userId === currentUserId) {
        summary[reaction.emoji].hasUserReacted = true;
      }
    });

    setReactionSummary(summary);
  };

  const handleReactionPress = async (emoji: string) => {
    try {
      const result = await reactionService.toggleReaction(
        photoId,
        currentUserId,
        currentUsername,
        emoji
      );

      onReactionChange?.();
      console.log(`Reaction ${emoji} ${result}`);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const handleAddReaction = () => {
    setShowPicker(true);
  };

  const handleReactionSelect = async (emoji: string) => {
    setShowPicker(false);
    await handleReactionPress(emoji);
  };

  const formatReactionUsers = (users: { userId: string; username: string }[]): string => {
    if (users.length === 0) return '';
    if (users.length === 1) return users[0].username;
    if (users.length === 2) return `${users[0].username} and ${users[1].username}`;
    return `${users[0].username}, ${users[1].username} and ${users.length - 2} others`;
  };

  const existingEmojis = Object.keys(reactionSummary);
  const availableEmojis = reactionService.constructor.REACTION_EMOJIS.filter(
    emoji => !existingEmojis.includes(emoji)
  );

  return (
    <Layout style={styles.container}>
      {/* Existing Reactions */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.reactionsScroll}
        contentContainerStyle={styles.reactionsContainer}
      >
        {Object.entries(reactionSummary).map(([emoji, data]) => (
          <TouchableOpacity
            key={emoji}
            style={[
              styles.reactionButton,
              data.hasUserReacted && styles.userReactedButton
            ]}
            onPress={() => handleReactionPress(emoji)}
            activeOpacity={0.7}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            <Text style={[
              styles.reactionCount,
              data.hasUserReacted && styles.userReactedText
            ]}>
              {data.count}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Add Reaction Button */}
        <TouchableOpacity
          style={styles.addReactionButton}
          onPress={handleAddReaction}
          activeOpacity={0.7}
        >
          <Plus size={16} color="#666666" />
        </TouchableOpacity>
      </ScrollView>

      {/* Reaction Picker Modal */}
      <ReactionPicker
        visible={showPicker}
        onReactionSelect={handleReactionSelect}
        onClose={() => setShowPicker(false)}
        availableEmojis={availableEmojis}
        existingEmojis={existingEmojis}
        onExistingReactionPress={handleReactionPress}
      />
    </Layout>
  );
};

interface ReactionPickerExtendedProps extends ReactionPickerProps {
  availableEmojis: string[];
  existingEmojis: string[];
  onExistingReactionPress: (emoji: string) => void;
}

const ReactionPicker: React.FC<ReactionPickerExtendedProps> = ({
  visible,
  onReactionSelect,
  onClose,
  availableEmojis,
  existingEmojis,
  onExistingReactionPress,
}) => {
  return (
    <Modal
      visible={visible}
      backdropStyle={styles.backdrop}
      onBackdropPress={onClose}
      style={styles.modal}
    >
      <Card style={styles.pickerCard}>
        <Layout style={styles.pickerHeader}>
          <Text category="h6" style={styles.pickerTitle}>
            Choose Reaction
          </Text>
          <Button
            appearance="ghost"
            size="tiny"
            onPress={onClose}
            accessoryLeft={(props) => <X {...props} size={16} />}
          />
        </Layout>

        {/* Available Reactions */}
        <Layout style={styles.pickerContent}>
          <Text category="s2" style={styles.sectionTitle}>
            Add Reaction
          </Text>
          <Layout style={styles.emojiGrid}>
            {availableEmojis.map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.emojiButton}
                onPress={() => onReactionSelect(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </Layout>

          {/* Existing Reactions */}
          {existingEmojis.length > 0 && (
            <Layout style={styles.existingSection}>
              <Text category="s2" style={styles.sectionTitle}>
                Remove Reaction
              </Text>
              <Layout style={styles.emojiGrid}>
                {existingEmojis.map((emoji) => (
                  <Pressable
                    key={emoji}
                    style={[styles.emojiButton, styles.existingEmojiButton]}
                    onPress={() => {
                      onClose();
                      onExistingReactionPress(emoji);
                    }}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </Pressable>
                ))}
              </Layout>
            </Layout>
          )}
        </Layout>
      </Card>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  reactionsScroll: {
    flexGrow: 0,
  },
  reactionsContainer: {
    paddingRight: 8,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  userReactedButton: {
    backgroundColor: '#FFE8E8',
    borderColor: '#FF4D4D',
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  userReactedText: {
    color: '#FF4D4D',
    fontWeight: '600',
  },
  addReactionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    width: '90%',
    maxWidth: 400,
  },
  pickerCard: {
    padding: 0,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  pickerTitle: {
    flex: 1,
  },
  pickerContent: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#666666',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  emojiButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    backgroundColor: '#F9F9F9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  existingEmojiButton: {
    backgroundColor: '#FFE8E8',
    borderColor: '#FF4D4D',
  },
  emojiText: {
    fontSize: 24,
  },
  existingSection: {
    marginTop: 8,
  },
});