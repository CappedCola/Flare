import { User, Post, Comment, Streak, PhotoMetadata, PersonalPost, FriendRequest, MutualFriend } from '../types';
import { auth, firestore, storage } from '../config/firebase';
import { formatTimeAgo } from '../utils/helpers';
// React Native Firebase v22+ modular API imports
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from '@react-native-firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from '@react-native-firebase/firestore';

// Authentication Services
export const signUp = async (email: string, password: string, username: string): Promise<User> => {
  try {
    // Create user account using v22 modular API
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Create user document in Firestore
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
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    // Sign in using v22 modular API
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));
    
    if (userDoc.exists()) {
      return { id: userCredential.user.uid, ...userDoc.data() } as User;
    } else {
      throw new Error('User data not found');
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    // Sign out using v22 modular API
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    
    const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
    if (userDoc.exists()) {
      return { id: currentUser.uid, ...userDoc.data() } as User;
    }
    return null;
  } catch (error: any) {
    if (__DEV__) console.error('Error getting current user:', error);
    return null;
  }
};

// Post Services
export const createPost = async (photoUri: string, caption: string = '', userId: string): Promise<void> => {
  try {
    // Validate inputs
    if (!photoUri || !userId) {
      throw new Error('Photo URI and User ID are required');
    }
    
    // Handle file URI - remove file:// prefix if present
    const cleanPhotoPath = photoUri.startsWith('file://') ? photoUri.replace('file://', '') : photoUri;
    
    // Upload photo to Firebase Storage (v22 - storage still uses instance methods)
    const filename = `photos/${userId}/${Date.now()}.jpg`;
    const storageReference = storage.ref(filename);
    await storageReference.putFile(cleanPhotoPath);
    
    // Get download URL
    const photoUrl = await storageReference.getDownloadURL();
    
    // Get user data for username
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('User not found in database');
    }
    
    const userData = userDoc.data();
    
    // Create post document (only include fields with actual values)
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
    
    // Location will be added later when location feature is implemented
    // if (location) {
    //   postData.location = location;
    // }
    
    // Add post to Firestore
    const docRef = await addDoc(collection(firestore, 'posts'), postData);
    
    // Update user's total photos and streak
    await updateDoc(doc(firestore, 'users', userId), {
      totalPhotos: increment(1),
      currentStreak: increment(1),
      lastPhotoDate: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });
    
    
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error creating post:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }
    
    // Enhanced debugging for permission errors
    if (error.code === 'firestore/permission-denied') {
      if (__DEV__) {
        console.error('PERMISSION DENIED during post creation!');
        console.error('Current user ID:', userId);
        console.error('Auth user ID:', auth.currentUser?.uid);
      }
      throw new Error('Permission denied. Security rules may not be deployed correctly.');
    }
    
    // Provide more specific error messages
    if (error.code === 'storage/file-not-found') {
      throw new Error('Photo file not found. Please try taking the photo again.');
    } else if (error.message?.includes('undefined')) {
      throw new Error('Invalid data format. Please try again.');
    } else {
      throw new Error(`Failed to create post: ${error.message || 'Unknown error'}`);
    }
  }
};

// Dual posting: Create both global and personal posts
export const createPostWithRecipients = async (
  photoUri: string, 
  caption: string = '', 
  userId: string,
  recipients: string[] = []
): Promise<void> => {
  try {
    // First create the global post
    await createPost(photoUri, caption, userId);
    
    // If recipients are specified, create personal posts for each
    if (recipients.length > 0) {
      // Get sender info
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('Sender not found in database');
      }
      
      const senderData = userDoc.data();
      const senderInfo = {
        id: userId,
        username: senderData?.username || 'Unknown',
        avatar: senderData?.avatar
      };
      
      // Upload photo again for personal posts (in real implementation, you'd reuse the same photo URL)
      const cleanPhotoPath = photoUri.startsWith('file://') ? photoUri.replace('file://', '') : photoUri;
      const filename = `personal_photos/${userId}/${Date.now()}.jpg`;
      const storageReference = storage.ref(filename);
      await storageReference.putFile(cleanPhotoPath);
      const personalPhotoUrl = await storageReference.getDownloadURL();
      
      // Create personal posts for each recipient
      const personalPostPromises = recipients.map(async (recipientId) => {
        const personalPostData = {
          userId,
          username: senderInfo.username,
          userAvatar: senderInfo.avatar,
          photoUrl: personalPhotoUrl,
          caption,
          streakDay: senderData?.currentStreak || 1,
          createdAt: serverTimestamp(),
          likes: [],
          comments: [],
          isVisible: true,
          isPersonalPost: true,
          recipientId,
          senderInfo,
          status: 'sent'
        };
        
        // Add to personal_posts collection
        return addDoc(collection(firestore, 'personal_posts'), personalPostData);
      });
      
      await Promise.all(personalPostPromises);
    }
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error creating post with recipients:', error);
    }
    throw new Error(`Failed to create post: ${error.message || 'Unknown error'}`);
  }
};

