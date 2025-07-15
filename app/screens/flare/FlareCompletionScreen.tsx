import React, { useEffect, useRef } from 'react';
import { Layout, Text, Card, Button } from '@ui-kitten/components';
import { StyleSheet, ScrollView, Animated, Dimensions, Share as ShareAPI } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Trophy, Clock, Users, Heart, Share, Download, MessageCircle } from 'lucide-react-native';
import { ChainCompletionData } from '../types';

const { width: screenWidth } = Dimensions.get('window');

// Mock completion data
const mockCompletionData: ChainCompletionData = {
  chainId: 'demo-chain-completed',
  totalPhotos: 4,
  participants: [
    { userId: '1', username: 'alice_photo', avatar: '👩‍🎨', status: 'responded' as any, position: 0, invitedAt: new Date(), respondedAt: new Date() },
    { userId: '2', username: 'bob_creative', avatar: '👨‍💻', status: 'responded' as any, position: 1, invitedAt: new Date(), respondedAt: new Date() },
    { userId: '3', username: 'you', avatar: '👤', status: 'responded' as any, position: 2, invitedAt: new Date(), respondedAt: new Date() },
    { userId: '4', username: 'charlie_lens', avatar: '📸', status: 'responded' as any, position: 3, invitedAt: new Date(), respondedAt: new Date() },
  ],
  completedAt: new Date(),
  duration: 180, // 3 hours
  highlights: {
    fastestResponse: { username: 'alice_photo', time: 8 }, // 8 minutes
    mostReactions: { photoId: 'photo-2', username: 'bob_creative', count: 12 },
    participationRate: 100, // 100%
  },
};

