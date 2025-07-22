import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  doc,
  getDoc
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { 
  DiscoveryData, 
  TrendingPrompt, 
  SuggestedUser, 
  PopularChain, 
  NearbyUser,
  SearchFilters,
  UserSearchResult,
  ChainSearchResult,
  PromptCategoryType
} from '../types';

export class DiscoveryService {
  // Get comprehensive discovery data for user
  async getDiscoveryData(userId: string): Promise<DiscoveryData | null> {
    try {
      const [trendingPrompts, suggestedUsers, popularChains, nearbyUsers] = await Promise.all([
        this.getTrendingPrompts(),
        this.getSuggestedUsers(userId),
        this.getPopularChains(),
        this.getNearbyUsers(userId),
      ]);

      return {
        trendingPrompts,
        suggestedUsers,
        popularChains,
        nearbyUsers,
      };
    } catch (error) {
      console.error('Error getting discovery data:', error);
      return null;
    }
  }

  // Get trending prompts based on usage and engagement
  async getTrendingPrompts(limit: number = 10): Promise<TrendingPrompt[]> {
    try {
      // Mock implementation - would query Firebase for actual data
      return [
        {
          prompt: {
            id: 'trending-1',
            type: 'daily' as any,
            category: 'emotions' as PromptCategoryType,
            title: 'Current Mood',
            description: 'Show us how you\'re feeling right now',
            emoji: '😊',
            isActive: true,
            popularity: 95,
            createdAt: new Date(),
          },
          usageCount: 247,
          trendScore: 95,
          participantCount: 189,
          completionRate: 87,
        },
        {
          prompt: {
            id: 'trending-2',
            type: 'custom' as any,
            category: 'adventure' as PromptCategoryType,
            title: 'Weekend Adventure',
            description: 'Share your weekend exploration',
            emoji: '🏔️',
            isActive: true,
            popularity: 89,
            createdAt: new Date(),
          },
          usageCount: 156,
          trendScore: 89,
          participantCount: 134,
          completionRate: 92,
        },
        {
          prompt: {
            id: 'trending-3',
            type: 'category' as any,
            category: 'creativity' as PromptCategoryType,
            title: 'Creative Corner',
            description: 'Show us your latest creative work',
            emoji: '🎨',
            isActive: true,
            popularity: 82,
            createdAt: new Date(),
          },
          usageCount: 134,
          trendScore: 82,
          participantCount: 98,
          completionRate: 79,
        },
      ];
    } catch (error) {
      console.error('Error getting trending prompts:', error);
      return [];
    }
  }

  // Get suggested users based on mutual friends and interests
  async getSuggestedUsers(userId: string, limit: number = 8): Promise<SuggestedUser[]> {
    try {
      // Mock implementation - would use complex recommendation algorithms
      return [
        {
          userId: 'suggested-1',
          username: 'sarah_photographer',
          avatar: '📸',
          mutualFriends: ['alice_photo', 'bob_creative'],
          sharedChains: 3,
          suggestionReason: 'mutual_friends',
        },
        {
          userId: 'suggested-2', 
          username: 'mike_adventurer',
          avatar: '🏃‍♂️',
          mutualFriends: ['charlie_lens'],
          sharedChains: 0,
          suggestionReason: 'shared_interests',
        },
        {
          userId: 'suggested-3',
          username: 'emma_artist',
          avatar: '🎨',
          mutualFriends: [],
          sharedChains: 1,
          suggestionReason: 'chain_participation',
        },
        {
          userId: 'suggested-4',
          username: 'local_explorer',
          avatar: '🗺️',
          mutualFriends: [],
          sharedChains: 0,
          suggestionReason: 'geographic',
          distance: 2.3,
        },
      ];
    } catch (error) {
      console.error('Error getting suggested users:', error);
      return [];
    }
  }