export const getFeedPosts = async (userId?: string, limitCount: number = 20): Promise<Post[]> => {
  try {
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
  } catch (error: any) {
    if (__DEV__) console.error('Error getting feed posts:', error);
    throw new Error('Failed to load posts');
  }
};

export const likePost = async (postId: string, userId: string): Promise<void> => {
  try {
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
  } catch (error: any) {
    if (__DEV__) console.error('Error liking post:', error);
    
    // Provide specific error messages for different failure types
    if (error.code === 'firestore/permission-denied') {
      throw new Error('Permission denied. Please make sure you are signed in and try again.');
    } else if (error.code === 'firestore/not-found') {
      throw new Error('This post no longer exists.');
    } else if (error.code === 'firestore/offline') {
      throw new Error('No internet connection. Please check your network and try again.');
    } else if (error.message === 'Post not found') {
      throw new Error('This post no longer exists.');
    } else {
      throw new Error(`Failed to like post: ${error.message || 'Unknown error'}`);
    }
  }
};

export const addComment = async (postId: string, userId: string, text: string): Promise<Comment> => {
  try {
    if (__DEV__) console.log('🔍 [DEBUG] Starting addComment:', { postId, userId, textLength: text.length });
    
    // Validate inputs
    if (!postId || !userId || !text.trim()) {
      if (__DEV__) console.error('❌ [ERROR] Invalid comment data:', { postId, userId, text });
      throw new Error('Invalid comment data');
    }

    if (__DEV__) console.log('✅ [DEBUG] Input validation passed');

    // Check if post exists
    const postRef = doc(firestore, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      if (__DEV__) console.error('❌ [ERROR] Post not found:', postId);
      throw new Error('Post not found');
    }

    if (__DEV__) console.log('✅ [DEBUG] Post exists');

    // Get user data
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (!userDoc.exists()) {
      if (__DEV__) console.error('❌ [ERROR] User not found:', userId);
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    if (__DEV__) console.log('✅ [DEBUG] User data retrieved:', { username: userData?.username, hasAvatar: !!userData?.avatar });
    
    // Create comment object with proper types (NO serverTimestamp in arrayUnion!)
    // IMPORTANT: Firebase arrayUnion cannot accept objects with undefined values
    // We must conditionally build the object to completely omit undefined fields
    const currentTime = new Date();
    
    // Build base comment object with required fields
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
      if (__DEV__) console.log('✅ [DEBUG] User has avatar, adding to comment:', userData.avatar);
    } else {
      if (__DEV__) console.log('ℹ️ [DEBUG] User has no avatar, omitting userAvatar field');
    }
    
    if (__DEV__) console.log('✅ [DEBUG] Comment object created:', { 
      id: comment.id, 
      username: comment.username, 
      hasAvatar: !!comment.userAvatar,
      fields: Object.keys(comment),
      timestamp: comment.createdAt.toISOString()
    });
    
    // Add comment to post using arrayUnion for atomic operation
    if (__DEV__) console.log('🔄 [DEBUG] Adding comment to Firestore with fields:', Object.keys(comment));
    await updateDoc(postRef, {
      comments: arrayUnion(comment),
    });
    
    if (__DEV__) console.log('✅ [DEBUG] Comment successfully added to Firestore');
    
    // Return properly typed comment for UI
    return comment as Comment;
  } catch (error: any) {
    if (__DEV__) {
      console.error('💥 [CRASH] Error adding comment:', error);
      console.error('💥 [CRASH] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      });
    }
    
    // Provide specific error messages
    if (error.code === 'firestore/permission-denied') {
      throw new Error('Permission denied. Please make sure you are signed in.');
    } else if (error.code === 'firestore/not-found') {
      throw new Error('This post no longer exists.');
    } else if (error.code === 'firestore/offline') {
      throw new Error('No internet connection. Please check your network and try again.');
    } else if (error.message === 'Post not found' || error.message === 'User not found' || error.message === 'Invalid comment data') {
      throw new Error(error.message);
    } else {
      throw new Error(`Failed to add comment: ${error.message || 'Unknown error'}`);
    }
  }
};

// User Services
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (userDoc.exists()) {
      return { id: userId, ...userDoc.data() } as User;
    }
    return null;
  } catch (error: any) {
    if (__DEV__) console.error('Error getting user:', error);
    return null;
  }
};

