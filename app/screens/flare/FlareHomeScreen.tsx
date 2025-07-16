import React, { useState, useEffect } from 'react';
import { Layout, Text, Card, Button, Spinner } from '@ui-kitten/components';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Flame, Clock, Users, Trophy, TrendingUp, Search, Award, Bell } from 'lucide-react-native';
import { ChainDashboard } from '../../components/ChainDashboard';
import { AchievementCelebration } from '../../components/AchievementCelebration';
import { statisticsService } from '../../services/statisticsService';
import { useAchievements } from '../../hooks/useAchievements';
import { ChainDashboardData, UserStatistics, Achievement } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const FlareHomeScreen = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const currentUserId = user?.id || '';
  const [dashboardData, setDashboardData] = useState<ChainDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [celebrationAchievement, setCelebrationAchievement] = useState<Achievement | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const { unreadNotifications, markAsRead, markCelebrationShown } = useAchievements(currentUserId);

  useEffect(() => {
    // Check authentication first
    if (!isAuthenticated || !user || !currentUserId) {
      setLoading(false);
      setError('Please sign in to view dashboard');
      return;
    }

    loadDashboardData();
    
    // Subscribe to real-time statistics updates
    const unsubscribe = statisticsService.subscribeToUserStatistics(
      currentUserId,
      (statistics) => {
        if (statistics) {
          setDashboardData(prev => prev ? { ...prev, statistics } : null);
        }
      }
    );

    return unsubscribe;
  }, [currentUserId, isAuthenticated, user]);

  // Show celebration for new achievements
  useEffect(() => {
    const unshownNotifications = unreadNotifications.filter(n => !n.celebrationShown);
    if (unshownNotifications.length > 0) {
      const notification = unshownNotifications[0];
      setCelebrationAchievement(notification.achievement);
      setShowCelebration(true);
      markCelebrationShown(notification.id);
    }
  }, [unreadNotifications, markCelebrationShown]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUserId) {
        setError('No authenticated user');
        return;
      }
      
      const data = await statisticsService.getDashboardData(currentUserId);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChain = () => {
    navigation.navigate('FlarePrompt' as never);
  };

  const handleViewHistory = () => {
    navigation.navigate('FlareHistory' as never);
  };

  const handleDiscovery = () => {
    navigation.navigate('FlareDiscovery' as never);
  };

  const handleLeaderboard = () => {
    navigation.navigate('FlareLeaderboard' as never);
  };

  const handleCelebrationDismiss = () => {
    setShowCelebration(false);
    setCelebrationAchievement(null);
  };

  const handleShareAchievement = () => {
    // TODO: Implement sharing functionality
    console.log('Sharing achievement:', celebrationAchievement?.title);
  };

  const handleChainPress = (chainId: string) => {
    navigation.navigate('FlareChainView' as never, { chainId } as never);
  };

  const handleInvitationAccept = (invitationId: string) => {
    console.log('Accepting invitation:', invitationId);
    // TODO: Implement invitation acceptance
  };

  const handleInvitationDecline = (invitationId: string) => {
    console.log('Declining invitation:', invitationId);
    // TODO: Implement invitation decline
  };

  const formatCompletionRate = (rate: number): string => {
    return `${rate}%`;
  };

  const formatResponseTime = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Layout style={styles.loadingContainer}>
          <Spinner size="large" />
          <Text category="s1" style={styles.loadingText}>
            Loading dashboard...
          </Text>
        </Layout>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Layout style={styles.errorContainer}>
          <Text category="h6" style={styles.errorText}>
            {error}
          </Text>
          <Button appearance="ghost" onPress={loadDashboardData}>
            Try Again
          </Button>
        </Layout>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Layout style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Layout style={styles.header}>
            <Flame size={32} color="#FF4D4D" />
            <Text category="h4" style={styles.title}>Flare Chains</Text>
            <Text category="s1" appearance="hint" style={styles.subtitle}>
              Start a photo chain with friends
            </Text>
          </Layout>

          {/* Statistics Overview */}
          <Layout style={styles.section}>
            <Text category="h6" style={styles.sectionTitle}>Your Stats</Text>
            <Layout style={styles.statsContainer}>
              <Card style={styles.statCard}>
                <Text category="h6" style={styles.statNumber}>
                  {dashboardData?.statistics.totalChainsCreated || 0}
                </Text>
                <Text category="c1" appearance="hint">Chains Created</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text category="h6" style={styles.statNumber}>
                  {dashboardData?.statistics.totalChainsParticipated || 0}
                </Text>
                <Text category="c1" appearance="hint">Participated</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text category="h6" style={styles.statNumber}>
                  {formatCompletionRate(dashboardData?.statistics.chainCompletionRate || 0)}
                </Text>
                <Text category="c1" appearance="hint">Completion</Text>
              </Card>
            </Layout>

            {/* Achievement Preview */}
            {dashboardData?.statistics.achievements && dashboardData.statistics.achievements.length > 0 && (
              <Card style={styles.achievementCard}>
                <Layout style={styles.achievementHeader}>
                  <Trophy size={20} color="#FFD93D" />
                  <Text category="s2" style={styles.achievementTitle}>
                    Latest Achievement
                  </Text>
                </Layout>
                <Layout style={styles.achievementContent}>
                  <Text style={styles.achievementEmoji}>
                    {dashboardData.statistics.achievements[dashboardData.statistics.achievements.length - 1].emoji}
                  </Text>
                  <Layout style={styles.achievementText}>
                    <Text category="s2" style={styles.achievementName}>
                      {dashboardData.statistics.achievements[dashboardData.statistics.achievements.length - 1].title}
                    </Text>
                    <Text category="c1" appearance="hint">
                      {dashboardData.statistics.achievements[dashboardData.statistics.achievements.length - 1].description}
                    </Text>
                  </Layout>
                </Layout>
              </Card>
            )}
          </Layout>

          {/* Discovery Section */}
          <Layout style={styles.section}>
            <Text category="h6" style={styles.sectionTitle}>
              Discover
            </Text>
            <Card style={styles.discoveryCard}>
              <Layout style={styles.discoveryContent}>
                <Search size={24} color="#FF4D4D" />
                <Layout style={styles.discoveryText}>
                  <Text category="s2" style={styles.discoveryTitle}>
                    Find New Chains & Friends
                  </Text>
                  <Text category="c1" appearance="hint">
                    Explore trending prompts and connect with others
                  </Text>
                </Layout>
              </Layout>
              <Button
                size="small"
                appearance="outline"
                onPress={handleDiscovery}
              >
                Explore
              </Button>
            </Card>
          </Layout>

          {/* Leaderboard Section */}
          <Layout style={styles.section}>
            <Text category="h6" style={styles.sectionTitle}>
              Compete
            </Text>
            <Card style={styles.leaderboardCard}>
              <Layout style={styles.leaderboardContent}>
                <Trophy size={24} color="#FFD700" />
                <Layout style={styles.leaderboardText}>
                  <Text category="s2" style={styles.leaderboardTitle}>
                    Climb the Leaderboard
                  </Text>
                  <Text category="c1" appearance="hint">
                    Compete with friends and earn achievements
                  </Text>
                </Layout>
                {unreadNotifications.length > 0 && (
                  <Layout style={styles.notificationBadge}>
                    <Bell size={16} color="#FF4D4D" />
                    <Text category="c2" style={styles.badgeText}>
                      {unreadNotifications.length}
                    </Text>
                  </Layout>
                )}
              </Layout>
              <Button
                size="small"
                appearance="outline"
                onPress={handleLeaderboard}
              >
                View Rankings
              </Button>
            </Card>
          </Layout>

          {/* Chain Dashboard */}
          <ChainDashboard
            activeChains={dashboardData?.activeChains || []}
            pendingInvitations={dashboardData?.pendingInvitations || []}
            recentActivity={dashboardData?.recentActivity || []}
            onChainPress={handleChainPress}
            onInvitationAccept={handleInvitationAccept}
            onInvitationDecline={handleInvitationDecline}
          />

          {/* Quick Actions */}
          <Layout style={styles.section}>
            <Text category="h6" style={styles.sectionTitle}>Quick Actions</Text>
            <Button
              style={styles.actionButton}
              status="primary"
              onPress={handleCreateChain}
              accessoryLeft={(props) => <Flame {...props} size={20} />}
            >
              Create New Chain
            </Button>
            <Button
              style={styles.actionButton}
              appearance="outline"
              onPress={handleViewHistory}
              accessoryLeft={(props) => <Users {...props} size={20} />}
            >
              View Chain History
            </Button>
            <Button
              style={styles.actionButton}
              appearance="ghost"
              onPress={handleDiscovery}
              accessoryLeft={(props) => <Search {...props} size={20} />}
            >
              Discover & Connect
            </Button>
            <Button
              style={styles.actionButton}
              appearance="ghost"
              onPress={handleLeaderboard}
              accessoryLeft={(props) => <Trophy {...props} size={20} />}
            >
              Leaderboard & Achievements
            </Button>
          </Layout>

          {/* Achievement Celebration Modal */}
          {celebrationAchievement && (
            <AchievementCelebration
              achievement={celebrationAchievement}
              visible={showCelebration}
              onDismiss={handleCelebrationDismiss}
              onShare={handleShareAchievement}
            />
          )}

          {/* Performance Insights */}
          {(dashboardData?.statistics.totalChainsParticipated || 0) > 0 && (
            <Layout style={styles.section}>
              <Text category="h6" style={styles.sectionTitle}>Your Performance</Text>
              <Layout style={styles.performanceContainer}>
                <Card style={styles.performanceCard}>
                  <TrendingUp size={16} color="#4ECDC4" />
                  <Text category="c1" appearance="hint" style={styles.performanceLabel}>
                    Avg Response
                  </Text>
                  <Text category="s2" style={styles.performanceValue}>
                    {formatResponseTime(dashboardData?.statistics.averageResponseTime || 0)}
                  </Text>
                </Card>
                <Card style={styles.performanceCard}>
                  <Clock size={16} color="#FFD93D" />
                  <Text category="c1" appearance="hint" style={styles.performanceLabel}>
                    Fastest
                  </Text>
                  <Text category="s2" style={styles.performanceValue}>
                    {formatResponseTime(dashboardData?.statistics.fastestResponseTime === Infinity ? 0 : dashboardData?.statistics.fastestResponseTime || 0)}
                  </Text>
                </Card>
                <Card style={styles.performanceCard}>
                  <Trophy size={16} color="#FF4D4D" />
                  <Text category="c1" appearance="hint" style={styles.performanceLabel}>
                    Streak
                  </Text>
                  <Text category="s2" style={styles.performanceValue}>
                    {dashboardData?.statistics.currentStreak || 0} days
                  </Text>
                </Card>
              </Layout>
            </Layout>
          )}
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
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  title: {
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  actionButton: {
    marginVertical: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    color: '#FF4D4D',
    fontWeight: '700',
  },
  achievementCard: {
    padding: 16,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    marginLeft: 8,
    fontWeight: '600',
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementText: {
    flex: 1,
  },
  achievementName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  performanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    paddingVertical: 16,
  },
  performanceLabel: {
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  performanceValue: {
    fontWeight: '600',
    textAlign: 'center',
  },
  discoveryCard: {
    padding: 16,
  },
  discoveryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  discoveryText: {
    flex: 1,
    marginLeft: 16,
  },
  discoveryTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  // Leaderboard Styles
  leaderboardCard: {
    padding: 16,
  },
  leaderboardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  leaderboardText: {
    flex: 1,
    marginLeft: 16,
  },
  leaderboardTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFE8E8',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4D4D',
  },
  badgeText: {
    marginLeft: 4,
    color: '#FF4D4D',
    fontWeight: '600',
    fontSize: 11,
  },
});