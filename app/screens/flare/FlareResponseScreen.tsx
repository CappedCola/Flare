import React, { useState, useEffect } from 'react';
import { Layout, Text, Card, Button, Spinner, Input } from '@ui-kitten/components';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Camera, Clock, Users, Eye, ArrowRight, Send, Image, MessageCircle } from 'lucide-react-native';
import { useFlareChains } from '../../hooks/useFlareChains';
import { useChainTimer } from '../../hooks/useChainTimer';
import { FlareChain } from '../../types';
import { ParticipantStatus } from '../../types/flare';
import { useAuth } from '../../context/AuthContext';

export const FlareResponseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, isAuthenticated } = useAuth();
  const currentUserId = user?.id || '';
  const { respondToChain, getChainById, subscribeToChain } = useFlareChains(currentUserId);
  
  const [chain, setChain] = useState<FlareChain | null>(null);
  const [loading, setLoading] = useState(true);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState('');
  const [responding, setResponding] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);

  // Get chainId from navigation params
  const chainId = (route.params as any)?.chainId || 'demo-chain';

  // Use timer hook for real-time countdown
  const {
    timeRemaining,
    status: timerStatus,
    formattedTime,
    isExpired,
    timerColor,
    statusText,
    progress
  } = useChainTimer(chainId, currentUserId);

  useEffect(() => {
    // Check authentication first
    if (!isAuthenticated || !user) {
      Alert.alert('Authentication Required', 'Please sign in to respond to chains.');
      navigation.goBack();
      return;
    }

    loadChain();
    setupRealtimeUpdates();
  }, [chainId, isAuthenticated, user]);

  const loadChain = async () => {
    try {
      setLoading(true);
      const chainData = await getChainById(chainId);
      
      if (chainData) {
        setChain(chainData);
        
        // Check if user has already responded or it's not their turn
        const userParticipant = chainData.participants.find(p => p.userId === currentUserId);
        if (userParticipant) {
          if (userParticipant.status === ParticipantStatus.RESPONDED) {
            setHasResponded(true);
          }
          // Note: We'll check for CURRENT_TURN status in the render logic
        }
      } else {
        Alert.alert('Error', 'Chain not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading chain:', error);
      Alert.alert('Error', 'Failed to load chain');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeUpdates = () => {
    const unsubscribe = subscribeToChain(chainId, (updatedChain) => {
      if (updatedChain) {
        setChain(updatedChain);
        
        // Check if user has responded or status changed
        const userParticipant = updatedChain.participants.find(p => p.userId === currentUserId);
        if (userParticipant) {
          if (userParticipant.status === ParticipantStatus.RESPONDED) {
            setHasResponded(true);
          }
        }
      }
    });

    return unsubscribe;
  };


  const handleViewChain = () => {
    navigation.navigate('FlareChainView' as never, { chainId } as never);
  };

  const handleTakeResponse = () => {
    if (isExpired) {
      Alert.alert('Time Expired', 'Sorry, the time limit for this chain has expired.');
      return;
    }

    Alert.alert(
      'Take Response Photo',
      'This will open the camera to capture your response to the chain.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // TODO: Integrate with camera screen
            // For now, simulate photo capture
            setCapturedPhotoUri('mock-response-photo-' + Date.now());
            Alert.alert('Photo Captured', 'Now add an interpretation and submit your response!');
          }
        },
      ]
    );
  };

  const handleSubmitResponse = async () => {
    if (!capturedPhotoUri) {
      Alert.alert('Photo Required', 'Please take a photo first.');
      return;
    }

    if (isExpired) {
      Alert.alert('Time Expired', 'Sorry, the time limit for this chain has expired.');
      return;
    }

    try {
      setResponding(true);
      
      await respondToChain(chainId, capturedPhotoUri, interpretation);
      
      setHasResponded(true);
      
      Alert.alert(
        'Response Submitted!',
        'Your photo has been added to the chain.',
        [
          {
            text: 'View Chain',
            onPress: () => handleViewChain()
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', 'Failed to submit response. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  const handleSkipTurn = () => {
    Alert.alert(
      'Skip Your Turn',
      'Are you sure you want to skip this chain? The chain will continue to the next person and you won\'t be able to participate.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive', 
          onPress: () => {
            setHasResponded(true);
            // TODO: Implement skip functionality in service
            navigation.goBack();
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Layout style={styles.loadingContainer}>
          <Spinner size="large" />
          <Text category="s1" style={styles.loadingText}>
            Loading chain...
          </Text>
        </Layout>
      </SafeAreaView>
    );
  }

  if (!chain) {
    return (
      <SafeAreaView style={styles.container}>
        <Layout style={styles.errorContainer}>
          <Text category="h6" style={styles.errorText}>
            Chain not found
          </Text>
          <Button appearance="ghost" onPress={() => navigation.goBack()}>
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
          {/* Timer Header */}
          <Card style={[styles.timerCard, { borderColor: timerColor }]}>
            <Layout style={styles.timerContent}>
              <Clock size={24} color={timerColor} />
              <Layout style={styles.timerText}>
                <Text category="h6" style={[styles.timerTime, { color: timerColor }]}>
                  {formattedTime}
                </Text>
                <Text category="c1" appearance="hint">
                  {statusText}
                </Text>
              </Layout>
              <Layout style={styles.urgencyIndicator}>
                <Text category="c2" style={[styles.urgencyText, { color: timerColor }]}>
                  {timerStatus.toUpperCase()}
                </Text>
              </Layout>
              {/* Progress bar */}
              <Layout style={styles.progressContainer}>
                <Layout style={[styles.progressBar, { width: `${progress}%`, backgroundColor: timerColor }]} />
              </Layout>
            </Layout>
          </Card>

          {/* Chain Info */}
          <Layout style={styles.section}>
            <Text category="h6" style={styles.sectionTitle}>Chain Prompt</Text>
            <Card style={[styles.promptCard, { borderLeftColor: chain.prompt.category ? '#FF6B6B' : '#FF4D4D' }]}>
              <Layout style={styles.promptContent}>
                <Layout style={styles.promptHeader}>
                  {chain.prompt.emoji && (
                    <Text style={styles.promptEmoji}>{chain.prompt.emoji}</Text>
                  )}
                  <Text category="h6" style={styles.promptTitle}>
                    {chain.prompt.title}
                  </Text>
                </Layout>
                <Text category="s1" style={styles.promptText}>
                  "{chain.prompt.description}"
                </Text>
              </Layout>
            </Card>
          </Layout>

          {/* Chain Progress - Sequential Turn Flow */}
          <Layout style={styles.section}>
            <Text category="h6" style={styles.sectionTitle}>Turn Sequence</Text>
            <Card style={styles.progressCard}>
              <Layout style={styles.participantsList}>
                {chain.participants.map((participant, index) => {
                  const isCurrentUser = participant.userId === currentUserId;
                  const hasResponded = participant.status === ParticipantStatus.RESPONDED;
                  const isCurrentTurn = participant.status === ParticipantStatus.CURRENT_TURN;
                  const isWaiting = participant.status === ParticipantStatus.WAITING_TURN;
                  const isExpired = participant.status === ParticipantStatus.TURN_EXPIRED;
                  
                  let backgroundColor = '#F5F5F5';
                  let borderColor = 'transparent';
                  let borderWidth = 0;
                  
                  if (hasResponded) {
                    backgroundColor = '#E8F5E8';
                  } else if (isCurrentTurn) {
                    backgroundColor = '#FFF5E8';
                    borderColor = '#FF4D4D';
                    borderWidth = 2;
                  } else if (isExpired) {
                    backgroundColor = '#FFE8E8';
                  }
                  
                  return (
                    <Layout key={participant.userId} style={styles.participantItem}>
                      <Layout style={[
                        styles.participantAvatar,
                        { backgroundColor, borderColor, borderWidth }
                      ]}>
                        <Text style={styles.avatarText}>
                          {isCurrentUser ? '👤' : '👤'}
                        </Text>
                      </Layout>
                      <Text category="c1" style={styles.participantName}>
                        {isCurrentUser ? 'You' : participant.username}
                      </Text>
                      <Text category="c2" style={[
                        styles.statusText, 
                        { color: hasResponded ? '#4ECDC4' : 
                                isCurrentTurn ? '#FF4D4D' : 
                                isExpired ? '#95A5A6' : '#666' }
                      ]}>
                        {hasResponded ? '✓ Done' : 
                         isCurrentTurn ? (isCurrentUser ? 'Your turn!' : 'Taking photo...') :
                         isExpired ? 'Expired' :
                         isWaiting ? 'Waiting' : 'Pending'}
                      </Text>
                      {index < chain.participants.length - 1 && (
                        <Text style={styles.arrowText}>→</Text>
                      )}
                    </Layout>
                  );
                })}
              </Layout>
            </Card>
          </Layout>

          {/* Previous Photos */}
          <Layout style={styles.section}>
            <Layout style={styles.sectionHeader}>
              <Text category="h6" style={styles.sectionTitle}>Previous Photos</Text>
              <Button
                size="tiny"
                appearance="ghost"
                onPress={handleViewChain}
                accessoryLeft={(props) => <Eye {...props} size={16} />}
              >
                View All
              </Button>
            </Layout>
            <Text category="c1" appearance="hint" style={styles.photoCount}>
              {chain.photos.length} photos so far
            </Text>
          </Layout>

          {/* Response Interface */}
          {!hasResponded && !isExpired && chain.participants.find(p => p.userId === currentUserId)?.status === ParticipantStatus.CURRENT_TURN ? (
            <Layout style={styles.section}>
              {/* Photo Capture */}
              <Card style={[styles.photoCard, capturedPhotoUri && styles.photoCardCompleted]}>
                <Layout style={styles.photoContent}>
                  {capturedPhotoUri ? (
                    <Image size={24} color="#4ECDC4" />
                  ) : (
                    <Camera size={24} color="#FF4D4D" />
                  )}
                  <Layout style={styles.photoText}>
                    <Text category="s2" style={styles.photoTitle}>
                      {capturedPhotoUri ? 'Photo Ready!' : 'Capture Your Response'}
                    </Text>
                    <Text category="c1" appearance="hint">
                      {capturedPhotoUri ? 'Add interpretation below' : 'Take a photo to respond to this chain'}
                    </Text>
                  </Layout>
                  <Button
                    size="small"
                    status={capturedPhotoUri ? "success" : "primary"}
                    onPress={handleTakeResponse}
                    accessoryLeft={(props) => capturedPhotoUri ? <Image {...props} size={16} /> : <Camera {...props} size={16} />}
                  >
                    {capturedPhotoUri ? 'Retake' : 'Take Photo'}
                  </Button>
                </Layout>
              </Card>

              {/* Interpretation Input */}
              {capturedPhotoUri && (
                <Card style={styles.interpretationCard}>
                  <Layout style={styles.interpretationContent}>
                    <Text category="s2" style={styles.interpretationTitle}>
                      Add Your Interpretation (Optional)
                    </Text>
                    <Input
                      style={styles.interpretationInput}
                      value={interpretation}
                      onChangeText={setInterpretation}
                      placeholder="Describe your photo or share your thoughts..."
                      multiline
                      textStyle={styles.interpretationTextStyle}
                      maxLength={100}
                    />
                    <Text category="c2" appearance="hint" style={styles.characterCount}>
                      {interpretation.length}/100 characters
                    </Text>
                  </Layout>
                </Card>
              )}

              {/* Submit Button */}
              <Button
                style={styles.responseButton}
                status="primary"
                size="large"
                disabled={!capturedPhotoUri || responding}
                onPress={handleSubmitResponse}
                accessoryLeft={responding ? (props) => <Spinner {...props} size="small" /> : (props) => <Send {...props} size={20} />}
              >
                {responding ? 'Submitting...' : 'Submit Response'}
              </Button>

              <Button
                style={styles.skipButton}
                appearance="ghost"
                onPress={handleSkipTurn}
                disabled={responding}
              >
                Skip My Turn
              </Button>
            </Layout>
          ) : !hasResponded && chain.participants.find(p => p.userId === currentUserId)?.status === ParticipantStatus.WAITING_TURN ? (
            <Layout style={styles.section}>
              <Card style={styles.waitingCard}>
                <Layout style={styles.waitingContent}>
                  <Clock size={32} color="#FFD93D" />
                  <Text category="h6" style={styles.waitingText}>
                    Waiting for Your Turn
                  </Text>
                  <Text category="c1" appearance="hint" style={styles.waitingSubtext}>
                    {(() => {
                      const currentParticipant = chain.participants.find(p => p.status === ParticipantStatus.CURRENT_TURN);
                      return currentParticipant 
                        ? `${currentParticipant.username === 'current-user' ? 'Someone' : currentParticipant.username} is currently taking their photo`
                        : 'Chain is progressing...';
                    })()}
                  </Text>
                  <Button
                    style={styles.viewChainButton}
                    appearance="outline"
                    onPress={handleViewChain}
                    accessoryLeft={(props) => <Eye {...props} size={16} />}
                  >
                    View Chain So Far
                  </Button>
                </Layout>
              </Card>
            </Layout>
          ) : hasResponded ? (
            <Layout style={styles.section}>
              <Card style={styles.completedCard}>
                <Layout style={styles.completedContent}>
                  <Text category="h6" style={styles.completedText}>
                    ✓ Response Submitted
                  </Text>
                  <Text category="c1" appearance="hint">
                    {(() => {
                      const remainingParticipants = chain.participants.filter(p => 
                        p.status === ParticipantStatus.WAITING_TURN || p.status === ParticipantStatus.CURRENT_TURN
                      );
                      return remainingParticipants.length > 0 
                        ? `Waiting for ${remainingParticipants.length} more participant${remainingParticipants.length > 1 ? 's' : ''}...`
                        : 'Chain completed!';
                    })()}
                  </Text>
                  <Button
                    style={styles.viewChainButton}
                    appearance="outline"
                    onPress={handleViewChain}
                    accessoryLeft={(props) => <Eye {...props} size={16} />}
                  >
                    View Full Chain
                  </Button>
                </Layout>
              </Card>
            </Layout>
          ) : isExpired ? (
            <Layout style={styles.section}>
              <Card style={styles.expiredCard}>
                <Layout style={styles.expiredContent}>
                  <Clock size={32} color="#95A5A6" />
                  <Text category="h6" style={styles.expiredText}>
                    Time Expired
                  </Text>
                  <Text category="c1" appearance="hint" style={styles.expiredSubtext}>
                    Sorry, the time limit for this chain has expired.
                  </Text>
                  <Button
                    style={styles.viewChainButton}
                    appearance="outline"
                    onPress={handleViewChain}
                    accessoryLeft={(props) => <Eye {...props} size={16} />}
                  >
                    View Chain
                  </Button>
                </Layout>
              </Card>
            </Layout>
          ) : null}
        </ScrollView>
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
  timerCard: {
    marginVertical: 16,
    borderWidth: 2,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  timerText: {
    flex: 1,
    marginLeft: 12,
  },
  timerTime: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  urgencyIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  promptCard: {
    borderLeftWidth: 4,
  },
  promptContent: {
    padding: 4,
  },
  promptTitle: {
    marginBottom: 8,
  },
  promptText: {
    fontStyle: 'italic',
  },
  progressCard: {
    padding: 12,
  },
  participantsList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  participantItem: {
    alignItems: 'center',
    marginVertical: 8,
    minWidth: 60,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 20,
  },
  participantName: {
    textAlign: 'center',
    fontSize: 10,
  },
  statusText: {
    color: '#4ECDC4',
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentText: {
    color: '#FF4D4D',
    fontSize: 10,
    fontWeight: 'bold',
  },
  photoCount: {
    marginTop: 4,
  },
  responseButton: {
    marginVertical: 8,
  },
  skipButton: {
    marginVertical: 4,
  },
  completedCard: {
    backgroundColor: '#E8F5E8',
  },
  completedContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  completedText: {
    color: '#4ECDC4',
    marginBottom: 8,
  },
  // New styles for enhanced UI
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  progressBar: {
    height: '100%',
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  promptEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  photoCard: {
    marginVertical: 8,
  },
  photoCardCompleted: {
    borderColor: '#4ECDC4',
    borderWidth: 1,
  },
  photoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  photoText: {
    flex: 1,
    marginHorizontal: 16,
  },
  photoTitle: {
    marginBottom: 4,
  },
  interpretationCard: {
    marginVertical: 8,
  },
  interpretationContent: {
    padding: 12,
  },
  interpretationTitle: {
    marginBottom: 12,
  },
  interpretationInput: {
    marginBottom: 8,
  },
  interpretationTextStyle: {
    minHeight: 60,
  },
  characterCount: {
    textAlign: 'right',
  },
  expiredCard: {
    backgroundColor: '#F5F5F5',
  },
  expiredContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  expiredText: {
    color: '#95A5A6',
    marginVertical: 12,
  },
  expiredSubtext: {
    textAlign: 'center',
    marginBottom: 16,
  },
  viewChainButton: {
    marginTop: 8,
  },
  // New styles for sequential turn flow
  waitingCard: {
    backgroundColor: '#FFF9E6',
  },
  waitingContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  waitingText: {
    color: '#FFD93D',
    marginVertical: 12,
  },
  waitingSubtext: {
    textAlign: 'center',
    marginBottom: 16,
  },
  arrowText: {
    fontSize: 16,
    color: '#CCC',
    marginHorizontal: 4,
  },
});