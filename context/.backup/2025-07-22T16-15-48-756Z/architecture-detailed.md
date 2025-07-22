# Flare App - Complete Architecture Documentation

## Executive Summary

Flare is a production-ready React Native social photo-sharing application featuring traditional photo feeds and an innovative "Flare Chains" system for collaborative photo storytelling. Built with TypeScript, Firebase, and React Navigation, the app demonstrates enterprise-level architecture patterns with comprehensive error handling and real-time synchronization.

**Tech Stack:**
- React Native 0.79.4 + Expo SDK 53.0.0
- TypeScript 5.8.3 (strict mode)
- React Native Firebase v22+ (modular API)
- UI Kitten + Eva Design System
- React Navigation v6

---

## 1. File Structure & Organization

### Root Level Files
```
Flare/
├── App.tsx                    # Application entry point with providers
├── package.json               # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration (strict mode)
├── eas.json                  # Expo Application Services build config
├── firebase.json             # Firebase services configuration
├── firestore.rules           # Firestore security rules
├── firestore.indexes.json    # Firestore composite indexes
└── storage.rules             # Firebase Storage security rules
```

### Application Directory Structure
```
app/
├── components/               # Reusable UI components
├── config/                   # Configuration files
├── constants/               # App constants and static data
├── context/                 # React Context providers
├── hooks/                   # Custom React hooks
├── navigation/              # Navigation configuration
├── screens/                 # Screen components
├── services/                # Business logic and API services
├── theme/                   # UI Kitten theme configuration
├── types/                   # TypeScript type definitions
└── utils/                   # Utility functions and helpers
```

---

## 2. TypeScript Type System

### Core User Types (`app/types/index.ts`)

```typescript
// Primary user entity
interface User {
  id: string;                  // Firebase Auth UID
  username: string;            // Unique username for discovery
  email: string;               // Authentication email
  displayName: string;         // Public display name
  avatar?: string;            // Profile picture URL
  bio?: string;               // User biography
  currentStreak: number;       // Days of consecutive posting
  totalPhotos: number;         // Lifetime photo count
  longestStreak: number;       // Historical longest streak
  friends: string[];          // Array of friend user IDs
  createdAt: Date;            // Account creation timestamp
  lastActiveAt: Date;         // Last app interaction
  lastPhotoDate?: Date;       // Most recent photo timestamp
}

// Authentication state management
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}
```

### Social Features Types

```typescript
// Standard photo posts
interface Post {
  id: string;
  userId: string;
  username: string;
  imageUrl: string;
  caption: string;
  location?: string;
  likes: string[];            // Array of user IDs who liked
  comments: Comment[];
  createdAt: Date;
  metadata?: PhotoMetadata;
}

// Comment system with nested support
interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  content: string;
  likes: string[];
  parentCommentId?: string;   // For nested replies
  createdAt: Date;
  updatedAt?: Date;
}

// Friend relationship management
interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  toUsername: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: Date;
  respondedAt?: Date;
}
```

### Flare Chains Type System (`app/types/flare.ts`)

```typescript
// Core Flare Chain entity
interface FlareChain {
  id: string;
  creatorId: string;
  creatorUsername: string;
  prompt: ChainPrompt;
  participants: ChainParticipant[];
  photos: ChainPhoto[];
  status: ChainStatus;
  currentParticipantIndex: number;
  turnStartTime?: Date;
  turnEndTime?: Date;
  createdAt: Date;
  completedAt?: Date;
  maxParticipants: number;
  turnDurationMinutes: number;  // Default: 60
  isPublic: boolean;
  reactions: ChainReaction[];
  chatRoomId?: string;
}

// Participant status in chains
interface ChainParticipant {
  userId: string;
  username: string;
  position: number;            // Turn order (0-based)
  status: ParticipantStatus;
  joinedAt: Date;
  respondedAt?: Date;
  turnStartedAt?: Date;
  turnDuration?: number;       // Actual time taken in minutes
  hasResponded: boolean;
  hasBeenSkipped: boolean;
}

// Individual photos within chains
interface ChainPhoto {
  id: string;
  chainId: string;
  userId: string;
  username: string;
  imageUrl: string;
  caption?: string;
  position: number;            // Order in the chain sequence
  reactions: PhotoReaction[];
  createdAt: Date;
  metadata?: PhotoMetadata;
  turnTimeRemaining?: number;  // Minutes left when submitted
}

// Prompts driving chain creation
interface ChainPrompt {
  id: string;
  text: string;
  category: PromptCategoryType;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  isDaily: boolean;
  usageCount: number;
  rating: number;
  createdBy?: string;
  createdAt: Date;
  isActive: boolean;
}
```

### Status Enums

```typescript
type ChainStatus = 
  | 'ACTIVE'          // Chain in progress
  | 'COMPLETED'       // All participants responded
  | 'EXPIRED'         // Timed out
  | 'CANCELLED';      // Manually cancelled

type ParticipantStatus =
  | 'WAITING_TURN'    // Awaiting their position
  | 'CURRENT_TURN'    // Active turn with timer
  | 'RESPONDED'       // Successfully submitted
  | 'TURN_EXPIRED'    // Missed 60-minute window
  | 'SKIPPED';        // Voluntarily skipped

type PromptCategoryType =
  | 'EMOTIONS'        // Feelings and expressions
  | 'ADVENTURE'       // Outdoor and exploration
  | 'CREATIVITY'      // Artistic and imaginative
  | 'CONNECTION'      // Social and relationship
  | 'GROWTH'          // Personal development
  | 'DAILY'           // Everyday moments
  | 'CUSTOM';         // User-generated
```

### Service Interface Types

```typescript
// Hook return types for data management
interface UseFlareChainReturn {
  activeChains: FlareChain[];
  completedChains: FlareChain[];
  loading: boolean;
  error: string | null;
  createChain: (prompt: ChainPrompt, participants: string[]) => Promise<FlareChain>;
  respondToChain: (chainId: string, photoUri: string, caption?: string) => Promise<void>;
  subscribeToChain: (chainId: string) => () => void;
  refreshChains: () => Promise<void>;
}

// API response wrappers
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  success: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  nextPageToken?: string;
  hasMore: boolean;
  totalCount?: number;
}
```

