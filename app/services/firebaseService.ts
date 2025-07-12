import { User, Post, Comment, Streak, PhotoMetadata } from '../types';
import { auth, firestore, storage } from '../config/firebase';
import { formatTimeAgo } from '../utils/helpers';

// Authentication Services
export const signUp = async (email: string, password: string, username: string): Promise<User> => {
  try {
    // Create user account
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
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
    
    await firestore().collection('users').doc(firebaseUser.uid).set(newUser);
    return newUser;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const userDoc = await firestore().collection('users').doc(userCredential.user.uid).get();
    
    if (userDoc.exists) {
      return { id: userCredential.user.uid, ...userDoc.data() } as User;
    } else {
      throw new Error('User data not found');
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await auth().signOut();
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) return null;
    
    const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
    if (userDoc.exists) {
      return { id: currentUser.uid, ...userDoc.data() } as User;
    }
    return null;
  } catch (error: any) {
    console.error('Error getting current user:', error);
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
    
    console.log('Starting photo upload for user:', userId);
    console.log('Photo path:', photoUri);
    
    // Handle file URI - remove file:// prefix if present
    const cleanPhotoPath = photoUri.startsWith('file://') ? photoUri.replace('file://', '') : photoUri;
    console.log('Clean photo path for Firebase:', cleanPhotoPath);
    
    // Upload photo to Firebase Storage
    const filename = `photos/${userId}/${Date.now()}.jpg`;
    const reference = storage().ref(filename);
    
    // Upload the file
    console.log('Uploading photo to Firebase Storage...');
    await reference.putFile(cleanPhotoPath);
    
    // Get download URL
    console.log('Getting download URL...');
    const photoUrl = await reference.getDownloadURL();
    console.log('Photo uploaded successfully, URL:', photoUrl);
    
    // Get user data for username
    console.log('Fetching user data...');
    const userDoc = await firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
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
      createdAt: firestore.FieldValue.serverTimestamp(),
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
    
    console.log('Creating post document with data:', JSON.stringify(postData, null, 2));
    
    // Add post to Firestore
    const docRef = await firestore().collection('posts').add(postData);
    console.log('Post created successfully with ID:', docRef.id);
    
    // Update user's total photos and streak
    console.log('Updating user stats...');
    await firestore().collection('users').doc(userId).update({
      totalPhotos: firestore.FieldValue.increment(1),
      currentStreak: firestore.FieldValue.increment(1),
      lastPhotoDate: firestore.FieldValue.serverTimestamp(),
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('Post creation completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Error creating post:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    
    // Enhanced debugging for permission errors
    if (error.code === 'firestore/permission-denied') {
      console.error('🚫 PERMISSION DENIED during post creation!');
      console.error('🔐 Current user ID:', userId);
      console.error('🔐 Auth user ID:', auth().currentUser?.uid);
      console.error('📝 Post data being created:', {
        userId,
        photoUrl: 'URL_REDACTED',
        caption,
        isUserIdMatch: auth().currentUser?.uid === userId
      });
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

export const getFeedPosts = async (userId?: string, limit: number = 20): Promise<Post[]> => {
  try {
    let query = firestore()
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    const snapshot = await query.get();
    
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
    console.error('Error getting feed posts:', error);
    throw new Error('Failed to load posts');
  }
};

export const likePost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = firestore().collection('posts').doc(postId);
    const postDoc = await postRef.get();
    
    if (postDoc.exists) {
      const data = postDoc.data();
      const likes = data?.likes || [];
      const isLiked = likes.includes(userId);
      
      if (isLiked) {
        // Unlike post
        await postRef.update({
          likes: firestore.FieldValue.arrayRemove(userId),
        });
      } else {
        // Like post
        await postRef.update({
          likes: firestore.FieldValue.arrayUnion(userId),
        });
      }
    }
  } catch (error: any) {
    console.error('Error liking post:', error);
    throw new Error('Failed to like post');
  }
};

export const addComment = async (postId: string, userId: string, text: string): Promise<Comment> => {
  try {
    // Get user data
    const userDoc = await firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    const comment: Comment = {
      id: firestore().collection('temp').doc().id, // Generate ID
      postId,
      userId,
      username: userData?.username || 'Unknown',
      userAvatar: userData?.avatar,
      text,
      createdAt: new Date(),
      likes: [],
    };
    
    // Add comment to post
    await firestore().collection('posts').doc(postId).update({
      comments: firestore.FieldValue.arrayUnion(comment),
    });
    
    return comment;
  } catch (error: any) {
    console.error('Error adding comment:', error);
    throw new Error('Failed to add comment');
  }
};

// User Services
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await firestore().collection('users').doc(userId).get();
    if (userDoc.exists) {
      return { id: userId, ...userDoc.data() } as User;
    }
    return null;
  } catch (error: any) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const getUserPhotos = async (userId: string, limit: number = 12): Promise<string[]> => {
  try {
    console.log('🔍 getUserPhotos DEBUG INFO:');
    console.log('  - userId:', userId);
    console.log('  - userId type:', typeof userId);
    console.log('  - userId length:', userId?.length);
    console.log('  - limit:', limit);
    console.log('  - current auth user:', auth().currentUser?.uid);
    console.log('  - query collection: posts');
    console.log('  - query where: userId == ' + userId);
    console.log('  - query orderBy: createdAt desc');
    console.log('  - query limit:', limit);
    
    // First try: Test query WITHOUT orderBy to isolate the issue
    console.log('🧪 TESTING: Trying query WITHOUT orderBy first...');
    try {
      const testSnapshot = await firestore()
        .collection('posts')
        .where('userId', '==', userId)
        .limit(limit)
        .get();
      console.log('✅ Query WITHOUT orderBy succeeded! Found', testSnapshot.docs.length, 'docs');
    } catch (testError: any) {
      console.error('❌ Even query WITHOUT orderBy failed:', testError.code, testError.message);
    }
    
    // Second try: Compare with working feed query structure
    console.log('🧪 TESTING: Trying feed query structure (no where clause)...');
    try {
      const feedSnapshot = await firestore()
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      console.log('✅ Feed-style query succeeded! Found', feedSnapshot.docs.length, 'total posts');
    } catch (feedError: any) {
      console.error('❌ Feed-style query failed:', feedError.code, feedError.message);
    }
    
    // Third try: Original query WITH where + orderBy
    console.log('🧪 TESTING: Now trying original query (where + orderBy)...');
    const postsSnapshot = await firestore()
      .collection('posts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    console.log('✅ Query succeeded! Found', postsSnapshot.docs.length, 'user photos');
    return postsSnapshot.docs.map(doc => doc.data().photoUrl);
  } catch (error: any) {
    console.error('❌ getUserPhotos ERROR DETAILS:');
    console.error('  - Error code:', error.code);
    console.error('  - Error message:', error.message);
    console.error('  - Full error:', error);
    
    // If index is still building, fall back to getting all posts and filtering client-side
    if (error.code === 'firestore/failed-precondition') {
      console.log('🔄 Index still building, using fallback method...');
      try {
        const allPostsSnapshot = await firestore()
          .collection('posts')
          .limit(100) // Get reasonable amount to filter
          .get();
        
        const userPosts = allPostsSnapshot.docs
          .filter(doc => doc.data().userId === userId)
          .sort((a, b) => {
            const aTime = a.data().createdAt?.toDate() || new Date(0);
            const bTime = b.data().createdAt?.toDate() || new Date(0);
            return bTime.getTime() - aTime.getTime();
          })
          .slice(0, limit)
          .map(doc => doc.data().photoUrl);
        
        console.log(`📸 Found ${userPosts.length} user photos using fallback`);
        return userPosts;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return [];
      }
    }
    
    return [];
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
  try {
    await firestore().collection('users').doc(userId).update({
      ...updates,
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    });
    
    const updatedDoc = await firestore().collection('users').doc(userId).get();
    return { id: userId, ...updatedDoc.data() } as User;
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile');
  }
};

export const searchUsers = async (query: string): Promise<User[]> => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation - you might want to use Algolia or similar for production
    const snapshot = await firestore()
      .collection('users')
      .where('username', '>=', query.toLowerCase())
      .where('username', '<=', query.toLowerCase() + '\uf8ff')
      .limit(10)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error: any) {
    console.error('Error searching users:', error);
    return [];
  }
};

// Streak Services
export const getCurrentStreak = async (userId: string): Promise<Streak | null> => {
  try {
    const streaksSnapshot = await firestore()
      .collection('streaks')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (!streaksSnapshot.empty) {
      const doc = streaksSnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Streak;
    }
    
    return null;
  } catch (error: any) {
    console.error('Error getting current streak:', error);
    return null;
  }
};

// Photo Upload Services
export const uploadPhoto = async (photoUri: string, userId: string): Promise<PhotoMetadata> => {
  try {
    const filename = `photos/${userId}/${Date.now()}.jpg`;
    const reference = storage().ref(filename);
    
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
  console.log('🔄 Setting up posts subscription for user:', auth().currentUser?.uid);
  
  return firestore()
    .collection('posts')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .onSnapshot(
      (snapshot) => {
        console.log(`📥 Feed loaded: ${snapshot.docs.length} posts`);
        
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
        
        callback(posts);
      },
      (error) => {
        console.error('❌ Error in posts subscription:', error);
        console.error('❌ Error code:', error.code);
        
        if (error.code === 'permission-denied') {
          console.error('🚫 PERMISSION DENIED: Check Firebase security rules!');
          console.error('🔐 Current user:', auth().currentUser?.uid || 'Not authenticated');
        }
        
        if (onError) onError(new Error('Failed to subscribe to posts'));
      }
    );
};

export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  return auth().onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
        if (userDoc.exists) {
          const user = { id: firebaseUser.uid, ...userDoc.data() } as User;
          callback(user);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};