export const getUserPhotos = async (userId: string, limitCount: number = 12): Promise<string[]> => {
  try {
    const q = query(
      collection(firestore, 'posts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const postsSnapshot = await getDocs(q);
    
    return postsSnapshot.docs.map(doc => doc.data().photoUrl);
  } catch (error: any) {
    // If index is still building, fall back to getting all posts and filtering client-side
    if (error.code === 'firestore/failed-precondition') {
      try {
        const allPostsQuery = query(collection(firestore, 'posts'), limit(100));
        const allPostsSnapshot = await getDocs(allPostsQuery);
        
        const userPosts = allPostsSnapshot.docs
          .filter(doc => doc.data().userId === userId)
          .sort((a, b) => {
            const aTime = a.data().createdAt?.toDate() || new Date(0);
            const bTime = b.data().createdAt?.toDate() || new Date(0);
            return bTime.getTime() - aTime.getTime();
          })
          .slice(0, limitCount)
          .map(doc => doc.data().photoUrl);
        
        return userPosts;
      } catch (fallbackError) {
        console.error('Fallback getUserPhotos failed:', fallbackError);
        return [];
      }
    }
    
    console.error('Error getting user photos:', error);
    return [];
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
  try {
    await updateDoc(doc(firestore, 'users', userId), {
      ...updates,
      lastActiveAt: serverTimestamp(),
    });
    
    const updatedDoc = await getDoc(doc(firestore, 'users', userId));
    return { id: userId, ...updatedDoc.data() } as User;
  } catch (error: any) {
    if (__DEV__) console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile');
  }
};

export const searchUsers = async (searchQuery: string): Promise<User[]> => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation - you might want to use Algolia or similar for production
    const q = query(
      collection(firestore, 'users'),
      where('username', '>=', searchQuery.toLowerCase()),
      where('username', '<=', searchQuery.toLowerCase() + '\uf8ff'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error: any) {
    if (__DEV__) console.error('Error searching users:', error);
    return [];
  }
};

// Streak Services
export const getCurrentStreak = async (userId: string): Promise<Streak | null> => {
  try {
    const q = query(
      collection(firestore, 'streaks'),
      where('userId', '==', userId),
      where('isActive', '==', true),
      limit(1)
    );
    const streaksSnapshot = await getDocs(q);
    
    if (!streaksSnapshot.empty) {
      const docSnapshot = streaksSnapshot.docs[0];
      return { id: docSnapshot.id, ...docSnapshot.data() } as Streak;
    }
    
    return null;
  } catch (error: any) {
    if (__DEV__) console.error('Error getting current streak:', error);
    return null;
  }
};

// Photo Upload Services
export const uploadPhoto = async (photoUri: string, userId: string): Promise<PhotoMetadata> => {
  try {
    const filename = `photos/${userId}/${Date.now()}.jpg`;
    // Use storage instance from v22 modular config
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
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    throw new Error('Failed to upload photo');
  }
};

// Real-time listeners
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
                // Handle timestamp conversion for comments (now using regular Date objects)
                createdAt: comment.createdAt?.toDate ? comment.createdAt.toDate() : 
                          (comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt)),
                // Don't modify userAvatar - if it exists in Firestore, keep it; if not, it's already omitted
              }));
            })(),
            isVisible: data.isVisible ?? true,
            timeAgo: formatTimeAgo(data.createdAt?.toDate() || new Date()),
          };
        });
        
        callback(posts);
      },
      (error) => {
        console.error('Error in posts subscription:', error);
        
        if (error.code === 'permission-denied') {
          console.error('PERMISSION DENIED: Check Firebase security rules!');
        }
        
        if (onError) onError(new Error('Failed to subscribe to posts'));
      }
    );
};

