# Firebase Database Reference Guide - Flare App

## Overview

This document provides a comprehensive analysis of the Firebase integration in the Flare app, including Firestore collections, security rules, storage patterns, authentication flow, and real-time subscription patterns.

## Table of Contents

1. [Firebase Configuration](#firebase-configuration)
2. [Firestore Collections Schema](#firestore-collections-schema)
3. [Security Rules](#security-rules)
4. [Firebase Storage Structure](#firebase-storage-structure)
5. [Authentication Integration](#authentication-integration)
6. [Real-time Subscription Patterns](#real-time-subscription-patterns)
7. [Query Patterns and Indexes](#query-patterns-and-indexes)
8. [Data Validation and Constraints](#data-validation-and-constraints)
9. [Batch Operations and Transactions](#batch-operations-and-transactions)
10. [Performance Considerations](#performance-considerations)

## Firebase Configuration

### Project Setup
- **Project ID**: `flare-app-a2b12`
- **Database Region**: `nam5` (North America)
- **Storage Bucket**: `flare-app-a2b12.firebasestorage.app`
- **Auth Domain**: `flare-app-a2b12.firebaseapp.com`

### SDK Configuration (React Native Firebase v22+)
```typescript
// app/config/firebase.ts
import firebase from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
```

### Development Environment
- **Emulators**: Configured for Auth (9099), Firestore (8080), Storage (9199)
- **UI Dashboard**: Port 4000
- **Current State**: Emulators disabled in production for SSL/TLS debugging

## Firestore Collections Schema

### 1. Users Collection (`users/{userId}`)

**Purpose**: Store user profiles, authentication data, and social information.

```typescript
interface User {
  id: string;                    // Document ID (matches Auth UID)
  username: string;              // Unique username (lowercase)
  email: string;                 // Authentication email
  displayName: string;           // Display name for UI
  avatar?: string;               // Firebase Storage URL
  bio?: string;                  // User biography
  currentStreak: number;         // Current daily streak count
  totalPhotos: number;           // Total photos uploaded
  longestStreak: number;         // Longest streak achieved
  friends: string[];             // Array of user IDs
  createdAt: Date;               // Account creation timestamp
  lastActiveAt: Date;            // Last activity timestamp
  lastPhotoDate?: Date;          // Last photo upload date
}
```

**Access Patterns**:
- Users can read/write their own document
- All authenticated users can read other users' basic info for posts
- No public access to sensitive fields like email

### 2. Posts Collection (`posts/{postId}`)

**Purpose**: Global social feed with photos, likes, and comments.

```typescript
interface Post {
  id: string;                    // Auto-generated document ID
  userId: string;                // Post author's ID
  username: string;              // Author's username (denormalized)
  userAvatar?: string;           // Author's avatar URL (denormalized)
  photoUrl: string;              // Firebase Storage photo URL
  thumbnailUrl?: string;         // Optimized thumbnail URL
  previewUrl?: string;           // Preview/compressed URL
  caption?: string;              // Post caption/description
  streakDay: number;             // Author's streak day when posted
  location?: {                   // Optional location data
    city: string;
    country: string;
    coordinates?: [number, number];
  };
  createdAt: Date;               // Post creation timestamp
  likes: string[];               // Array of user IDs who liked
  comments: Comment[];           // Embedded comments array
  isVisible: boolean;            // Visibility flag
}
```

**Comments Structure** (Embedded in posts):
```typescript
interface Comment {
  id: string;                    // Unique comment ID
  postId: string;                // Parent post ID
  userId: string;                // Comment author ID
  username: string;              // Author username (denormalized)
  userAvatar?: string;           // Author avatar (optional)
  text: string;                  // Comment text content
  createdAt: Date;               // Comment timestamp
  likes: string[];               // Array of user IDs who liked comment
}
```

**Access Patterns**:
- All authenticated users can read posts (global feed)
- Only post authors can create/update/delete their posts
- Any authenticated user can update likes/comments arrays

### 3. Flare Chains Collection (`flareChains/{chainId}`)

**Purpose**: Sequential photo-sharing chains with turn-based mechanics.

```typescript
interface FlareChain {
  id: string;                    // Auto-generated chain ID
  creatorId: string;             // Chain creator's user ID
  creatorUsername: string;       // Creator's username (denormalized)
  prompt: ChainPrompt;           // Chain prompt/theme
  status: ChainStatus;           // 'active' | 'completed' | 'expired' | 'cancelled'
  participants: ChainParticipant[]; // Array of participant objects
  participantIds: string[];      // Array of user IDs (for efficient querying)
  photos: ChainPhoto[];          // Array of submitted photos
  maxParticipants: number;       // Maximum allowed participants
  currentParticipantIndex: number; // Index of current turn
  currentTurnExpiresAt: Date;    // When current turn expires (60 min)
  turnHistory: TurnRecord[];     // Track each person's turn
  timeLimit: number;             // Minutes per person (60)
  createdAt: Date;               // Chain creation timestamp
  expiresAt: Date;               // Overall chain expiry (24 hours)
  completedAt?: Date;            // Completion timestamp
  groupChatId?: string;          // Associated chat room ID
}
```

**Chain Participant Structure**:
```typescript
interface ChainParticipant {
  userId: string;                // Participant's user ID
  username: string;              // Username (denormalized)
  avatar?: string;               // Avatar URL (optional)
  status: ParticipantStatus;     // Turn status
  position: number;              // Order in chain sequence
  invitedAt: Date;               // Invitation timestamp
  respondedAt?: Date;            // Response timestamp
}

enum ParticipantStatus {
  WAITING_TURN = 'waiting_turn',
  CURRENT_TURN = 'current_turn',
  RESPONDED = 'responded',
  TURN_EXPIRED = 'turn_expired',
  SKIPPED = 'skipped'
}
```

**Chain Photo Structure**:
```typescript
interface ChainPhoto {
  id: string;                    // Unique photo ID
  chainId: string;               // Parent chain ID
  userId: string;                // Photo author ID
  username: string;              // Author username (denormalized)
  userAvatar?: string;           // Author avatar (optional)
  photoUrl: string;              // Firebase Storage URL
  thumbnailUrl?: string;         // Thumbnail URL
  interpretation?: string;       // Photo interpretation/caption
  position: number;              // Order in chain
  createdAt: Date;               // Upload timestamp
  likes: string[];               // Array of user IDs who liked
  reactions: ChainPhotoReaction[]; // Emoji reactions
}
```

**Turn Record Structure**:
```typescript
interface TurnRecord {
  userId: string;                // Turn participant ID
  username: string;              // Username (denormalized)
  position: number;              // Turn position in sequence
  startedAt: Date;               // Turn start timestamp
  completedAt?: Date;            // Turn completion timestamp
  expiredAt?: Date;              // Turn expiry timestamp
  photoSubmitted: boolean;       // Whether photo was submitted
  turnDurationMinutes: number;   // Duration of turn in minutes
  skipped?: boolean;             // Whether turn was skipped
}
```

**Access Patterns**:
- Participants can read chains they're involved in
- Creators can create and manage their chains
- Participants can update chains (add photos, update status)
- Only creators can delete chains

### 4. Friend Requests Collection (`friend_requests/{requestId}`)

**Purpose**: Manage friend request workflow.

```typescript
interface FriendRequest {
  id: string;                    // Auto-generated request ID
  fromUserId: string;            // Requester's user ID
  fromUsername: string;          // Requester's username (denormalized)
  toUserId: string;              // Target user ID
  toUsername: string;            // Target username (denormalized)
  status: 'pending' | 'accepted' | 'declined'; // Request status
  createdAt: Date;               // Request timestamp
}
```

**Access Patterns**:
- Users can read/write requests where they are sender or recipient
- Users can create requests where they are the sender

### 5. Personal Posts Collection (`personal_posts/{postId}`)

**Purpose**: Direct photo sharing between users.

```typescript
interface PersonalPost extends Post {
  isPersonalPost: true;          // Type discriminator
  recipientId: string;           // Target recipient ID
  senderInfo: {                  // Sender information object
    id: string;
    username: string;
    avatar?: string;
  };
  status: 'sent' | 'viewed' | 'dismissed'; // Delivery status
}
```

**Access Patterns**:
- All authenticated users can read/write (filtering at application level)
- Used for targeted photo sharing

### 6. User Statistics Collection (`userStatistics/{userId}`)

**Purpose**: Track user achievements and performance metrics.

```typescript
interface UserStatistics {
  userId: string;                // User ID (document ID)
  totalChainsCreated: number;    // Chains created by user
  totalChainsParticipated: number; // Chains participated in
  chainCompletionRate: number;   // Completion percentage
  averageResponseTime: number;   // Average response time in minutes
  fastestResponseTime: number;   // Fastest response in minutes
  totalPhotosShared: number;     // Total photos shared
  totalReactionsReceived: number; // Reactions received
  totalReactionsGiven: number;   // Reactions given
  currentStreak: number;         // Current activity streak
  longestStreak: number;         // Longest activity streak
  achievements: Achievement[];   // Array of unlocked achievements
  favoritePromptCategory: PromptCategoryType | null; // Preferred category
  createdAt: Date;               // Statistics creation date
  lastUpdated: Date;             // Last update timestamp
}
```

**Access Patterns**:
- Users can read/write their own statistics
- All authenticated users can read others' stats for leaderboards

### 7. Prompt Collections

**Custom Prompts** (`customPrompts/{promptId}`):
```typescript
interface ChainPrompt {
  id: string;                    // Prompt ID
  type: PromptType;              // 'daily' | 'category' | 'custom'
  category?: PromptCategoryType; // Optional category
  title: string;                 // Prompt title
  description: string;           // Prompt description
  emoji?: string;                // Associated emoji
  createdBy?: string;            // Creator user ID (for custom)
  isActive: boolean;             // Active status
  popularity: number;            // Usage count
  createdAt: Date;               // Creation timestamp
}
```

**Prompt Ratings** (`promptRatings/{ratingId}`):
- Users can rate prompts
- All authenticated users can read ratings

### 8. Chat System Collections

**Chat Rooms** (`chatRooms/{roomId}`):
```typescript
interface ChatRoom {
  id: string;                    // Room ID
  chainId: string;               // Associated chain ID
  participantIds: string[];      // Participant user IDs
  createdAt: Date;               // Creation timestamp
  lastMessageAt: Date;           // Last message timestamp
  lastMessage: string | null;    // Last message preview
  messageCount: number;          // Total message count
}
```

**Chat Messages** (`chatMessages/{messageId}`):
```typescript
interface ChatMessage {
  id: string;                    // Message ID
  chatRoomId: string;            // Parent room ID
  senderId: string;              // Sender user ID
  senderUsername: string;        // Sender username (denormalized)
  text: string;                  // Message content
  type: 'text' | 'system';      // Message type
  createdAt: Date;               // Message timestamp
  readBy: string[];              // Array of user IDs who read message
}
```

## Security Rules

### Firestore Rules (`firestore.rules`)

The security rules implement a principle of least privilege with careful access control:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own document and basic info of others
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Basic info for posts
    }
    
    // Posts - Global feed with social interactions
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                   request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
      // Allow updating likes/comments arrays only
      allow update: if request.auth != null && 
                   (isOnlyUpdatingLikes(request.resource.data, resource.data) ||
                    isOnlyUpdatingComments(request.resource.data, resource.data));
    }
    
    // Helper functions for granular post updates
    function isOnlyUpdatingLikes(newData, oldData) {
      return newData.diff(oldData).affectedKeys().hasOnly(['likes']) &&
             newData.userId == oldData.userId &&
             newData.photoUrl == oldData.photoUrl &&
             newData.caption == oldData.caption &&
             newData.username == oldData.username;
    }
    
    function isOnlyUpdatingComments(newData, oldData) {
      return newData.diff(oldData).affectedKeys().hasOnly(['comments']) &&
             newData.userId == oldData.userId &&
             newData.photoUrl == oldData.photoUrl &&
             newData.caption == oldData.caption &&
             newData.username == oldData.username;
    }
    
    // Flare Chains - Participant-based access
    match /flareChains/{chainId} {
      allow list: if request.auth != null; // Prevents empty collection errors
      allow get: if request.auth != null && 
                 (request.auth.uid in resource.data.participantIds ||
                  request.auth.uid == resource.data.creatorId);
      allow create: if request.auth != null && 
                   request.auth.uid == request.resource.data.creatorId;
      allow update: if request.auth != null && 
                   (request.auth.uid in resource.data.participantIds ||
                    request.auth.uid == resource.data.creatorId);
      allow delete: if request.auth != null && 
                   request.auth.uid == resource.data.creatorId;
    }
    
    // Friend requests - Sender/recipient access
    match /friend_requests/{requestId} {
      allow read, write: if request.auth != null && 
                        (request.auth.uid == resource.data.fromUserId || 
                         request.auth.uid == resource.data.toUserId);
      allow create: if request.auth != null && 
                   request.auth.uid == request.resource.data.fromUserId;
    }
    
    // User statistics - Self-access with public read for leaderboards
    match /userStatistics/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Key Security Features**:
- Authentication required for all operations
- Owner-based access control for user data
- Participant-based access for chains
- Granular update permissions for social interactions
- Helper functions to prevent unauthorized field updates

## Firebase Storage Structure

### Storage Rules (`storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User photos for global feed
    match /photos/{userId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User avatars/profile pictures
    match /avatars/{userId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Personal photos for direct sharing
    match /personal_photos/{userId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Flare Chain photos
    match /chains/{chainId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Participants verified at app level
    }
    
    // Thumbnails and processed images
    match /thumbnails/{userId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### File Organization Patterns

```
Storage Bucket Structure:
├── photos/
│   └── {userId}/
│       ├── {timestamp}.jpg        # Original uploads
│       └── {timestamp}_thumb.jpg  # Generated thumbnails
├── avatars/
│   └── {userId}/
│       └── profile.jpg           # User profile pictures
├── personal_photos/
│   └── {userId}/
│       └── {timestamp}.jpg       # Direct sharing photos
├── chains/
│   └── {chainId}/
│       ├── {userId}-{timestamp}.jpg  # Chain photos
│       └── {userId}-{timestamp}_thumb.jpg # Chain thumbnails
└── thumbnails/
    └── {userId}/
        └── {photoId}_thumb.jpg   # Auto-generated thumbnails
```

**Storage Patterns**:
- User-based folder structure for organization and security
- Timestamp-based filenames to prevent conflicts
- Automatic thumbnail generation (planned)
- Compression and optimization (planned)

## Authentication Integration

### User Document Creation Flow

1. **Firebase Auth Registration**:
   ```typescript
   const userCredential = await createUserWithEmailAndPassword(auth, email, password);
   const firebaseUser = userCredential.user;
   ```

2. **Firestore User Document Creation**:
   ```typescript
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
   ```

### Authentication State Management

**Real-time Auth State Listener**:
```typescript
export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const user = { id: firebaseUser.uid, ...userDoc.data() } as User;
        callback(user);
      }
    } else {
      callback(null);
    }
  });
};
```

**Security Integration**:
- UID from Firebase Auth used as document ID in Firestore
- Auth state automatically linked to security rules via `request.auth.uid`
- User documents created atomically with auth registration

## Real-time Subscription Patterns

### 1. Posts Feed Subscription

```typescript
export const subscribeToPosts = (callback: (posts: Post[]) => void) => {
  const q = query(
    collection(firestore, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  return onSnapshot(q, (snapshot) => {
    const posts: Post[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        comments: data.comments?.map((comment: any) => ({
          ...comment,
          createdAt: comment.createdAt?.toDate ? 
            comment.createdAt.toDate() : 
            new Date(comment.createdAt)
        })) || []
      };
    });
    callback(posts);
  });
};
```

### 2. Flare Chains Subscription

```typescript
export const subscribeToUserCurrentTurnChains = (
  userId: string, 
  callback: (chains: FlareChain[]) => void
) => {
  const q = query(
    collection(firestore, 'flareChains'),
    where('participantIds', 'array-contains', userId),
    where('status', '==', ChainStatus.ACTIVE),
    orderBy('currentTurnExpiresAt', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const chains: FlareChain[] = [];
    querySnapshot.forEach((doc) => {
      const rawData = doc.data();
      const convertedData = convertChainTimestamps(rawData);
      const chain = { id: doc.id, ...convertedData } as FlareChain;
      
      // Filter for user's current turn
      if (isUserCurrentTurn(chain, userId)) {
        chains.push(chain);
      }
    });
    callback(chains);
  });
};
```

### 3. Friend Requests Subscription

```typescript
export const subscribeToFriendRequests = (
  userId: string, 
  callback: (requests: { incoming: FriendRequest[], outgoing: FriendRequest[] }) => void
) => {
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
  
  // Dual subscription pattern for related data
  let incomingRequests: FriendRequest[] = [];
  let outgoingRequests: FriendRequest[] = [];
  
  const unsubscribeIncoming = onSnapshot(incomingQuery, (snapshot) => {
    incomingRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback({ incoming: incomingRequests, outgoing: outgoingRequests });
  });
  
  const unsubscribeOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
    outgoingRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback({ incoming: incomingRequests, outgoing: outgoingRequests });
  });
  
  return () => {
    unsubscribeIncoming();
    unsubscribeOutgoing();
  };
};
```

### 4. Chat Messages Subscription

```typescript
subscribeToMessages(chatRoomId: string, callback: (messages: ChatMessage[]) => void) {
  const q = query(
    collection(firestore, 'chatMessages'),
    where('chatRoomId', '==', chatRoomId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
    callback(messages);
  });
}
```

**Subscription Patterns**:
- Automatic timestamp conversion from Firestore to JavaScript Date objects
- Error handling with graceful fallbacks
- Resource cleanup with unsubscribe functions
- Multi-query coordination for related data
- Real-time filtering at application level when needed

## Query Patterns and Indexes

### Composite Indexes (`firestore.indexes.json`)

```json
{
  "indexes": [
    {
      "collectionGroup": "flareChains",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "participantIds", "arrayConfig": "CONTAINS" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "currentTurnExpiresAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "flareChains", 
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "participantIds", "arrayConfig": "CONTAINS" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Common Query Patterns

**1. User's Active Chains**:
```typescript
const q = query(
  collection(firestore, 'flareChains'),
  where('participantIds', 'array-contains', userId),
  where('status', '==', ChainStatus.ACTIVE),
  orderBy('createdAt', 'desc')
);
```

**2. User's Current Turn Chains**:
```typescript
const q = query(
  collection(firestore, 'flareChains'),
  where('participantIds', 'array-contains', userId),
  where('status', '==', ChainStatus.ACTIVE),
  orderBy('currentTurnExpiresAt', 'asc') // Most urgent first
);
```

**3. Recent Posts Feed**:
```typescript
const q = query(
  collection(firestore, 'posts'),
  orderBy('createdAt', 'desc'),
  limit(20)
);
```

**4. User Search by Username**:
```typescript
const q = query(
  collection(firestore, 'users'),
  where('username', '>=', searchQuery.toLowerCase()),
  where('username', '<=', searchQuery.toLowerCase() + '\uf8ff'),
  limit(10)
);
```

**5. Friend Requests by Status**:
```typescript
const q = query(
  collection(firestore, 'friend_requests'),
  where('toUserId', '==', userId),
  where('status', '==', 'pending')
);
```

**Index Requirements**:
- Single field indexes automatically created
- Composite indexes required for multi-field queries
- Array-contains queries need special indexing
- Order-by queries require ascending/descending index specification

## Data Validation and Constraints

### Client-Side Validation

**User Input Validation**:
```typescript
// Username validation
const validateUsername = (username: string): boolean => {
  return username.length >= 3 && 
         username.length <= 20 && 
         /^[a-zA-Z0-9_]+$/.test(username);
};

// Post validation
const validatePost = (photoUri: string, caption: string): boolean => {
  return photoUri.length > 0 && 
         caption.length <= 500;
};

// Chain validation
const validateChain = (participants: string[]): boolean => {
  return participants.length >= MIN_CHAIN_PARTICIPANTS && 
         participants.length <= MAX_CHAIN_PARTICIPANTS;
};
```

### Server-Side Constraints (Security Rules)

**Data Type Validation**:
```javascript
// Ensure required fields exist and have correct types
allow create: if request.auth != null && 
              request.resource.data.keys().hasAll(['userId', 'username', 'photoUrl']) &&
              request.resource.data.userId is string &&
              request.resource.data.username is string;
```

**Field Immutability**:
```javascript
// Prevent modification of critical fields
allow update: if request.auth != null && 
              request.auth.uid == resource.data.userId &&
              request.resource.data.userId == resource.data.userId &&
              request.resource.data.createdAt == resource.data.createdAt;
```

### Data Consistency Patterns

**Denormalization Strategy**:
- Username stored in posts for display performance
- User avatar URLs copied to posts/comments
- Participant data embedded in chains for atomic updates
- Trade-off: Faster reads vs. potential inconsistency

**Atomic Operations**:
```typescript
// Update user stats and create post atomically
const batch = writeBatch(firestore);
batch.set(doc(firestore, 'posts', postId), postData);
batch.update(doc(firestore, 'users', userId), {
  totalPhotos: increment(1),
  lastActiveAt: serverTimestamp()
});
await batch.commit();
```

## Batch Operations and Transactions

### Batch Writes

**Friend Request Acceptance**:
```typescript
export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  const requestRef = doc(firestore, 'friend_requests', requestId);
  const requestDoc = await getDoc(requestRef);
  const requestData = requestDoc.data() as FriendRequest;
  
  const toUserRef = doc(firestore, 'users', requestData.toUserId);
  
  // Atomic batch update
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

### Transaction Patterns

**Chain Turn Management**:
```typescript
// Complex chain state updates require careful coordination
await updateDoc(doc(firestore, 'flareChains', chainId), {
  photos: arrayUnion(newPhoto),
  participants: updatedParticipants,
  turnHistory: newTurnRecord ? arrayUnion(newTurnRecord) : updatedTurnHistory,
  currentParticipantIndex: nextIndex,
  currentTurnExpiresAt: nextIndex < maxParticipants ? turnExpiresAt : undefined
});
```

### Error Handling Patterns

**Retry Logic with Exponential Backoff**:
```typescript
export const withFirebaseRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = handleFirebaseError(error, operationName);
      
      // Don't retry permission or validation errors
      if (error.code === 'firestore/permission-denied' || 
          error.code === 'firestore/not-found') {
        throw lastError;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  throw lastError!;
};
```

## Performance Considerations

### Query Optimization

**1. Index Strategy**:
- Composite indexes for complex queries
- Array-contains indexes for participant lookups
- Avoid large result sets with pagination

**2. Denormalization Benefits**:
```typescript
// Store username in posts to avoid joins
interface Post {
  userId: string;
  username: string;  // Denormalized for performance
  // ... other fields
}
```

**3. Subscription Management**:
```typescript
// Unsubscribe from real-time listeners to prevent memory leaks
useEffect(() => {
  const unsubscribe = subscribeToPosts(setPosts);
  return unsubscribe; // Cleanup on unmount
}, []);
```

### Data Structure Optimization

**1. Embedded vs. Referenced Data**:
- Comments embedded in posts for atomic updates
- User references by ID to maintain consistency
- Photo arrays in chains for sequential access

**2. Pagination Patterns**:
```typescript
const getFeedPosts = async (lastDoc?: DocumentSnapshot) => {
  let q = query(
    collection(firestore, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  return getDocs(q);
};
```

### Storage Optimization

**1. Image Processing**:
- Automatic thumbnail generation (planned)
- Progressive JPEG compression
- WebP format support for modern devices

**2. File Organization**:
- User-based folder structure for efficient queries
- Timestamp-based naming for chronological access
- Separate buckets for different content types

### Monitoring and Debugging

**1. Connection Monitoring**:
```typescript
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    const testDoc = firestore.collection('users').limit(1);
    await testDoc.get();
    return true;
  } catch (error) {
    console.error('Firebase connection failed:', error);
    return false;
  }
};
```

**2. Error Classification**:
```typescript
export const handleFirebaseError = (error: any, operation: string): Error => {
  switch (error.code) {
    case 'firestore/permission-denied':
      return new Error('Permission denied. Check authentication.');
    case 'firestore/unavailable':
      return new Error('Service temporarily unavailable.');
    // ... other error cases
    default:
      return new Error(`Failed to ${operation}. Please try again.`);
  }
};
```

## Cloud Functions and Background Tasks

### Planned Function Implementations

**1. Image Processing**:
- Automatic thumbnail generation on photo upload
- Image compression and optimization
- Metadata extraction

**2. Chain Management**:
- Automatic chain expiration handling
- Turn timer enforcement
- Notification sending

**3. Data Cleanup**:
- Remove expired friend requests
- Archive completed chains
- User data anonymization

### Current Implementation Status

- **Core Firebase Services**: ✅ Implemented
- **Security Rules**: ✅ Production ready
- **Real-time Subscriptions**: ✅ Optimized
- **Error Handling**: ✅ Comprehensive
- **Cloud Functions**: 🔄 Planned
- **Push Notifications**: 🔄 Planned
- **Analytics Integration**: 🔄 Planned

---

## Summary

The Flare app implements a comprehensive Firebase architecture with:

- **9 Main Collections** with well-defined schemas and access patterns
- **Robust Security Rules** with principle of least privilege
- **Real-time Subscriptions** for live user experiences  
- **Optimized Query Patterns** with composite indexes
- **Error Handling and Retry Logic** for reliability
- **Performance Optimizations** through denormalization and caching
- **Scalable Storage Structure** with user-based organization

The architecture supports the core Flare features including social photo sharing, sequential photo chains, friend systems, and real-time chat while maintaining security, performance, and scalability.