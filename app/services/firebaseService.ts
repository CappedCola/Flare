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
    // Upload photo to Firebase Storage
    const filename = `photos/${userId}/${Date.now()}.jpg`;
    const reference = storage().ref(filename);
    
    // Upload the file
    await reference.putFile(photoUri);
    
    // Get download URL
    const photoUrl = await reference.getDownloadURL();
    
    // Get user data for username
    const userDoc = await firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    // Create post document
    const postData = {
      userId,
      username: userData?.username || 'Unknown',
      userAvatar: userData?.avatar || undefined,
      photoUrl,
      caption,
      streakDay: userData?.currentStreak || 1,
      location: undefined, // TODO: Add location if needed
      createdAt: firestore.FieldValue.serverTimestamp(),
      likes: [],
      comments: [],
      isVisible: true,
    };
    
    // Add post to Firestore
    await firestore().collection('posts').add(postData);
    
    // Update user's total photos and streak
    await firestore().collection('users').doc(userId).update({
      totalPhotos: firestore.FieldValue.increment(1),
      currentStreak: firestore.FieldValue.increment(1),
      lastPhotoDate: firestore.FieldValue.serverTimestamp(),
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    });
    
  } catch (error: any) {
    console.error('Error creating post:', error);
    throw new Error('Failed to create post');
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
    const postsSnapshot = await firestore()
      .collection('posts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return postsSnapshot.docs.map(doc => doc.data().photoUrl);
  } catch (error: any) {
    console.error('Error getting user photos:', error);
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
  return firestore()
    .collection('posts')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .onSnapshot(
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
            comments: data.comments || [],
            isVisible: data.isVisible ?? true,
            timeAgo: formatTimeAgo(data.createdAt?.toDate() || new Date()),
          };
        });
        callback(posts);
      },
      (error) => {
        console.error('Error in posts subscription:', error);
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