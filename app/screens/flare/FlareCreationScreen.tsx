import React, { useState, useEffect } from 'react';
import { Layout, Text, Card, Button, Input, Spinner } from '@ui-kitten/components';
import { StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Camera, Users, Clock, ArrowRight, Check, X, Image } from 'lucide-react-native';
import { useFlareChains } from '../../hooks/useFlareChains';
import { ChainPrompt, User } from '../../types';
import { PromptType, PromptCategoryType } from '../../types/flare';
import { getUserFriends } from '../../services/firebaseService';

export const FlareCreationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { createChain, loading: chainLoading } = useFlareChains('current-user-id'); // TODO: Get from auth context
  
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [maxParticipants, setMaxParticipants] = useState('5');
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [creating, setCreating] = useState(false);

  // Get params from navigation
  const params = route.params as any;
  const prompt = params?.prompt as ChainPrompt;
  const photoUri = params?.photoUri as string;
  const photoOrientation = params?.photoOrientation as 'portrait' | 'landscape';

  useEffect(() => {
    loadFriends();
    
    // If photo is passed from camera, use it directly
    if (photoUri) {
      setCapturedPhotoUri(photoUri);
    }
  }, [photoUri]);

  const loadFriends = async () => {
    try {
      setLoadingFriends(true);
      // TODO: Get current user ID from auth context
      const userFriends = await getUserFriends('current-user-id');
      setFriends(userFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends list');
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleTakePhoto = () => {
    // If photo was passed from camera, allow retaking by going back to camera
    if (photoUri) {
      Alert.alert(
        'Retake Photo',
        'This will go back to the camera to capture a new photo.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Retake', 
            onPress: () => {
              navigation.goBack(); // Go back to camera
            }
          },
        ]
      );
    } else {
      // Fallback for direct navigation (shouldn't happen with new flow)
      Alert.alert(
        'Take Photo',
        'This will open the camera to capture your chain-starting photo.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              // Simulate photo capture for demo
              setCapturedPhotoUri('mock-photo-uri-' + Date.now());
              Alert.alert('Photo Captured', 'Photo captured successfully! Now select friends to invite.');
            }
          },
        ]
      );
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else if (prev.length < parseInt(maxParticipants) - 1) {
        return [...prev, friendId];
      } else {
        Alert.alert('Maximum Reached', `You can only invite ${parseInt(maxParticipants) - 1} friends.`);
        return prev;
      }
    });
  };

  const handleCreateChain = async () => {
    // If no prompt provided (camera flow), create a default one
    const chainPrompt = prompt || {
      id: 'camera-default',
      title: 'Share the Moment',
      description: 'Share what you captured',
      type: PromptType.DAILY,
      category: PromptCategoryType.CONNECTION,
      isActive: true,
      popularity: 0,
      createdAt: new Date(),
      emoji: '📸'
    };

    if (selectedFriends.length < 2) {
      Alert.alert('Minimum Friends', 'Please select at least 2 friends to start a chain.');
      return;
    }

    if (!capturedPhotoUri) {
      Alert.alert('Photo Required', 'Please take a photo to start the chain.');
      return;
    }

    try {
      setCreating(true);
      
      const newChain = await createChain(chainPrompt, selectedFriends, capturedPhotoUri);
      
      Alert.alert(
        'Chain Created!',
        `Your "${chainPrompt.title}" chain has been started with ${selectedFriends.length} friends.`,
        [
          {
            text: 'View Chain',
            onPress: () => {
              navigation.navigate('FlareChainView' as never, { chainId: newChain.id } as never);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating chain:', error);
      Alert.alert('Error', 'Failed to create chain. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderFriendItem = ({ item }: { item: User }) => {
    const isSelected = selectedFriends.includes(item.id);
    
    return (
      <Card 
        style={[styles.friendCard, isSelected && styles.friendCardSelected]}
        onPress={() => toggleFriendSelection(item.id)}
      >
        <Layout style={styles.friendContent}>
          <Layout style={styles.friendInfo}>
            <Text style={styles.friendAvatar}>👤</Text>
            <Layout style={styles.friendText}>
              <Text category="s2" style={styles.friendName}>
                {item.displayName}
              </Text>
              <Text category="c1" appearance="hint">
                @{item.username}
              </Text>
            </Layout>
          </Layout>
          <Layout style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorSelected]}>
            {isSelected ? (
              <Check size={16} color="#FFFFFF" />
            ) : null}
          </Layout>
        </Layout>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Layout style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Layout style={styles.header}>
            <Text category="h4" style={styles.title}>Create Chain</Text>
            <Text category="s1" appearance="hint" style={styles.subtitle}>
              Set up your photo chain
            </Text>
          </Layout>

          {/* Selected Prompt */}
          {prompt ? (
            <Layout style={styles.section}>
              <Text category="h6" style={styles.sectionTitle}>Your Prompt</Text>
              <Card style={[styles.promptCard, { borderLeftColor: '#FF4D4D' }]}>
                <Layout style={styles.promptContent}>
                  <Text category="h6" style={styles.promptTitle}>
                    {prompt.title}
                  </Text>
                  <Text category="s1" style={styles.promptText}>
                    "{prompt.description}"
                  </Text>
                </Layout>
              </Card>
            </Layout>
          ) : photoUri ? (
            <Layout style={styles.section}>
              <Text category="h6" style={styles.sectionTitle}>Chain Theme</Text>
              <Card style={[styles.promptCard, { borderLeftColor: '#FF4D4D' }]}>
                <Layout style={styles.promptContent}>
                  <Text category="h6" style={styles.promptTitle}>
                    Share the Moment
                  </Text>
                  <Text category="s1" style={styles.promptText}>
                    "Share what you captured"
                  </Text>
                </Layout>
              </Card>
            </Layout>
          ) : null}

          {/* Photo Step */}
          <Layout style={styles.section}>
            <Text category="h6" style={styles.sectionTitle}>1. Take Your Photo</Text>
            <Card style={[styles.stepCard, capturedPhotoUri && styles.stepCardCompleted]}>
              <Layout style={styles.stepContent}>
                {capturedPhotoUri ? (
                  <Image size={32} color="#4ECDC4" />
                ) : (
                  <Camera size={32} color="#FF4D4D" />
                )}
                <Layout style={styles.stepText}>
                  <Text category="s1" style={styles.stepTitle}>
                    {capturedPhotoUri ? 'Photo ready!' : 'Start the chain with your interpretation'}
                  </Text>
                  <Text category="c1" appearance="hint">
                    {capturedPhotoUri 
                      ? photoUri ? 'Photo received from camera' : 'Ready to create chain with this photo'
                      : 'Take a photo that responds to the prompt above'
                    }
                  </Text>
                </Layout>
                <Button
                  size="small"
                  status={capturedPhotoUri ? "success" : "primary"}
                  onPress={handleTakePhoto}
                  accessoryLeft={(props) => 
                    capturedPhotoUri ? <Check {...props} size={16} /> : <Camera {...props} size={16} />
                  }
                >
                  {capturedPhotoUri ? 'Retake' : 'Take Photo'}
                </Button>
              </Layout>
            </Card>
          </Layout>

          {/* Friends Step */}
          <Layout style={styles.section}>
            <Text category="h6" style={styles.sectionTitle}>2. Invite Friends ({selectedFriends.length} selected)</Text>
            
            {loadingFriends ? (
              <Card style={styles.loadingCard}>
                <Layout style={styles.loadingContent}>
                  <Spinner size="small" />
                  <Text category="s1" style={styles.loadingText}>Loading friends...</Text>
                </Layout>
              </Card>
            ) : friends.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Layout style={styles.emptyContent}>
                  <Users size={32} color="#CCC" />
                  <Text category="s1" style={styles.emptyText}>No friends found</Text>
                  <Text category="c1" appearance="hint">Add friends to start creating chains!</Text>
                </Layout>
              </Card>
            ) : (
              <Layout style={styles.friendsList}>
                <FlatList
                  data={friends}
                  renderItem={renderFriendItem}
                  keyExtractor={(item) => item.id}
                  style={styles.friendsListContainer}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              </Layout>
            )}
          </Layout>

          {/* Settings */}
          <Layout style={styles.section}>
            <Text category="h6" style={styles.sectionTitle}>3. Chain Settings</Text>
            <Card style={styles.settingsCard}>
              <Layout style={styles.settingItem}>
                <Clock size={24} color="#FFD93D" />
                <Layout style={styles.settingText}>
                  <Text category="s1">Time Limit</Text>
                  <Text category="c1" appearance="hint">
                    Each person has 60 minutes to respond
                  </Text>
                </Layout>
              </Layout>
              <Layout style={styles.settingItem}>
                <Text category="label" style={styles.inputLabel}>
                  Max Participants
                </Text>
                <Input
                  style={styles.input}
                  value={maxParticipants}
                  onChangeText={setMaxParticipants}
                  keyboardType="numeric"
                  placeholder="5"
                  maxLength={1}
                />
              </Layout>
            </Card>
          </Layout>

          {/* Create Button */}
          <Layout style={styles.section}>
            <Button
              style={styles.createButton}
              status="primary"
              size="large"
              disabled={!capturedPhotoUri || selectedFriends.length < 2 || creating}
              onPress={handleCreateChain}
              accessoryLeft={creating ? (props) => <Spinner {...props} size="small" /> : undefined}
              accessoryRight={!creating ? (props) => <ArrowRight {...props} size={20} /> : undefined}
            >
              {creating ? 'Creating Chain...' : 'Create Chain'}
            </Button>
            <Text category="c1" appearance="hint" style={styles.createHint}>
              {!capturedPhotoUri 
                ? photoUri ? 'Photo received - select friends' : 'Take a photo first' 
                : selectedFriends.length < 2 
                  ? 'Select at least 2 friends'
                  : `Ready to create chain with ${selectedFriends.length} friends`
              }
            </Text>
          </Layout>
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
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
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
  stepCard: {
    marginVertical: 4,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  stepText: {
    flex: 1,
    marginHorizontal: 16,
  },
  stepTitle: {
    marginBottom: 4,
  },
  settingsCard: {
    padding: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  settingText: {
    flex: 1,
    marginLeft: 16,
  },
  inputLabel: {
    flex: 1,
  },
  input: {
    width: 60,
  },
  createButton: {
    marginVertical: 8,
  },
  createHint: {
    textAlign: 'center',
    marginTop: 8,
  },
  // New styles for enhanced UI
  stepCardCompleted: {
    borderColor: '#4ECDC4',
    borderWidth: 1,
  },
  loadingCard: {
    marginVertical: 8,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 12,
  },
  emptyCard: {
    marginVertical: 8,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 12,
    marginBottom: 4,
  },
  friendsList: {
    marginVertical: 8,
  },
  friendsListContainer: {
    maxHeight: 300,
  },
  friendCard: {
    marginVertical: 4,
  },
  friendCardSelected: {
    borderColor: '#FF4D4D',
    borderWidth: 2,
  },
  friendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  friendText: {
    flex: 1,
  },
  friendName: {
    marginBottom: 2,
    fontWeight: 'bold',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicatorSelected: {
    backgroundColor: '#FF4D4D',
    borderColor: '#FF4D4D',
  },
});