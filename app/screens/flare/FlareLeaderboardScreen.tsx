import React, { useState, useEffect } from 'react';
import { Layout, Text, Card, Button, Spinner } from '@ui-kitten/components';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Trophy, Medal, TrendingUp, Users, Clock, Heart, Zap, Crown, Award, ChevronUp, ChevronDown, Minus } from 'lucide-react-native';
import { statisticsService, Leaderboard, LeaderboardEntry } from '../../services/statisticsService';

export const FlareLeaderboardScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'global' | 'friends' | 'weekly'>('global');
  const [activeMetric, setActiveMetric] = useState<'chains' | 'streak' | 'reactions' | 'speed'>('chains');
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [userPosition, setUserPosition] = useState<{ rank: number; totalUsers: number; percentile: number } | null>(null);
  
  const currentUserId = 'current-user-id'; // TODO: Get from auth context
  const userFriends = ['friend1', 'friend2', 'friend3']; // TODO: Get from friends service

  useEffect(() => {
    loadLeaderboard();
    loadUserPosition();
  }, [activeTab, activeMetric]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      let board: Leaderboard;

      switch (activeTab) {
        case 'global':
          board = await statisticsService.getGlobalLeaderboard(activeMetric, 50);
          break;
        case 'friends':
          board = await statisticsService.getFriendsLeaderboard(currentUserId, userFriends, activeMetric);
          break;
        case 'weekly':
          board = await statisticsService.getWeeklyLeaderboard(20);
          break;
        default:
          board = await statisticsService.getGlobalLeaderboard(activeMetric, 50);
      }

      setLeaderboard(board);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosition = async () => {
    try {
      const position = await statisticsService.getUserLeaderboardPosition(currentUserId, activeMetric);
      setUserPosition(position);
    } catch (error) {
      console.error('Error loading user position:', error);
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'chains': return Trophy;
      case 'streak': return Zap;
      case 'reactions': return Heart;
      case 'speed': return Clock;
      default: return Trophy;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'chains': return 'Chains Completed';
      case 'streak': return 'Current Streak';
      case 'reactions': return 'Reactions Received';
      case 'speed': return 'Fastest Response';
      default: return 'Chains';
    }
  };

  const formatScore = (score: number, metric: string) => {
    switch (metric) {
      case 'speed':
        if (score === 0) return 'No data';
        return score < 60 ? `${Math.round(score)}m` : `${Math.round(score / 60)}h`;
      case 'reactions':
        return score.toLocaleString();
      default:
        return score.toString();
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown size={20} color="#FFD700" />;
      case 2: return <Medal size={20} color="#C0C0C0" />;
      case 3: return <Award size={20} color="#CD7F32" />;
      default: return <Text category="s2" style={styles.rankNumber}>#{rank}</Text>;
    }
  };

  const getChangeIcon = (change: LeaderboardEntry['change']) => {
    switch (change) {
      case 'up': return <ChevronUp size={16} color="#4ECDC4" />;
      case 'down': return <ChevronDown size={16} color="#FF6B6B" />;
      case 'new': return <TrendingUp size={16} color="#FFD93D" />;
      default: return <Minus size={16} color="#CCCCCC" />;
    }
  };

  const renderLeaderboardEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = item.userId === currentUserId;
    
    return (
      <Card style={[styles.entryCard, isCurrentUser && styles.currentUserCard]}>
        <Layout style={styles.entryContent}>
          <Layout style={styles.entryLeft}>
            <Layout style={styles.rankContainer}>
              {getRankIcon(item.rank)}
            </Layout>
            
            <Layout style={styles.userInfo}>
              <Layout style={styles.userAvatar}>
                <Text style={styles.avatarText}>{item.avatar || '👤'}</Text>
              </Layout>
              <Layout style={styles.userDetails}>
                <Text category="s2" style={[styles.username, isCurrentUser && styles.currentUserText]}>
                  {item.username}
                  {isCurrentUser && ' (You)'}
                </Text>
                <Text category="c1" appearance="hint">
                  {item.stats.chainsCompleted} chains • {item.stats.currentStreak} day streak
                </Text>
              </Layout>
            </Layout>
          </Layout>
          
          <Layout style={styles.entryRight}>
            <Layout style={styles.scoreContainer}>
              <Text category="h6" style={styles.score}>
                {formatScore(item.score, activeMetric)}
              </Text>
              <Layout style={styles.changeContainer}>
                {getChangeIcon(item.change)}
              </Layout>
            </Layout>
          </Layout>
        </Layout>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Layout style={styles.loadingContainer}>
          <Spinner size="large" />
          <Text category="s1" style={styles.loadingText}>
            Loading leaderboard...
          </Text>
        </Layout>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Layout style={styles.container}>
        {/* Header */}
        <Layout style={styles.header}>
          <Trophy size={32} color="#FFD700" />
          <Text category="h4" style={styles.title}>Leaderboard</Text>
          <Text category="s1" appearance="hint" style={styles.subtitle}>
            Compete with friends and climb the ranks
          </Text>
        </Layout>

        {/* User Position Card */}
        {userPosition && userPosition.rank > 0 && (
          <Layout style={styles.userPositionSection}>
            <Card style={styles.userPositionCard}>
              <Layout style={styles.userPositionContent}>
                <Layout style={styles.positionStats}>
                  <Layout style={styles.positionStat}>
                    <Text category="h5" style={styles.positionNumber}>
                      #{userPosition.rank}
                    </Text>
                    <Text category="c1" appearance="hint">Your Rank</Text>
                  </Layout>
                  <Layout style={styles.positionStat}>
                    <Text category="h5" style={styles.positionNumber}>
                      {userPosition.percentile}%
                    </Text>
                    <Text category="c1" appearance="hint">Top Percentile</Text>
                  </Layout>
                  <Layout style={styles.positionStat}>
                    <Text category="h5" style={styles.positionNumber}>
                      {userPosition.totalUsers.toLocaleString()}
                    </Text>
                    <Text category="c1" appearance="hint">Total Players</Text>
                  </Layout>
                </Layout>
              </Layout>
            </Card>
          </Layout>
        )}

        {/* Tab Navigation */}
        <Layout style={styles.tabSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Layout style={styles.tabContainer}>
              {[
                { key: 'global', label: 'Global', icon: Trophy },
                { key: 'friends', label: 'Friends', icon: Users },
                { key: 'weekly', label: 'This Week', icon: TrendingUp },
              ].map(({ key, label, icon: Icon }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.tab,
                    activeTab === key && styles.activeTab
                  ]}
                  onPress={() => setActiveTab(key as any)}
                >
                  <Icon size={16} color={activeTab === key ? '#FF4D4D' : '#666666'} />
                  <Text
                    category="s2"
                    style={[
                      styles.tabText,
                      activeTab === key && styles.activeTabText
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </Layout>
          </ScrollView>
        </Layout>

        {/* Metric Selection */}
        <Layout style={styles.metricSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Layout style={styles.metricContainer}>
              {[
                { key: 'chains', label: 'Chains' },
                { key: 'streak', label: 'Streak' },
                { key: 'reactions', label: 'Reactions' },
                { key: 'speed', label: 'Speed' },
              ].map(({ key, label }) => {
                const Icon = getMetricIcon(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.metricChip,
                      activeMetric === key && styles.activeMetricChip
                    ]}
                    onPress={() => setActiveMetric(key as any)}
                  >
                    <Icon size={14} color={activeMetric === key ? '#FF4D4D' : '#666666'} />
                    <Text
                      category="c1"
                      style={[
                        styles.metricText,
                        activeMetric === key && styles.activeMetricText
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Layout>
          </ScrollView>
        </Layout>

        {/* Leaderboard */}
        <Layout style={styles.leaderboardSection}>
          <Layout style={styles.leaderboardHeader}>
            <Text category="h6" style={styles.sectionTitle}>
              {getMetricLabel(activeMetric)} • {leaderboard?.type.toUpperCase()}
            </Text>
            <Text category="c1" appearance="hint">
              {leaderboard?.totalParticipants} participants
            </Text>
          </Layout>

          {leaderboard && leaderboard.entries.length > 0 ? (
            <FlatList
              data={leaderboard.entries}
              renderItem={renderLeaderboardEntry}
              keyExtractor={(item) => item.userId}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <Layout style={styles.separator} />}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <Layout style={styles.emptyContent}>
                <Trophy size={48} color="#CCCCCC" />
                <Text category="s1" style={styles.emptyText}>
                  No rankings yet
                </Text>
                <Text category="c1" appearance="hint" style={styles.emptySubtext}>
                  Complete some chains to appear on the leaderboard!
                </Text>
              </Layout>
            </Card>
          )}
        </Layout>
      </Layout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  title: {
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  userPositionSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  userPositionCard: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFD1D1',
  },
  userPositionContent: {
    padding: 16,
  },
  positionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  positionStat: {
    alignItems: 'center',
    flex: 1,
  },
  positionNumber: {
    color: '#FF4D4D',
    fontWeight: '700',
    marginBottom: 4,
  },
  tabSection: {
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    backgroundColor: '#FFE8E8',
  },
  tabText: {
    marginLeft: 6,
    color: '#666666',
  },
  activeTabText: {
    color: '#FF4D4D',
    fontWeight: '600',
  },
  metricSection: {
    marginBottom: 16,
  },
  metricContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  activeMetricChip: {
    backgroundColor: '#FFE8E8',
  },
  metricText: {
    marginLeft: 4,
    fontSize: 12,
  },
  activeMetricText: {
    color: '#FF4D4D',
    fontWeight: '600',
  },
  leaderboardSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  separator: {
    height: 8,
  },
  entryCard: {
    marginVertical: 2,
  },
  currentUserCard: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFD1D1',
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontWeight: '600',
    color: '#666666',
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
  currentUserText: {
    color: '#FF4D4D',
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  score: {
    fontWeight: '700',
    color: '#333333',
    marginRight: 8,
  },
  changeContainer: {
    width: 20,
    alignItems: 'center',
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: 'center',
  },
});