import { 
  collection, 
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query, 
  where, 
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  Timestamp
} from '@react-native-firebase/firestore';
import { firestore } from '../config/firebase';
import { UserStatistics, Achievement, AchievementType, ChainDashboardData, ActiveChainInfo, ChainInvitation, ChainActivity, User } from '../types';

// Extended interfaces for leaderboards and notifications
export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
  change: 'up' | 'down' | 'same' | 'new';
  stats: {
    chainsCompleted: number;
    averageResponseTime: number;
    currentStreak: number;
    totalReactions: number;
  };
}

export interface Leaderboard {
  type: 'global' | 'friends' | 'weekly' | 'monthly';
  period: string;
  entries: LeaderboardEntry[];
  userRank?: number;
  totalParticipants: number;
  lastUpdated: Date;
}

export interface AchievementNotification {
  id: string;
  userId: string;
  achievement: Achievement;
  createdAt: Date;
  isRead: boolean;
  celebrationShown: boolean;
}

export interface CompetitionEvent {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  metric: 'chains_completed' | 'response_time' | 'reactions' | 'streak';
  startDate: Date;
  endDate: Date;
  prize: string;
  participants: string[];
  leaderboard: LeaderboardEntry[];
  isActive: boolean;
}

export class StatisticsService {
  // Achievement definitions
  static readonly ACHIEVEMENTS = {
    [AchievementType.CHAIN_MASTER]: {
      title: 'Chain Master',
      description: 'Complete 10 chains',
      emoji: '👑',
      maxProgress: 10,
    },
    [AchievementType.SPEED_DEMON]: {
      title: 'Speed Demon',
      description: 'Respond within 5 minutes',
      emoji: '⚡',
      maxProgress: 5,
    },
    [AchievementType.SOCIAL_BUTTERFLY]: {
      title: 'Social Butterfly',
      description: 'Start chains with 20+ different people',
      emoji: '🦋',
      maxProgress: 20,
    },
    [AchievementType.REACTION_KING]: {
      title: 'Reaction King',
      description: 'Receive 100 reactions',
      emoji: '🔥',
      maxProgress: 100,
    },
    [AchievementType.STREAK_WARRIOR]: {
      title: 'Streak Warrior',
      description: 'Maintain 7-day streak',
      emoji: '🏆',
      maxProgress: 7,
    },
    [AchievementType.CATEGORY_EXPLORER]: {
      title: 'Category Explorer',
      description: 'Use all prompt categories',
      emoji: '🌟',
      maxProgress: 6, // Number of categories
    },
    [AchievementType.EARLY_BIRD]: {
      title: 'Early Bird',
      description: 'Respond first in 5 chains',
      emoji: '🐦',
      maxProgress: 5,
    },
    [AchievementType.CHAIN_STARTER]: {
      title: 'Chain Starter',
      description: 'Create 25 chains',
      emoji: '🚀',
      maxProgress: 25,
    },
  };