---

## 3. Firebase Integration Architecture

### Configuration & Setup (`app/config/firebase.ts`)

```typescript
import { initializeApp, getApps, getApp } from '@react-native-firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from '@react-native-firebase/auth';
import { getFirestore, connectFirestoreEmulator } from '@react-native-firebase/firestore';
import { getStorage, connectStorageEmulator } from '@react-native-firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Firebase with persistence
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services with error handling
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const firestore = getFirestore(app);
const storage = getStorage(app);

// Connection monitoring utilities
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    await firestore.enableNetwork();
    await auth.currentUser?.reload();
    return true;
  } catch (error) {
    console.error('Firebase connection failed:', error);
    return false;
  }
};

export const isFirebaseInitialized = (): boolean => {
  return !!(app && auth && firestore && storage);
};
```

### Core Firebase Service (`app/services/firebaseService.ts`)

```typescript
// Error handling with retry logic
export const withFirebaseRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        console.log(`${operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`${operationName} failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) break;
      
      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw handleFirebaseError(lastError!, operationName);
};

// Authentication services
export const signUpWithEmailPassword = async (
  email: string, 
  password: string, 
  username: string
): Promise<User> => {
  return withFirebaseRetry(async () => {
    // Check username availability
    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      throw new Error('Username is already taken');
    }
    
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document
    const userData: Omit<User, 'id'> = {
      username,
      email: user.email!,
      displayName: username,
      currentStreak: 0,
      totalPhotos: 0,
      longestStreak: 0,
      friends: [],
      createdAt: new Date(),
      lastActiveAt: new Date()
    };
    
    await setDoc(doc(firestore, 'users', user.uid), userData);
    
    return { id: user.uid, ...userData };
  }, 'signUpWithEmailPassword');
};

// Real-time post subscription
export const subscribeToPosts = (
  callback: (posts: Post[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const q = query(
    collection(firestore, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  return onSnapshot(q, 
    (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      })) as Post[];
      
      callback(posts);
    },
    (error) => {
      console.error('Posts subscription error:', error);
      onError?.(handleFirebaseError(error, 'subscribeToPosts'));
    }
  );
};

// Photo upload with metadata
export const uploadPhoto = async (
  uri: string, 
  path: string,
  metadata?: Record<string, any>
): Promise<{ url: string; metadata: PhotoMetadata }> => {
  return withFirebaseRetry(async () => {
    const reference = storage().ref(path);
    
    // Upload file
    await reference.putFile(uri, {
      customMetadata: metadata
    });
    
    // Get download URL
    const url = await reference.getDownloadURL();
    
    // Get file metadata
    const fileMetadata = await reference.getMetadata();
    
    const photoMetadata: PhotoMetadata = {
      size: fileMetadata.size,
      contentType: fileMetadata.contentType || 'image/jpeg',
      timeCreated: new Date(fileMetadata.timeCreated),
      bucket: fileMetadata.bucket,
      fullPath: fileMetadata.fullPath
    };
    
    return { url, metadata: photoMetadata };
  }, 'uploadPhoto');
};
```

### Flare Chain Service (`app/services/flareChainService.ts`)

```typescript
// Chain creation with automatic photo upload
export const createChain = async (
  prompt: ChainPrompt,
  participantUserIds: string[],
  maxParticipants: number,
  creatorId: string,
  firstPhotoUri?: string
): Promise<FlareChain> => {
  return withFirebaseRetry(async () => {
    const chainId = doc(collection(firestore, 'flareChains')).id;
    
    // Prepare participants array
    const participants: ChainParticipant[] = [
      {
        userId: creatorId,
        username: '', // Will be populated
        position: 0,
        status: firstPhotoUri ? 'RESPONDED' : 'CURRENT_TURN',
        joinedAt: new Date(),
        respondedAt: firstPhotoUri ? new Date() : undefined,
        hasResponded: !!firstPhotoUri,
        hasBeenSkipped: false
      },
      ...participantUserIds.map((userId, index) => ({
        userId,
        username: '', // Will be populated
        position: index + 1,
        status: 'WAITING_TURN' as ParticipantStatus,
        joinedAt: new Date(),
        hasResponded: false,
        hasBeenSkipped: false
      }))
    ];
    
    // Upload first photo if provided
    let photos: ChainPhoto[] = [];
    if (firstPhotoUri) {
      const { url, metadata } = await uploadPhoto(
        firstPhotoUri,
        `chains/${chainId}/photos/${creatorId}_0.jpg`
      );
      
      photos = [{
        id: `${chainId}_photo_0`,
        chainId,
        userId: creatorId,
        username: '', // Will be populated
        imageUrl: url,
        position: 0,
        reactions: [],
        createdAt: new Date(),
        metadata
      }];
    }
    
    // Create chain document
    const chainData: Omit<FlareChain, 'id'> = {
      creatorId,
      creatorUsername: '', // Will be populated
      prompt,
      participants,
      photos,
      status: 'ACTIVE',
      currentParticipantIndex: firstPhotoUri ? 1 : 0,
      turnStartTime: new Date(),
      maxParticipants,
      turnDurationMinutes: 60,
      isPublic: false,
      reactions: [],
      createdAt: new Date()
    };
    
    await setDoc(doc(firestore, 'flareChains', chainId), chainData);
    
    return { id: chainId, ...chainData };
  }, 'createChain');
};

// Turn progression with timer management
export const respondToChain = async (
  chainId: string,
  userId: string,
  photoUri: string,
  caption?: string
): Promise<void> => {
  return withFirebaseRetry(async () => {
    const chainRef = doc(firestore, 'flareChains', chainId);
    const chainDoc = await getDoc(chainRef);
    
    if (!chainDoc.exists()) {
      throw new Error('Chain not found');
    }
    
    const chain = { id: chainDoc.id, ...chainDoc.data() } as FlareChain;
    
    // Verify it's user's turn
    const currentParticipant = chain.participants[chain.currentParticipantIndex];
    if (currentParticipant.userId !== userId) {
      throw new Error('Not your turn');
    }
    
    // Upload photo
    const photoPosition = chain.photos.length;
    const { url, metadata } = await uploadPhoto(
      photoUri,
      `chains/${chainId}/photos/${userId}_${photoPosition}.jpg`
    );
    
    // Create photo record
    const newPhoto: ChainPhoto = {
      id: `${chainId}_photo_${photoPosition}`,
      chainId,
      userId,
      username: currentParticipant.username,
      imageUrl: url,
      caption,
      position: photoPosition,
      reactions: [],
      createdAt: new Date(),
      metadata
    };
    
    // Update participant status
    const updatedParticipants = chain.participants.map((p, index) => {
      if (index === chain.currentParticipantIndex) {
        return {
          ...p,
          status: 'RESPONDED' as ParticipantStatus,
          respondedAt: new Date(),
          hasResponded: true
        };
      }
      return p;
    });
    
    // Determine next participant
    const nextParticipantIndex = chain.currentParticipantIndex + 1;
    const isChainComplete = nextParticipantIndex >= chain.participants.length;
    
    // Update chain
    const updates: Partial<FlareChain> = {
      participants: updatedParticipants,
      photos: [...chain.photos, newPhoto],
      currentParticipantIndex: isChainComplete ? -1 : nextParticipantIndex,
      status: isChainComplete ? 'COMPLETED' : 'ACTIVE',
      turnStartTime: isChainComplete ? undefined : new Date(),
      completedAt: isChainComplete ? new Date() : undefined
    };
    
    await updateDoc(chainRef, updates);
  }, 'respondToChain');
};

// Real-time chain subscription
export const subscribeToChain = (
  chainId: string,
  callback: (chain: FlareChain | null) => void
): (() => void) => {
  return onSnapshot(
    doc(firestore, 'flareChains', chainId),
    (doc) => {
      if (doc.exists()) {
        const chain = {
          id: doc.id,
          ...convertChainTimestamps(doc.data())
        } as FlareChain;
        callback(chain);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Chain subscription error:', error);
      callback(null);
    }
  );
};
```

### Timestamp Conversion System

```typescript
// Convert Firestore timestamps to JavaScript Dates
const convertTimestampToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  
  // Firestore Timestamp object
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // Already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // ISO string or milliseconds
  return new Date(timestamp);
};

const convertChainTimestamps = (data: any): any => {
  const converted = { ...data };
  
  // Convert date fields
  if (converted.createdAt) converted.createdAt = convertTimestampToDate(converted.createdAt);
  if (converted.completedAt) converted.completedAt = convertTimestampToDate(converted.completedAt);
  if (converted.turnStartTime) converted.turnStartTime = convertTimestampToDate(converted.turnStartTime);
  if (converted.turnEndTime) converted.turnEndTime = convertTimestampToDate(converted.turnEndTime);
  
  // Convert participant timestamps
  if (converted.participants) {
    converted.participants = converted.participants.map((p: any) => ({
      ...p,
      joinedAt: convertTimestampToDate(p.joinedAt),
      respondedAt: p.respondedAt ? convertTimestampToDate(p.respondedAt) : undefined,
      turnStartedAt: p.turnStartedAt ? convertTimestampToDate(p.turnStartedAt) : undefined
    }));
  }
  
  // Convert photo timestamps
  if (converted.photos) {
    converted.photos = converted.photos.map((photo: any) => ({
      ...photo,
      createdAt: convertTimestampToDate(photo.createdAt)
    }));
  }
  
  return converted;
};
```

---

## 4. Navigation Architecture

### Root Navigation Structure (`app/navigation/RootNavigator.tsx`)

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Stack navigators
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

// Authentication flow
const AuthNavigator = () => (
  <AuthStack.Navigator 
    screenOptions={{ headerShown: false }}
    initialRouteName="Welcome"
  >
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    <AuthStack.Screen name="SignIn" component={SignInScreen} />
  </AuthStack.Navigator>
);

// Main app navigation
const MainNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    {/* Bottom tab navigation */}
    <MainStack.Screen name="Main" component={BottomTabs} />
    
    {/* Modal presentations */}
    <MainStack.Screen 
      name="PostUpload" 
      component={PostUploadScreen}
      options={{ 
        presentation: 'modal',
        gestureEnabled: true,
        cardOverlayEnabled: true
      }} 
    />
    <MainStack.Screen 
      name="PhotoEdit" 
      component={PhotoEditScreen}
      options={{ presentation: 'modal' }}
    />
    
    {/* Flare Chain screens */}
    <MainStack.Screen name="FlareCreation" component={FlareCreationScreen} />
    <MainStack.Screen name="FlareResponse" component={FlareResponseScreen} />
    <MainStack.Screen name="FlareChainView" component={FlareChainViewScreen} />
    <MainStack.Screen name="FlareCompletion" component={FlareCompletionScreen} />
  </MainStack.Navigator>
);

