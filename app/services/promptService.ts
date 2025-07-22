import { ChainPrompt, DailyPrompt, PromptCategory, User } from '../types';
import { PromptType, PromptCategoryType } from '../types/flare';
import { firestore } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  setDoc,
  getDoc
} from '@react-native-firebase/firestore';

// Extended interfaces for advanced features
export interface PromptRating {
  userId: string;
  promptId: string;
  rating: number; // 1-5 stars
  feedback?: string;
  createdAt: Date;
}

export interface UserPromptHistory {
  userId: string;
  usedPrompts: string[];
  favoritePrompts: string[];
  createdPrompts: string[];
  ratings: PromptRating[];
  lastUpdated: Date;
}

export interface PromptModerationStatus {
  promptId: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  moderatedBy?: string;
  moderatedAt: Date;
}

export interface CustomPromptData extends ChainPrompt {
  createdBy: string;
  createdByUsername: string;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  reports: number;
  averageRating: number;
  totalRatings: number;
  usageCount: number;
  tags: string[];
}

// Daily prompt themes for each day of the week
const DAILY_THEMES = {
  0: { theme: 'Sleepy Sunday', emoji: '😴', color: '#A8E6CF' },
  1: { theme: 'Monday Motivation', emoji: '💪', color: '#FF8B94' },
  2: { theme: 'Transformation Tuesday', emoji: '🦋', color: '#4ECDC4' },
  3: { theme: 'Wisdom Wednesday', emoji: '🧠', color: '#FFD93D' },
  4: { theme: 'Thirsty Thursday', emoji: '🥤', color: '#FF6B6B' },
  5: { theme: 'Feel-Good Friday', emoji: '🎉', color: '#A8E6CF' },
  6: { theme: 'Social Saturday', emoji: '👥', color: '#FF8B94' },
};

// Predefined daily prompts
const DAILY_PROMPTS = [
  // Sunday - Sleepy Sunday
  { day: 0, title: 'Morning Vibes', description: 'Show us your sleepy Sunday morning', emoji: '☀️' },
  { day: 0, title: 'Comfort Zone', description: 'Share your coziest spot right now', emoji: '🛋️' },
  { day: 0, title: 'Lazy Day', description: 'What does relaxation look like to you?', emoji: '😌' },
  
  // Monday - Monday Motivation  
  { day: 1, title: 'New Week Energy', description: 'Show us what motivates you this Monday', emoji: '⚡' },
  { day: 1, title: 'Goal Crusher', description: 'Share something you\'re working towards', emoji: '🎯' },
  { day: 1, title: 'Monday Mood', description: 'How are you tackling this new week?', emoji: '💪' },
  
  // Tuesday - Transformation Tuesday
  { day: 2, title: 'Before & After', description: 'Show us a change you\'ve made recently', emoji: '🔄' },
  { day: 2, title: 'Growth Moment', description: 'Share how you\'ve grown this month', emoji: '🌱' },
  { day: 2, title: 'New Perspective', description: 'Something you see differently now', emoji: '👁️' },
  
  // Wednesday - Wisdom Wednesday
  { day: 3, title: 'Life Lesson', description: 'Share something important you\'ve learned', emoji: '📚' },
  { day: 3, title: 'Wise Words', description: 'Show us something that inspired you today', emoji: '💭' },
  { day: 3, title: 'Teaching Moment', description: 'Something you could teach others', emoji: '🎓' },
  
  // Thursday - Thirsty Thursday
  { day: 4, title: 'Drink Check', description: 'Show us your favorite drink today', emoji: '🥤' },
  { day: 4, title: 'Hydration Station', description: 'How are you staying refreshed?', emoji: '💧' },
  { day: 4, title: 'Thirst Quencher', description: 'What\'s keeping you energized?', emoji: '⚡' },
  
  // Friday - Feel-Good Friday
  { day: 5, title: 'Weekend Ready', description: 'Show us your Friday celebration', emoji: '🎉' },
  { day: 5, title: 'Happy Moment', description: 'Share something that made you smile today', emoji: '😊' },
  { day: 5, title: 'Friday Feeling', description: 'How are you ending the week?', emoji: '✨' },
  
  // Saturday - Social Saturday
  { day: 6, title: 'Squad Goals', description: 'Show us your Saturday social time', emoji: '👥' },
  { day: 6, title: 'Fun Times', description: 'Share your Saturday adventure', emoji: '🎊' },
  { day: 6, title: 'Weekend Vibes', description: 'Who are you spending time with?', emoji: '💫' },
];