  // Get user statistics
  async getUserStatistics(userId: string): Promise<UserStatistics | null> {
    try {
      const userStatsDoc = await getDoc(doc(firestore, 'userStatistics', userId));
      
      if (!userStatsDoc.exists()) {
        // Initialize stats for new user
        return await this.initializeUserStatistics(userId);
      }

      const data = userStatsDoc.data();
      if (!data) {
        // Document exists but has no data - initialize it
        return await this.initializeUserStatistics(userId);
      }
      
      return {
        userId: data.userId || userId,
        totalChainsCreated: data.totalChainsCreated || 0,
        totalChainsParticipated: data.totalChainsParticipated || 0,
        chainCompletionRate: data.chainCompletionRate || 0,
        averageResponseTime: data.averageResponseTime || 0,
        fastestResponseTime: data.fastestResponseTime || Infinity,
        totalPhotosShared: data.totalPhotosShared || 0,
        totalReactionsReceived: data.totalReactionsReceived || 0,
        totalReactionsGiven: data.totalReactionsGiven || 0,
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        achievements: (data.achievements || []).map((ach: any) => ({
          ...ach,
          unlockedAt: ach.unlockedAt?.toDate() || new Date(),
        })),
        favoritePromptCategory: data.favoritePromptCategory || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      return null;
    }
  }

  // Initialize statistics for new user
  private async initializeUserStatistics(userId: string): Promise<UserStatistics> {
    const stats: UserStatistics = {
      userId,
      totalChainsCreated: 0,
      totalChainsParticipated: 0,
      chainCompletionRate: 0,
      averageResponseTime: 0,
      fastestResponseTime: Infinity,
      totalPhotosShared: 0,
      totalReactionsReceived: 0,
      totalReactionsGiven: 0,
      currentStreak: 0,
      longestStreak: 0,
      achievements: [],
      favoritePromptCategory: null,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    try {
      await setDoc(doc(firestore, 'userStatistics', userId), {
        ...stats,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error initializing user statistics:', error);
      // Return default stats even if Firebase write fails
    }

    return stats;
  }

  // Update statistics after chain events
  async updateUserStatistics(
    userId: string, 
    updates: Partial<UserStatistics>
  ): Promise<void> {
    try {
      const userStatsRef = doc(firestore, 'userStatistics', userId);
      
      await updateDoc(userStatsRef, {
        ...updates,
        lastUpdated: serverTimestamp(),
      });

      // Check for new achievements
      await this.checkAchievements(userId);
    } catch (error) {
      console.error('Error updating user statistics:', error);
    }
  }

  // Increment specific statistics
  async incrementStatistic(
    userId: string,
    field: keyof UserStatistics,
    value: number = 1
  ): Promise<void> {
    try {
      const userStatsRef = doc(firestore, 'userStatistics', userId);
      
      await updateDoc(userStatsRef, {
        [field]: increment(value),
        lastUpdated: serverTimestamp(),
      });

      // Check for new achievements
      await this.checkAchievements(userId);
    } catch (error) {
      console.error('Error incrementing statistic:', error);
    }
  }

  // Check and unlock achievements
  private async checkAchievements(userId: string): Promise<void> {
    try {
      const stats = await this.getUserStatistics(userId);
      if (!stats) return;

      const newAchievements: Achievement[] = [];

      // Check each achievement type
      for (const [type, definition] of Object.entries(StatisticsService.ACHIEVEMENTS)) {
        const achievementType = type as AchievementType;
        
        // Skip if already unlocked
        if (stats.achievements.some(ach => ach.type === achievementType)) {
          continue;
        }

        let shouldUnlock = false;
        let progress = 0;

        switch (achievementType) {
          case AchievementType.CHAIN_MASTER:
            progress = stats.totalChainsParticipated;
            shouldUnlock = progress >= definition.maxProgress;
            break;
          
          case AchievementType.SPEED_DEMON:
            shouldUnlock = stats.fastestResponseTime <= 5; // 5 minutes
            progress = stats.fastestResponseTime <= 5 ? 1 : 0;
            break;
          
          case AchievementType.SOCIAL_BUTTERFLY:
            // Would need to calculate unique participants - simplified for now
            progress = Math.min(stats.totalChainsCreated, definition.maxProgress);
            shouldUnlock = progress >= definition.maxProgress;
            break;
          
          case AchievementType.REACTION_KING:
            progress = stats.totalReactionsReceived;
            shouldUnlock = progress >= definition.maxProgress;
            break;
          
          case AchievementType.STREAK_WARRIOR:
            progress = stats.currentStreak;
            shouldUnlock = progress >= definition.maxProgress;
            break;
          
          case AchievementType.CHAIN_STARTER:
            progress = stats.totalChainsCreated;
            shouldUnlock = progress >= definition.maxProgress;
            break;
        }

        if (shouldUnlock) {
          const achievement: Achievement = {
            id: `${userId}_${achievementType}`,
            type: achievementType,
            title: definition.title,
            description: definition.description,
            emoji: definition.emoji,
            unlockedAt: new Date(),
            progress: definition.maxProgress,
            maxProgress: definition.maxProgress,
          };

          newAchievements.push(achievement);
        }
      }

      // Save new achievements
      if (newAchievements.length > 0) {
        await updateDoc(doc(firestore, 'userStatistics', userId), {
          achievements: [...stats.achievements, ...newAchievements],
          lastUpdated: serverTimestamp(),
        });

        // Trigger achievement notifications
        for (const achievement of newAchievements) {
          await this.createAchievementNotification(userId, achievement);
        }
        console.log(`🎉 New achievements unlocked for ${userId}:`, newAchievements);
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  // Get dashboard data for user
  async getDashboardData(userId: string): Promise<ChainDashboardData | null> {
    try {
      const [statistics, activeChains, invitations, activities] = await Promise.all([
        this.getUserStatistics(userId),
        this.getActiveChains(userId),
        this.getPendingInvitations(userId),
        this.getRecentActivity(userId),
      ]);

      if (!statistics) return null;

      return {
        statistics,
        activeChains,
        pendingInvitations: invitations,
        recentActivity: activities,
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return null;
    }
  }

  // Get active chains for user
  private async getActiveChains(userId: string): Promise<ActiveChainInfo[]> {
    try {
      // This would query the flareChains collection for active chains where user is participant
      // Simplified implementation with mock data for now
      return [
        {
          chainId: 'active-chain-1',
          prompt: {
            id: 'prompt-1',
            type: 'daily' as any,
            title: 'Morning Vibes',
            description: 'Share your morning energy',
            emoji: '☀️',
            isActive: true,
            popularity: 85,
            createdAt: new Date(),
          },
          participants: [
            { userId: 'user1', username: 'alice', avatar: '👩‍🎨', status: 'responded' as any, position: 0, invitedAt: new Date() },
            { userId: userId, username: 'you', avatar: '👤', status: 'pending' as any, position: 1, invitedAt: new Date() },
          ],
          currentParticipantIndex: 1,
          timeRemaining: 1800000, // 30 minutes
          status: 'active' as any,
          isYourTurn: true,
          unreadMessages: 2,
        }
      ];
    } catch (error) {
      console.error('Error getting active chains:', error);
      return [];
    }
  }

  // Get pending invitations
  private async getPendingInvitations(userId: string): Promise<ChainInvitation[]> {
    try {
      // This would query for pending invitations
      // Mock implementation for now
      return [];
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      return [];
    }
  }

  // Get recent activity
  private async getRecentActivity(userId: string): Promise<ChainActivity[]> {
    try {
      // This would query for recent chain activities
      // Mock implementation for now
      return [
        {
          id: 'activity-1',
          type: 'chain_completed',
          chainId: 'chain-123',
          message: 'You completed a chain with alice and bob! 🎉',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          participants: ['alice', 'bob'],
        },
        {
          id: 'activity-2',
          type: 'achievement_unlocked',
          message: 'Achievement unlocked: Speed Demon ⚡',
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        },
      ];
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  // Subscribe to real-time statistics updates
  subscribeToUserStatistics(
    userId: string,
    callback: (statistics: UserStatistics | null) => void
  ): () => void {
    const userStatsRef = doc(firestore, 'userStatistics', userId);

    return onSnapshot(userStatsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (!data) {
          callback(null);
          return;
        }
        
        const statistics: UserStatistics = {
          userId: data.userId || userId,
          totalChainsCreated: data.totalChainsCreated || 0,
          totalChainsParticipated: data.totalChainsParticipated || 0,
          chainCompletionRate: data.chainCompletionRate || 0,
          averageResponseTime: data.averageResponseTime || 0,
          fastestResponseTime: data.fastestResponseTime || Infinity,
          totalPhotosShared: data.totalPhotosShared || 0,
          totalReactionsReceived: data.totalReactionsReceived || 0,
          totalReactionsGiven: data.totalReactionsGiven || 0,
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          achievements: (data.achievements || []).map((ach: any) => ({
            ...ach,
            unlockedAt: ach.unlockedAt?.toDate() || new Date(),
          })),
          favoritePromptCategory: data.favoritePromptCategory || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        };
        callback(statistics);
      } else {
        callback(null);
      }
    });
  }

  // Calculate completion rate
  calculateCompletionRate(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }

  // Update response time statistics
  async updateResponseTime(userId: string, responseTimeMinutes: number): Promise<void> {
    try {
      const stats = await this.getUserStatistics(userId);
      if (!stats) return;

      const newFastest = Math.min(stats.fastestResponseTime, responseTimeMinutes);
      const newAverage = ((stats.averageResponseTime * stats.totalPhotosShared) + responseTimeMinutes) / (stats.totalPhotosShared + 1);

      await this.updateUserStatistics(userId, {
        fastestResponseTime: newFastest,
        averageResponseTime: Math.round(newAverage),
      });
    } catch (error) {
      console.error('Error updating response time:', error);
    }
  }

  // Update streak
  async updateStreak(userId: string, hasActivity: boolean): Promise<void> {
    try {
      const stats = await this.getUserStatistics(userId);
      if (!stats) return;

      if (hasActivity) {
        const newStreak = stats.currentStreak + 1;
        const newLongest = Math.max(stats.longestStreak, newStreak);

        await this.updateUserStatistics(userId, {
          currentStreak: newStreak,
          longestStreak: newLongest,
        });
      } else {
        // Reset streak if no activity
        await this.updateUserStatistics(userId, {
          currentStreak: 0,
        });
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }

  // Achievement notification system
  async createAchievementNotification(userId: string, achievement: Achievement): Promise<void> {
    try {
      const notification: AchievementNotification = {
        id: `notif_${Date.now()}_${userId}`,
        userId,
        achievement,
        createdAt: new Date(),
        isRead: false,
        celebrationShown: false,
      };

      await setDoc(doc(firestore, 'achievementNotifications', notification.id), {
        ...notification,
        createdAt: serverTimestamp(),
      });

      console.log('Achievement notification created:', notification.id);
    } catch (error) {
      console.error('Error creating achievement notification:', error);
    }
  }

  // Get unread achievement notifications
  async getUnreadAchievementNotifications(userId: string): Promise<AchievementNotification[]> {
    try {
      const q = query(
        collection(firestore, 'achievementNotifications'),
        where('userId', '==', userId),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        achievement: {
          ...doc.data().achievement,
          unlockedAt: doc.data().achievement.unlockedAt?.toDate() || new Date(),
        },
      } as AchievementNotification));
    } catch (error) {
      console.error('Error getting achievement notifications:', error);
      return [];
    }
  }

  // Mark achievement notification as read
  async markAchievementNotificationRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'achievementNotifications', notificationId), {
        isRead: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark celebration as shown
  async markCelebrationShown(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'achievementNotifications', notificationId), {
        celebrationShown: true,
      });
    } catch (error) {
      console.error('Error marking celebration as shown:', error);
    }
  }

  // Leaderboard system
  async getGlobalLeaderboard(metric: 'chains' | 'streak' | 'reactions' | 'speed', limitCount: number = 50): Promise<Leaderboard> {
    try {
      let orderField: string;
      let orderDirection: 'asc' | 'desc' = 'desc';

      switch (metric) {
        case 'chains':
          orderField = 'totalChainsParticipated';
          break;
        case 'streak':
          orderField = 'currentStreak';
          break;
        case 'reactions':
          orderField = 'totalReactionsReceived';
          break;
        case 'speed':
          orderField = 'fastestResponseTime';
          orderDirection = 'asc'; // Faster is better
          break;
        default:
          orderField = 'totalChainsParticipated';
      }

      const q = query(
        collection(firestore, 'userStatistics'),
        orderBy(orderField, orderDirection),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];

      for (let i = 0; i < snapshot.docs.length; i++) {
        const doc = snapshot.docs[i];
        const stats = doc.data();
        
        // Get user info (would need to join with users collection)
        const userDoc = await getDoc(doc(firestore, 'users', stats.userId));
        const userData = userDoc.data();

        if (userData) {
          entries.push({
            userId: stats.userId,
            username: userData.username || 'Anonymous',
            avatar: userData.avatar,
            score: stats[orderField] || 0,
            rank: i + 1,
            change: 'same', // Would calculate based on previous rankings
            stats: {
              chainsCompleted: stats.totalChainsParticipated || 0,
              averageResponseTime: stats.averageResponseTime || 0,
              currentStreak: stats.currentStreak || 0,
              totalReactions: stats.totalReactionsReceived || 0,
            },
          });
        }
      }

      return {
        type: 'global',
        period: 'all-time',
        entries,
        totalParticipants: entries.length,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error getting global leaderboard:', error);
      return {
        type: 'global',
        period: 'all-time',
        entries: [],
        totalParticipants: 0,
        lastUpdated: new Date(),
      };
    }
  }

  // Get friends leaderboard
  async getFriendsLeaderboard(userId: string, friendIds: string[], metric: 'chains' | 'streak' | 'reactions' | 'speed'): Promise<Leaderboard> {
    try {
      const entries: LeaderboardEntry[] = [];
      const allUserIds = [userId, ...friendIds];

      // Get stats for user and friends
      for (const uid of allUserIds) {
        const stats = await this.getUserStatistics(uid);
        const userDoc = await getDoc(doc(firestore, 'users', uid));
        const userData = userDoc.data();

        if (stats && userData) {
          let score = 0;
          switch (metric) {
            case 'chains':
              score = stats.totalChainsParticipated;
              break;
            case 'streak':
              score = stats.currentStreak;
              break;
            case 'reactions':
              score = stats.totalReactionsReceived;
              break;
            case 'speed':
              score = stats.fastestResponseTime === Infinity ? 0 : stats.fastestResponseTime;
              break;
          }

          entries.push({
            userId: uid,
            username: userData.username || 'Anonymous',
            avatar: userData.avatar,
            score,
            rank: 0, // Will be set after sorting
            change: 'same',
            stats: {
              chainsCompleted: stats.totalChainsParticipated,
              averageResponseTime: stats.averageResponseTime,
              currentStreak: stats.currentStreak,
              totalReactions: stats.totalReactionsReceived,
            },
          });
        }
      }

      // Sort and assign ranks
      const isAscending = metric === 'speed';
      entries.sort((a, b) => {
        if (isAscending) {
          // For speed, lower is better, but handle 0 (no data) as worst
          if (a.score === 0 && b.score === 0) return 0;
          if (a.score === 0) return 1;
          if (b.score === 0) return -1;
          return a.score - b.score;
        }
        return b.score - a.score;
      });

      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return {
        type: 'friends',
        period: 'all-time',
        entries,
        userRank: entries.find(e => e.userId === userId)?.rank,
        totalParticipants: entries.length,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error getting friends leaderboard:', error);
      return {
        type: 'friends',
        period: 'all-time',
        entries: [],
        totalParticipants: 0,
        lastUpdated: new Date(),
      };
    }
  }

  // Get weekly leaderboard (chains completed this week)
  async getWeeklyLeaderboard(limitCount: number = 20): Promise<Leaderboard> {
    try {
      // Would need to track weekly statistics separately
      // For now, return global leaderboard with weekly period
      const globalBoard = await this.getGlobalLeaderboard('chains', limitCount);
      return {
        ...globalBoard,
        type: 'weekly',
        period: 'this-week',
      };
    } catch (error) {
      console.error('Error getting weekly leaderboard:', error);
      return {
        type: 'weekly',
        period: 'this-week',
        entries: [],
        totalParticipants: 0,
        lastUpdated: new Date(),
      };
    }
  }

  // Create or join competition
  async createCompetition(event: Omit<CompetitionEvent, 'id' | 'participants' | 'leaderboard' | 'isActive'>): Promise<string> {
    try {
      const competition: CompetitionEvent = {
        ...event,
        id: `comp_${Date.now()}`,
        participants: [],
        leaderboard: [],
        isActive: true,
      };

      await setDoc(doc(firestore, 'competitions', competition.id), {
        ...competition,
        startDate: serverTimestamp(),
        endDate: serverTimestamp(),
      });

      return competition.id;
    } catch (error) {
      console.error('Error creating competition:', error);
      throw error;
    }
  }

  // Join competition
  async joinCompetition(competitionId: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'competitions', competitionId), {
        participants: increment(1), // Would use arrayUnion in real implementation
      });
    } catch (error) {
      console.error('Error joining competition:', error);
    }
  }

  // Get active competitions
  async getActiveCompetitions(): Promise<CompetitionEvent[]> {
    try {
      const q = query(
        collection(firestore, 'competitions'),
        where('isActive', '==', true),
        orderBy('startDate', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate() || new Date(),
      } as CompetitionEvent));
    } catch (error) {
      console.error('Error getting competitions:', error);
      return [];
    }
  }

  // Calculate user's leaderboard position
  async getUserLeaderboardPosition(userId: string, metric: 'chains' | 'streak' | 'reactions' | 'speed'): Promise<{ rank: number; totalUsers: number; percentile: number }> {
    try {
      const userStats = await this.getUserStatistics(userId);
      if (!userStats) {
        return { rank: -1, totalUsers: 0, percentile: 0 };
      }

      let userScore = 0;
      let orderField = '';
      let orderDirection: 'asc' | 'desc' = 'desc';

      switch (metric) {
        case 'chains':
          userScore = userStats.totalChainsParticipated;
          orderField = 'totalChainsParticipated';
          break;
        case 'streak':
          userScore = userStats.currentStreak;
          orderField = 'currentStreak';
          break;
        case 'reactions':
          userScore = userStats.totalReactionsReceived;
          orderField = 'totalReactionsReceived';
          break;
        case 'speed':
          userScore = userStats.fastestResponseTime;
          orderField = 'fastestResponseTime';
          orderDirection = 'asc';
          break;
      }

      // Count users with better scores
      let betterUsersQuery;
      if (orderDirection === 'desc') {
        betterUsersQuery = query(
          collection(firestore, 'userStatistics'),
          where(orderField, '>', userScore)
        );
      } else {
        betterUsersQuery = query(
          collection(firestore, 'userStatistics'),
          where(orderField, '<', userScore),
          where(orderField, '>', 0) // Exclude users with no data
        );
      }

      const betterUsersSnapshot = await getDocs(betterUsersQuery);
      const rank = betterUsersSnapshot.size + 1;

      // Get total users with data
      const totalUsersQuery = query(
        collection(firestore, 'userStatistics'),
        where(orderField, '>', 0)
      );
      const totalUsersSnapshot = await getDocs(totalUsersQuery);
      const totalUsers = totalUsersSnapshot.size;

      const percentile = totalUsers > 0 ? Math.round(((totalUsers - rank + 1) / totalUsers) * 100) : 0;

      return { rank, totalUsers, percentile };
    } catch (error) {
      console.error('Error calculating leaderboard position:', error);
      return { rank: -1, totalUsers: 0, percentile: 0 };
    }
  }
}

// Export singleton instance
export const statisticsService = new StatisticsService();