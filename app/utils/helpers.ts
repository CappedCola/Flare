import { User, Post, AppError, ValidationError, SUPPORTED_IMAGE_FORMATS, MAX_PHOTO_SIZE } from '../types';

// Time formatting utilities
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ID generation utilities
export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const generateUniqueId = (prefix: string = ''): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}_${random}`;
};

// String utilities
export const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

export const sanitizeUsername = (username: string): string => {
  return username.toLowerCase().replace(/[^a-z0-9_]/g, '');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validation utilities
export const validateUser = (user: Partial<User>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!user.username || user.username.trim().length < 3) {
    errors.push({
      field: 'username',
      message: 'Username must be at least 3 characters long',
    });
  }
  
  if (!user.email || !validateEmail(user.email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
    });
  }
  
  if (!user.displayName || user.displayName.trim().length < 2) {
    errors.push({
      field: 'displayName',
      message: 'Display name must be at least 2 characters long',
    });
  }
  
  return errors;
};

export const validatePost = (post: Partial<Post>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!post.photoUrl || post.photoUrl.trim().length === 0) {
    errors.push({
      field: 'photoUrl',
      message: 'Photo is required',
    });
  }
  
  if (post.caption && post.caption.length > 280) {
    errors.push({
      field: 'caption',
      message: 'Caption must be less than 280 characters',
    });
  }
  
  return errors;
};

// Image utilities
export const validateImageFile = (fileUri: string, mimeType?: string): { isValid: boolean; error?: string } => {
  // Check file type
  if (mimeType && !SUPPORTED_IMAGE_FORMATS.includes(mimeType)) {
    return {
      isValid: false,
      error: 'Unsupported image format. Please use JPEG, PNG, or WebP.',
    };
  }
  
  // Additional validation can be added here
  return { isValid: true };
};

export const getImageDimensions = (imageUri: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const Image = require('react-native').Image;
    Image.getSize(
      imageUri,
      (width: number, height: number) => resolve({ width, height }),
      (error: any) => reject(error)
    );
  });
};

export const compressImageUri = async (imageUri: string, quality: number = 0.8): Promise<string> => {
  // For now, return the original URI
  // In a real implementation, you would use a library like react-native-image-picker
  // or expo-image-manipulator to compress the image
  return imageUri;
};

// Array utilities
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const removeDuplicates = <T>(array: T[], key?: keyof T): T[] => {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

// Error handling utilities
export const createAppError = (code: string, message: string, details?: any): AppError => {
  return { code, message, details };
};

export const handleServiceError = (error: any): AppError => {
  if (error.code && error.message) {
    return error as AppError;
  }
  
  // Handle common error types
  if (error.message?.includes('Network')) {
    return createAppError('NETWORK_ERROR', 'Please check your internet connection');
  }
  
  if (error.message?.includes('Auth')) {
    return createAppError('AUTH_ERROR', 'Please log in again');
  }
  
  if (error.message?.includes('Permission')) {
    return createAppError('PERMISSION_ERROR', 'You don\'t have permission to perform this action');
  }
  
  // Default error
  return createAppError('UNKNOWN_ERROR', 'An unexpected error occurred');
};

// Streak utilities
export const calculateStreakStatus = (lastPhotoDate: Date): { 
  isActive: boolean; 
  hoursRemaining: number; 
  daysMissed: number; 
} => {
  const now = new Date();
  const timeDiff = now.getTime() - lastPhotoDate.getTime();
  const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
  const daysDiff = Math.floor(hoursDiff / 24);
  
  // A streak is active if the last photo was taken within the last 24 hours
  const isActive = hoursDiff < 24;
  const hoursRemaining = isActive ? 24 - hoursDiff : 0;
  const daysMissed = Math.max(0, daysDiff - 1);
  
  return { isActive, hoursRemaining, daysMissed };
};

export const getStreakMessage = (streakCount: number, hoursRemaining: number): string => {
  if (hoursRemaining === 0) {
    return `Your ${streakCount}-day streak has ended`;
  }
  
  if (hoursRemaining < 2) {
    return `${hoursRemaining} hour left to keep your ${streakCount}-day streak!`;
  }
  
  return `${hoursRemaining} hours left to keep your ${streakCount}-day streak`;
};

// Storage utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isFileSizeValid = (sizeInBytes: number): boolean => {
  return sizeInBytes <= MAX_PHOTO_SIZE;
};

// Theme utilities
export const getThemeColor = (theme: any, colorKey: string): string => {
  return theme[colorKey] || '#000000';
};

export const adjustOpacity = (color: string, opacity: number): string => {
  // Simple opacity adjustment for hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return `#${hex}${alpha}`;
  }
  return color;
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Async utilities
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Location utilities
export const formatLocation = (city: string, country: string): string => {
  return `${city}, ${country}`;
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Development utilities
export const logError = (error: any, context?: string): void => {
  if (__DEV__) {
    console.error(`[${context || 'Error'}]`, error);
  }
};

export const logPerformance = (label: string, startTime: number): void => {
  if (__DEV__) {
    const endTime = Date.now();
    console.log(`[Performance] ${label}: ${endTime - startTime}ms`);
  }
};