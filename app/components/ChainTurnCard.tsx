import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import { Camera, Clock, Users, ArrowRight, SkipForward } from 'lucide-react-native';
import { ChainFeedItem } from '../types';
import { useNavigation } from '@react-navigation/native';

interface ChainTurnCardProps {
  chainItem: ChainFeedItem;
  onQuickResponse?: (chainId: string) => void;
  onSkipTurn?: (chainId: string) => void;
}

export const ChainTurnCard: React.FC<ChainTurnCardProps> = ({
  chainItem,
  onQuickResponse,
  onSkipTurn,
}) => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [timeRemaining, setTimeRemaining] = useState(chainItem.timeRemaining);
  const [timerColor, setTimerColor] = useState(theme['color-success-500']);

  const chain = chainItem.data;

  // Update timer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, chain.currentTurnExpiresAt.getTime() - now.getTime());
      setTimeRemaining(remaining);

      // Update timer color based on time remaining
      const minutes = Math.floor(remaining / (1000 * 60));
      if (minutes <= 5) {
        setTimerColor(theme['color-danger-500']); // Critical - red
      } else if (minutes <= 15) {
        setTimerColor(theme['color-warning-500']); // Warning - orange
      } else {
        setTimerColor(theme['color-success-500']); // Good - green
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [chain.currentTurnExpiresAt, theme]);

  // Format time remaining as HH:MM or MM:SS
  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return '00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const handleViewFullChain = () => {
    (navigation as any).navigate('FlareChainView', { chainId: chain.id });
  };

  const handleQuickResponse = () => {
    if (onQuickResponse) {
      onQuickResponse(chain.id);
    } else {
      (navigation as any).navigate('FlareResponse', { chainId: chain.id });
    }
  };

  const handleSkipTurn = () => {
    if (onSkipTurn) {
      onSkipTurn(chain.id);
    }
  };

  const latestPhoto = chain.photos[chain.photos.length - 1];
  const participantsCount = chain.participants.length;

  return (
    <View style={[styles.container, { backgroundColor: theme['background-basic-color-3'] }]}>
      {/* Header with chain info */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.chainIcon, { backgroundColor: theme['color-primary-100'] }]}>
            <Text style={[styles.chainEmoji, { color: theme['color-primary-500'] }]}>
              🔥
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text 
              category="s1" 
              style={[styles.headerTitle, { color: theme['text-primary-color'] }]}
            >
              Chain Turn
            </Text>
            <Text 
              category="c1" 
              style={[styles.headerSubtitle, { color: theme['text-secondary-color'] }]}
            >
              From {chain.creatorUsername}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.viewChainButton}
          onPress={handleViewFullChain}
        >
          <Text 
            category="c1" 
            style={[styles.viewChainText, { color: theme['color-primary-500'] }]}
          >
            View Chain
          </Text>
          <ArrowRight size={14} color={theme['color-primary-500']} />
        </TouchableOpacity>
      </View>

      {/* Prompt */}
      <View style={styles.promptSection}>
        <Text 
          category="h6" 
          style={[styles.promptTitle, { color: theme['text-primary-color'] }]}
        >
          {chain.prompt.title}
        </Text>
        {chain.prompt.description && (
          <Text 
            category="p2" 
            style={[styles.promptDescription, { color: theme['text-secondary-color'] }]}
          >
            {chain.prompt.description}
          </Text>
        )}
      </View>

      {/* Latest photo if exists */}
      {latestPhoto && (
        <View style={styles.photoSection}>
          <Image 
            source={{ uri: latestPhoto.photoUrl }}
            style={[styles.latestPhoto, { borderColor: theme['border-basic-color-3'] }]}
            resizeMode="cover"
          />
          <View style={styles.photoOverlay}>
            <Text 
              category="c1" 
              style={[styles.photoUsername, { color: theme['text-on-primary-color'] }]}
            >
              by {latestPhoto.username}
            </Text>
          </View>
        </View>
      )}

      {/* Timer and participants info */}
      <View style={[styles.infoRow, { borderTopColor: theme['border-basic-color-3'] }]}>
        <View style={styles.timerSection}>
          <Clock size={16} color={timerColor} />
          <Text 
            category="s1" 
            style={[styles.timerText, { color: timerColor }]}
          >
            {formatTimeRemaining(timeRemaining)} left
          </Text>
        </View>
        <View style={styles.participantsSection}>
          <Users size={16} color={theme['text-secondary-color']} />
          <Text 
            category="c1" 
            style={[styles.participantsText, { color: theme['text-secondary-color'] }]}
          >
            {participantsCount} participants
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.skipButton,
            { 
              backgroundColor: theme['background-basic-color-2'],
              borderColor: theme['border-basic-color-4'] 
            }
          ]}
          onPress={handleSkipTurn}
        >
          <SkipForward size={18} color={theme['text-secondary-color']} />
          <Text 
            category="s2" 
            style={[styles.skipButtonText, { color: theme['text-secondary-color'] }]}
          >
            Skip Turn
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.responseButton,
            { backgroundColor: theme['color-primary-500'] }
          ]}
          onPress={handleQuickResponse}
        >
          <Camera size={18} color={theme['text-on-primary-color']} />
          <Text 
            category="s1" 
            style={[styles.responseButtonText, { color: theme['text-on-primary-color'] }]}
          >
            Take Photo
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chainIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chainEmoji: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewChainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewChainText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  promptSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  promptTitle: {
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
  },
  promptDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  photoSection: {
    position: 'relative',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  latestPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  photoUsername: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  participantsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  responseButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  responseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
});