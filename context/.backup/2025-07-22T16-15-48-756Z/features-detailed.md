# Flare - Detailed Feature Implementation Reference

This document provides comprehensive implementation details for all current features in the Flare social photo app, including complete code examples, database operations, real-time updates, and error handling patterns.

## Table of Contents

1. [Firebase Service Functions](#firebase-service-functions)
2. [Authentication System](#authentication-system)
3. [Friends System](#friends-system)
4. [Photo Upload & Storage](#photo-upload--storage)
5. [Feed System](#feed-system)
6. [Like System](#like-system)
7. [Comment System](#comment-system)
8. [Navigation Patterns](#navigation-patterns)
9. [Real-time Subscriptions](#real-time-subscriptions)
10. [Error Handling](#error-handling)

---

## Firebase Service Functions

### Core Service File: `app/services/firebaseService.ts`

The Firebase service provides a comprehensive interface for all backend operations using Firebase v22+ modular API.

#### Error Handling System

```typescript
export const handleFirebaseError = (error: any, operation: string): Error => {
  // Comprehensive error mapping with user-friendly messages
  switch (error.code) {
    case 'auth/network-request-failed':
      return new Error('Network connection failed. Please check your internet connection and try again.');
    case 'firestore/permission-denied':
      return new Error('Permission denied. Please make sure you are signed in and have the necessary permissions.');
    case 'firestore/unavailable':
      return new Error('Service temporarily unavailable. Please try again in a moment.');
    // ... additional error codes
    default:
      return new Error(error.message || `Failed to ${operation}. Please try again.`);
  }
};

export const withFirebaseRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> => {
  // Automatic retry with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const isConnected = await checkFirebaseConnection();
      if (!isConnected && attempt === 1) {
        throw new Error('Firebase connection is not available. Please check your internet connection.');
      }
      return await operation();
    } catch (error: any) {
      lastError = handleFirebaseError(error, operationName);
      
      // Don't retry for permission errors or invalid data errors
      if (error.code === 'firestore/permission-denied' || 
          error.code === 'firestore/not-found' ||
          error.code === 'auth/user-not-found') {
        throw lastError;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000)); // Exponential backoff
      }
    }
  }
  throw lastError!;
};
```

#### Authentication Functions

```typescript
// Sign up with user document creation
export const signUp = async (email: string, password: string, username: string): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  const newUser: User = {
    id: firebaseUser.uid,
    username,
    email,
    displayName: username,
    currentStreak: 0,
    totalPhotos: 0,
    longestStreak: 0,
    friends: [],
    createdAt: new Date(),
    lastActiveAt: new Date(),
  };
  
  await setDoc(doc(firestore, 'users', firebaseUser.uid), newUser);
  return newUser;
};

// Sign in with user data retrieval
export const signIn = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));
  
  if (userDoc.exists()) {
    return { id: userCredential.user.uid, ...userDoc.data() } as User;
  } else {
    throw new Error('User data not found');
  }
};

// Real-time auth state subscription
export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const user = { id: firebaseUser.uid, ...userDoc.data() } as User;
          callback(user);
        } else {
          callback(null);
        }
      } catch (error) {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};
```

#### Post Management Functions

```typescript
// Create post with photo upload and user data updates
export const createPost = async (photoUri: string, caption: string = '', userId: string): Promise<void> => {
  // Handle file URI - remove file:// prefix if present
  const cleanPhotoPath = photoUri.startsWith('file://') ? photoUri.replace('file://', '') : photoUri;
  
  // Upload photo to Firebase Storage
  const filename = `photos/${userId}/${Date.now()}.jpg`;
  const storageReference = storage.ref(filename);
  await storageReference.putFile(cleanPhotoPath);
  
  // Get download URL
  const photoUrl = await storageReference.getDownloadURL();
  
  // Get user data for username
  const userDoc = await getDoc(doc(firestore, 'users', userId));
  const userData = userDoc.data();
  
  // Create post document with conditional fields
  const postData: any = {
    userId,
    username: userData?.username || 'Unknown',
    photoUrl,
    caption,
    streakDay: userData?.currentStreak || 1,
    createdAt: serverTimestamp(),
    likes: [],
    comments: [],
    isVisible: true,
  };
  
  // Only add optional fields if they have values
  if (userData?.avatar) {
    postData.userAvatar = userData.avatar;
  }
  
  // Add post to Firestore
  await addDoc(collection(firestore, 'posts'), postData);
  
  // Update user's total photos and streak
  await updateDoc(doc(firestore, 'users', userId), {
    totalPhotos: increment(1),
    currentStreak: increment(1),
    lastPhotoDate: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  });
};

// Get feed posts with data transformation
export const getFeedPosts = async (userId?: string, limitCount: number = 20): Promise<Post[]> => {
  const q = query(
    collection(firestore, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  
  const posts: Post[] = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      username: data.username,
      userAvatar: data.userAvatar,
      photoUrl: data.photoUrl,
      thumbnailUrl: data.thumbnailUrl,
      previewUrl: data.previewUrl,
      caption: data.caption,
      streakDay: data.streakDay,
      location: data.location,
      createdAt: data.createdAt?.toDate() || new Date(),
      likes: data.likes || [],
      comments: data.comments || [],
      isVisible: data.isVisible ?? true,
      timeAgo: formatTimeAgo(data.createdAt?.toDate() || new Date()),
    };
  });
  
  return posts;
};
```

---

## Authentication System

### AuthContext Implementation: `app/context/AuthContext.tsx`

Provides centralized authentication state management with React Context.

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to authentication state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((userData) => {
      setUser(userData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await firebaseSignIn(email, password);
      setUser(userData);
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Similar implementations for signUp and signOut...
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Utility hooks
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

export const useCurrentUser = (): User | null => {
  const { user } = useAuth();
  return user;
};
```

### Usage Pattern

```typescript
// In any component
const { user, signIn, signOut, loading, error } = useAuth();

// Check authentication status
const isAuthenticated = useIsAuthenticated();

// Get current user
const currentUser = useCurrentUser();
```

---

## Friends System

### Database Operations

The friends system uses multiple Firestore collections with real-time synchronization:

#### Friend Request Management

```typescript
// Send friend request with duplicate prevention
export const sendFriendRequest = async (fromUserId: string, toUsername: string): Promise<void> => {
  // Find user by username
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef, where('username', '==', toUsername.toLowerCase()));
  const userSnapshot = await getDocs(q);
  
  if (!userSnapshot || userSnapshot.empty) {
    throw new Error('User not found');
  }
  
  const toUserDoc = userSnapshot.docs[0];
  const toUserId = toUserDoc.id;
  const toUserData = toUserDoc.data();
  
  // Get sender data
  const fromUserDoc = await getDoc(doc(firestore, 'users', fromUserId));
  const fromUserData = fromUserDoc.data();
  
  // Check if they're already friends
  if (fromUserData?.friends?.includes(toUserId)) {
    throw new Error('Already friends with this user');
  }
  
  // Check if friend request already exists
  const existingRequestQuery = query(
    collection(firestore, 'friend_requests'),
    where('fromUserId', '==', fromUserId),
    where('toUserId', '==', toUserId),
    where('status', '==', 'pending')
  );
  const existingRequest = await getDocs(existingRequestQuery);
  
  if (existingRequest && !existingRequest.empty) {
    throw new Error('Friend request already sent');
  }
  
  // Create friend request
  const friendRequest: Omit<FriendRequest, 'id'> = {
    fromUserId,
    fromUsername: fromUserData?.username || 'Unknown',
    toUserId,
    toUsername: toUserData?.username || 'Unknown',
    status: 'pending',
    createdAt: new Date(),
  };
  
  await addDoc(collection(firestore, 'friend_requests'), friendRequest);
};

// Accept friend request with mutual friend addition
export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  const requestRef = doc(firestore, 'friend_requests', requestId);
  const requestDoc = await getDoc(requestRef);
  
  if (!requestDoc.exists()) {
    throw new Error('Friend request not found');
  }
  
  const requestData = requestDoc.data() as FriendRequest;
  
  // Update the accepting user's document and request status
  const toUserRef = doc(firestore, 'users', requestData.toUserId);
  
  await Promise.all([
    updateDoc(toUserRef, {
      friends: arrayUnion(requestData.fromUserId)
    }),
    updateDoc(requestRef, {
      status: 'accepted'
    })
  ]);
};
```

#### Real-time Friend Updates

```typescript
// Subscribe to user's friends list changes
export const subscribeToUserFriends = (userId: string, callback: (friends: User[]) => void, onError?: (error: Error) => void) => {
  const userRef = doc(firestore, 'users', userId);
  
  return onSnapshot(userRef, 
    async (userDoc) => {
      if (!userDoc.exists()) {
        callback([]);
        return;
      }
      
      const userData = userDoc.data();
      const friendIds = userData?.friends || [];
      
      if (friendIds.length === 0) {
        callback([]);
        return;
      }
      
      try {
        // Get friend user documents
        const friendPromises = friendIds.map((friendId: string) => 
          getDoc(doc(firestore, 'users', friendId))
        );
        
        const friendDocs = await Promise.all(friendPromises);
        const friends = friendDocs
          .filter(doc => doc && doc.exists())
          .map(doc => ({ id: doc.id, ...doc.data() } as User));
        
        callback(friends);
      } catch (error) {
        callback([]);
      }
    },
    (error) => {
      // Handle permission denied gracefully
      if (error.code === 'firestore/permission-denied') {
        callback([]);
        return;
      }
      
      if (onError) onError(new Error('Failed to subscribe to user friends'));
    }
  );
};

// Subscribe to friend requests with dual listeners
export const subscribeToFriendRequests = (userId: string, callback: (requests: { incoming: FriendRequest[], outgoing: FriendRequest[] }) => void) => {
  const incomingQuery = query(
    collection(firestore, 'friend_requests'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  );
  
  const outgoingQuery = query(
    collection(firestore, 'friend_requests'),
    where('fromUserId', '==', userId),
    where('status', '==', 'pending')
  );
  
  let incomingRequests: FriendRequest[] = [];
  let outgoingRequests: FriendRequest[] = [];
  
  const unsubscribeIncoming = onSnapshot(incomingQuery, (snapshot) => {
    incomingRequests = snapshot?.docs?.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FriendRequest)) || [];
    callback({ incoming: incomingRequests, outgoing: outgoingRequests });
  });
  
  const unsubscribeOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
    outgoingRequests = snapshot?.docs?.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FriendRequest)) || [];
    callback({ incoming: incomingRequests, outgoing: outgoingRequests });
  });
  
  return () => {
    unsubscribeIncoming();
    unsubscribeOutgoing();
  };
};
```

#### Mutual Friends Discovery

```typescript
// Calculate mutual friends for discovery
export const getMutualFriends = async (userId: string): Promise<MutualFriend[]> => {
  // Get current user's friends
  const currentUserFriends = await getUserFriends(userId);
  
  if (currentUserFriends.length === 0) {
    return [];
  }
  
  const currentUserFriendIds = currentUserFriends.map(friend => friend.id);
  const mutualFriendsMap = new Map<string, MutualFriend>();
  
  // For each of user's friends, get their friends list
  for (const friend of currentUserFriends) {
    try {
      const friendsFriends = await getUserFriends(friend.id);
      
      // Check each friend's friend to see if they're a mutual connection
      for (const friendsFriend of friendsFriends) {
        // Skip if it's the current user or already a friend
        if (friendsFriend.id === userId || currentUserFriendIds.includes(friendsFriend.id)) {
          continue;
        }
        
        // Add or update mutual friend
        if (mutualFriendsMap.has(friendsFriend.id)) {
          const existing = mutualFriendsMap.get(friendsFriend.id)!;
          existing.mutualFriends.push(friend.username);
          existing.mutualCount++;
        } else {
          mutualFriendsMap.set(friendsFriend.id, {
            user: friendsFriend,
            mutualFriends: [friend.username],
            mutualCount: 1
          });
        }
      }
    } catch (error) {
      // Skip this friend if we can't get their friends list
      continue;
    }
  }
  
  // Convert map to array and sort by mutual count
  const mutuals = Array.from(mutualFriendsMap.values())
    .sort((a, b) => b.mutualCount - a.mutualCount)
    .slice(0, 10); // Limit to top 10 mutual friends
  
  return mutuals;
};
```

### UI Implementation: `app/screens/FriendsScreen.tsx`

Three-tab interface with real-time updates:

```typescript
export const FriendsScreen: React.FC<FriendsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [mutualFriends, setMutualFriends] = useState<MutualFriend[]>([]);

  // Load friends and friend requests when component mounts
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to real-time updates for friends list
    const unsubscribeFriends = subscribeToUserFriends(user.id, (friendsData) => {
      setFriends(friendsData);
    });
    
    // Subscribe to real-time updates for friend requests
    const unsubscribeRequests = subscribeToFriendRequests(user.id, (requests) => {
      setFriendRequests(requests.incoming);
      setOutgoingRequests(requests.outgoing);
    });
    
    // Subscribe to accepted friend requests to update requester's friends list
    const unsubscribeAccepted = subscribeToAcceptedFriendRequests(user.id, (acceptedUserId) => {
      // The subscribeToUserFriends will automatically update the UI when the friends array changes
    });
    
    return () => {
      unsubscribeFriends();
      unsubscribeRequests();
      unsubscribeAccepted();
    };
  }, [user]);

  const handleAddFriend = async (username: string) => {
    if (!user) return;
    
    try {
      await sendFriendRequest(user.id, username);
      Alert.alert('Success', `Friend request sent to @${username}`);
      // Remove from search results since request was sent
      setSearchResults(prev => prev.filter(u => u.username !== username));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      // Real-time subscription will automatically update friends list
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept friend request');
    }
  };
  
  // Tab rendering and other UI components...
};
```

---

## Photo Upload & Storage

### Storage Implementation

```typescript
// Photo upload with metadata
export const uploadPhoto = async (photoUri: string, userId: string): Promise<PhotoMetadata> => {
  const filename = `photos/${userId}/${Date.now()}.jpg`;
  const reference = storage.ref(filename);
  
  // Upload file
  const task = reference.putFile(photoUri);
  
  // Wait for upload to complete
  await task;
  
  // Get download URL
  const downloadURL = await reference.getDownloadURL();
  
  // Get file metadata
  const metadata = await reference.getMetadata();
  
  const photoMetadata: PhotoMetadata = {
    id: reference.name,
    userId,
    originalUrl: downloadURL,
    thumbnailUrl: downloadURL, // TODO: Generate thumbnail
    previewUrl: downloadURL,
    size: metadata.size || 0,
    dimensions: {
      width: 400, // TODO: Get actual dimensions
      height: 500,
    },
    orientation: 'portrait',
    createdAt: new Date(),
  };
  
  return photoMetadata;
};
```

### Camera Implementation: `app/screens/CameraScreen.tsx`

Dynamic camera selection with fallback:

```typescript
export const CameraScreen = ({ navigation }: { navigation: any }) => {
  const [shouldFallback, setShouldFallback] = React.useState(false);
  
  // Listen for Vision Camera failures and trigger fallback
  React.useEffect(() => {
    const handleVisionCameraFailure = () => {
      setShouldFallback(true);
    };
    
    // Add global listener for Vision Camera failures
    (global as any).fallbackToExpoCamera = handleVisionCameraFailure;
    
    return () => {
      (global as any).fallbackToExpoCamera = null;
    };
  }, []);

  if (FEATURE_FLAGS.USE_VISION_CAMERA && !shouldFallback) {
    // Use Vision Camera for development builds
    try {
      const { VisionCameraScreen } = require('./VisionCameraScreen');
      return React.createElement(VisionCameraScreen, { navigation });
    } catch (error) {
      // Fallback to Expo Camera if Vision Camera fails to load
      const { ExpoCameraScreen } = require('./ExpoCameraScreen');
      return React.createElement(ExpoCameraScreen, { navigation });
    }
  }
  
  // Use Expo Camera for Expo Go compatibility or when Vision Camera fails
  const { ExpoCameraScreen } = require('./ExpoCameraScreen');
  return React.createElement(ExpoCameraScreen, { navigation });
};
```

---

## Feed System

### Real-time Feed Subscription

```typescript
// Real-time posts subscription with error handling
export const subscribeToPosts = (callback: (posts: Post[]) => void, onError?: (error: Error) => void) => {
  const q = query(
    collection(firestore, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  return onSnapshot(q,
    (snapshot) => {
      const posts: Post[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          username: data.username,
          userAvatar: data.userAvatar,
          photoUrl: data.photoUrl,
          thumbnailUrl: data.thumbnailUrl,
          previewUrl: data.previewUrl,
          caption: data.caption,
          streakDay: data.streakDay,
          location: data.location,
          createdAt: data.createdAt?.toDate() || new Date(),
          likes: data.likes || [],
          comments: (() => {
            const comments = data.comments || [];
            // Deduplicate comments by ID to prevent duplicate key errors
            const seen = new Set<string>();
            const uniqueComments = comments.filter((comment: any) => {
              if (seen.has(comment.id)) {
                return false;
              }
              seen.add(comment.id);
              return true;
            });
            
            return uniqueComments.map((comment: any) => ({
              ...comment,
              // Handle timestamp conversion for comments
              createdAt: comment.createdAt?.toDate ? comment.createdAt.toDate() : 
                        (comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt)),
            }));
          })(),
          isVisible: data.isVisible ?? true,
          timeAgo: formatTimeAgo(data.createdAt?.toDate() || new Date()),
        };
      });
      
      callback(posts);
    },
    (error) => {
      if (error.code === 'permission-denied') {
        console.error('PERMISSION DENIED: Check Firebase security rules!');
      }
      
      if (onError) onError(new Error('Failed to subscribe to posts'));
    }
  );
};
```

### Feed Screen Implementation: `app/screens/FeedScreen.tsx`

```typescript
export const FeedScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Real-time posts subscription
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToPosts(
      (newPosts) => {
        setPosts(newPosts);
        setLoading(false);
        setRefreshing(false);
        setError(null);
      },
      (err) => {
        setError('Failed to load posts. Please try again.');
        setLoading(false);
        setRefreshing(false);
      }
    );

    return unsubscribe;
  }, [isAuthenticated]);

  // Handle post like
  const handleLike = async (postId: string) => {
    if (!user) return;
    
    try {
      await likePost(postId, user.id);
      // Real-time subscription will automatically update the UI
    } catch (err: any) {
      // Log error - real-time listener handles UI consistency
    }
  };

  // Render feed posts with optimized performance
  const renderFeedPost = ({ item }: { item: Post }) => (
    <FeedPost
      post={item}
      onLike={handleLike}
      onComment={handleComment}
      onExpand={handleExpand}
      currentUserId={user?.id || null}
    />
  );

  return (
    <FlatList
      data={posts}
      renderItem={renderFeedPost}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme['color-primary-500'] || '#FF4D4D']}
          tintColor={theme['color-primary-500'] || '#FF4D4D'}
        />
      }
    />
  );
};
```

---

## Like System

### Optimistic Updates with Conflict Resolution

```typescript
// Like/unlike post with atomic operations
export const likePost = async (postId: string, userId: string): Promise<void> => {
  const postRef = doc(firestore, 'posts', postId);
  const postDoc = await getDoc(postRef);
  
  if (!postDoc.exists()) {
    throw new Error('Post not found');
  }
  
  const data = postDoc.data();
  const likes = data?.likes || [];
  const isLiked = likes.includes(userId);
  
  if (isLiked) {
    // Unlike post
    await updateDoc(postRef, {
      likes: arrayRemove(userId),
    });
  } else {
    // Like post
    await updateDoc(postRef, {
      likes: arrayUnion(userId),
    });
  }
};
```

### UI Implementation with Real-time Updates

```typescript
const FeedPost = ({ post, onLike, currentUserId }: { 
  post: Post; 
  onLike: (postId: string) => void; 
  currentUserId: string | null;
}) => {
  // Initialize like state based on whether current user has liked this post
  const [isLiked, setIsLiked] = useState(
    currentUserId ? post.likes.includes(currentUserId) : false
  );
  const [likesCount, setLikesCount] = useState(post.likes.length);
  
  // Update like state when post data changes (from Firebase real-time updates)
  useEffect(() => {
    const userHasLiked = currentUserId ? post.likes.includes(currentUserId) : false;
    setIsLiked(userHasLiked);
    setLikesCount(post.likes.length);
  }, [post.likes, currentUserId]);
  
  const handleLike = () => {
    // Don't do optimistic updates - let Firebase real-time listener handle UI updates
    onLike(post.id);
  };
  
  return (
    <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
      <Heart 
        size={24} 
        color={isLiked ? '#FF4D4D' : '#666666'} 
        fill={isLiked ? '#FF4D4D' : 'none'}
      />
      {likesCount > 0 && (
        <Text style={styles.actionText}>{likesCount}</Text>
      )}
    </TouchableOpacity>
  );
};
```

---

## Comment System

### Comment Creation with Optimistic UI

```typescript
// Add comment with proper error handling and deduplication
export const addComment = async (postId: string, userId: string, text: string): Promise<Comment> => {
  // Validate inputs
  if (!postId || !userId || !text.trim()) {
    throw new Error('Invalid comment data');
  }

  // Check if post exists
  const postRef = doc(firestore, 'posts', postId);
  const postDoc = await getDoc(postRef);
  
  if (!postDoc.exists()) {
    throw new Error('Post not found');
  }

  // Get user data
  const userDoc = await getDoc(doc(firestore, 'users', userId));
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const userData = userDoc.data();
  const currentTime = new Date();
  
  // Build comment object with required fields
  const comment: any = {
    id: doc(collection(firestore, 'temp')).id, // Generate unique ID
    postId,
    userId,
    username: userData?.username || 'Unknown',
    text: text.trim(),
    createdAt: currentTime, // Use regular Date object to avoid serverTimestamp in arrayUnion
    likes: [],
  };
  
  // Only add userAvatar field if the user actually has an avatar
  // This completely omits the field rather than setting it to undefined
  if (userData?.avatar) {
    comment.userAvatar = userData.avatar;
  }
  
  // Add comment to post using arrayUnion for atomic operation
  await updateDoc(postRef, {
    comments: arrayUnion(comment),
  });
  
  // Return properly typed comment for UI
  return comment as Comment;
};
```

### Comment Modal Implementation: `app/components/CommentModal.tsx`

```typescript
export const CommentModal = ({ visible, onClose, post, onCommentAdded }: CommentModalProps) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to deduplicate comments by ID
  const deduplicateComments = (comments: Comment[]): Comment[] => {
    if (!comments || comments.length === 0) return [];
    
    const seen = new Set<string>();
    const uniqueComments = comments.filter(comment => {
      if (!comment?.id) return false;
      
      if (seen.has(comment.id)) {
        return false;
      }
      seen.add(comment.id);
      return true;
    });
    
    return uniqueComments;
  };

  useEffect(() => {
    const newComments = deduplicateComments(post.comments || []);
    
    setComments(prevComments => {
      // Get any temporary comments (optimistic UI)
      const tempComments = prevComments.filter(comment => comment.id.startsWith('temp_'));
      
      // Merge real comments with temp comments, avoiding duplicates
      const mergedComments = [...newComments];
      
      // Add temp comments that don't have real counterparts yet
      tempComments.forEach(tempComment => {
        const hasRealComment = newComments.some(comment => 
          comment.text === tempComment.text && 
          comment.userId === tempComment.userId &&
          Math.abs(new Date(comment.createdAt).getTime() - tempComment.createdAt.getTime()) < 5000
        );
        if (!hasRealComment) {
          mergedComments.push(tempComment);
        }
      });
      
      // Sort by creation date
      mergedComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      return mergedComments;
    });
  }, [post.comments]);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !user || isSubmitting) return;

    const commentToSubmit = commentText.trim();
    
    const tempComment: Comment = {
      id: `temp_${Date.now()}`, // Temporary ID for optimistic UI
      postId: post.id,
      userId: user.id,
      username: user.username || user.displayName,
      userAvatar: user.avatar,
      text: commentToSubmit,
      createdAt: new Date(),
      likes: [],
    };

    // Optimistic UI - add comment immediately
    setComments(prevComments => [...prevComments, tempComment]);
    setCommentText('');
    
    setIsSubmitting(true);
    try {
      const newComment = await addComment(post.id, user.id, commentToSubmit);
      
      // Replace temp comment with real comment from server
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === tempComment.id ? newComment : comment
        )
      );
      
      onCommentAdded?.(newComment);
    } catch (error) {
      // Remove temp comment on error
      setComments(prevComments => 
        prevComments.filter(comment => comment.id !== tempComment.id)
      );
      
      // Restore the comment text so user can try again
      setCommentText(tempComment.text);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render comment list with optimized performance...
};
```

---

## Navigation Patterns

### Root Navigator: `app/navigation/RootNavigator.tsx`

Conditional navigation based on authentication state:

```typescript
export const RootNavigator = () => {
  const { user, loading } = useAuth();

  return (
    <NavigationContainer>
      {loading ? (
        <LoadingScreen />
      ) : user ? (
        <MainNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
    </AuthStack.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Main" component={BottomTabs} />
      <MainStack.Screen 
        name="PostUpload" 
        component={PostUploadScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }}
      />
      <MainStack.Screen 
        name="Friends" 
        component={FriendsScreen}
        options={{
          animation: 'slide_from_right'
        }}
      />
      {/* Additional screens... */}
    </MainStack.Navigator>
  );
};
```

### Usage Pattern

```typescript
// Navigation between screens
const navigation = useNavigation();

// Navigate to friends screen
navigation.navigate('Friends');

// Navigate with parameters
navigation.navigate('FlareChainView', { chainId: 'chain123' });

// Modal navigation
navigation.navigate('PostUpload', { photoUri: 'file://path/to/photo.jpg' });

// Go back
navigation.goBack();
```

---

## Real-time Subscriptions

### Subscription Management Pattern

All real-time subscriptions follow a consistent pattern with error handling and cleanup:

```typescript
// Pattern for real-time subscriptions
useEffect(() => {
  if (!user) return;
  
  const unsubscribe = subscribeToData(user.id, 
    (data) => {
      setData(data);
      setLoading(false);
      setError(null);
    },
    (error) => {
      setError('Failed to load data. Please try again.');
      setLoading(false);
    }
  );

  return unsubscribe; // Cleanup subscription on unmount
}, [user]);
```

### Multiple Subscriptions

```typescript
// Managing multiple subscriptions
useEffect(() => {
  if (!user) return;
  
  const unsubscribeFriends = subscribeToUserFriends(user.id, setFriends);
  const unsubscribeRequests = subscribeToFriendRequests(user.id, setRequests);
  const unsubscribePosts = subscribeToPosts(setPosts);
  
  return () => {
    unsubscribeFriends();
    unsubscribeRequests();
    unsubscribePosts();
  };
}, [user]);
```

---

## Error Handling

### Comprehensive Error Handling Strategy

```typescript
// Global error handling pattern
const handleOperation = async (operation: () => Promise<any>, operationName: string) => {
  try {
    setLoading(true);
    setError(null);
    
    const result = await operation();
    return result;
  } catch (error: any) {
    const friendlyError = handleFirebaseError(error, operationName);
    setError(friendlyError.message);
    
    // Log detailed error for debugging
    if (__DEV__) {
      console.error(`Error in ${operationName}:`, error);
    }
    
    throw friendlyError;
  } finally {
    setLoading(false);
  }
};

// Usage in components
const handleAddFriend = async (username: string) => {
  try {
    await handleOperation(
      () => sendFriendRequest(user.id, username),
      'send friend request'
    );
    Alert.alert('Success', `Friend request sent to @${username}`);
  } catch (error: any) {
    Alert.alert('Error', error.message);
  }
};
```

### Permission Handling

```typescript
// Graceful permission error handling
export const handlePermissionError = (error: any, fallback: any) => {
  if (error.code === 'firestore/permission-denied') {
    if (__DEV__) {
      console.warn('Permission denied - returning fallback data');
    }
    return fallback;
  }
  throw error;
};

// Usage in service functions
export const getUserFriends = async (userId: string): Promise<User[]> => {
  try {
    // Firestore operations...
    return friends;
  } catch (error: any) {
    return handlePermissionError(error, []);
  }
};
```

### Network Error Recovery

```typescript
// Automatic retry with exponential backoff
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry for certain error types
      if (error.code === 'firestore/permission-denied' || 
          error.code === 'firestore/not-found') {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
};
```

---

## Performance Optimizations

### Data Deduplication

```typescript
// Comment deduplication to prevent duplicate keys
const deduplicateComments = (comments: Comment[]): Comment[] => {
  const seen = new Set<string>();
  return comments.filter(comment => {
    if (!comment?.id || seen.has(comment.id)) {
      return false;
    }
    seen.add(comment.id);
    return true;
  });
};
```

### Optimistic UI Updates

```typescript
// Optimistic UI pattern for immediate feedback
const handleLikeWithOptimisticUI = async (postId: string) => {
  // Immediate UI update
  setPosts(prevPosts => 
    prevPosts.map(post => 
      post.id === postId 
        ? { ...post, likes: [...post.likes, userId] }
        : post
    )
  );
  
  try {
    await likePost(postId, userId);
    // Success - real-time listener will sync final state
  } catch (error) {
    // Revert optimistic update on error
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes.filter(id => id !== userId) }
          : post
      )
    );
    
    showError('Failed to like post. Please try again.');
  }
};
```

This comprehensive documentation covers all major features with detailed implementation examples, error handling patterns, and performance optimizations used throughout the Flare application.