// Personal Posts Services
export const getPersonalPosts = async (userId: string, limitCount: number = 20): Promise<PersonalPost[]> => {
  try {
    const q = query(
      collection(firestore, 'personal_posts'),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    const personalPosts: PersonalPost[] = snapshot.docs.map(doc => {
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
        isPersonalPost: true,
        recipientId: data.recipientId,
        senderInfo: data.senderInfo,
        status: data.status || 'sent'
      };
    });
    
    return personalPosts;
  } catch (error: any) {
    if (__DEV__) console.error('Error getting personal posts:', error);
    throw new Error('Failed to load personal posts');
  }
};

export const subscribeToPersonalPosts = (userId: string, callback: (posts: PersonalPost[]) => void, onError?: (error: Error) => void) => {
  const q = query(
    collection(firestore, 'personal_posts'),
    where('recipientId', '==', userId),
    where('status', '==', 'sent'),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  
  return onSnapshot(q,
    (snapshot) => {
      // Add null check for snapshot
      const personalPosts: PersonalPost[] = snapshot?.docs?.map(doc => {
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
          isPersonalPost: true,
          recipientId: data.recipientId,
          senderInfo: data.senderInfo,
          status: data.status || 'sent'
        };
      }) || [];
      
      callback(personalPosts);
    },
    (error) => {
      if (__DEV__) console.error('Error in personal posts subscription:', error);
      
      // Handle permission denied errors gracefully
      if (error.code === 'firestore/permission-denied') {
        if (__DEV__) console.warn('Permission denied for personal posts subscription - calling callback with empty array');
        // Call callback with empty array instead of error for permission issues
        callback([]);
        return;
      }
      
      // Only call onError for actual errors, not permission issues
      if (onError) onError(new Error('Failed to subscribe to personal posts'));
    }
  );
};

export const updatePersonalPostStatus = async (postId: string, status: 'sent' | 'viewed' | 'dismissed'): Promise<void> => {
  try {
    await updateDoc(doc(firestore, 'personal_posts', postId), {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    if (__DEV__) console.error('Error updating personal post status:', error);
    throw new Error('Failed to update post status');
  }
};

export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  try {
    // Auth state listener using v22 modular API
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
        if (__DEV__) console.error('Error getting user data:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
    });
  } catch (error) {
    if (__DEV__) console.error('Error setting up auth state listener:', error);
    // Return a no-op function if auth state subscription fails
    return () => {};
  }
};

// Friends Services
export const searchUsersByUsername = async (searchQuery: string): Promise<User[]> => {
  try {
    if (!searchQuery.trim()) return [];
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const q = query(
      collection(firestore, 'users'),
      where('username', '>=', normalizedQuery),
      where('username', '<=', normalizedQuery + '\uf8ff'),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    return snapshot?.docs?.map(doc => ({ id: doc.id, ...doc.data() } as User)) || [];
  } catch (error: any) {
    if (__DEV__) console.error('Error searching users by username:', error);
    
    // Return empty array for permission issues instead of throwing
    if (error.code === 'firestore/permission-denied') {
      if (__DEV__) console.warn('Permission denied for user search - returning empty array');
      return [];
    }
    
    throw new Error('Failed to search users');
  }
};

export const sendFriendRequest = async (fromUserId: string, toUsername: string): Promise<void> => {
  try {
    // First find the user by username
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
    if (!fromUserDoc.exists()) {
      throw new Error('Sender not found');
    }
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
  } catch (error: any) {
    if (__DEV__) console.error('Error sending friend request:', error);
    throw new Error(error.message || 'Failed to send friend request');
  }
};

export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  try {
    const requestRef = doc(firestore, 'friend_requests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Friend request not found');
    }
    
    const requestData = requestDoc.data() as FriendRequest;
    
    // Update both users' friends arrays
    const fromUserRef = doc(firestore, 'users', requestData.fromUserId);
    const toUserRef = doc(firestore, 'users', requestData.toUserId);
    
    await Promise.all([
      updateDoc(fromUserRef, {
        friends: arrayUnion(requestData.toUserId)
      }),
      updateDoc(toUserRef, {
        friends: arrayUnion(requestData.fromUserId)
      }),
      updateDoc(requestRef, {
        status: 'accepted'
      })
    ]);
  } catch (error: any) {
    if (__DEV__) console.error('Error accepting friend request:', error);
    throw new Error('Failed to accept friend request');
  }
};

export const declineFriendRequest = async (requestId: string): Promise<void> => {
  try {
    const requestRef = doc(firestore, 'friend_requests', requestId);
    await updateDoc(requestRef, {
      status: 'declined'
    });
  } catch (error: any) {
    if (__DEV__) console.error('Error declining friend request:', error);
    throw new Error('Failed to decline friend request');
  }
};

