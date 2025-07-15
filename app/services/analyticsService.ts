import firestore from '@react-native-firebase/firestore';
import { FlareChain, ChainPhoto, ChainParticipant, UserStatistics } from '../types';

export interface ChainAnalytics {
  chainId: string;
  createdAt: Date;
  completionRate: number;
  averageResponseTime: number; // minutes
  fastestResponse: number; // minutes
  slowestResponse: number; // minutes
  totalPhotos: number;
  participantCount: number;
  dropoffRate: number; // percentage of participants who didn't complete
  engagementScore: number; // 0-100 based on reactions, chat activity
  peakActivityHour: number; // 0-23
  averagePhotosPerParticipant: number;
  chatMessageCount: number;
  totalReactions: number;
  promptCategory: string;
  promptPopularity: number;
}

export interface UserBehaviorMetrics {
  userId: string;
  totalChainsJoined: number;
  completionRate: number;
  averageResponseTime: number;
  favoriteTimeOfDay: number; // 0-23
  mostActiveDay: number; // 0-6 (Sunday-Saturday)
  preferredPromptCategories: string[];
  friendInteractionRate: number;
  chainStarterScore: number; // how often they initiate chains
  socialScore: number; // based on reactions given/received
  consistencyScore: number; // how regularly they participate
  lastActiveDate: Date;
  streakDays: number;
  longestStreak: number;
}

export interface PerformanceMetrics {
  totalChains: number;
  totalActiveUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageChainCompletionRate: number;
  averageResponseTime: number;
  mostPopularPromptCategories: string[];
  peakUsageHours: number[];
  userRetentionRate: number;
  newUserGrowthRate: number;
  engagementTrends: {
    date: Date;
    activeUsers: number;
    chainsCreated: number;
    chainsCompleted: number;
    averageEngagement: number;
  }[];
}

