import React, { useState } from 'react';
import { Layout, Text, Card, Button } from '@ui-kitten/components';
import { StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Clock, Users, Heart, MessageCircle, Share, Expand } from 'lucide-react-native';
import { PhotoTimeline } from '../../components/PhotoTimeline';
import { FullscreenImageViewer } from '../../components/FullscreenImageViewer';

const { width: screenWidth } = Dimensions.get('window');

export const FlareChainViewScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const chainId = (route.params as any)?.chainId || 'demo-chain';
  
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const handleOpenChat = () => {
    navigation.navigate('FlareChat' as never, { chainId } as never);
  };

  const handleViewCompletion = () => {
    navigation.navigate('FlareCompletion' as never, { chainId } as never);
  };

  // Mock chain data with photos - can be 'active', 'completed', or 'expired'
  const mockChain = {
    id: chainId,
    status: chainId.includes('completed') ? 'completed' : 'active',
    prompt: {
      title: 'Emotions',
      description: 'Share how you\'re feeling right now',
      color: '#FF6B6B',
    },
    creator: 'alice_photo',
    createdAt: new Date('2024-01-15T10:30:00'),
    participants: [
      { username: 'alice_photo', avatar: '👩‍🎨' },
      { username: 'bob_creative', avatar: '👨‍💻' },
      { username: 'you', avatar: '👤' },
      { username: 'charlie_lens', avatar: '📸' },
    ],
    photos: [
      {
        id: '1',
        username: 'alice_photo',
        interpretation: 'Feeling creative today! This sunrise inspires me.',
        timestamp: new Date('2024-01-15T10:35:00'),
        likes: ['bob_creative', 'you'],
        position: 1,
        photoUrl: 'https://picsum.photos/400/300?random=1',
        userAvatar: '👩‍🎨',
        reactions: [
          { id: '1', userId: 'bob_creative', username: 'bob_creative', emoji: '❤️', createdAt: new Date() },
          { id: '2', userId: 'you', username: 'you', emoji: '😍', createdAt: new Date() },
        ],
      },
      {
        id: '2',
        username: 'bob_creative',
        interpretation: 'Coding makes me happy - my morning coffee setup',
        timestamp: new Date('2024-01-15T11:20:00'),
        likes: ['alice_photo'],
        position: 2,
        photoUrl: 'https://picsum.photos/400/300?random=2',
        userAvatar: '👨‍💻',
        reactions: [
          { id: '3', userId: 'alice_photo', username: 'alice_photo', emoji: '👏', createdAt: new Date() },
        ],
      },
    ],
    timeRemaining: mockChain.status === 'completed' ? 0 : 2340000, // 39 minutes or 0 if completed
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (mockChain.timeRemaining > 900000) return '#4ECDC4';
    if (mockChain.timeRemaining > 300000) return '#FFD93D';
    return '#FF6B6B';
  };

  const handlePhotoPress = (photo: any, index: number) => {
    setSelectedPhotoIndex(index);
    setShowFullscreen(true);
  };

  const handleReactionAdd = (photoId: string, emoji: string) => {
    console.log(`Adding reaction ${emoji} to photo ${photoId}`);
    // TODO: Implement reaction service call
  };

  const handleNavigatePhoto = (direction: 'prev' | 'next') => {
    if (selectedPhotoIndex === null) return;
    
    if (direction === 'prev' && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    } else if (direction === 'next' && selectedPhotoIndex < mockChain.photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Layout style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Chain Header */}
          <Card style={[styles.headerCard, { borderTopColor: mockChain.prompt.color }]}>
            <Layout style={styles.headerContent}>
              <Layout style={styles.promptSection}>
                <Text category="h6" style={styles.promptTitle}>
                  {mockChain.prompt.title}
                </Text>
                <Text category="s1" style={styles.promptText}>
                  "{mockChain.prompt.description}"
                </Text>
              </Layout>
              
              <Layout style={styles.chainStats}>
                <Layout style={styles.statItem}>
                  <Clock size={16} color={getStatusColor()} />
                  <Text category="c1" style={[styles.statText, { color: getStatusColor() }]}>
                    {formatTimeRemaining(mockChain.timeRemaining)} left
                  </Text>
                </Layout>
                <Layout style={styles.statItem}>
                  <Users size={16} color="#666" />
                  <Text category="c1" style={styles.statText}>
                    {mockChain.participants.length} participants
                  </Text>
                </Layout>
              </Layout>
            </Layout>
          </Card>

          {/* Participants Progress */}
          <Layout style={styles.section}>
            <Text category="h6" style={styles.sectionTitle}>Chain Progress</Text>
            <Card style={styles.progressCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.participantsScroll}>
                {mockChain.participants.map((participant, index) => {
                  const hasPhoto = mockChain.photos.some(p => p.username === participant.username);
                  const isNext = !hasPhoto && index === mockChain.photos.length;
                  
                  return (
                    <Layout key={participant.username} style={styles.participantItem}>
                      <Layout style={[
                        styles.participantAvatar,
                        {
                          backgroundColor: hasPhoto ? '#E8F5E8' : isNext ? '#FFF5E8' : '#F5F5F5',
                          borderColor: isNext ? '#FF4D4D' : 'transparent',
                          borderWidth: isNext ? 2 : 0,
                        }
                      ]}>
                        <Text style={styles.avatarText}>{participant.avatar}</Text>
                      </Layout>
                      <Text category="c1" style={styles.participantName}>
                        {participant.username}
                      </Text>
                      <Text category="c2" style={[
                        styles.participantStatus,
                        { color: hasPhoto ? '#4ECDC4' : isNext ? '#FF4D4D' : '#CCC' }
                      ]}>
                        {hasPhoto ? '✓ Done' : isNext ? 'Current' : 'Waiting'}
                      </Text>
                    </Layout>
                  );
                })}
              </ScrollView>
            </Card>
          </Layout>

          {/* Photo Timeline */}
          <Layout style={styles.section}>
            <Text category="h6" style={styles.sectionTitle}>Photo Timeline</Text>
            <PhotoTimeline
              chainId={chainId}
              photos={mockChain.photos}
              participants={mockChain.participants}
              currentUserId="you"
              onPhotoPress={handlePhotoPress}
              onReactionAdd={handleReactionAdd}
            />
          </Layout>

          {/* Legacy Timeline (keeping for reference) */}
          <Layout style={[styles.section, { display: 'none' }]}>
            {mockChain.photos.map((photo, index) => (
              <Card key={photo.id} style={styles.photoCard}>
                <Layout style={styles.photoHeader}>
                  <Layout style={styles.photoUser}>
                    <Layout style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {mockChain.participants.find(p => p.username === photo.username)?.avatar}
                      </Text>
                    </Layout>
                    <Layout style={styles.userInfo}>
                      <Text category="s2" style={styles.username}>
                        {photo.username}
                      </Text>
                      <Text category="c1" appearance="hint">
                        {formatTimeAgo(photo.timestamp)}
                      </Text>
                    </Layout>
                  </Layout>
                  <Text category="c1" style={styles.positionText}>
                    #{photo.position}
                  </Text>
                </Layout>

                {/* Photo placeholder */}
                <Layout style={styles.photoPlaceholder}>
                  <Text category="h6" style={styles.photoPlaceholderText}>
                    📸
                  </Text>
                  <Text category="c1" appearance="hint">
                    Photo would appear here
                  </Text>
                </Layout>

                {/* Photo interpretation */}
                <Layout style={styles.photoContent}>
                  <Text category="s1" style={styles.interpretationText}>
                    {photo.interpretation}
                  </Text>
                  
                  <Layout style={styles.photoActions}>
                    <Layout style={styles.actionItem}>
                      <Heart
                        size={16}
                        color={photo.likes.includes('you') ? '#FF4D4D' : '#CCC'}
                        fill={photo.likes.includes('you') ? '#FF4D4D' : 'transparent'}
                      />
                      <Text category="c1" style={styles.actionText}>
                        {photo.likes.length}
                      </Text>
                    </Layout>
                    <Layout style={styles.actionItem}>
                      <MessageCircle size={16} color="#CCC" />
                      <Text category="c1" style={styles.actionText}>
                        0
                      </Text>
                    </Layout>
                  </Layout>
                </Layout>
              </Card>
            ))}

            {/* Next participant indicator */}
            {mockChain.status === 'active' && (
              <Card style={styles.nextCard}>
                <Layout style={styles.nextContent}>
                  <Clock size={24} color="#FFD93D" />
                  <Layout style={styles.nextText}>
                    <Text category="s1" style={styles.nextTitle}>
                      Waiting for next photo...
                    </Text>
                    <Text category="c1" appearance="hint">
                      {mockChain.participants[mockChain.photos.length]?.username} is up next
                    </Text>
                  </Layout>
                </Layout>
              </Card>
            )}
          </Layout>

          {/* Chain Actions */}
          <Layout style={styles.section}>
            {mockChain.status === 'completed' ? (
              <Button
                style={styles.actionButton}
                status="success"
                accessoryLeft={(props) => <Users {...props} size={16} />}
                onPress={handleViewCompletion}
              >
                View Completion
              </Button>
            ) : (
              <Button
                style={styles.actionButton}
                status="primary"
                accessoryLeft={(props) => <MessageCircle {...props} size={16} />}
                onPress={handleOpenChat}
              >
                Open Chat
              </Button>
            )}
            <Button
              style={styles.actionButton}
              appearance="outline"
              accessoryLeft={(props) => <Share {...props} size={16} />}
            >
              Share Chain
            </Button>
          </Layout>
        </ScrollView>

        {/* Fullscreen Photo Viewer */}
        <FullscreenImageViewer
          visible={showFullscreen}
          onClose={() => {
            setShowFullscreen(false);
            setSelectedPhotoIndex(null);
          }}
          chainPhoto={selectedPhotoIndex !== null ? mockChain.photos[selectedPhotoIndex] : undefined}
          chainPhotos={mockChain.photos}
          currentPhotoIndex={selectedPhotoIndex || 0}
          onNavigate={handleNavigatePhoto}
          onReactionAdd={handleReactionAdd}
          currentUserId="you"
          currentUsername="Current User"
        />
      </Layout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerCard: {
    marginVertical: 16,
    borderTopWidth: 4,
  },
  headerContent: {
    padding: 8,
  },
  promptSection: {
    marginBottom: 16,
  },
  promptTitle: {
    marginBottom: 8,
  },
  promptText: {
    fontStyle: 'italic',
  },
  chainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 6,
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  progressCard: {
    padding: 12,
  },
  participantsScroll: {
    flexDirection: 'row',
  },
  participantItem: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarText: {
    fontSize: 18,
  },
  participantName: {
    textAlign: 'center',
    fontSize: 10,
    marginBottom: 2,
  },
  participantStatus: {
    fontSize: 9,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  photoCard: {
    marginVertical: 8,
    overflow: 'hidden',
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  photoUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 14,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
  },
  positionText: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
  },
  photoPlaceholder: {
    height: 200,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    borderRadius: 8,
  },
  photoPlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  photoContent: {
    padding: 12,
  },
  interpretationText: {
    marginBottom: 12,
    lineHeight: 20,
  },
  photoActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 12,
  },
  nextCard: {
    marginTop: 12,
    backgroundColor: '#FFF9E6',
  },
  nextContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  nextText: {
    marginLeft: 12,
  },
  nextTitle: {
    marginBottom: 4,
  },
  actionButton: {
    marginVertical: 8,
  },
});