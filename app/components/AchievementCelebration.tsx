import React, { useState, useEffect } from 'react';
import { Layout, Text, Card, Button, Modal } from '@ui-kitten/components';
import { StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Trophy, Star, X, Share } from 'lucide-react-native';
import { Achievement } from '../types';

interface AchievementCelebrationProps {
  achievement: Achievement;
  visible: boolean;
  onDismiss: () => void;
  onShare?: () => void;
}

export const AchievementCelebration: React.FC<AchievementCelebrationProps> = ({
  achievement,
  visible,
  onDismiss,
  onShare,
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    if (visible) {
      // Start celebration animation
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      slideAnim.setValue(50);
      sparkleAnim.setValue(0);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    }
  };

  const sparkleStyle = {
    opacity: sparkleAnim,
    transform: [
      {
        rotate: sparkleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <Modal
      visible={visible}
      backdropStyle={styles.backdrop}
      onBackdropPress={handleDismiss}
    >
      <Layout style={styles.container}>
        <Animated.View
          style={[
            styles.celebrationCard,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          <Card style={styles.card}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
              <X size={24} color="#666666" />
            </TouchableOpacity>

            {/* Sparkle Effects */}
            <Animated.View style={[styles.sparkle, styles.sparkle1, sparkleStyle]}>
              <Star size={16} color="#FFD700" fill="#FFD700" />
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle2, sparkleStyle]}>
              <Star size={12} color="#FF6B9D" fill="#FF6B9D" />
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle3, sparkleStyle]}>
              <Star size={14} color="#4ECDC4" fill="#4ECDC4" />
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle4, sparkleStyle]}>
              <Star size={10} color="#FFD93D" fill="#FFD93D" />
            </Animated.View>

            {/* Main Content */}
            <Layout style={styles.content}>
              {/* Achievement Icon */}
              <Layout style={styles.iconContainer}>
                <Layout style={styles.iconBackground}>
                  <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
                </Layout>
                <Layout style={styles.trophyContainer}>
                  <Trophy size={32} color="#FFD700" />
                </Layout>
              </Layout>

              {/* Text Content */}
              <Layout style={styles.textContent}>
                <Text category="h4" style={styles.celebrationTitle}>
                  Achievement Unlocked!
                </Text>
                
                <Text category="h5" style={styles.achievementTitle}>
                  {achievement.title}
                </Text>
                
                <Text category="s1" appearance="hint" style={styles.achievementDescription}>
                  {achievement.description}
                </Text>

                {/* Progress Bar (if applicable) */}
                {achievement.maxProgress && achievement.maxProgress > 1 && (
                  <Layout style={styles.progressSection}>
                    <Layout style={styles.progressBar}>
                      <Layout style={[styles.progressFill, { width: '100%' }]} />
                    </Layout>
                    <Text category="c1" style={styles.progressText}>
                      {achievement.progress} / {achievement.maxProgress} completed
                    </Text>
                  </Layout>
                )}

                {/* Unlock Date */}
                <Text category="c2" appearance="hint" style={styles.unlockDate}>
                  Unlocked on {achievement.unlockedAt.toLocaleDateString()}
                </Text>
              </Layout>

              {/* Action Buttons */}
              <Layout style={styles.actions}>
                <Button
                  style={styles.actionButton}
                  appearance="ghost"
                  onPress={handleShare}
                  accessoryLeft={(props) => <Share {...props} size={16} />}
                >
                  Share
                </Button>
                <Button
                  style={styles.actionButton}
                  status="primary"
                  onPress={handleDismiss}
                >
                  Awesome!
                </Button>
              </Layout>
            </Layout>
          </Card>
        </Animated.View>
      </Layout>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  celebrationCard: {
    width: width - 40,
    maxWidth: 400,
  },
  card: {
    borderRadius: 20,
    overflow: 'visible',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    zIndex: 5,
  },
  sparkle1: {
    top: 20,
    left: 30,
  },
  sparkle2: {
    top: 40,
    right: 40,
  },
  sparkle3: {
    bottom: 100,
    left: 20,
  },
  sparkle4: {
    bottom: 120,
    right: 30,
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  achievementEmoji: {
    fontSize: 40,
  },
  trophyContainer: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  textContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  celebrationTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#FF4D4D',
    fontWeight: '700',
  },
  achievementTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  achievementDescription: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  unlockDate: {
    textAlign: 'center',
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
  },
});

export default AchievementCelebration;