// Root navigator with auth state
export const RootNavigator = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
```

### Custom Bottom Tab Navigation (`app/navigation/BottomTabs.tsx`)

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabs = () => {
  const { navigationBarVisible } = useNavigation();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          display: navigationBarVisible ? 'flex' : 'none'
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="light"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.9)'
            }}
          />
        ),
        tabBarIcon: ({ focused, color, size }) => {
          return getTabIcon(route.name, focused, color, size);
        },
        tabBarActiveTintColor: '#FF4D4D',
        tabBarInactiveTintColor: '#8F9BB3'
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Flare" component={FlareNavigator} />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{
          tabBarButton: (props) => <CameraTabButton {...props} />
        }}
      />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Custom camera button component
const CameraTabButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={{
      top: -30,
      justifyContent: 'center',
      alignItems: 'center',
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#FF4D4D',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 3.5,
      elevation: 5
    }}
    onPress={onPress}
  >
    {children}
  </TouchableOpacity>
);
```

### Flare Chain Navigation (`app/navigation/FlareNavigator.tsx`)

```typescript
const FlareStack = createStackNavigator<FlareStackParamList>();

export const FlareNavigator = () => (
  <FlareStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#FDF6EC'
      },
      headerTintColor: '#FF4D4D',
      headerTitleStyle: {
        fontFamily: 'Inter_600SemiBold'
      }
    }}
  >
    <FlareStack.Screen 
      name="FlareHome" 
      component={FlareHomeScreen}
      options={{ title: 'Flare Chains' }}
    />
    <FlareStack.Screen 
      name="FlareDiscovery" 
      component={FlareDiscoveryScreen}
      options={{ title: 'Discover Prompts' }}
    />
    <FlareStack.Screen 
      name="FlarePrompt" 
      component={FlarePromptScreen}
      options={{ title: 'Select Prompt' }}
    />
    <FlareStack.Screen 
      name="FlareLeaderboard" 
      component={FlareLeaderboardScreen}
      options={{ title: 'Leaderboard' }}
    />
    <FlareStack.Screen 
      name="FlareHistory" 
      component={FlareHistoryScreen}
      options={{ title: 'Chain History' }}
    />
    <FlareStack.Screen 
      name="FlareChat" 
      component={FlareChatScreen}
      options={({ route }) => ({ 
        title: `Chain Chat`,
        headerBackTitleVisible: false
      })}
    />
  </FlareStack.Navigator>
);
```

