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
};

export type AuthStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  SignIn: undefined;
};

export type TabParamList = {
  Feed: undefined;
  Camera: undefined;
  Profile: undefined;
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
export const POST_VISIBILITY_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export const MAX_STREAK_DAYS = 365;
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];