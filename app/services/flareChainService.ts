import { FlareChain, ChainParticipant, ChainPhoto, ChainPrompt, User } from '../types';
import { ChainStatus, ParticipantStatus } from '../types/flare';
import { firestore, storage } from '../config/firebase';
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
import { ref, uploadBytes, getDownloadURL } from '@react-native-firebase/storage';

export const flareChainService = {
  // Create a new Flare chain
  async createChain(
    prompt: ChainPrompt, 
    participantUserIds: string[], 
    maxParticipants: number,
    creatorId: string,
    firstPhotoUri?: string
  ): Promise<FlareChain> {
    try {
      // Create chain document
      const chainRef = doc(collection(firestore, 'flareChains'));
      const chainId = chainRef.id;
      
      // Calculate expiration time (60 minutes from now)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
      
      // Create participants array with creator first
      const participants: ChainParticipant[] = [
        {
          userId: creatorId,
          username: 'current-user', // TODO: Get from auth context
          status: firstPhotoUri ? ParticipantStatus.RESPONDED : ParticipantStatus.PENDING,
          position: 0,
          invitedAt: now,
          respondedAt: firstPhotoUri ? now : undefined,
        }
      ];

      // Add selected participants
      participantUserIds.forEach((userId, index) => {
        participants.push({
          userId,
          username: `user-${userId}`, // TODO: Get actual username from user data
          status: ParticipantStatus.PENDING,
          position: index + 1,
          invitedAt: now,
        });
      });

      const newChain: FlareChain = {
        id: chainId,
        creatorId,
        creatorUsername: 'current-user', // TODO: Get from auth context
        prompt,
        status: ChainStatus.ACTIVE,
        participants,
        photos: [],
        maxParticipants,
        currentParticipantIndex: firstPhotoUri ? 1 : 0,
        timeLimit: 60, // minutes
        createdAt: now,
        expiresAt,
      };

      // Upload first photo if provided
      if (firstPhotoUri) {
        const photoUrl = await this.uploadChainPhoto(chainId, creatorId, firstPhotoUri);
        const firstPhoto: ChainPhoto = {
          id: `${chainId}-0`,
          chainId,
          userId: creatorId,
          username: 'current-user',
          photoUrl,
          position: 0,
          createdAt: now,
          likes: [],
          reactions: [],
        };
        newChain.photos = [firstPhoto];
      }

      // Save to Firestore
      await setDoc(chainRef, {
        ...newChain,
        createdAt: serverTimestamp(),
        expiresAt: serverTimestamp(),
      });

      // Create notifications for invited participants
      await this.sendChainInvitations(chainId, participantUserIds, prompt.title);

      // TODO: Create group chat
      // newChain.groupChatId = await this.createGroupChat(chainId, participants);

      console.log('Chain created successfully:', chainId);
      return newChain;
    } catch (error) {
      console.error('Error creating chain:', error);
      throw error;
    }
  },

  // Upload photo to Firebase Storage
  async uploadChainPhoto(chainId: string, userId: string, photoUri: string): Promise<string> {
    try {
      const response = await fetch(photoUri);
      const blob = await response.blob();
      
      const filename = `chains/${chainId}/${userId}-${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading chain photo:', error);
      throw error;
    }
  },

  // Add a photo response to a chain
  async respondToChain(
    chainId: string, 
    userId: string, 
    photoUri: string, 
    interpretation?: string
  ): Promise<ChainPhoto> {
    try {
      // Upload photo
      const photoUrl = await this.uploadChainPhoto(chainId, userId, photoUri);
      
      // Get current chain data
      const chainDoc = await getDoc(doc(firestore, 'flareChains', chainId));
      if (!chainDoc.exists()) {
        throw new Error('Chain not found');
      }
      
      const chainData = chainDoc.data() as FlareChain;
      const currentPosition = chainData.photos.length;
      
      // Create photo document
      const newPhoto: ChainPhoto = {
        id: `${chainId}-${currentPosition}`,
        chainId,
        userId,
        username: 'current-user', // TODO: Get from auth context
        photoUrl,
        interpretation,
        position: currentPosition,
        createdAt: new Date(),
        likes: [],
        reactions: [],
      };

      // Update chain document
      await updateDoc(doc(firestore, 'flareChains', chainId), {
        photos: arrayUnion(newPhoto),
        currentParticipantIndex: increment(1),
        'participants': chainData.participants.map(p => 
          p.userId === userId 
            ? { ...p, status: ParticipantStatus.RESPONDED, respondedAt: new Date() }
            : p
        ),
      });

      // Check if chain is complete
      const allResponded = chainData.participants.every(p => 
        p.status === ParticipantStatus.RESPONDED || p.userId === userId
      );
      
      if (allResponded) {
        await this.completeChain(chainId);
      }

      console.log('Photo added to chain successfully');
      return newPhoto;
    } catch (error) {
      console.error('Error responding to chain:', error);
      throw error;
    }
  },

  // Get active chains for a user
  async getActiveChains(userId: string): Promise<FlareChain[]> {
    try {
      const q = query(
        collection(firestore, 'flareChains'),
        where('participants', 'array-contains', { userId }),
        where('status', '==', ChainStatus.ACTIVE),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const chains: FlareChain[] = [];
      
      querySnapshot.forEach((doc) => {
        chains.push({ id: doc.id, ...doc.data() } as FlareChain);
      });
      
      return chains;
    } catch (error) {
      console.error('Error getting active chains:', error);
      return [];
    }
  },

  // Get a specific chain by ID
  async getChainById(chainId: string): Promise<FlareChain | null> {
    try {
      const chainDoc = await getDoc(doc(firestore, 'flareChains', chainId));
      
      if (!chainDoc.exists()) {
        return null;
      }
      
      return { id: chainDoc.id, ...chainDoc.data() } as FlareChain;
    } catch (error) {
      console.error('Error getting chain:', error);
      return null;
    }
  },

  // Get chain history for a user
  async getChainHistory(userId: string, limitCount = 20): Promise<FlareChain[]> {
    try {
      const q = query(
        collection(firestore, 'flareChains'),
        where('participants', 'array-contains', { userId }),
        where('status', 'in', [ChainStatus.COMPLETED, ChainStatus.EXPIRED]),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const chains: FlareChain[] = [];
      
      querySnapshot.forEach((doc) => {
        chains.push({ id: doc.id, ...doc.data() } as FlareChain);
      });
      
      return chains;
    } catch (error) {
      console.error('Error getting chain history:', error);
      return [];
    }
  },

  // Complete a chain
  async completeChain(chainId: string): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'flareChains', chainId), {
        status: ChainStatus.COMPLETED,
        completedAt: serverTimestamp(),
      });
      
      console.log('Chain completed:', chainId);
    } catch (error) {
      console.error('Error completing chain:', error);
      throw error;
    }
  },

  // Cancel a chain (creator only)
  async cancelChain(chainId: string, userId: string): Promise<void> {
    try {
      const chain = await this.getChainById(chainId);
      
      if (!chain || chain.creatorId !== userId) {
        throw new Error('Only the creator can cancel the chain');
      }
      
      await updateDoc(doc(firestore, 'flareChains', chainId), {
        status: ChainStatus.CANCELLED,
        completedAt: serverTimestamp(),
      });
      
      console.log('Chain cancelled:', chainId);
    } catch (error) {
      console.error('Error cancelling chain:', error);
      throw error;
    }
  },

  // Invite additional users to a chain
  async inviteToChain(chainId: string, userIds: string[]): Promise<void> {
    try {
      const chain = await this.getChainById(chainId);
      
      if (!chain) {
        throw new Error('Chain not found');
      }
      
      if (chain.participants.length + userIds.length > chain.maxParticipants) {
        throw new Error('Too many participants');
      }
      
      const newParticipants = userIds.map((userId, index) => ({
        userId,
        username: `user-${userId}`, // TODO: Get actual username
        status: ParticipantStatus.PENDING,
        position: chain.participants.length + index,
        invitedAt: new Date(),
      }));
      
      await updateDoc(doc(firestore, 'flareChains', chainId), {
        participants: arrayUnion(...newParticipants),
      });
      
      await this.sendChainInvitations(chainId, userIds, chain.prompt.title);
      
      console.log('Users invited to chain:', userIds);
    } catch (error) {
      console.error('Error inviting to chain:', error);
      throw error;
    }
  },

  // Remove a user from a chain
  async removeFromChain(chainId: string, userId: string): Promise<void> {
    try {
      const chain = await this.getChainById(chainId);
      
      if (!chain) {
        throw new Error('Chain not found');
      }
      
      const updatedParticipants = chain.participants.filter(p => p.userId !== userId);
      
      await updateDoc(doc(firestore, 'flareChains', chainId), {
        participants: updatedParticipants,
      });
      
      console.log('User removed from chain:', userId);
    } catch (error) {
      console.error('Error removing from chain:', error);
      throw error;
    }
  },

  // Send chain invitations (notifications)
  async sendChainInvitations(chainId: string, userIds: string[], promptTitle: string): Promise<void> {
    try {
      // TODO: Implement push notifications
      console.log(`Sending chain invitations for "${promptTitle}" to:`, userIds);
      
      // For now, just log. In real implementation:
      // 1. Create notification documents in Firestore
      // 2. Send push notifications
      // 3. Create in-app notifications
    } catch (error) {
      console.error('Error sending invitations:', error);
    }
  },

  // Create group chat for chain participants
  async createGroupChat(chainId: string, participants: ChainParticipant[]): Promise<string> {
    try {
      // TODO: Implement group chat creation
      console.log('Creating group chat for chain:', chainId);
      
      // For now, return a mock chat ID
      return `chat-${chainId}`;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  },

  // Listen to real-time chain updates
  subscribeToChain(chainId: string, callback: (chain: FlareChain | null) => void): () => void {
    const unsubscribe = onSnapshot(
      doc(firestore, 'flareChains', chainId),
      (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as FlareChain);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to chain updates:', error);
        callback(null);
      }
    );
    
    return unsubscribe;
  },

  // Get chains that a user needs to respond to
  async getChainsAwaitingResponse(userId: string): Promise<FlareChain[]> {
    try {
      const activeChains = await this.getActiveChains(userId);
      
      return activeChains.filter(chain => {
        const userParticipant = chain.participants.find(p => p.userId === userId);
        const currentParticipant = chain.participants[chain.currentParticipantIndex];
        
        return userParticipant && 
               userParticipant.status === ParticipantStatus.PENDING &&
               currentParticipant?.userId === userId;
      });
    } catch (error) {
      console.error('Error getting chains awaiting response:', error);
      return [];
    }
  },

  // Expire chains that have timed out
  async expireOverdueChains(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(firestore, 'flareChains'),
        where('status', '==', ChainStatus.ACTIVE),
        where('expiresAt', '<', now)
      );
      
      const querySnapshot = await getDocs(q);
      
      const expirePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          status: ChainStatus.EXPIRED,
          completedAt: serverTimestamp(),
        })
      );
      
      await Promise.all(expirePromises);
      console.log(`Expired ${expirePromises.length} overdue chains`);
    } catch (error) {
      console.error('Error expiring overdue chains:', error);
    }
  },
};