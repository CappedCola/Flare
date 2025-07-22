import React, { useState, useEffect } from 'react';
import { Layout, Text, Card, Button, Spinner } from '@ui-kitten/components';
import { StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Clock, Users, Heart, MessageCircle, Share, ArrowLeft } from 'lucide-react-native';
import { PhotoTimeline } from '../../components/PhotoTimeline';
import { FullscreenImageViewer } from '../../components/FullscreenImageViewer';
import { FlareChain, ChainParticipant } from '../../types';
import { ParticipantStatus, ChainStatus } from '../../types/flare';
import { flareChainService } from '../../services/flareChainService';
import { useAuth } from '../../context/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

export const FlareChainViewScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const chainId = (route.params as any)?.chainId;
  
  const [chain, setChain] = useState<FlareChain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Load chain data from Firebase
  useEffect(() => {
    const loadChain = async () => {
      if (!chainId) {
        setError('No chain ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Loading chain data for ID:', chainId);
        const chainData = await flareChainService.getChainById(chainId);
        
        if (!chainData) {
          setError('Chain not found');
          setLoading(false);
          return;
        }
        
        console.log('✅ Chain data loaded:', chainData);
        setChain(chainData);
      } catch (err) {
        console.error('❌ Error loading chain:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chain');
      } finally {
        setLoading(false);
      }
    };

    loadChain();
  }, [chainId]);

  const handleOpenChat = async () => {
    if (!chainId) return;
    
    try {
      // Check if chat is available for this chain
      const { chatService } = await import('../../services/chatService');
      const chatRoom = await chatService.getChatRoomByChainId(chainId);
      
      if (!chatRoom) {
        Alert.alert(
          'Chat Not Available',
          'This chain does not have a chat room yet. Chat will be available once the chain is fully set up.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Navigate to chat
      navigation.navigate('FlareChat' as never, { chainId } as never);
    } catch (error) {
      console.error('Error checking chat availability:', error);
      Alert.alert(
        'Chat Error',
        'Unable to access chat at this time. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleViewCompletion = () => {
    if (chainId) {
      navigation.navigate('FlareCompletion' as never, { chainId } as never);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      return `${hours}h ${remainingMins}m`;
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (expiresAt: Date) => {
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    
    if (diffMs <= 0) return '#95A5A6'; // Expired
    if (diffMs > 900000) return '#4ECDC4'; // > 15 minutes - green
    if (diffMs > 300000) return '#FFD93D'; // > 5 minutes - yellow
    return '#FF6B6B'; // < 5 minutes - red
  };

  const getParticipantStatusText = (participant: ChainParticipant) => {
    switch (participant.status) {
      case ParticipantStatus.RESPONDED:
        return '✓ Done';
      case ParticipantStatus.CURRENT_TURN:
        return 'Current';
      case ParticipantStatus.WAITING_TURN:
        return 'Waiting';
      case ParticipantStatus.TURN_EXPIRED:
        return 'Expired';
      case ParticipantStatus.SKIPPED:
        return 'Skipped';
      default:
        return 'Waiting';
    }
  };

  const getParticipantStatusColor = (participant: ChainParticipant) => {
    switch (participant.status) {
      case ParticipantStatus.RESPONDED:
        return '#4ECDC4';
      case ParticipantStatus.CURRENT_TURN:
        return '#FF4D4D';
      case ParticipantStatus.WAITING_TURN:
        return '#CCC';
      case ParticipantStatus.TURN_EXPIRED:
      case ParticipantStatus.SKIPPED:
        return '#95A5A6';
      default:
        return '#CCC';
    }
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
    if (selectedPhotoIndex === null || !chain) return;
    
    if (direction === 'prev' && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    } else if (direction === 'next' && selectedPhotoIndex < chain.photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Layout style={[styles.container, styles.centered]}>
          <Spinner size="large" />
          <Text category="s1" style={styles.loadingText}>Loading chain...</Text>
        </Layout>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !chain) {
    return (
      <SafeAreaView style={styles.container}>
        <Layout style={[styles.container, styles.centered]}>
          <Text category="h6" style={styles.errorTitle}>Chain Not Found</Text>
          <Text category="s1" appearance="hint" style={styles.errorText}>
            {error || 'This chain does not exist or you do not have access to it.'}
          </Text>
          <Button
            style={styles.errorButton}
            status="basic"
            accessoryLeft={(props) => <ArrowLeft {...props} size={16} />}
            onPress={handleBack}
          >
            Go Back
          </Button>
        </Layout>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Layout style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Chain Header */}
          <Card style={[styles.headerCard, { borderTopColor: chain.prompt?.emoji ? '#4ECDC4' : '#FF6B6B' }]}>
            <Layout style={styles.headerContent}>
              <Layout style={styles.promptSection}>
                <Text category="h6" style={styles.promptTitle}>
                  {chain.prompt?.emoji} {chain.prompt?.title || 'Flare Chain'}
                </Text>
                <Text category="s1" style={styles.promptText}>
                  "{chain.prompt?.description || 'Share your moment'}"
                </Text>
              </Layout>
              
              <Layout style={styles.chainStats}>
                <Layout style={styles.statItem}>
                  <Clock size={16} color={getStatusColor(chain.currentTurnExpiresAt)} />
                  <Text category="c1" style={[styles.statText, { color: getStatusColor(chain.currentTurnExpiresAt) }]}>
                    {formatTimeRemaining(chain.currentTurnExpiresAt)} left
                  </Text>
                </Layout>
                <Layout style={styles.statItem}>
                  <Users size={16} color="#666" />
                  <Text category="c1" style={styles.statText}>
                    {chain.participants.length} participants
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
                {chain.participants.map((participant, index) => {
                  const statusColor = getParticipantStatusColor(participant);
                  const statusText = getParticipantStatusText(participant);
                  const isCurrentTurn = participant.status === ParticipantStatus.CURRENT_TURN;
                  
                  return (
                    <Layout key={participant.userId} style={styles.participantItem}>
                      <Layout style={[
                        styles.participantAvatar,
                        {
                          backgroundColor: participant.status === ParticipantStatus.RESPONDED 
                            ? '#E8F5E8' 
                            : isCurrentTurn 
                              ? '#FFF5E8' 
                              : '#F5F5F5',
                          borderColor: isCurrentTurn ? '#FF4D4D' : 'transparent',
                          borderWidth: isCurrentTurn ? 2 : 0,
                        }
                      ]}>
                        <Text style={styles.avatarText}>
                          {participant.avatar || (participant.username?.charAt(0).toUpperCase() || '👤')}
                        </Text>
                      </Layout>
                      <Text category="c1" style={styles.participantName}>
                        {participant.username}
                      </Text>
                      <Text category="c2" style={[
                        styles.participantStatus,
                        { color: statusColor }
                      ]}>
                        {statusText}
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
              photos={chain.photos || []}
              participants={chain.participants}
              currentUserId={user?.id || 'anonymous'}
              onPhotoPress={handlePhotoPress}
              onReactionAdd={handleReactionAdd}
            />
          </Layout>

          {/* Chain Actions */}
          <Layout style={styles.section}>
            {chain.status === ChainStatus.COMPLETED ? (
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
          chainPhoto={selectedPhotoIndex !== null && chain.photos ? chain.photos[selectedPhotoIndex] : undefined}
          chainPhotos={chain.photos || []}
          currentPhotoIndex={selectedPhotoIndex || 0}
          onNavigate={handleNavigatePhoto}
          onReactionAdd={handleReactionAdd}
          currentUserId={user?.id || 'anonymous'}
          currentUsername={user?.username || 'You'}
        />
      </Layout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
  },
  errorTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorButton: {
    marginTop: 12,
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