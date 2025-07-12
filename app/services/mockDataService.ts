import { User, Post, Comment, Streak, PhotoMetadata } from '../types';

// Mock Users Data
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'alice_smith',
    email: 'alice@flare.app',
    displayName: 'Alice Smith',
    avatar: 'https://via.placeholder.com/100/FF4D4D/FFFFFF?text=AS',
    bio: 'Daily streak enthusiast 📸',
    currentStreak: 42,
    totalPhotos: 156,
    longestStreak: 67,
    friends: ['2', '3', '4'],
    createdAt: new Date('2024-01-15'),
    lastActiveAt: new Date(),
    lastPhotoDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '2',
    username: 'john_doe',
    email: 'john@flare.app',
    displayName: 'John Doe',
    avatar: 'https://via.placeholder.com/100/FF4D4D/FFFFFF?text=JD',
    bio: 'Capturing life one day at a time',
    currentStreak: 28,
    totalPhotos: 84,
    longestStreak: 45,
    friends: ['1', '3'],
    createdAt: new Date('2024-02-01'),
    lastActiveAt: new Date(),
    lastPhotoDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    id: '3',
    username: 'sarah_wilson',
    email: 'sarah@flare.app',
    displayName: 'Sarah Wilson',
    avatar: 'https://via.placeholder.com/100/FF4D4D/FFFFFF?text=SW',
    bio: 'Flare addict 🔥',
    currentStreak: 15,
    totalPhotos: 45,
    longestStreak: 32,
    friends: ['1', '2', '4'],
    createdAt: new Date('2024-03-01'),
    lastActiveAt: new Date(),
    lastPhotoDate: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },
  {
    id: '4',
    username: 'mike_jones',
    email: 'mike@flare.app',
    displayName: 'Mike Jones',
    avatar: 'https://via.placeholder.com/100/FF4D4D/FFFFFF?text=MJ',
    bio: 'Streak master 🏆',
    currentStreak: 89,
    totalPhotos: 267,
    longestStreak: 89,
    friends: ['1', '3'],
    createdAt: new Date('2024-01-01'),
    lastActiveAt: new Date(),
    lastPhotoDate: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
  },
];

// Mock Posts Data
export const mockPosts: Post[] = [
  {
    id: '1',
    userId: '1',
    username: 'alice_smith',
    userAvatar: 'https://via.placeholder.com/40/FF4D4D/FFFFFF?text=AS',
    photoUrl: 'https://picsum.photos/400/500?random=1',
    thumbnailUrl: 'https://picsum.photos/200/250?random=1',
    previewUrl: 'https://picsum.photos/400/500?random=1',
    caption: 'Morning coffee and sunrise ☕️',
    streakDay: 42,
    location: {
      city: 'San Francisco',
      country: 'USA',
      coordinates: [37.7749, -122.4194],
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    likes: ['2', '3'],
    comments: [
      {
        id: '1',
        postId: '1',
        userId: '2',
        username: 'john_doe',
        userAvatar: 'https://via.placeholder.com/40/FF4D4D/FFFFFF?text=JD',
        text: 'Great shot! 📸',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        likes: ['1'],
      },
    ],
    isVisible: true,
    timeAgo: '2 hours ago',
  },
  {
    id: '2',
    userId: '2',
    username: 'john_doe',
    userAvatar: 'https://via.placeholder.com/40/FF4D4D/FFFFFF?text=JD',
    photoUrl: 'https://picsum.photos/400/500?random=2',
    thumbnailUrl: 'https://picsum.photos/200/250?random=2',
    previewUrl: 'https://picsum.photos/400/500?random=2',
    caption: 'Lunch break vibes 🍕',
    streakDay: 28,
    location: {
      city: 'New York',
      country: 'USA',
      coordinates: [40.7128, -74.0060],
    },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    likes: ['1'],
    comments: [],
    isVisible: true,
    timeAgo: '4 hours ago',
  },
  {
    id: '3',
    userId: '3',
    username: 'sarah_wilson',
    userAvatar: 'https://via.placeholder.com/40/FF4D4D/FFFFFF?text=SW',
    photoUrl: 'https://picsum.photos/400/500?random=3',
    thumbnailUrl: 'https://picsum.photos/200/250?random=3',
    previewUrl: 'https://picsum.photos/400/500?random=3',
    caption: 'Afternoon workout 💪',
    streakDay: 15,
    location: {
      city: 'Los Angeles',
      country: 'USA',
      coordinates: [34.0522, -118.2437],
    },
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    likes: ['1', '2', '4'],
    comments: [
      {
        id: '2',
        postId: '3',
        userId: '4',
        username: 'mike_jones',
        userAvatar: 'https://via.placeholder.com/40/FF4D4D/FFFFFF?text=MJ',
        text: 'Keep it up! 🔥',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        likes: ['3'],
      },
    ],
    isVisible: true,
    timeAgo: '6 hours ago',
  },
  {
    id: '4',
    userId: '4',
    username: 'mike_jones',
    userAvatar: 'https://via.placeholder.com/40/FF4D4D/FFFFFF?text=MJ',
    photoUrl: 'https://picsum.photos/400/500?random=4',
    thumbnailUrl: 'https://picsum.photos/200/250?random=4',
    previewUrl: 'https://picsum.photos/400/500?random=4',
    caption: 'Evening walk 🌅',
    streakDay: 89,
    location: {
      city: 'Chicago',
      country: 'USA',
      coordinates: [41.8781, -87.6298],
    },
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    likes: ['1', '3'],
    comments: [],
    isVisible: true,
    timeAgo: '8 hours ago',
  },
];

// Mock Streaks Data
export const mockStreaks: Streak[] = [
  {
    id: '1',
    userId: '1',
    startDate: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
    currentCount: 42,
    isActive: true,
    photos: Array.from({ length: 42 }, (_, i) => `https://picsum.photos/400/500?random=${i + 100}`),
    lastPhotoDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    userId: '2',
    startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    currentCount: 28,
    isActive: true,
    photos: Array.from({ length: 28 }, (_, i) => `https://picsum.photos/400/500?random=${i + 200}`),
    lastPhotoDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
];

// Current user (for profile screen)
export const mockCurrentUser = mockUsers[0];

// Mock Photo URLs for Profile Grid
export const mockPhotoUrls = Array.from({ length: 15 }, (_, i) => 
  `https://picsum.photos/400/500?random=${i + 500}`
);

// Service Functions
export const getFeedPosts = async (userId?: string, limit: number = 20): Promise<Post[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Filter posts based on user's friends if userId provided
  if (userId) {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      return mockPosts
        .filter(post => user.friends.includes(post.userId) || post.userId === userId)
        .slice(0, limit);
    }
  }
  
  return mockPosts.slice(0, limit);
};

export const getCurrentUser = async (): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return { ...mockCurrentUser };
};

