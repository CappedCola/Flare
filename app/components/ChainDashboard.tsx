import React from 'react';
import { Layout, Text, Card, Button } from '@ui-kitten/components';
import { StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Clock, MessageCircle, Play, AlertCircle } from 'lucide-react-native';
import { ActiveChainInfo, ChainInvitation, ChainActivity } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface ChainDashboardProps {
  activeChains: ActiveChainInfo[];
  pendingInvitations: ChainInvitation[];
  recentActivity: ChainActivity[];
  onChainPress: (chainId: string) => void;
  onInvitationAccept: (invitationId: string) => void;
  onInvitationDecline: (invitationId: string) => void;
}

export const ChainDashboard: React.FC<ChainDashboardProps> = ({
  activeChains,
  pendingInvitations,
  recentActivity,
  onChainPress,
  onInvitationAccept,
  onInvitationDecline,
}) => {
  const formatTimeRemaining = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getTimerColor = (timeRemaining: number): string => {
    const minutes = timeRemaining / 60000;
    if (minutes > 30) return '#4ECDC4'; // Green
    if (minutes > 15) return '#FFD93D'; // Yellow
    return '#FF4D4D'; // Red
  };

  const formatActivityTime = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getActivityEmoji = (type: ChainActivity['type']): string => {
    switch (type) {
      case 'chain_completed': return '🎉';
      case 'photo_added': return '📸';
      case 'chain_expired': return '⏰';
      case 'achievement_unlocked': return '🏆';
      default: return '📱';
    }
  };

  return (
    <Layout style={styles.container}>
      {/* Active Chains */}
      {activeChains.length > 0 && (
        <Layout style={styles.section}>
          <Text category="h6" style={styles.sectionTitle}>
            Active Chains ({activeChains.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Layout style={styles.horizontalScroll}>
              {activeChains.map((chain) => (
                <TouchableOpacity
                  key={chain.chainId}
                  onPress={() => onChainPress(chain.chainId)}
                  activeOpacity={0.8}
                >
                  <Card style={[
                    styles.activeChainCard,
                    chain.isYourTurn && styles.yourTurnCard
                  ]}>
                    {/* Chain Header */}
                    <Layout style={styles.chainHeader}>
                      <Layout style={styles.promptInfo}>
                        <Text category="s2" style={styles.promptTitle} numberOfLines={1}>
                          {chain.prompt.emoji} {chain.prompt.title}
                        </Text>
                        <Text category="c1" appearance="hint" numberOfLines={2}>
                          {chain.prompt.description}
                        </Text>
                      </Layout>
                      {chain.isYourTurn && (
                        <Layout style={styles.yourTurnBadge}>
                          <Play size={12} color="#FFFFFF" />
                        </Layout>
                      )}
                    </Layout>

                    {/* Timer */}
                    <Layout style={styles.timerSection}>
                      <Clock size={16} color={getTimerColor(chain.timeRemaining)} />
                      <Text 
                        category="c1" 
                        style={[styles.timerText, { color: getTimerColor(chain.timeRemaining) }]}
                      >
                        {formatTimeRemaining(chain.timeRemaining)} left
                      </Text>
                    </Layout>

                    {/* Participants */}
                    <Layout style={styles.participantsSection}>
                      <Layout style={styles.participantAvatars}>
                        {chain.participants.slice(0, 3).map((participant, index) => (
                          <Layout 
                            key={participant.userId}
                            style={[
                              styles.participantAvatar,
                              { 
                                marginLeft: index > 0 ? -8 : 0,
                                zIndex: chain.participants.length - index,
                                borderColor: participant.status === 'responded' ? '#4ECDC4' : '#E8E8E8',
                              }
                            ]}
                          >
                            <Text style={styles.participantEmoji}>
                              {participant.avatar || '👤'}
                            </Text>
                          </Layout>
                        ))}
                        {chain.participants.length > 3 && (
                          <Layout style={[styles.participantAvatar, styles.moreParticipants]}>
                            <Text style={styles.moreText}>
                              +{chain.participants.length - 3}
                            </Text>
                          </Layout>
                        )}
                      </Layout>

                      {/* Unread Messages */}
                      {chain.unreadMessages > 0 && (
                        <Layout style={styles.unreadBadge}>
                          <MessageCircle size={12} color="#FF4D4D" />
                          <Text category="c2" style={styles.unreadText}>
                            {chain.unreadMessages}
                          </Text>
                        </Layout>
                      )}
                    </Layout>

                    {/* Status */}
                    <Layout style={styles.statusSection}>
                      <Text category="c2" style={[
                        styles.statusText,
                        { color: chain.isYourTurn ? '#FF4D4D' : '#666666' }
                      ]}>
                        {chain.isYourTurn ? 'Your turn to respond!' : 'Waiting for others...'}
                      </Text>
                    </Layout>
                  </Card>
                </TouchableOpacity>
              ))}
            </Layout>
          </ScrollView>
        </Layout>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Layout style={styles.section}>
          <Text category="h6" style={styles.sectionTitle}>
            Pending Invitations ({pendingInvitations.length})
          </Text>
          {pendingInvitations.map((invitation) => (
            <Card key={invitation.id} style={styles.invitationCard}>
              <Layout style={styles.invitationHeader}>
                <Layout style={styles.invitationInfo}>
                  <Text category="s2" style={styles.invitationTitle}>
                    {invitation.fromUsername} invited you to join:
                  </Text>
                  <Text category="s1" style={styles.invitationPrompt}>
                    {invitation.prompt.emoji} {invitation.prompt.title}
                  </Text>
                  <Text category="c1" appearance="hint">
                    {invitation.prompt.description}
                  </Text>
                </Layout>
                <AlertCircle size={20} color="#FFD93D" />
              </Layout>

              <Layout style={styles.invitationActions}>
                <Button
                  size="small"
                  status="success"
                  onPress={() => onInvitationAccept(invitation.id)}
                  style={styles.invitationButton}
                >
                  Accept
                </Button>
                <Button
                  size="small"
                  appearance="outline"
                  onPress={() => onInvitationDecline(invitation.id)}
                  style={styles.invitationButton}
                >
                  Decline
                </Button>
              </Layout>
            </Card>
          ))}
        </Layout>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Layout style={styles.section}>
          <Text category="h6" style={styles.sectionTitle}>
            Recent Activity
          </Text>
          <Card style={styles.activityCard}>
            {recentActivity.slice(0, 5).map((activity, index) => (
              <Layout key={activity.id} style={[
                styles.activityItem,
                index < recentActivity.length - 1 && styles.activityItemBorder
              ]}>
                <Text style={styles.activityEmoji}>
                  {getActivityEmoji(activity.type)}
                </Text>
                <Layout style={styles.activityContent}>
                  <Text category="s2" style={styles.activityMessage}>
                    {activity.message}
                  </Text>
                  <Text category="c1" appearance="hint" style={styles.activityTime}>
                    {formatActivityTime(activity.timestamp)}
                  </Text>
                </Layout>
              </Layout>
            ))}
          </Card>
        </Layout>
      )}

      {/* Empty State */}
      {activeChains.length === 0 && pendingInvitations.length === 0 && recentActivity.length === 0 && (
        <Layout style={styles.emptySection}>
          <Card style={styles.emptyCard}>
            <Layout style={styles.emptyContent}>
              <Text style={styles.emptyEmoji}>📸</Text>
              <Text category="h6" style={styles.emptyTitle}>
                No active chains yet
              </Text>
              <Text category="s1" appearance="hint" style={styles.emptySubtitle}>
                Create your first chain to start sharing moments with friends!
              </Text>
            </Layout>
          </Card>
        </Layout>
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  horizontalScroll: {
    flexDirection: 'row',
    paddingRight: 16,
  },
  activeChainCard: {
    width: screenWidth * 0.75,
    marginRight: 16,
    padding: 12,
  },
  yourTurnCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF4D4D',
  },
  chainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  promptInfo: {
    flex: 1,
    marginRight: 8,
  },
  promptTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  yourTurnBadge: {
    backgroundColor: '#FF4D4D',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 12,
  },
  participantsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  participantEmoji: {
    fontSize: 12,
  },
  moreParticipants: {
    backgroundColor: '#E8E8E8',
    borderColor: '#CCCCCC',
  },
  moreText: {
    fontSize: 8,
    color: '#666666',
    fontWeight: '600',
  },
  unreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unreadText: {
    marginLeft: 4,
    color: '#FF4D4D',
    fontWeight: '600',
    fontSize: 10,
  },
  statusSection: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  invitationCard: {
    marginBottom: 12,
    padding: 12,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationTitle: {
    marginBottom: 4,
  },
  invitationPrompt: {
    fontWeight: '600',
    marginBottom: 4,
  },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  invitationButton: {
    marginLeft: 8,
  },
  activityCard: {
    padding: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityEmoji: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    marginBottom: 2,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 11,
  },
  emptySection: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 32,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
});