export interface ChainInsight {
  type: 'completion_rate' | 'response_time' | 'engagement' | 'participation' | 'trending';
  title: string;
  description: string;
  metric: number;
  trend: 'up' | 'down' | 'stable';
  recommendation?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface UserInsight {
  type: 'performance' | 'behavior' | 'social' | 'suggestion';
  title: string;
  description: string;
  actionable: boolean;
  suggestion?: string;
  priority: 'high' | 'medium' | 'low';
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private readonly db = firestore();

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Chain Analytics Methods
  async generateChainAnalytics(chainId: string): Promise<ChainAnalytics> {
    try {
      const chainDoc = await this.db.collection('flareChains').doc(chainId).get();
      if (!chainDoc.exists) {
        throw new Error('Chain not found');
      }

      const chainData = chainDoc.data() as FlareChain;
      const photos = chainData.photos || [];
      const participants = chainData.participants || [];

      // Calculate completion rate
      const completedParticipants = participants.filter(p => p.status === 'completed').length;
      const completionRate = participants.length > 0 ? (completedParticipants / participants.length) * 100 : 0;

      // Calculate response times
      const responseTimes = photos.map(photo => {
        const participant = participants.find(p => p.userId === photo.userId);
        if (participant && participant.respondedAt) {
          return (participant.respondedAt.getTime() - participant.invitedAt.getTime()) / (1000 * 60); // minutes
        }
        return 0;
      }).filter(time => time > 0);

      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;
      const fastestResponse = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
      const slowestResponse = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

      // Calculate engagement score
      const totalReactions = photos.reduce((sum, photo) => sum + (photo.reactions?.length || 0), 0);
      const chatDoc = await this.db.collection('chatRooms').doc(chainData.groupChatId || '').get();
      const chatMessageCount = chatDoc.exists ? chatDoc.data()?.messageCount || 0 : 0;
      
      const engagementScore = Math.min(100, (totalReactions * 2) + (chatMessageCount * 1.5));

      // Calculate peak activity hour
      const photoTimes = photos.map(photo => photo.createdAt.getHours());
      const peakActivityHour = this.calculateMostFrequent(photoTimes);

      // Calculate dropoff rate
      const dropoffRate = participants.length > 0 
        ? ((participants.length - completedParticipants) / participants.length) * 100 
        : 0;

      return {
        chainId,
        createdAt: chainData.createdAt,
        completionRate,
        averageResponseTime,
        fastestResponse,
        slowestResponse,
        totalPhotos: photos.length,
        participantCount: participants.length,
        dropoffRate,
        engagementScore,
        peakActivityHour,
        averagePhotosPerParticipant: participants.length > 0 ? photos.length / participants.length : 0,
        chatMessageCount,
        totalReactions,
        promptCategory: chainData.prompt.category || 'general',
        promptPopularity: chainData.prompt.popularity || 0,
      };
    } catch (error) {
      console.error('Error generating chain analytics:', error);
      throw error;
    }
  }

  // User Behavior Analytics
  async generateUserBehaviorMetrics(userId: string): Promise<UserBehaviorMetrics> {
    try {
      const chainsSnapshot = await this.db.collection('flareChains')
        .where('participants', 'array-contains', userId)
        .get();

      const userChains = chainsSnapshot.docs.map(doc => doc.data() as FlareChain);
      const completedChains = userChains.filter(chain => {
        const userParticipant = chain.participants.find(p => p.userId === userId);
        return userParticipant?.status === 'completed';
      });

      const completionRate = userChains.length > 0 
        ? (completedChains.length / userChains.length) * 100 
        : 0;

      // Calculate response times
      const responseTimes: number[] = [];
      const activityHours: number[] = [];
      const activityDays: number[] = [];

      for (const chain of userChains) {
        const userParticipant = chain.participants.find(p => p.userId === userId);
        if (userParticipant?.respondedAt) {
          const responseTime = (userParticipant.respondedAt.getTime() - userParticipant.invitedAt.getTime()) / (1000 * 60);
          responseTimes.push(responseTime);
          activityHours.push(userParticipant.respondedAt.getHours());
          activityDays.push(userParticipant.respondedAt.getDay());
        }
      }

      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;

      const favoriteTimeOfDay = this.calculateMostFrequent(activityHours);
      const mostActiveDay = this.calculateMostFrequent(activityDays);

      // Get user statistics for additional metrics
      const userStats = await this.getUserStatistics(userId);

      return {
        userId,
        totalChainsJoined: userChains.length,
        completionRate,
        averageResponseTime,
        favoriteTimeOfDay,
        mostActiveDay,
        preferredPromptCategories: await this.getUserPreferredCategories(userId),
        friendInteractionRate: await this.calculateFriendInteractionRate(userId),
        chainStarterScore: await this.calculateChainStarterScore(userId),
        socialScore: await this.calculateSocialScore(userId),
        consistencyScore: await this.calculateConsistencyScore(userId),
        lastActiveDate: userStats?.lastUpdated || new Date(),
        streakDays: userStats?.currentStreak || 0,
        longestStreak: userStats?.longestStreak || 0,
      };
    } catch (error) {
      console.error('Error generating user behavior metrics:', error);
      throw error;
    }
  }

  // Performance Metrics
  async generatePerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get total chains
      const totalChainsSnapshot = await this.db.collection('flareChains').get();
      const totalChains = totalChainsSnapshot.size;

      // Get active users
      const dailyActiveSnapshot = await this.db.collection('userStatistics')
        .where('lastUpdated', '>=', dayAgo)
        .get();
      const weeklyActiveSnapshot = await this.db.collection('userStatistics')
        .where('lastUpdated', '>=', weekAgo)
        .get();
      const monthlyActiveSnapshot = await this.db.collection('userStatistics')
        .where('lastUpdated', '>=', monthAgo)
        .get();

      const dailyActiveUsers = dailyActiveSnapshot.size;
      const weeklyActiveUsers = weeklyActiveSnapshot.size;
      const monthlyActiveUsers = monthlyActiveSnapshot.size;
      const totalActiveUsers = monthlyActiveUsers;

      // Calculate completion rate
      const completedChains = totalChainsSnapshot.docs.filter(doc => 
        doc.data().status === 'completed'
      ).length;
      const averageChainCompletionRate = totalChains > 0 
        ? (completedChains / totalChains) * 100 
        : 0;

      // Calculate average response time
      const averageResponseTime = await this.calculateGlobalAverageResponseTime();

      // Get popular prompt categories
      const mostPopularPromptCategories = await this.getMostPopularPromptCategories();

      // Calculate peak usage hours
      const peakUsageHours = await this.calculatePeakUsageHours();

      // Calculate retention and growth rates
      const userRetentionRate = await this.calculateUserRetentionRate();
      const newUserGrowthRate = await this.calculateNewUserGrowthRate();

      // Get engagement trends
      const engagementTrends = await this.getEngagementTrends();

      return {
        totalChains,
        totalActiveUsers,
        dailyActiveUsers,
        weeklyActiveUsers,
        monthlyActiveUsers,
        averageChainCompletionRate,
        averageResponseTime,
        mostPopularPromptCategories,
        peakUsageHours,
        userRetentionRate,
        newUserGrowthRate,
        engagementTrends,
      };
    } catch (error) {
      console.error('Error generating performance metrics:', error);
      throw error;
    }
  }

  // Insights Generation
  async generateChainInsights(chainId: string): Promise<ChainInsight[]> {
    try {
      const analytics = await this.generateChainAnalytics(chainId);
      const insights: ChainInsight[] = [];

      // Completion rate insight
      if (analytics.completionRate < 50) {
        insights.push({
          type: 'completion_rate',
          title: 'Low Completion Rate',
          description: `Only ${analytics.completionRate.toFixed(1)}% of participants completed this chain`,
          metric: analytics.completionRate,
          trend: 'down',
          recommendation: 'Consider shorter time limits or simpler prompts to improve completion rates',
          priority: 'high',
        });
      }

      // Response time insight
      if (analytics.averageResponseTime > 30) {
        insights.push({
          type: 'response_time',
          title: 'Slow Response Time',
          description: `Average response time is ${analytics.averageResponseTime.toFixed(1)} minutes`,
          metric: analytics.averageResponseTime,
          trend: 'up',
          recommendation: 'Try more engaging prompts or send reminders to speed up responses',
          priority: 'medium',
        });
      }

      // Engagement insight
      if (analytics.engagementScore > 70) {
        insights.push({
          type: 'engagement',
          title: 'High Engagement',
          description: `This chain has an engagement score of ${analytics.engagementScore.toFixed(1)}/100`,
          metric: analytics.engagementScore,
          trend: 'up',
          recommendation: 'This prompt type works well! Consider creating similar chains',
          priority: 'low',
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating chain insights:', error);
      return [];
    }
  }

  async generateUserInsights(userId: string): Promise<UserInsight[]> {
    try {
      const metrics = await this.generateUserBehaviorMetrics(userId);
      const insights: UserInsight[] = [];

      // Performance insight
      if (metrics.completionRate < 70) {
        insights.push({
          type: 'performance',
          title: 'Improve Completion Rate',
          description: `You complete ${metrics.completionRate.toFixed(1)}% of chains you join`,
          actionable: true,
          suggestion: 'Try joining chains with prompts that interest you more',
          priority: 'medium',
        });
      }

      // Behavior insight
      if (metrics.averageResponseTime > 45) {
        insights.push({
          type: 'behavior',
          title: 'Quick Response Opportunity',
          description: `Your average response time is ${metrics.averageResponseTime.toFixed(1)} minutes`,
          actionable: true,
          suggestion: 'Enable notifications to respond faster and keep chains moving',
          priority: 'low',
        });
      }

      // Social insight
      if (metrics.socialScore < 30) {
        insights.push({
          type: 'social',
          title: 'Increase Social Interaction',
          description: 'You could be more active in chain conversations',
          actionable: true,
          suggestion: 'Try reacting to photos and chatting more in your chains',
          priority: 'medium',
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating user insights:', error);
      return [];
    }
  }

  // Helper Methods
  private calculateMostFrequent(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const frequency: { [key: number]: number } = {};
    numbers.forEach(num => frequency[num] = (frequency[num] || 0) + 1);
    
    return Object.keys(frequency).reduce((a, b) => 
      frequency[parseInt(a)] > frequency[parseInt(b)] ? a : b
    ) as unknown as number;
  }

  private async getUserStatistics(userId: string): Promise<UserStatistics | null> {
    try {
      const userStatsDoc = await this.db.collection('userStatistics').doc(userId).get();
      return userStatsDoc.exists ? userStatsDoc.data() as UserStatistics : null;
    } catch (error) {
      console.error('Error getting user statistics:', error);
      return null;
    }
  }

  private async getUserPreferredCategories(userId: string): Promise<string[]> {
    try {
      const chainsSnapshot = await this.db.collection('flareChains')
        .where('participants', 'array-contains', userId)
        .get();

      const categories: string[] = [];
      chainsSnapshot.docs.forEach(doc => {
        const chain = doc.data() as FlareChain;
        if (chain.prompt.category) {
          categories.push(chain.prompt.category);
        }
      });

      // Count frequency and return top 3
      const frequency: { [key: string]: number } = {};
      categories.forEach(cat => frequency[cat] = (frequency[cat] || 0) + 1);
      
      return Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .slice(0, 3);
    } catch (error) {
      console.error('Error getting user preferred categories:', error);
      return [];
    }
  }

  private async calculateFriendInteractionRate(userId: string): Promise<number> {
    // Implementation for friend interaction rate calculation
    // This would involve checking how often user interacts with friends in chains
    return 75; // Placeholder
  }

  private async calculateChainStarterScore(userId: string): Promise<number> {
    try {
      const createdChainsSnapshot = await this.db.collection('flareChains')
        .where('creatorId', '==', userId)
        .get();

      const totalChainsSnapshot = await this.db.collection('flareChains')
        .where('participants', 'array-contains', userId)
        .get();

      const createdCount = createdChainsSnapshot.size;
      const totalCount = totalChainsSnapshot.size;

      return totalCount > 0 ? (createdCount / totalCount) * 100 : 0;
    } catch (error) {
      console.error('Error calculating chain starter score:', error);
      return 0;
    }
  }

  private async calculateSocialScore(userId: string): Promise<number> {
    // Implementation for social score calculation
    // This would involve reactions given/received, chat participation, etc.
    return 60; // Placeholder
  }

  private async calculateConsistencyScore(userId: string): Promise<number> {
    // Implementation for consistency score calculation
    // This would involve checking regular participation patterns
    return 80; // Placeholder
  }

  private async calculateGlobalAverageResponseTime(): Promise<number> {
    // Implementation for global average response time
    return 25; // Placeholder
  }

  private async getMostPopularPromptCategories(): Promise<string[]> {
    // Implementation for most popular prompt categories
    return ['connection', 'creativity', 'daily']; // Placeholder
  }

  private async calculatePeakUsageHours(): Promise<number[]> {
    // Implementation for peak usage hours calculation
    return [12, 18, 20]; // Placeholder
  }

  private async calculateUserRetentionRate(): Promise<number> {
    // Implementation for user retention rate calculation
    return 85; // Placeholder
  }

  private async calculateNewUserGrowthRate(): Promise<number> {
    // Implementation for new user growth rate calculation
    return 15; // Placeholder
  }

  private async getEngagementTrends(): Promise<PerformanceMetrics['engagementTrends']> {
    // Implementation for engagement trends
    return []; // Placeholder
  }
}

export default AnalyticsService.getInstance();