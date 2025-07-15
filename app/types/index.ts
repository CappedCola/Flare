// Core data types for Flare app
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  currentStreak: number;
  totalPhotos: number;
  longestStreak: number;
  friends: string[];
  createdAt: Date;
  lastActiveAt: Date;
  lastPhotoDate?: Date;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  photoUrl: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  caption?: string;
  streakDay: number;
  location?: {
    city: string;
    country: string;
    coordinates?: [number, number];
  };
  createdAt: Date;
  likes: string[];
  comments: Comment[];
  isVisible: boolean;
  timeAgo: string; // Computed field for UI
}

// Chat system types
export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderUsername: string;
  text: string;
  type: 'text' | 'system';
  createdAt: Date;
  readBy: string[];
}

export interface ChatRoom {
  id: string;
  chainId: string;
  participantIds: string[];
  createdAt: Date;
  lastMessageAt: Date;
  lastMessage: string | null;
  messageCount: number;
}

export interface PersonalPost extends Post {
  isPersonalPost: true;
  recipientId: string;
  senderInfo: {
    id: string;
    username: string;
    avatar?: string;
  };
  status: 'sent' | 'viewed' | 'dismissed';
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
  likes: string[];
}

export interface Streak {
  id: string;
  userId: string;
  startDate: Date;
  endDate?: Date;
  currentCount: number;
  isActive: boolean;
  photos: string[];
  lastPhotoDate: Date;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export interface MutualFriend {
  user: User;
  mutualFriends: string[]; // Array of mutual friend usernames
  mutualCount: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'friend_request' | 'streak_reminder';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export interface PhotoMetadata {
  id: string;
  userId: string;
  originalUrl: string;
  thumbnailUrl: string;
  previewUrl: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  orientation: 'portrait' | 'landscape';
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Service function types
export interface FeedService {
  getFeedPosts(userId: string, limit?: number): Promise<Post[]>;
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
  addComment(postId: string, userId: string, text: string): Promise<Comment>;
  deleteComment(commentId: string, userId: string): Promise<void>;
}

export interface UserService {
  getCurrentUser(): Promise<User>;
  getUserById(userId: string): Promise<User>;
  updateUserProfile(userId: string, updates: Partial<User>): Promise<User>;
  getUserPhotos(userId: string, limit?: number): Promise<string[]>;
  searchUsers(query: string): Promise<User[]>;
}

export interface StreakService {
  getCurrentStreak(userId: string): Promise<Streak>;
  updateStreak(userId: string, photoUrl: string): Promise<Streak>;
  getStreakHistory(userId: string): Promise<Streak[]>;
}

export interface PhotoService {
  uploadPhoto(photoUri: string, userId: string): Promise<PhotoMetadata>;
  deletePhoto(photoId: string, userId: string): Promise<void>;
  getPhotoMetadata(photoId: string): Promise<PhotoMetadata>;
}

export interface AuthService {
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string, username: string): Promise<User>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
}

// Hook return types
export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export interface UseFeedReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
}

export interface UseProfileReturn {
  user: User | null;
  photos: string[];
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  loadPhotos: () => Promise<void>;
}

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  PostUpload: {
    photoUri: string;
    photoOrientation?: 'portrait' | 'landscape';
  };
  PhotoSend: {
    photoUri: string;
    photoOrientation?: 'portrait' | 'landscape';
  };
  PhotoEdit: {
    photoUri: string;
    photoOrientation?: 'portrait' | 'landscape';
  };
  Friends: undefined;
  FlareCreation: {
    prompt?: ChainPrompt;
    photoUri?: string;
    photoOrientation?: 'portrait' | 'landscape';
  };
  FlareChainView: {
    chainId: string;
  };
  FlareResponse: {
    chainId: string;
  };
  FlareChat: {
    chainId: string;
  };
  FlareCompletion: {
    chainId: string;
  };
  FlareHome: undefined;
  FlareDiscovery: undefined;
  FlareLeaderboard: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  SignIn: undefined;
};

export type TabParamList = {
  Feed: undefined;
  Friends: undefined;
  Camera: undefined;
  Profile: undefined;
};

export type FlareStackParamList = {
  FlareHome: undefined;
  FlarePrompt: undefined;
  FlareCreation: {
    prompt: ChainPrompt;
  };
  FlareResponse: {
    chainId: string;
  };
  FlareChainView: {
    chainId: string;
  };
  FlareHistory: undefined;
  FlareChat: {
    chainId: string;
  };
  FlareCompletion: {
    chainId: string;
  };
  FlareDiscovery: undefined;
  FlareLeaderboard: undefined;
};

// Utility types
export type Theme = any; // UI Kitten theme type
export type NavigationProp = any; // React Navigation type
export type RouteProp = any; // React Navigation type

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Constants
// Flare Chain Types
import { ChainStatus, ParticipantStatus, PromptType, PromptCategoryType, ChainTimerStatus, NotificationType } from './flare';

export interface FlareChain {
  id: string;
  creatorId: string;
  creatorUsername: string;
  prompt: ChainPrompt;
  status: ChainStatus;
  participants: ChainParticipant[];
  photos: ChainPhoto[];
  maxParticipants: number;
  currentParticipantIndex: number;
  timeLimit: number; // minutes
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
  groupChatId?: string;
}