export const getUserFriends = async (userId: string): Promise<User[]> => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (!userDoc || !userDoc.exists()) {
      if (__DEV__) console.warn('User document not found, returning empty friends list');
      return [];
    }
    
    const userData = userDoc.data();
    const friendIds = userData?.friends || [];
    
    if (friendIds.length === 0) {
      return [];
    }
    
    // Get friend user documents
    const friendPromises = friendIds.map((friendId: string) => 
      getDoc(doc(firestore, 'users', friendId))
    );
    
    const friendDocs = await Promise.all(friendPromises);
    return friendDocs
      .filter(doc => doc && doc.exists())
      .map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error: any) {
    if (__DEV__) console.error('Error getting user friends:', error);
    
    // Return empty array for permission issues instead of throwing
    if (error.code === 'firestore/permission-denied') {
      if (__DEV__) console.warn('Permission denied for user friends - returning empty array');
      return [];
    }
    
    throw new Error('Failed to load friends');
  }
};

export const getFriendRequests = async (userId: string): Promise<{ incoming: FriendRequest[], outgoing: FriendRequest[] }> => {
  try {
    // Get incoming requests
    const incomingQuery = query(
      collection(firestore, 'friend_requests'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    );
    
    // Get outgoing requests
    const outgoingQuery = query(
      collection(firestore, 'friend_requests'),
      where('fromUserId', '==', userId),
      where('status', '==', 'pending')
    );
    
    const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
      getDocs(incomingQuery),
      getDocs(outgoingQuery)
    ]);
    
    // Add null checks for snapshots
    const incoming: FriendRequest[] = incomingSnapshot?.docs?.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FriendRequest)) || [];
    
    const outgoing: FriendRequest[] = outgoingSnapshot?.docs?.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FriendRequest)) || [];
    
    return { incoming, outgoing };
  } catch (error: any) {
    if (__DEV__) console.error('Error getting friend requests:', error);
    
    // Return empty arrays instead of throwing error for permission issues
    if (error.code === 'firestore/permission-denied') {
      if (__DEV__) console.warn('Permission denied for friend requests - returning empty arrays');
      return { incoming: [], outgoing: [] };
    }
    
    throw new Error('Failed to load friend requests');
  }
};

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
  
  const unsubscribeIncoming = onSnapshot(
    incomingQuery, 
    (snapshot) => {
      // Add null check for snapshot and docs
      incomingRequests = snapshot?.docs?.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FriendRequest)) || [];
      callback({ incoming: incomingRequests, outgoing: outgoingRequests });
    },
    (error) => {
      if (__DEV__) console.error('Error in incoming friend requests subscription:', error);
      // On error, call callback with empty arrays
      callback({ incoming: [], outgoing: outgoingRequests });
    }
  );
  
  const unsubscribeOutgoing = onSnapshot(
    outgoingQuery, 
    (snapshot) => {
      // Add null check for snapshot and docs
      outgoingRequests = snapshot?.docs?.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FriendRequest)) || [];
      callback({ incoming: incomingRequests, outgoing: outgoingRequests });
    },
    (error) => {
      if (__DEV__) console.error('Error in outgoing friend requests subscription:', error);
      // On error, call callback with empty arrays
      callback({ incoming: incomingRequests, outgoing: [] });
    }
  );
  
  return () => {
    unsubscribeIncoming();
    unsubscribeOutgoing();
  };
};

export const getMutualFriends = async (userId: string): Promise<MutualFriend[]> => {
  try {
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
        if (__DEV__) console.warn(`Could not get friends for user ${friend.id}:`, error);
        continue;
      }
    }
    
    // Convert map to array and sort by mutual count (most mutuals first)
    const mutuals = Array.from(mutualFriendsMap.values())
      .sort((a, b) => b.mutualCount - a.mutualCount)
      .slice(0, 10); // Limit to top 10 mutual friends
    
    return mutuals;
  } catch (error: any) {
    if (__DEV__) console.error('Error getting mutual friends:', error);
    
    // Return empty array for permission issues
    if (error.code === 'firestore/permission-denied') {
      if (__DEV__) console.warn('Permission denied for mutual friends - returning empty array');
      return [];
    }
    
    throw new Error('Failed to load mutual friends');
  }
};