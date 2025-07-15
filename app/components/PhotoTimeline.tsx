import React, { useState } from 'react';
import { Layout, Text, Card, Button } from '@ui-kitten/components';
import { StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Clock, User, Heart, MessageCircle, Expand } from 'lucide-react-native';
import { PhotoTimelineProps, ChainPhoto, ChainParticipant } from '../types';
import { PhotoReactions } from './PhotoReactions';

const { width: screenWidth } = Dimensions.get('window');
const PHOTO_SIZE = screenWidth - 32; // Full width minus padding

export const PhotoTimeline: React.FC<PhotoTimelineProps> = ({
  chainId,
  photos,
  participants,
  currentUserId,
  onPhotoPress,
  onReactionAdd,
}) => {
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getParticipantInfo = (userId: string): ChainParticipant | undefined => {
    return participants.find(p => p.userId === userId);
  };

  const getCurrentUserReactions = (photo: ChainPhoto): string[] => {
    return photo.reactions
      .filter(reaction => reaction.userId === currentUserId)
      .map(reaction => reaction.emoji);
  };

  const getPhotoStats = (photo: ChainPhoto) => {
    const totalReactions = photo.reactions.length;
    const uniqueUsers = new Set(photo.reactions.map(r => r.userId)).size;
    const likes = photo.likes.length;
    
    return { totalReactions, uniqueUsers, likes };
  };

  if (photos.length === 0) {
    return (
      <Layout style={styles.emptyContainer}>
        <Text category="h6" appearance="hint" style={styles.emptyTitle}>
          No photos yet
        </Text>
        <Text category="s1" appearance="hint" style={styles.emptySubtext}>
          Photos will appear here as participants respond to the chain.
        </Text>
      </Layout>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <Layout style={styles.timelineContainer}>
        {photos.map((photo, index) => {
          const participant = getParticipantInfo(photo.userId);
          const userReactions = getCurrentUserReactions(photo);
          const stats = getPhotoStats(photo);
          const isOwnPhoto = photo.userId === currentUserId;

          return (
            <Card key={photo.id} style={styles.photoCard}>
              {/* Photo Header */}
              <Layout style={styles.photoHeader}>
                <Layout style={styles.userInfo}>
                  <Layout style={styles.userAvatar}>
                    <Text style={styles.avatarText}>
                      {participant?.avatar || '👤'}
                    </Text>
                  </Layout>
                  <Layout style={styles.userDetails}>
                    <Text category="s2" style={styles.username}>
                      {isOwnPhoto ? 'You' : photo.username}
                    </Text>
                    <Layout style={styles.timeInfo}>
                      <Clock size={12} color="#999999" />
                      <Text category="c1" appearance="hint" style={styles.timeText}>
                        {formatTimeAgo(photo.createdAt)}
                      </Text>
                    </Layout>
                  </Layout>
                </Layout>
                
                <Layout style={styles.positionBadge}>
                  <Text category="c2" style={styles.positionText}>
                    #{photo.position}
                  </Text>
                </Layout>
              </Layout>

              {/* Photo Display */}
              <TouchableOpacity
                style={styles.photoContainer}
                onPress={() => onPhotoPress(photo, index)}
                activeOpacity={0.9}
              >
                <Layout style={styles.photoPlaceholder}>
                  <Image
                    source={{ uri: photo.photoUrl }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  
                  {/* Photo Overlay */}
                  <Layout style={styles.photoOverlay}>
                    <Expand size={24} color="rgba(255, 255, 255, 0.8)" />
                  </Layout>
                </Layout>
              </TouchableOpacity>

              {/* Photo Interpretation */}
              {photo.interpretation && (
                <Layout style={styles.interpretationContainer}>
                  <Text category="s1" style={styles.interpretationText}>
                    "{photo.interpretation}"
                  </Text>
                </Layout>
              )}

              {/* Photo Stats */}
              <Layout style={styles.statsContainer}>
                <Layout style={styles.statItem}>
                  <Heart 
                    size={16} 
                    color={stats.likes > 0 ? '#FF4D4D' : '#999999'}
                    fill={stats.likes > 0 ? '#FF4D4D' : 'transparent'}
                  />
                  <Text category="c1" style={styles.statText}>
                    {stats.likes}
                  </Text>
                </Layout>
                
                <Layout style={styles.statItem}>
                  <Text category="c1" style={styles.statText}>
                    {stats.totalReactions} reactions
                  </Text>
                </Layout>
                
                {stats.uniqueUsers > 1 && (
                  <Layout style={styles.statItem}>
                    <User size={16} color="#999999" />
                    <Text category="c1" style={styles.statText}>
                      {stats.uniqueUsers} people
                    </Text>
                  </Layout>
                )}
              </Layout>

              {/* Reactions */}
              <PhotoReactions
                photoId={photo.id}
                currentUserId={currentUserId}
                currentUsername="Current User" // TODO: Get from auth context
                reactions={photo.reactions}
                onReactionChange={() => {
                  // Trigger parent refresh if needed
                }}
              />

              {/* Timeline Connector */}
              {index < photos.length - 1 && (
                <Layout style={styles.timelineConnector}>
                  <Layout style={styles.connectorLine} />
                  <Layout style={styles.connectorDot} />
                </Layout>
              )}
            </Card>
          );
        })}

        {/* Next Participant Indicator */}
        <Card style={styles.nextParticipantCard}>
          <Layout style={styles.nextParticipantContent}>
            <Layout style={styles.nextAvatar}>
              <Text style={styles.nextAvatarText}>⏰</Text>
            </Layout>
            <Layout style={styles.nextInfo}>
              <Text category="s2" style={styles.nextTitle}>
                Waiting for next photo...
              </Text>
              <Text category="c1" appearance="hint">
                {participants[photos.length]?.username || 'Next participant'} is up
              </Text>
            </Layout>
          </Layout>
        </Card>
      </Layout>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timelineContainer: {
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  photoCard: {
    marginBottom: 16,
    marginHorizontal: 16,
    position: 'relative',
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
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
  avatarText: {
    fontSize: 18,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontWeight: '600',
    marginBottom: 2,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 4,
    fontSize: 12,
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FF4D4D',
    borderRadius: 12,
  },
  positionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 10,
  },
  photoContainer: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  photoPlaceholder: {
    width: '100%',
    height: PHOTO_SIZE * 0.75, // 4:3 aspect ratio
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 8,
  },
  interpretationContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  interpretationText: {
    fontStyle: 'italic',
    color: '#666666',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
    color: '#999999',
    fontSize: 12,
  },
  timelineConnector: {
    position: 'absolute',
    bottom: -16,
    left: 32, // Align with avatar
    alignItems: 'center',
    zIndex: 1,
  },
  connectorLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E8E8E8',
  },
  connectorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4D',
    marginTop: -2,
  },
  nextParticipantCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#F9F9F9',
  },
  nextParticipantContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  nextAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD93D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nextAvatarText: {
    fontSize: 18,
  },
  nextInfo: {
    flex: 1,
  },
  nextTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
});