// Category prompts
const CATEGORY_PROMPTS = {
  [PromptCategoryType.EMOTIONS]: [
    { title: 'Current Mood', description: 'Show us how you\'re feeling right now', emoji: '😊' },
    { title: 'Happy Place', description: 'Share what makes you feel at peace', emoji: '🌈' },
    { title: 'Emotional Support', description: 'Something that comforts you when sad', emoji: '🤗' },
    { title: 'Joy Trigger', description: 'What never fails to make you smile?', emoji: '😄' },
    { title: 'Stress Relief', description: 'How do you unwind after a tough day?', emoji: '😌' },
  ],
  [PromptCategoryType.ADVENTURE]: [
    { title: 'New Discovery', description: 'Show us something new you found today', emoji: '🔍' },
    { title: 'Hidden Gem', description: 'Share a secret spot you love', emoji: '💎' },
    { title: 'Adventure Time', description: 'Your most exciting moment this week', emoji: '🏃‍♂️' },
    { title: 'Explore Mode', description: 'Something you\'ve never tried before', emoji: '🗺️' },
    { title: 'Wild Side', description: 'Show us your adventurous spirit', emoji: '🌟' },
  ],
  [PromptCategoryType.CREATIVITY]: [
    { title: 'Art Attack', description: 'Create something artistic with what\'s around you', emoji: '🎨' },
    { title: 'DIY Moment', description: 'Show us something you made or fixed', emoji: '🔨' },
    { title: 'Creative Solution', description: 'How did you solve a problem creatively?', emoji: '💡' },
    { title: 'Inspiration Strike', description: 'What sparked your creativity today?', emoji: '⚡' },
    { title: 'Artistic Vision', description: 'Turn something ordinary into art', emoji: '✨' },
  ],
  [PromptCategoryType.CONNECTION]: [
    { title: 'Friendship Goals', description: 'Show us a moment with a friend', emoji: '👭' },
    { title: 'Family Time', description: 'Share a special family moment', emoji: '👨‍👩‍👧‍👦' },
    { title: 'Random Kindness', description: 'Someone who was kind to you today', emoji: '💝' },
    { title: 'Support System', description: 'Who has your back?', emoji: '🤝' },
    { title: 'Love Language', description: 'How do you show you care?', emoji: '💕' },
  ],
  [PromptCategoryType.GROWTH]: [
    { title: 'Learning Curve', description: 'Something new you\'re learning', emoji: '📈' },
    { title: 'Challenge Accepted', description: 'A difficulty you\'re overcoming', emoji: '💪' },
    { title: 'Skill Building', description: 'Show us a skill you\'re developing', emoji: '🏗️' },
    { title: 'Progress Check', description: 'How have you grown this month?', emoji: '🌱' },
    { title: 'Future Self', description: 'What are you working towards?', emoji: '🚀' },
  ],
};