### Navigation Type Safety

```typescript
// Parameter lists for type-safe navigation
type AuthStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  SignIn: undefined;
};

type MainStackParamList = {
  Main: undefined;
  PostUpload: { imageUri: string };
  PhotoEdit: { imageUri: string; onSave: (editedUri: string) => void };
  FlareCreation: { prompt?: ChainPrompt };
  FlareResponse: { chainId: string };
  FlareChainView: { chainId: string };
  FlareCompletion: { chainId: string };
};

type BottomTabParamList = {
  Feed: undefined;
  Flare: undefined;
  Camera: undefined;
  Friends: undefined;
  Profile: undefined;
};

type FlareStackParamList = {
  FlareHome: undefined;
  FlareDiscovery: { category?: PromptCategoryType };
  FlarePrompt: { promptId: string };
  FlareLeaderboard: undefined;
  FlareHistory: { userId?: string };
  FlareChat: { chainId: string };
};

// Hook for type-safe navigation
export const useTypedNavigation = () => {
  return useNavigation<NavigationProp<MainStackParamList & BottomTabParamList>>();
};
```

---

## 5. State Management Architecture

### Context Providers

#### AuthContext (`app/context/AuthContext.tsx`)

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch user document from Firestore
          const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            setUser(userData);
            
            // Update last active timestamp
            await updateDoc(doc(firestore, 'users', firebaseUser.uid), {
              lastActiveAt: new Date()
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setError(handleFirebaseError(error, 'signIn').message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setError(null);
      setLoading(true);
      await signUpWithEmailPassword(email, password, username);
    } catch (error: any) {
      setError(handleFirebaseError(error, 'signUp').message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error: any) {
      setError(handleFirebaseError(error, 'signOut').message);
      throw error;
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### NavigationContext (`app/context/NavigationContext.tsx`)

```typescript
interface NavigationContextType {
  navigationBarVisible: boolean;
  setNavigationBarVisible: (visible: boolean) => void;
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navigationBarVisible, setNavigationBarVisible] = useState(true);

  const value: NavigationContextType = {
    navigationBarVisible,
    setNavigationBarVisible
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
```

### Custom Hooks for Data Management

#### useFlareChains Hook (`app/hooks/useFlareChains.ts`)

```typescript
interface UseFlareChainReturn {
  activeChains: FlareChain[];
  completedChains: FlareChain[];
  loading: boolean;
  error: string | null;
  createChain: (prompt: ChainPrompt, participantUserIds: string[], firstPhotoUri?: string) => Promise<FlareChain>;
  respondToChain: (chainId: string, photoUri: string, caption?: string) => Promise<void>;
  subscribeToChain: (chainId: string, callback: (chain: FlareChain | null) => void) => () => void;
  refreshChains: () => Promise<void>;
  getUserChainStats: () => { totalChains: number; completedChains: number; averageResponseTime: number };
}

export const useFlareChains = (userId?: string): UseFlareChainReturn => {
  const [activeChains, setActiveChains] = useState<FlareChain[]>([]);
  const [completedChains, setCompletedChains] = useState<FlareChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's chains on mount and when userId changes
  useEffect(() => {
    if (!userId) {
      setActiveChains([]);
      setCompletedChains([]);
      setLoading(false);
      return;
    }

    loadUserChains();
  }, [userId]);

  const loadUserChains = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Query for active chains where user is participant
      const activeQuery = query(
        collection(firestore, 'flareChains'),
        where('participants', 'array-contains-any', [{ userId }]),
        where('status', '==', 'ACTIVE'),
        orderBy('createdAt', 'desc')
      );

      // Query for completed chains
      const completedQuery = query(
        collection(firestore, 'flareChains'),
        where('participants', 'array-contains-any', [{ userId }]),
        where('status', 'in', ['COMPLETED', 'EXPIRED', 'CANCELLED']),
        orderBy('completedAt', 'desc'),
        limit(20)
      );

      const [activeSnapshot, completedSnapshot] = await Promise.all([
        getDocs(activeQuery),
        getDocs(completedQuery)
      ]);

      const active = activeSnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertChainTimestamps(doc.data())
      })) as FlareChain[];

      const completed = completedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertChainTimestamps(doc.data())
      })) as FlareChain[];

      setActiveChains(active);
      setCompletedChains(completed);
    } catch (err) {
      console.error('Error loading chains:', err);
      setError('Failed to load chains');
    } finally {
      setLoading(false);
    }
  };

  const createChain = async (
    prompt: ChainPrompt,
    participantUserIds: string[],
    firstPhotoUri?: string
  ): Promise<FlareChain> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      setError(null);
      const newChain = await flareChainService.createChain(
        prompt,
        participantUserIds,
        participantUserIds.length + 1,
        userId,
        firstPhotoUri
      );

      // Add to active chains
      setActiveChains(prev => [newChain, ...prev]);
      
      return newChain;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      throw error;
    }
  };

  const respondToChain = async (
    chainId: string,
    photoUri: string,
    caption?: string
  ): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      setError(null);
      await flareChainService.respondToChain(chainId, userId, photoUri, caption);
      
      // Chain will be updated via real-time subscription
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      throw error;
    }
  };

  const subscribeToChain = (
    chainId: string,
    callback: (chain: FlareChain | null) => void
  ): (() => void) => {
    return flareChainService.subscribeToChain(chainId, (chain) => {
      // Update local state if this chain is in our lists
      if (chain) {
        if (chain.status === 'ACTIVE') {
          setActiveChains(prev => 
            prev.map(c => c.id === chainId ? chain : c)
          );
        } else {
          setActiveChains(prev => prev.filter(c => c.id !== chainId));
          setCompletedChains(prev => {
            const exists = prev.find(c => c.id === chainId);
            if (exists) {
              return prev.map(c => c.id === chainId ? chain : c);
            } else {
              return [chain, ...prev];
            }
          });
        }
      }
      
      callback(chain);
    });
  };

  const refreshChains = async (): Promise<void> => {
    await loadUserChains();
  };

  const getUserChainStats = () => {
    const totalChains = activeChains.length + completedChains.length;
    const completed = completedChains.filter(c => c.status === 'COMPLETED').length;
    
    // Calculate average response time from completed chains
    const responseTimes = completedChains
      .flatMap(chain => 
        chain.participants
          .filter(p => p.userId === userId && p.respondedAt && p.turnStartedAt)
          .map(p => {
            const start = p.turnStartedAt!.getTime();
            const end = p.respondedAt!.getTime();
            return (end - start) / (1000 * 60); // minutes
          })
      );
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    return {
      totalChains,
      completedChains: completed,
      averageResponseTime: Math.round(averageResponseTime)
    };
  };

  return {
    activeChains,
    completedChains,
    loading,
    error,
    createChain,
    respondToChain,
    subscribeToChain,
    refreshChains,
    getUserChainStats
  };
};
```

#### useChainTimer Hook (`app/hooks/useChainTimer.ts`)

```typescript
interface UseChainTimerReturn {
  timeRemaining: number;
  formattedTime: string;
  isExpired: boolean;
  isWarning: boolean;
  isCritical: boolean;
  progressPercentage: number;
}

export const useChainTimer = (
  chain: FlareChain | null,
  currentUserId?: string
): UseChainTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!chain || !currentUserId || chain.status !== 'ACTIVE') {
      setTimeRemaining(0);
      return;
    }

    // Check if it's current user's turn
    const currentParticipant = chain.participants[chain.currentParticipantIndex];
    if (!currentParticipant || currentParticipant.userId !== currentUserId) {
      setTimeRemaining(0);
      return;
    }

    const calculateTimeRemaining = () => {
      if (!chain.turnStartTime) return 0;
      
      const turnDuration = chain.turnDurationMinutes * 60 * 1000; // Convert to milliseconds
      const elapsed = Date.now() - chain.turnStartTime.getTime();
      const remaining = Math.max(0, turnDuration - elapsed);
      
      return Math.floor(remaining / 1000); // Return seconds
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [chain, currentUserId]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = (chain?.turnDurationMinutes || 60) * 60; // Total seconds
  const progressPercentage = totalDuration > 0 
    ? Math.max(0, Math.min(100, ((totalDuration - timeRemaining) / totalDuration) * 100))
    : 0;

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    isExpired: timeRemaining <= 0,
    isWarning: timeRemaining <= 300, // Last 5 minutes
    isCritical: timeRemaining <= 60, // Last minute
    progressPercentage
  };
};
```

---

## 6. Component Architecture

### Screen Components

#### FeedScreen (`app/screens/FeedScreen.tsx`)

```typescript
export const FeedScreen: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Real-time posts subscription
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToPosts(
      (newPosts) => {
        setPosts(newPosts);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Subscription will automatically update the posts
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      await toggleLikePost(postId, user.id);
      // Real-time subscription will update the UI
    } catch (error) {
      console.error('Error liking post:', error);
      // Show error toast
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={user?.id}
      onLike={() => handleLike(item.id)}
      onComment={() => {/* Open comment modal */}}
      onProfile={() => {/* Navigate to profile */}}
    />
  );

  if (loading && !refreshing) {
    return <LoadingIndicator />;
  }

  if (error) {
    return (
      <ErrorView
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  return (
    <Layout style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF4D4D']}
            tintColor="#FF4D4D"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyView
            title="No posts yet"
            subtitle="Start sharing photos with your friends!"
          />
        }
      />
    </Layout>
  );
};
```

#### FlareHomeScreen (`app/screens/flare/FlareHomeScreen.tsx`)

```typescript
export const FlareHomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<FlareHomeScreenNavigationProp>();
  const { 
    activeChains, 
    completedChains, 
    loading, 
    error, 
    getUserChainStats,
    subscribeToChain 
  } = useFlareChains(user?.id);

  const [stats, setStats] = useState({
    totalChains: 0,
    completedChains: 0,
    averageResponseTime: 0
  });

  // Update stats when chains change
  useEffect(() => {
    setStats(getUserChainStats());
  }, [activeChains, completedChains]);

  // Subscribe to active chain updates
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    activeChains.forEach(chain => {
      const unsubscribe = subscribeToChain(chain.id, (updatedChain) => {
        // Chain updates handled by the hook
      });
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [activeChains.map(c => c.id).join(',')]);

  const handleCreateChain = () => {
    navigation.navigate('FlareDiscovery');
  };

  const handleViewChain = (chain: FlareChain) => {
    navigation.navigate('FlareChainView', { chainId: chain.id });
  };

  const renderActiveChain = ({ item }: { item: FlareChain }) => (
    <ChainCard
      chain={item}
      currentUserId={user?.id}
      onPress={() => handleViewChain(item)}
      onRespond={(chainId) => navigation.navigate('FlareResponse', { chainId })}
    />
  );

  const renderCompletedChain = ({ item }: { item: FlareChain }) => (
    <CompletedChainCard
      chain={item}
      onPress={() => handleViewChain(item)}
    />
  );

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <Layout style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Statistics Section */}
        <Card style={styles.statsCard}>
          <Text category="h6" style={styles.statsTitle}>Your Chain Stats</Text>
          <View style={styles.statsRow}>
            <StatItem label="Total Chains" value={stats.totalChains} />
            <StatItem label="Completed" value={stats.completedChains} />
            <StatItem label="Avg Response" value={`${stats.averageResponseTime}m`} />
          </View>
        </Card>

        {/* Create New Chain Button */}
        <Button
          style={styles.createButton}
          onPress={handleCreateChain}
          accessoryLeft={(props) => <Icon {...props} name="plus" />}
        >
          Create New Chain
        </Button>

        {/* Active Chains Section */}
        <Text category="h6" style={styles.sectionTitle}>Active Chains</Text>
        {activeChains.length > 0 ? (
          <FlatList
            data={activeChains}
            renderItem={renderActiveChain}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        ) : (
          <EmptyView
            title="No active chains"
            subtitle="Create a new chain to get started!"
          />
        )}

        {/* Completed Chains Section */}
        <Text category="h6" style={styles.sectionTitle}>Recently Completed</Text>
        {completedChains.length > 0 ? (
          <FlatList
            data={completedChains.slice(0, 5)}
            renderItem={renderCompletedChain}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <EmptyView
            title="No completed chains"
            subtitle="Complete some chains to see them here"
          />
        )}
      </ScrollView>
    </Layout>
  );
};
```

### Reusable Components

#### PostCard Component (`app/components/PostCard.tsx`)

```typescript
interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike: () => void;
  onComment: () => void;
  onProfile: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onComment,
  onProfile
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false;
  const likeCount = post.likes.length;
  const commentCount = post.comments.length;

  useEffect(() => {
    if (post.imageUrl) {
      Image.getSize(
        post.imageUrl,
        (width, height) => {
          const screenWidth = Dimensions.get('window').width;
          const aspectRatio = width / height;
          const imageHeight = screenWidth / aspectRatio;
          
          setImageDimensions({
            width: screenWidth,
            height: Math.min(imageHeight, 400) // Max height
          });
          setImageLoading(false);
        },
        (error) => {
          console.error('Error getting image size:', error);
          setImageLoading(false);
        }
      );
    }
  }, [post.imageUrl]);

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={onProfile}
        >
          <Avatar
            source={{ uri: post.userAvatar }}
            size="small"
            style={styles.avatar}
          />
          <View>
            <Text category="s1" style={styles.username}>
              {post.username}
            </Text>
            {post.location && (
              <Text category="c1" appearance="hint" style={styles.location}>
                {post.location}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        
        <Text category="c1" appearance="hint">
          {formatTimeAgo(post.createdAt)}
        </Text>
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        {imageLoading ? (
          <View style={[styles.imagePlaceholder, { height: 300 }]}>
            <Spinner size="large" />
          </View>
        ) : (
          <Image
            source={{ uri: post.imageUrl }}
            style={[
              styles.image,
              {
                width: imageDimensions.width,
                height: imageDimensions.height
              }
            ]}
            resizeMode="cover"
          />
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onLike}
          >
            <Icon
              name={isLiked ? "heart" : "heart-outline"}
              fill={isLiked ? "#FF4D4D" : "#8F9BB3"}
              style={styles.actionIcon}
            />
            {likeCount > 0 && (
              <Text category="c1" style={styles.actionCount}>
                {likeCount}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onComment}
          >
            <Icon
              name="message-circle-outline"
              fill="#8F9BB3"
              style={styles.actionIcon}
            />
            {commentCount > 0 && (
              <Text category="c1" style={styles.actionCount}>
                {commentCount}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Caption */}
      {post.caption && (
        <View style={styles.caption}>
          <Text category="p2">
            <Text style={styles.username}>{post.username}</Text>
            {' '}
            {post.caption}
          </Text>
        </View>
      )}

      {/* Comments Preview */}
      {post.comments.length > 0 && (
        <TouchableOpacity style={styles.commentsPreview} onPress={onComment}>
          <Text category="c1" appearance="hint">
            View all {post.comments.length} comments
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
};
```

#### ChainCard Component (`app/components/ChainCard.tsx`)

```typescript
interface ChainCardProps {
  chain: FlareChain;
  currentUserId?: string;
  onPress: () => void;
  onRespond?: (chainId: string) => void;
}

export const ChainCard: React.FC<ChainCardProps> = ({
  chain,
  currentUserId,
  onPress,
  onRespond
}) => {
  const { timeRemaining, formattedTime, isWarning, isCritical } = useChainTimer(
    chain, 
    currentUserId
  );

  const currentParticipant = chain.participants[chain.currentParticipantIndex];
  const isCurrentUserTurn = currentParticipant?.userId === currentUserId;
  const completedCount = chain.participants.filter(p => p.hasResponded).length;
  const totalParticipants = chain.participants.length;

  const getStatusColor = () => {
    if (isCurrentUserTurn) {
      if (isCritical) return '#FF3D71';
      if (isWarning) return '#FFAA00';
      return '#FF4D4D';
    }
    return '#8F9BB3';
  };

  const getStatusText = () => {
    if (isCurrentUserTurn) {
      return `Your turn - ${formattedTime}`;
    }
    if (currentParticipant) {
      return `${currentParticipant.username}'s turn`;
    }
    return 'Chain completed';
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={[styles.card, isCurrentUserTurn && styles.activeCard]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.promptInfo}>
            <Text category="h6" style={styles.promptText} numberOfLines={2}>
              {chain.prompt.text}
            </Text>
            <Text category="c1" style={styles.category}>
              {chain.prompt.category}
            </Text>
          </View>
          
          <View style={styles.statusBadge}>
            <View 
              style={[
                styles.statusDot, 
                { backgroundColor: getStatusColor() }
              ]} 
            />
          </View>
        </View>

        {/* Photos Preview */}
        <View style={styles.photosPreview}>
          {chain.photos.slice(0, 3).map((photo, index) => (
            <Image
              key={photo.id}
              source={{ uri: photo.imageUrl }}
              style={[
                styles.previewImage,
                { marginLeft: index > 0 ? -10 : 0 }
              ]}
            />
          ))}
          {chain.photos.length > 3 && (
            <View style={styles.morePhotos}>
              <Text category="c1">+{chain.photos.length - 3}</Text>
            </View>
          )}
        </View>

        {/* Progress */}
        <View style={styles.progress}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${(completedCount / totalParticipants) * 100}%`,
                  backgroundColor: getStatusColor()
                }
              ]}
            />
          </View>
          <Text category="c1" style={styles.progressText}>
            {completedCount}/{totalParticipants} responses
          </Text>
        </View>

        {/* Status */}
        <View style={styles.status}>
          <Text 
            category="s1" 
            style={[styles.statusText, { color: getStatusColor() }]}
          >
            {getStatusText()}
          </Text>
          
          {isCurrentUserTurn && onRespond && (
            <Button
              size="small"
              status="primary"
              onPress={() => onRespond(chain.id)}
            >
              Respond
            </Button>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};
```

---

## 7. Utility Functions & Helpers

### Time & Date Utilities (`app/utils/helpers.ts`)

```typescript
// Human-readable time differences
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
};

// Calculate photo streak status
export const calculateStreakStatus = (lastPhotoDate?: Date): {
  status: 'ACTIVE' | 'BROKEN' | 'NONE';
  daysSinceLastPhoto: number;
} => {
  if (!lastPhotoDate) {
    return { status: 'NONE', daysSinceLastPhoto: 0 };
  }
  
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - lastPhotoDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (diffInDays <= 1) {
    return { status: 'ACTIVE', daysSinceLastPhoto: diffInDays };
  } else {
    return { status: 'BROKEN', daysSinceLastPhoto: diffInDays };
  }
};

// Format duration in minutes to human readable
export const formatDuration = (minutes: number): string => {
  if (minutes < 1) return 'less than a minute';
  if (minutes < 60) return `${Math.round(minutes)} minute${minutes !== 1 ? 's' : ''}`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};
```

### Validation Utilities

```typescript
// User data validation
export const validateUser = (userData: Partial<User>): string[] => {
  const errors: string[] = [];
  
  if (!userData.username || userData.username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  
  if (!userData.email || !validateEmail(userData.email)) {
    errors.push('Valid email is required');
  }
  
  if (!userData.displayName || userData.displayName.length < 1) {
    errors.push('Display name is required');
  }
  
  return errors;
};

// Email format validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Image file validation
export const validateImageFile = (uri: string): Promise<{
  isValid: boolean;
  error?: string;
}> => {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => {
        if (width < 100 || height < 100) {
          resolve({ isValid: false, error: 'Image too small (minimum 100x100)' });
        } else if (width > 4000 || height > 4000) {
          resolve({ isValid: false, error: 'Image too large (maximum 4000x4000)' });
        } else {
          resolve({ isValid: true });
        }
      },
      () => {
        resolve({ isValid: false, error: 'Invalid image file' });
      }
    );
  });
};
```

### Performance Utilities

```typescript
// Debounce function for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Retry utility for async operations
export const retry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) break;
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
};

// Performance measurement for development
export const logPerformance = (label: string) => {
  const start = Date.now();
  
  return () => {
    const end = Date.now();
    console.log(`${label}: ${end - start}ms`);
  };
};
```

---

## 8. Theme & Styling System

### Theme Configuration (`app/theme/newflaretheme.ts`)

```typescript
import { light } from '@eva-design/eva';

export const flareThemeLogoBased = {
  ...light,
  
  // Primary brand colors from logo
  'color-primary-100': '#FFE5E5',
  'color-primary-200': '#FFB3B3',
  'color-primary-300': '#FF8080',
  'color-primary-400': '#FF6666',
  'color-primary-500': '#FF4D4D', // Main brand red
  'color-primary-600': '#E63946',
  'color-primary-700': '#CC2936',
  'color-primary-800': '#B31B26',
  'color-primary-900': '#990D16',
  
  // Firework body tones (warm off-white beige)
  'color-accent-100': '#FDFBF9',
  'color-accent-200': '#F5F0E6',
  'color-accent-300': '#EDE5D3',
  'color-accent-400': '#E5DAC0',
  'color-accent-500': '#DDCFAD',
  
  // Background hierarchy for depth
  'background-basic-color-1': '#FDF6EC', // Main app background
  'background-basic-color-2': '#FAF9F6', // Section backgrounds  
  'background-basic-color-3': '#FFFFFF', // Cards and tiles
  'background-basic-color-4': '#F7F9FC', // Input fields
  
  // Text colors with proper contrast
  'text-basic-color': '#1A1A1A',
  'text-alternate-color': '#FFFFFF',
  'text-control-color': '#FFFFFF',
  'text-disabled-color': '#8F9BB3',
  'text-hint-color': '#8F9BB3',
  
  // Border and divider colors
  'border-basic-color-1': '#E4E9F2',
  'border-basic-color-2': '#EDF1F7',
  'border-basic-color-3': '#F7F9FC',
  'border-basic-color-4': '#EDF1F7',
  'border-basic-color-5': '#E4E9F2',
  
  // Success, warning, and error colors
  'color-success-500': '#00E096',
  'color-warning-500': '#FFAA00', 
  'color-danger-500': '#FF3D71',
  'color-info-500': '#006FFF',
  
  // Glass morphism effects
  'glass-background-color': 'rgba(255, 255, 255, 0.9)',
  'glass-border-color': 'rgba(255, 255, 255, 0.2)',
  'glass-shadow-color': 'rgba(0, 0, 0, 0.1)',
};

// Typography configuration
export const typography = {
  'text-font-family': 'Inter_400Regular',
  'text-heading-1-font-family': 'Inter_700Bold',
  'text-heading-2-font-family': 'Inter_600SemiBold',
  'text-heading-3-font-family': 'Inter_600SemiBold',
  'text-heading-4-font-family': 'Inter_600SemiBold',
  'text-heading-5-font-family': 'Inter_600SemiBold',
  'text-heading-6-font-family': 'Inter_600SemiBold',
  'text-subtitle-1-font-family': 'Inter_600SemiBold',
  'text-subtitle-2-font-family': 'Inter_500Medium',
  'text-paragraph-1-font-family': 'Inter_400Regular',
  'text-paragraph-2-font-family': 'Inter_400Regular',
  'text-caption-1-font-family': 'Inter_400Regular',
  'text-caption-2-font-family': 'Inter_400Regular',
  'text-button-font-family': 'Inter_600SemiBold',
};

// Spacing system
export const spacing = {
  'spacing-xs': 4,
  'spacing-sm': 8,
  'spacing-md': 16,
  'spacing-lg': 24,
  'spacing-xl': 32,
  'spacing-2xl': 48,
};

// Shadow presets
export const shadows = {
  shadowCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  shadowButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  shadowModal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
};
```

### Common Styles

```typescript
// Shared style utilities
export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6EC',
  },
  
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    ...shadows.shadowCard,
  },
  
  separator: {
    height: 1,
    backgroundColor: '#E4E9F2',
    marginHorizontal: 16,
  },
  
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    ...shadows.shadowButton,
  },
  
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E9F2',
    backgroundColor: '#F7F9FC',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
```

---

## 9. Application Entry Point

### App.tsx - Provider Hierarchy

```typescript
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

import { flareThemeLogoBased } from './app/theme/newflaretheme';
import { AuthProvider } from './app/context/AuthContext';
import { NavigationProvider } from './app/context/NavigationContext';
import { NotificationProvider } from './app/context/NotificationContext';
import { RootNavigator } from './app/navigation/RootNavigator';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  // Load fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Hide splash screen when fonts are loaded
  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor="#FDF6EC" />
      
      {/* UI System Setup */}
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider theme={flareThemeLogoBased}>
        
        {/* Context Provider Hierarchy */}
        <AuthProvider>
          <NavigationProvider>
            <NotificationProvider>
              <RootNavigator />
            </NotificationProvider>
          </NavigationProvider>
        </AuthProvider>
        
      </ApplicationProvider>
    </>
  );
}
```

---

## 10. Build Configuration

### EAS Build Configuration (`eas.json`)

```json
{
  "cli": {
    "version": ">= 7.8.6"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Firebase Configuration (`firebase.json`)

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

---

## Architectural Strengths

### 1. **Type Safety & Developer Experience**
- Comprehensive TypeScript coverage with strict configuration
- Clear interface definitions for all data structures
- Type-safe navigation with parameter validation
- Extensive error handling with user-friendly messages

### 2. **Real-time Architecture**
- Efficient Firebase onSnapshot subscriptions throughout
- Automatic UI updates for live data synchronization
- Optimized query patterns with proper indexing
- Connection monitoring and offline handling

### 3. **Modular Design**
- Clear separation between services, hooks, and UI components
- Reusable custom hooks for complex business logic
- Context providers for global state management
- Service layer abstraction for Firebase operations

### 4. **Performance Optimization**
- Image loading optimization with dimension calculation
- Debounced user interactions and search functionality
- Efficient FlatList rendering with proper key extraction
- Memory management with subscription cleanup

### 5. **User Experience Focus**
- Loading states, error handling, and empty states throughout
- Responsive design supporting multiple device sizes
- Smooth animations and transitions
- Accessibility considerations with proper labeling

### 6. **Security Implementation**
- Comprehensive Firestore security rules
- User authentication with Firebase Auth
- Data validation on client and server side
- Proper error message handling without exposing internals

---

## Areas for Enhancement

### 1. **Testing Coverage**
```typescript
// Recommended testing structure
__tests__/
├── components/
│   ├── PostCard.test.tsx
│   └── ChainCard.test.tsx
├── hooks/
│   ├── useFlareChains.test.ts
│   └── useAuth.test.ts
├── services/
│   ├── firebaseService.test.ts
│   └── flareChainService.test.ts
└── utils/
    └── helpers.test.ts
```

### 2. **Caching & Offline Support**
```typescript
// Potential implementation with React Query
const usePostsWithCache = () => {
  return useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};
```

### 3. **Performance Monitoring**
```typescript
// Firebase Performance integration
import perf from '@react-native-firebase/perf';

const uploadPhotoWithMetrics = async (uri: string) => {
  const trace = await perf().startTrace('photo_upload');
  try {
    const result = await uploadPhoto(uri);
    trace.putAttribute('success', 'true');
    return result;
  } catch (error) {
    trace.putAttribute('success', 'false');
    throw error;
  } finally {
    await trace.stop();
  }
};
```

### 4. **Advanced Image Processing**
```typescript
// Image compression and optimization
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const optimizeImage = async (uri: string) => {
  return await manipulateAsync(
    uri,
    [{ resize: { width: 1080 } }],
    { compress: 0.8, format: SaveFormat.JPEG }
  );
};
```

---

This documentation provides a complete architectural reference for the Flare application, covering all major systems, patterns, and implementation details. The codebase demonstrates professional React Native development practices with strong TypeScript integration, comprehensive Firebase utilization, and thoughtful separation of concerns that supports both current functionality and future scalability.