  // Get popular chains that users can join
  async getPopularChains(limit: number = 6): Promise<PopularChain[]> {
    try {
      // Mock implementation - would query active chains with high engagement
      return [
        {
          chainId: 'popular-1',
          prompt: {
            id: 'prompt-popular-1',
            type: 'daily' as any,
            title: 'Coffee Culture',
            description: 'Share your coffee moment',
            emoji: '☕',
            isActive: true,
            popularity: 88,
            createdAt: new Date(),
          },
          creator: 'coffee_lover',
          participantCount: 6,
          completionRate: 94,
          averageResponseTime: 23, // minutes
          isJoinable: true,
          tags: ['coffee', 'morning', 'routine'],
        },
        {
          chainId: 'popular-2',
          prompt: {
            id: 'prompt-popular-2',
            type: 'category' as any,
            category: 'adventure' as PromptCategoryType,
            title: 'City Explorer',
            description: 'Discover hidden gems in your city',
            emoji: '🏙️',
            isActive: true,
            popularity: 85,
            createdAt: new Date(),
          },
          creator: 'urban_explorer',
          participantCount: 4,
          completionRate: 81,
          averageResponseTime: 45,
          isJoinable: true,
          tags: ['exploration', 'city', 'discovery'],
        },
        {
          chainId: 'popular-3',
          prompt: {
            id: 'prompt-popular-3',
            type: 'custom' as any,
            category: 'creativity' as PromptCategoryType,
            title: 'Sunset Stories',
            description: 'Capture the golden hour',
            emoji: '🌅',
            isActive: true,
            popularity: 79,
            createdAt: new Date(),
          },
          creator: 'golden_hour',
          participantCount: 8,
          completionRate: 76,
          averageResponseTime: 32,
          isJoinable: false, // Full
          tags: ['sunset', 'photography', 'nature'],
        },
      ];
    } catch (error) {
      console.error('Error getting popular chains:', error);
      return [];
    }
  }

  // Get nearby users (requires location permission)
  async getNearbyUsers(userId: string, radiusKm: number = 25): Promise<NearbyUser[]> {
    try {
      // Mock implementation - would use geolocation queries
      return [
        {
          userId: 'nearby-1',
          username: 'local_foodie',
          avatar: '🍜',
          distance: 1.2,
          lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
          commonInterests: ['connection' as PromptCategoryType, 'adventure' as PromptCategoryType],
        },
        {
          userId: 'nearby-2',
          username: 'neighborhood_walker',
          avatar: '🚶‍♀️',
          distance: 3.7,
          lastSeen: new Date(Date.now() - 1800000), // 30 minutes ago
          commonInterests: ['emotions' as PromptCategoryType],
        },
      ];
    } catch (error) {
      console.error('Error getting nearby users:', error);
      return [];
    }
  }