export const FlareCompletionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Animation values
  const confettiAnims = useRef([...Array(20)].map(() => ({
    translateY: new Animated.Value(-100),
    translateX: new Animated.Value(Math.random() * screenWidth),
    rotate: new Animated.Value(0),
    opacity: new Animated.Value(1),
  }))).current;
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const chainId = (route.params as any)?.chainId || 'demo-chain';
  const completionData = mockCompletionData; // TODO: Load from service

  useEffect(() => {
    startCelebrationAnimation();
  }, []);

  const startCelebrationAnimation = () => {
    // Trophy scale animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Content fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Confetti animation
    const confettiAnimations = confettiAnims.map((anim, index) => {
      return Animated.parallel([
        Animated.timing(anim.translateY, {
          toValue: screenWidth + 200,
          duration: 3000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: 1,
          duration: 3000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 3000,
          delay: 2000,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(100, confettiAnimations).start();
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  const handleShareChain = async () => {
    try {
      const shareMessage = `🎉 Just completed an amazing Flare Chain!\n\n` +
        `📸 ${completionData.totalPhotos} photos from ${completionData.participants.length} friends\n` +
        `⏱️ Completed in ${formatDuration(completionData.duration)}\n` +
        `🏆 ${completionData.highlights.participationRate}% participation rate\n\n` +
        `Join the fun on Flare! 🔥`;

      await ShareAPI.share({
        message: shareMessage,
        title: 'Flare Chain Completed!',
      });
    } catch (error) {
      console.error('Error sharing chain:', error);
    }
  };

  const handleViewChain = () => {
    navigation.navigate('FlareChainView' as never, { chainId } as never);
  };

  const handleStartNewChain = () => {
    navigation.navigate('FlarePrompt' as never);
  };

  const getConfettiColor = (index: number): string => {
    const colors = ['#FF4D4D', '#FFD93D', '#4ECDC4', '#FF6B6B', '#95E1D3', '#F8B500'];
    return colors[index % colors.length];
  };

  return (
    <SafeAreaView style={styles.container}>
      <Layout style={styles.container}>
        {/* Confetti Animation */}
        {confettiAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: getConfettiColor(index),
                transform: [
                  { translateX: anim.translateX },
                  { translateY: anim.translateY },
                  {
                    rotate: anim.rotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: anim.opacity,
              },
            ]}
          />
        ))}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Layout style={styles.content}>
            {/* Header */}
            <Layout style={styles.headerSection}>
              <Animated.View style={[styles.trophyContainer, { transform: [{ scale: scaleAnim }] }]}>
                <Trophy size={80} color="#FFD93D" />
              </Animated.View>
              
              <Animated.View style={{ opacity: fadeAnim }}>
                <Text category="h2" style={styles.title}>
                  Chain Complete! 🎉
                </Text>
                <Text category="s1" style={styles.subtitle}>
                  Amazing work, everyone! Your Flare Chain is now complete.
                </Text>
              </Animated.View>
            </Layout>

            {/* Stats Overview */}
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Card style={styles.statsCard}>
                <Layout style={styles.statsGrid}>
                  <Layout style={styles.statItem}>
                    <Text category="h4" style={styles.statNumber}>
                      {completionData.totalPhotos}
                    </Text>
                    <Text category="c1" appearance="hint">
                      Photos
                    </Text>
                  </Layout>
                  
                  <Layout style={styles.statItem}>
                    <Text category="h4" style={styles.statNumber}>
                      {completionData.participants.length}
                    </Text>
                    <Text category="c1" appearance="hint">
                      Participants
                    </Text>
                  </Layout>
                  
                  <Layout style={styles.statItem}>
                    <Text category="h4" style={styles.statNumber}>
                      {formatDuration(completionData.duration)}
                    </Text>
                    <Text category="c1" appearance="hint">
                      Duration
                    </Text>
                  </Layout>
                </Layout>
              </Card>
            </Animated.View>

            {/* Highlights */}
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Text category="h6" style={styles.sectionTitle}>
                Chain Highlights
              </Text>
              
              <Card style={styles.highlightCard}>
                <Layout style={styles.highlightItem}>
                  <Clock size={24} color="#4ECDC4" />
                  <Layout style={styles.highlightText}>
                    <Text category="s2" style={styles.highlightTitle}>
                      Fastest Response
                    </Text>
                    <Text category="s1">
                      {completionData.highlights.fastestResponse.username} in {completionData.highlights.fastestResponse.time} minutes
                    </Text>
                  </Layout>
                </Layout>
              </Card>

              <Card style={styles.highlightCard}>
                <Layout style={styles.highlightItem}>
                  <Heart size={24} color="#FF4D4D" />
                  <Layout style={styles.highlightText}>
                    <Text category="s2" style={styles.highlightTitle}>
                      Most Popular Photo
                    </Text>
                    <Text category="s1">
                      {completionData.highlights.mostReactions.username}'s photo with {completionData.highlights.mostReactions.count} reactions
                    </Text>
                  </Layout>
                </Layout>
              </Card>

              <Card style={styles.highlightCard}>
                <Layout style={styles.highlightItem}>
                  <Users size={24} color="#95E1D3" />
                  <Layout style={styles.highlightText}>
                    <Text category="s2" style={styles.highlightTitle}>
                      Participation Rate
                    </Text>
                    <Text category="s1">
                      {completionData.highlights.participationRate}% - Everyone participated!
                    </Text>
                  </Layout>
                </Layout>
              </Card>
            </Animated.View>

            {/* Participants */}
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Text category="h6" style={styles.sectionTitle}>
                Chain Participants
              </Text>
              
              <Card style={styles.participantsCard}>
                <Layout style={styles.participantsList}>
                  {completionData.participants.map((participant, index) => (
                    <Layout key={participant.userId} style={styles.participantItem}>
                      <Layout style={styles.participantAvatar}>
                        <Text style={styles.participantEmoji}>
                          {participant.avatar}
                        </Text>
                      </Layout>
                      <Text category="s2" style={styles.participantName}>
                        {participant.username === 'you' ? 'You' : participant.username}
                      </Text>
                      <Layout style={styles.participantBadge}>
                        <Text category="c2" style={styles.badgeText}>
                          #{index + 1}
                        </Text>
                      </Layout>
                    </Layout>
                  ))}
                </Layout>
              </Card>
            </Animated.View>

            {/* Actions */}
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Button
                style={styles.actionButton}
                size="large"
                status="primary"
                onPress={handleViewChain}
                accessoryLeft={(props) => <MessageCircle {...props} size={20} />}
              >
                View Full Chain
              </Button>

              <Button
                style={styles.actionButton}
                size="large"
                appearance="outline"
                onPress={handleShareChain}
                accessoryLeft={(props) => <Share {...props} size={20} />}
              >
                Share Achievement
              </Button>

              <Button
                style={styles.actionButton}
                size="large"
                appearance="ghost"
                onPress={handleStartNewChain}
                accessoryLeft={(props) => <Trophy {...props} size={20} />}
              >
                Start New Chain
              </Button>
            </Animated.View>
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
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  trophyContainer: {
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    color: '#2C2C2C',
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666666',
    lineHeight: 22,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  statsCard: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FF4D4D',
    fontWeight: '700',
    marginBottom: 4,
  },
  highlightCard: {
    marginBottom: 12,
    padding: 16,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightText: {
    flex: 1,
    marginLeft: 16,
  },
  highlightTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  participantsCard: {
    padding: 16,
  },
  participantsList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  participantItem: {
    alignItems: 'center',
    marginVertical: 8,
    minWidth: 80,
  },
  participantAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#FFD93D',
  },
  participantEmoji: {
    fontSize: 24,
  },
  participantName: {
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '500',
  },
  participantBadge: {
    backgroundColor: '#FF4D4D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 10,
  },
  actionButton: {
    marginVertical: 8,
  },
});