export interface ChainParticipant {
  userId: string;
  username: string;
  avatar?: string;
  status: ParticipantStatus;
  position: number; // Order in chain
  invitedAt: Date;
  respondedAt?: Date;
  timeRemaining?: number; // milliseconds
}

export interface ChainPhoto {
  id: string;
  chainId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  photoUrl: string;
  thumbnailUrl?: string;
  interpretation?: string;
  position: number; // Order in chain
  createdAt: Date;
  likes: string[];
  reactions: ChainPhotoReaction[];
}

export interface ChainPhotoReaction {
  id: string;
  userId: string;
  username: string;
  emoji: string;
  createdAt: Date;
}

// Photo timeline and reactions
export interface PhotoTimelineProps {
  chainId: string;
  photos: ChainPhoto[];
  participants: ChainParticipant[];
  currentUserId: string;
  onPhotoPress: (photo: ChainPhoto, index: number) => void;
  onReactionAdd: (photoId: string, emoji: string) => void;
}

export interface ReactionPickerProps {
  visible: boolean;
  onReactionSelect: (emoji: string) => void;
  onClose: () => void;
}

export interface ChainCompletionData {
  chainId: string;
  totalPhotos: number;
  participants: ChainParticipant[];
  completedAt: Date;
  duration: number; // minutes
  highlights: {
    fastestResponse: { username: string; time: number };
    mostReactions: { photoId: string; username: string; count: number };
    participationRate: number;
  };
}

// Advanced Features Types
export interface UserStatistics {
  userId: string;
  totalChainsCreated: number;
  totalChainsParticipated: number;
  chainCompletionRate: number; // percentage
  averageResponseTime: number; // minutes
  fastestResponseTime: number; // minutes
  totalPhotosShared: number;
  totalReactionsReceived: number;
  totalReactionsGiven: number;
  currentStreak: number; // consecutive days with chain activity
  longestStreak: number;
  achievements: Achievement[];
  favoritePromptCategory: PromptCategoryType | null;
  createdAt: Date;
  lastUpdated: Date;
}

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  emoji: string;
  unlockedAt: Date;
  progress?: number; // for tiered achievements
  maxProgress?: number;
}

export enum AchievementType {
  CHAIN_MASTER = 'chain_master', // Complete 10 chains
  SPEED_DEMON = 'speed_demon', // Respond within 5 minutes
  SOCIAL_BUTTERFLY = 'social_butterfly', // Start chains with 20+ different people
  REACTION_KING = 'reaction_king', // Receive 100 reactions
  STREAK_WARRIOR = 'streak_warrior', // Maintain 7-day streak
  CATEGORY_EXPLORER = 'category_explorer', // Use all prompt categories
  EARLY_BIRD = 'early_bird', // Respond first in 5 chains
  CHAIN_STARTER = 'chain_starter', // Create 25 chains
}

export interface ChainDashboardData {
  activeChains: ActiveChainInfo[];
  pendingInvitations: ChainInvitation[];
  recentActivity: ChainActivity[];
  statistics: UserStatistics;
}

export interface ActiveChainInfo {
  chainId: string;
  prompt: ChainPrompt;
  participants: ChainParticipant[];
  currentParticipantIndex: number;
  timeRemaining: number; // milliseconds
  status: ChainStatus;
  isYourTurn: boolean;
  unreadMessages: number;
}

export interface ChainInvitation {
  id: string;
  chainId: string;
  fromUserId: string;
  fromUsername: string;
  prompt: ChainPrompt;
  invitedAt: Date;
  expiresAt: Date;
}

export interface ChainActivity {
  id: string;
  type: 'chain_completed' | 'photo_added' | 'chain_expired' | 'achievement_unlocked';
  chainId?: string;
  message: string;
  timestamp: Date;
  participants?: string[];
}

// Discovery and Recommendations Types
export interface DiscoveryData {
  trendingPrompts: TrendingPrompt[];
  suggestedUsers: SuggestedUser[];
  popularChains: PopularChain[];
  nearbyUsers: NearbyUser[];
}

export interface TrendingPrompt {
  prompt: ChainPrompt;
  usageCount: number;
  trendScore: number;
  participantCount: number;
  completionRate: number;
}

export interface SuggestedUser {
  userId: string;
  username: string;
  avatar?: string;
  mutualFriends: string[];
  sharedChains: number;
  suggestionReason: 'mutual_friends' | 'shared_interests' | 'geographic' | 'chain_participation';
  distance?: number; // km, for geographic suggestions
}

export interface PopularChain {
  chainId: string;
  prompt: ChainPrompt;
  creator: string;
  participantCount: number;
  completionRate: number;
  averageResponseTime: number;
  isJoinable: boolean;
  tags: string[];
}

export interface NearbyUser {
  userId: string;
  username: string;
  avatar?: string;
  distance: number; // km
  lastSeen: Date;
  commonInterests: PromptCategoryType[];
}