export const getUserById = async (userId: string): Promise<User | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockUsers.find(user => user.id === userId) || null;
};

export const getUserPhotos = async (userId: string, limit: number = 12): Promise<string[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const user = mockUsers.find(u => u.id === userId);
  if (!user) return [];
  
  // Return mock photo URLs based on user's total photos
  return Array.from({ length: Math.min(user.totalPhotos, limit) }, (_, i) => 
    `https://picsum.photos/400/500?random=${userId}_${i + 1}`
  );
};

export const likePost = async (postId: string, userId: string): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const post = mockPosts.find(p => p.id === postId);
  if (post) {
    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }
  }
};

export const addComment = async (postId: string, userId: string, text: string): Promise<Comment> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const user = mockUsers.find(u => u.id === userId);
  if (!user) throw new Error('User not found');
  
  const comment: Comment = {
    id: Date.now().toString(),
    postId,
    userId,
    username: user.username,
    userAvatar: user.avatar || undefined,
    text,
    createdAt: new Date(),
    likes: [],
  };
  
  const post = mockPosts.find(p => p.id === postId);
  if (post) {
    post.comments.push(comment);
  }
  
  return comment;
};

export const getCurrentStreak = async (userId: string): Promise<Streak | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockStreaks.find(streak => streak.userId === userId) || null;
};

export const searchUsers = async (query: string): Promise<User[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return mockUsers.filter(user => 
    user.username.toLowerCase().includes(query.toLowerCase()) ||
    user.displayName.toLowerCase().includes(query.toLowerCase())
  );
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error('User not found');
  
  const updatedUser = { ...mockUsers[userIndex], ...updates };
  mockUsers[userIndex] = updatedUser;
  return updatedUser;
};

// Photo upload simulation
export const uploadPhoto = async (photoUri: string, userId: string): Promise<PhotoMetadata> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const photoId = Date.now().toString();
  const photoMetadata: PhotoMetadata = {
    id: photoId,
    userId,
    originalUrl: `https://picsum.photos/400/500?random=${photoId}`,
    thumbnailUrl: `https://picsum.photos/200/250?random=${photoId}`,
    previewUrl: `https://picsum.photos/400/500?random=${photoId}`,
    size: Math.floor(Math.random() * 1000000) + 500000, // 0.5-1.5MB
    dimensions: {
      width: 400,
      height: 500,
    },
    orientation: 'portrait',
    createdAt: new Date(),
  };
  
  return photoMetadata;
};

// Error simulation for testing
export const simulateError = async (errorType: 'network' | 'auth' | 'validation' = 'network'): Promise<never> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  switch (errorType) {
    case 'network':
      throw new Error('Network error. Please check your connection.');
    case 'auth':
      throw new Error('Authentication error. Please log in again.');
    case 'validation':
      throw new Error('Validation error. Please check your input.');
    default:
      throw new Error('An unexpected error occurred.');
  }
};