  // Search users with filters
  async searchUsers(
    query: string, 
    filters: SearchFilters = {}, 
    limit: number = 20
  ): Promise<UserSearchResult[]> {
    try {
      // Mock implementation - would implement full-text search with filters
      const mockResults: UserSearchResult[] = [
        {
          userId: 'search-1',
          username: 'alex_photos',
          avatar: '📷',
          statistics: {
            chainsCompleted: 23,
            averageResponseTime: 18,
            completionRate: 89,
          },
          badges: [
            {
              id: 'badge-1',
              type: 'chain_master' as any,
              title: 'Chain Master',
              description: 'Complete 10 chains',
              emoji: '👑',
              unlockedAt: new Date(),
            },
          ],
          mutualFriends: ['alice_photo'],
          isOnline: true,
        },
        {
          userId: 'search-2',
          username: 'outdoor_enthusiast',
          avatar: '⛰️',
          statistics: {
            chainsCompleted: 15,
            averageResponseTime: 34,
            completionRate: 76,
          },
          badges: [],
          mutualFriends: [],
          isOnline: false,
        },
      ];

      // Filter by query
      if (query) {
        return mockResults.filter(user => 
          user.username.toLowerCase().includes(query.toLowerCase())
        );
      }

      return mockResults;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Search chains with filters
  async searchChains(
    query: string,
    filters: SearchFilters = {},
    limit: number = 20
  ): Promise<ChainSearchResult[]> {
    try {
      // Mock implementation
      return [
        {
          chainId: 'chain-search-1',
          prompt: {
            id: 'prompt-search-1',
            type: 'custom' as any,
            category: filters.category || 'adventure' as PromptCategoryType,
            title: 'Morning Routine',
            description: 'Share your perfect morning',
            emoji: '🌅',
            isActive: true,
            popularity: 75,
            createdAt: new Date(),
          },
          creator: 'morning_person',
          status: 'active' as any,
          participantCount: 3,
          spotsAvailable: 2,
          timeRemaining: 1800000, // 30 minutes
          tags: ['morning', 'routine', 'lifestyle'],
        },
      ];
    } catch (error) {
      console.error('Error searching chains:', error);
      return [];
    }
  }

  // Calculate mutual friends between users
  async getMutualFriends(userId1: string, userId2: string): Promise<string[]> {
    try {
      // Mock implementation - would query friend relationships
      return ['alice_photo', 'charlie_lens'];
    } catch (error) {
      console.error('Error getting mutual friends:', error);
      return [];
    }
  }

  // Get user's interests based on chain participation
  async getUserInterests(userId: string): Promise<PromptCategoryType[]> {
    try {
      // Mock implementation - would analyze user's chain history
      return ['emotions' as PromptCategoryType, 'creativity' as PromptCategoryType];
    } catch (error) {
      console.error('Error getting user interests:', error);
      return [];
    }
  }

  // Calculate trend score for prompts
  private calculateTrendScore(
    usageCount: number,
    completionRate: number,
    recentActivity: number
  ): number {
    // Weighted algorithm: usage (40%), completion rate (30%), recent activity (30%)
    const usageScore = Math.min(usageCount / 100, 1) * 40;
    const completionScore = (completionRate / 100) * 30;
    const activityScore = Math.min(recentActivity / 50, 1) * 30;
    
    return Math.round(usageScore + completionScore + activityScore);
  }

  // Get recommendation reason for user suggestions
  private getRecommendationReason(
    mutualFriendsCount: number,
    sharedChainsCount: number,
    distance?: number
  ): SuggestedUser['suggestionReason'] {
    if (mutualFriendsCount >= 2) return 'mutual_friends';
    if (sharedChainsCount >= 1) return 'chain_participation';
    if (distance && distance <= 5) return 'geographic';
    return 'shared_interests';
  }

  // Check if user can join a chain
  async canUserJoinChain(userId: string, chainId: string): Promise<boolean> {
    try {
      // Mock implementation - would check chain status, participant limits, etc.
      return true;
    } catch (error) {
      console.error('Error checking if user can join chain:', error);
      return false;
    }
  }

  // Get personalized discovery feed
  async getPersonalizedFeed(userId: string): Promise<{
    forYou: (TrendingPrompt | PopularChain | SuggestedUser)[];
    trending: TrendingPrompt[];
    nearby: NearbyUser[];
  }> {
    try {
      const discoveryData = await this.getDiscoveryData(userId);
      if (!discoveryData) {
        return { forYou: [], trending: [], nearby: [] };
      }

      // Mix different types of content for personalized feed
      const forYou = [
        ...discoveryData.trendingPrompts.slice(0, 2),
        ...discoveryData.suggestedUsers.slice(0, 3),
        ...discoveryData.popularChains.slice(0, 2),
      ].sort(() => Math.random() - 0.5); // Shuffle

      return {
        forYou,
        trending: discoveryData.trendingPrompts,
        nearby: discoveryData.nearbyUsers,
      };
    } catch (error) {
      console.error('Error getting personalized feed:', error);
      return { forYou: [], trending: [], nearby: [] };
    }
  }
}

// Export singleton instance
export const discoveryService = new DiscoveryService();