export const promptService = {
  // Get today's daily prompt
  async getTodaysPrompt(): Promise<DailyPrompt> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const theme = DAILY_THEMES[dayOfWeek as keyof typeof DAILY_THEMES];
    
    // Get random prompt for today
    const todaysPrompts = DAILY_PROMPTS.filter(p => p.day === dayOfWeek);
    const selectedPrompt = todaysPrompts[Math.floor(Math.random() * todaysPrompts.length)];
    
    return {
      id: `daily-${dayOfWeek}-${today.getTime()}`,
      type: PromptType.DAILY,
      title: selectedPrompt.title,
      description: selectedPrompt.description,
      emoji: selectedPrompt.emoji,
      isActive: true,
      popularity: 0,
      createdAt: today,
      dayOfWeek,
      isSpecial: dayOfWeek === 4, // Thursday is special (Thirsty Thursday)
      theme: theme.theme,
    };
  },

  // Get all daily prompts for the week
  async getWeeklyPrompts(): Promise<DailyPrompt[]> {
    const prompts: DailyPrompt[] = [];
    
    for (let day = 0; day < 7; day++) {
      const theme = DAILY_THEMES[day as keyof typeof DAILY_THEMES];
      const dayPrompts = DAILY_PROMPTS.filter(p => p.day === day);
      const selectedPrompt = dayPrompts[0]; // Use first prompt for each day
      
      prompts.push({
        id: `daily-${day}`,
        type: PromptType.DAILY,
        title: selectedPrompt.title,
        description: selectedPrompt.description,
        emoji: selectedPrompt.emoji,
        isActive: true,
        popularity: Math.floor(Math.random() * 100),
        createdAt: new Date(),
        dayOfWeek: day,
        isSpecial: day === 4,
        theme: theme.theme,
      });
    }
    
    return prompts;
  },

  // Get prompts by category
  async getPromptsByCategory(category: PromptCategoryType): Promise<ChainPrompt[]> {
    const categoryPrompts = CATEGORY_PROMPTS[category] || [];
    
    return categoryPrompts.map((prompt, index) => ({
      id: `${category}-${index}`,
      type: PromptType.CATEGORY,
      category,
      title: prompt.title,
      description: prompt.description,
      emoji: prompt.emoji,
      isActive: true,
      popularity: Math.floor(Math.random() * 50),
      createdAt: new Date(),
    }));
  },

  // Get trending prompts (mock data for now)
  async getTrendingPrompts(): Promise<ChainPrompt[]> {
    const allCategories = Object.values(PromptCategoryType);
    const trending: ChainPrompt[] = [];
    
    for (const category of allCategories) {
      const categoryPrompts = await this.getPromptsByCategory(category);
      // Get top 2 from each category
      trending.push(...categoryPrompts.slice(0, 2));
    }
    
    // Sort by popularity and return top 10
    return trending
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);
  },

  // Get prompt categories with metadata
  async getPromptCategories(): Promise<PromptCategory[]> {
    return [
      {
        id: 'emotions',
        type: PromptCategoryType.EMOTIONS,
        name: 'Emotions',
        description: 'Express your feelings',
        emoji: '❤️',
        color: '#FF6B6B',
        promptCount: CATEGORY_PROMPTS[PromptCategoryType.EMOTIONS].length,
        isActive: true,
      },
      {
        id: 'adventure',
        type: PromptCategoryType.ADVENTURE,
        name: 'Adventure',
        description: 'Explore and discover',
        emoji: '🗺️',
        color: '#4ECDC4',
        promptCount: CATEGORY_PROMPTS[PromptCategoryType.ADVENTURE].length,
        isActive: true,
      },
      {
        id: 'creativity',
        type: PromptCategoryType.CREATIVITY,
        name: 'Creativity',
        description: 'Let your imagination run wild',
        emoji: '🎨',
        color: '#A8E6CF',
        promptCount: CATEGORY_PROMPTS[PromptCategoryType.CREATIVITY].length,
        isActive: true,
      },
      {
        id: 'connection',
        type: PromptCategoryType.CONNECTION,
        name: 'Connection',
        description: 'Build relationships',
        emoji: '🤝',
        color: '#FFD93D',
        promptCount: CATEGORY_PROMPTS[PromptCategoryType.CONNECTION].length,
        isActive: true,
      },
      {
        id: 'growth',
        type: PromptCategoryType.GROWTH,
        name: 'Growth',
        description: 'Learn and develop',
        emoji: '🌱',
        color: '#FF8B94',
        promptCount: CATEGORY_PROMPTS[PromptCategoryType.GROWTH].length,
        isActive: true,
      },
    ];
  },

  // Create custom prompt with moderation
  async createCustomPrompt(
    title: string, 
    description: string, 
    userId: string, 
    username: string,
    category?: PromptCategoryType,
    tags: string[] = []
  ): Promise<CustomPromptData> {
    const customPrompt: CustomPromptData = {
      id: `custom-${Date.now()}-${userId}`,
      type: PromptType.CUSTOM,
      category,
      title: title.trim(),
      description: description.trim(),
      createdBy: userId,
      createdByUsername: username,
      moderationStatus: 'pending',
      reports: 0,
      averageRating: 0,
      totalRatings: 0,
      usageCount: 0,
      tags: tags.map(tag => tag.toLowerCase().trim()),
      isActive: false, // Inactive until moderated
      popularity: 0,
      createdAt: new Date(),
    };
    
    try {
      // Add to Firestore custom prompts collection
      await addDoc(collection(firestore, 'customPrompts'), customPrompt);
      
      // Update user's prompt history
      await this.addToUserPromptHistory(userId, 'createdPrompts', customPrompt.id);
      
      console.log('Custom prompt created:', customPrompt.id);
      return customPrompt;
    } catch (error) {
      console.error('Error creating custom prompt:', error);
      throw new Error('Failed to create custom prompt');
    }
  },

  // Get custom prompts (approved only for public, all for moderation)
  async getCustomPrompts(includeUnmoderated: boolean = false): Promise<CustomPromptData[]> {
    try {
      let q = query(
        collection(firestore, 'customPrompts'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      if (!includeUnmoderated) {
        q = query(
          collection(firestore, 'customPrompts'),
          where('moderationStatus', '==', 'approved'),
          where('isActive', '==', true),
          orderBy('averageRating', 'desc'),
          limit(50)
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data() } as CustomPromptData));
    } catch (error) {
      console.error('Error fetching custom prompts:', error);
      return [];
    }
  },

  // Rate a prompt
  async ratePrompt(promptId: string, userId: string, rating: number, feedback?: string): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    try {
      const ratingData: PromptRating = {
        userId,
        promptId,
        rating,
        feedback: feedback?.trim(),
        createdAt: new Date(),
      };
      
      // Add rating to Firestore
      await addDoc(collection(firestore, 'promptRatings'), ratingData);
      
      // Update prompt's average rating if it's a custom prompt
      await this.updatePromptRating(promptId, rating);
      
      // Add to user's rating history
      await this.addToUserPromptHistory(userId, 'ratings', ratingData);
      
      console.log('Prompt rated successfully');
    } catch (error) {
      console.error('Error rating prompt:', error);
      throw new Error('Failed to rate prompt');
    }
  },

  // Get user's prompt ratings
  async getUserPromptRatings(userId: string): Promise<PromptRating[]> {
    try {
      const q = query(
        collection(firestore, 'promptRatings'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data() } as PromptRating));
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      return [];
    }
  },

  // Add prompt to favorites
  async addToFavorites(userId: string, promptId: string): Promise<void> {
    try {
      await this.addToUserPromptHistory(userId, 'favoritePrompts', promptId);
      console.log('Added to favorites:', promptId);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw new Error('Failed to add to favorites');
    }
  },

  // Remove prompt from favorites
  async removeFromFavorites(userId: string, promptId: string): Promise<void> {
    try {
      await this.removeFromUserPromptHistory(userId, 'favoritePrompts', promptId);
      console.log('Removed from favorites:', promptId);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw new Error('Failed to remove from favorites');
    }
  },

  // Get user's favorite prompts
  async getUserFavorites(userId: string): Promise<ChainPrompt[]> {
    try {
      const history = await this.getUserPromptHistory(userId);
      if (!history || !history.favoritePrompts.length) return [];
      
      // Get prompt details for favorites
      const favoritePrompts: ChainPrompt[] = [];
      
      // Get daily prompts
      const dailyPrompts = await this.getWeeklyPrompts();
      favoritePrompts.push(...dailyPrompts.filter(p => history.favoritePrompts.includes(p.id)));
      
      // Get category prompts
      for (const category of Object.values(PromptCategoryType)) {
        const categoryPrompts = await this.getPromptsByCategory(category);
        favoritePrompts.push(...categoryPrompts.filter(p => history.favoritePrompts.includes(p.id)));
      }
      
      // Get custom prompts
      const customPrompts = await this.getCustomPrompts();
      favoritePrompts.push(...customPrompts.filter(p => history.favoritePrompts.includes(p.id)));
      
      return favoritePrompts;
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      return [];
    }
  },

  // Get user's prompt usage history
  async getUserPromptHistory(userId: string): Promise<UserPromptHistory | null> {
    try {
      const docRef = doc(firestore, 'userPromptHistory', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { ...docSnap.data() } as UserPromptHistory;
      }
      
      // Create initial history document
      const initialHistory: UserPromptHistory = {
        userId,
        usedPrompts: [],
        favoritePrompts: [],
        createdPrompts: [],
        ratings: [],
        lastUpdated: new Date(),
      };
      
      await setDoc(docRef, initialHistory);
      return initialHistory;
    } catch (error) {
      console.error('Error fetching user prompt history:', error);
      return null;
    }
  },

  // Record prompt usage
  async recordPromptUsage(userId: string, promptId: string): Promise<void> {
    try {
      await this.addToUserPromptHistory(userId, 'usedPrompts', promptId);
      await this.incrementPromptPopularity(promptId);
      console.log('Recorded prompt usage:', promptId);
    } catch (error) {
      console.error('Error recording prompt usage:', error);
    }
  },

  // Get personalized prompt recommendations
  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<ChainPrompt[]> {
    try {
      const history = await this.getUserPromptHistory(userId);
      if (!history) return await this.getTrendingPrompts();
      
      const recommendations: ChainPrompt[] = [];
      
      // Get user's favorite categories based on usage
      const categoryUsage = new Map<PromptCategoryType, number>();
      
      // Analyze used prompts to find preferred categories
      for (const promptId of history.usedPrompts) {
        // Parse category from prompt ID or get from database
        const category = this.extractCategoryFromPromptId(promptId);
        if (category) {
          categoryUsage.set(category, (categoryUsage.get(category) || 0) + 1);
        }
      }
      
      // Get prompts from preferred categories first
      const sortedCategories = Array.from(categoryUsage.entries())
        .sort(([,a], [,b]) => b - a)
        .map(([category]) => category);
      
      for (const category of sortedCategories) {
        const categoryPrompts = await this.getPromptsByCategory(category);
        const unusedPrompts = categoryPrompts.filter(p => !history.usedPrompts.includes(p.id));
        recommendations.push(...unusedPrompts.slice(0, 3));
      }
      
      // Fill remaining slots with trending prompts
      if (recommendations.length < limit) {
        const trending = await this.getTrendingPrompts();
        const unusedTrending = trending.filter(p => 
          !history.usedPrompts.includes(p.id) && 
          !recommendations.some(r => r.id === p.id)
        );
        recommendations.push(...unusedTrending.slice(0, limit - recommendations.length));
      }
      
      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return await this.getTrendingPrompts();
    }
  },

  // Helper method to extract category from prompt ID
  extractCategoryFromPromptId(promptId: string): PromptCategoryType | null {
    for (const category of Object.values(PromptCategoryType)) {
      if (promptId.startsWith(category)) {
        return category;
      }
    }
    return null;
  },

  // Helper method to update user prompt history
  async addToUserPromptHistory(
    userId: string, 
    field: keyof UserPromptHistory, 
    value: any
  ): Promise<void> {
    const docRef = doc(firestore, 'userPromptHistory', userId);
    
    if (field === 'ratings') {
      await updateDoc(docRef, {
        [field]: arrayUnion(value),
        lastUpdated: new Date(),
      });
    } else {
      await updateDoc(docRef, {
        [field]: arrayUnion(value),
        lastUpdated: new Date(),
      });
    }
  },

  // Helper method to remove from user prompt history
  async removeFromUserPromptHistory(
    userId: string, 
    field: keyof UserPromptHistory, 
    value: any
  ): Promise<void> {
    const docRef = doc(firestore, 'userPromptHistory', userId);
    await updateDoc(docRef, {
      [field]: arrayRemove(value),
      lastUpdated: new Date(),
    });
  },

  // Helper method to update prompt rating
  async updatePromptRating(promptId: string, newRating: number): Promise<void> {
    try {
      // Only update if it's a custom prompt
      if (promptId.startsWith('custom-')) {
        const q = query(
          collection(firestore, 'customPrompts'),
          where('id', '==', promptId),
          limit(1)
        );
        
        const snapshot = await getDocs(q);
        if (snapshot && snapshot.docs && !snapshot.empty) {
          const doc = snapshot.docs[0];
          const currentData = doc.data() as CustomPromptData;
          
          const newTotalRatings = currentData.totalRatings + 1;
          const newAverageRating = 
            (currentData.averageRating * currentData.totalRatings + newRating) / newTotalRatings;
          
          await updateDoc(doc.ref, {
            averageRating: newAverageRating,
            totalRatings: newTotalRatings,
          });
        }
      }
    } catch (error) {
      console.error('Error updating prompt rating:', error);
    }
  },

  // Increment prompt popularity when used
  async incrementPromptPopularity(promptId: string): Promise<void> {
    try {
      if (promptId.startsWith('custom-')) {
        // Update custom prompt usage count
        const q = query(
          collection(firestore, 'customPrompts'),
          where('id', '==', promptId),
          limit(1)
        );
        
        const snapshot = await getDocs(q);
        if (snapshot && snapshot.docs && !snapshot.empty) {
          const doc = snapshot.docs[0];
          await updateDoc(doc.ref, {
            usageCount: increment(1),
            popularity: increment(1),
          });
        }
      } else {
        // For built-in prompts, just log for analytics
        console.log(`Incrementing popularity for prompt: ${promptId}`);
      }
    } catch (error) {
      console.error('Error incrementing prompt popularity:', error);
    }
  },

  // Search prompts by title or description
  async searchPrompts(query: string): Promise<ChainPrompt[]> {
    const allPrompts: ChainPrompt[] = [];
    
    // Search daily prompts
    const dailyPrompts = await this.getWeeklyPrompts();
    allPrompts.push(...dailyPrompts);
    
    // Search category prompts
    for (const category of Object.values(PromptCategoryType)) {
      const categoryPrompts = await this.getPromptsByCategory(category);
      allPrompts.push(...categoryPrompts);
    }
    
    // Filter by query
    const lowercaseQuery = query.toLowerCase();
    return allPrompts.filter(prompt => 
      prompt.title.toLowerCase().includes(lowercaseQuery) ||
      prompt.description.toLowerCase().includes(lowercaseQuery)
    );
  },
};