export interface SearchFilters {
  category?: PromptCategoryType;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // km
  };
  userLevel?: 'beginner' | 'intermediate' | 'expert';
  responseTime?: 'fast' | 'medium' | 'relaxed';
}

export interface UserSearchResult {
  userId: string;
  username: string;
  avatar?: string;
  statistics: {
    chainsCompleted: number;
    averageResponseTime: number;
    completionRate: number;
  };
  badges: Achievement[];
  mutualFriends: string[];
  isOnline: boolean;
}

export interface ChainSearchResult {
  chainId: string;
  prompt: ChainPrompt;
  creator: string;
  status: ChainStatus;
  participantCount: number;
  spotsAvailable: number;
  timeRemaining?: number;
  tags: string[];
}

export interface ChainPrompt {
  id: string;
  type: PromptType;
  category?: PromptCategoryType;
  title: string;
  description: string;
  emoji?: string;
  createdBy?: string; // For custom prompts
  isActive: boolean;
  popularity: number;
  createdAt: Date;
}

export interface DailyPrompt extends ChainPrompt {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  isSpecial: boolean;
  theme: string; // e.g., "Monday Motivation", "Thirsty Thursday"
}

export interface PromptCategory {
  id: string;
  type: PromptCategoryType;
  name: string;
  description: string;
  emoji: string;
  color: string;
  promptCount: number;
  isActive: boolean;
}

export interface ChainTimer {
  chainId: string;
  participantId: string;
  startTime: Date;
  endTime: Date;
  timeRemaining: number; // milliseconds
  status: ChainTimerStatus;
  warningsSent: number;
}

export interface FlareNotification extends Notification {
  chainId?: string;
  chainTitle?: string;
  senderUsername?: string;
  notificationType: NotificationType;
}

export interface ChainStats {
  userId: string;
  totalChainsCreated: number;
  totalChainsCompleted: number;
  totalPhotosContributed: number;
  averageResponseTime: number; // minutes
  currentActiveChains: number;
  longestChainCompleted: number;
  favoriteCategory: PromptCategoryType;
  streakDays: number;
  achievements: string[];
}

export interface MutualChainParticipant extends MutualFriend {
  sharedChains: string[]; // Chain IDs
  sharedChainCount: number;
}

// Service function types for Flare Chains
export interface FlareChainService {
  createChain(prompt: ChainPrompt, participants: string[], maxParticipants: number): Promise<FlareChain>;
  respondToChain(chainId: string, photoUri: string, interpretation?: string): Promise<ChainPhoto>;
  getActiveChains(userId: string): Promise<FlareChain[]>;
  getChainById(chainId: string): Promise<FlareChain>;
  getChainHistory(userId: string, limit?: number): Promise<FlareChain[]>;
  cancelChain(chainId: string, userId: string): Promise<void>;
  inviteToChain(chainId: string, userIds: string[]): Promise<void>;
  removeFromChain(chainId: string, userId: string): Promise<void>;
}

export interface PromptService {
  getDailyPrompts(): Promise<DailyPrompt[]>;
  getPromptsByCategory(category: PromptCategoryType): Promise<ChainPrompt[]>;
  getTrendingPrompts(): Promise<ChainPrompt[]>;
  createCustomPrompt(title: string, description: string, userId: string): Promise<ChainPrompt>;
  getPromptCategories(): Promise<PromptCategory[]>;
}

export interface ChainTimerService {
  startTimer(chainId: string, participantId: string): Promise<ChainTimer>;
  getTimeRemaining(chainId: string, participantId: string): Promise<number>;
  handleTimerExpiration(timerId: string): Promise<void>;
  sendTimerWarning(timerId: string, type: 'warning' | 'urgent'): Promise<void>;
}

// Hook return types for Flare Chains
export interface UseFlareChainReturn {
  activeChains: FlareChain[];
  completedChains: FlareChain[];
  loading: boolean;
  error: string | null;
  createChain: (prompt: ChainPrompt, participants: string[]) => Promise<FlareChain>;
  respondToChain: (chainId: string, photoUri: string, interpretation?: string) => Promise<void>;
  refreshChains: () => Promise<void>;
}

export interface UseChainTimerReturn {
  timeRemaining: number;
  status: ChainTimerStatus;
  formattedTime: string;
  isExpired: boolean;
  warningsShown: number;
}

export interface UsePromptsReturn {
  dailyPrompts: DailyPrompt[];
  categories: PromptCategory[];
  trendingPrompts: ChainPrompt[];
  loading: boolean;
  error: string | null;
  createCustomPrompt: (title: string, description: string) => Promise<ChainPrompt>;
  refreshPrompts: () => Promise<void>;
}

export const POST_VISIBILITY_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export const MAX_STREAK_DAYS = 365;
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

// Flare Chain Constants
export const CHAIN_TIME_LIMIT = 60; // minutes
export const MAX_CHAIN_PARTICIPANTS = 8;
export const MIN_CHAIN_PARTICIPANTS = 3;
export const TIMER_WARNING_THRESHOLD = 15; // minutes
export const TIMER_URGENT_THRESHOLD = 5; // minutes
export const MAX_INTERPRETATION_LENGTH = 100; // characters