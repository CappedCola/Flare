import { FlareChain, ChainParticipant, ChainPhoto, ChainPrompt, User, TurnRecord } from '../types';
import { ChainStatus, ParticipantStatus } from '../types/flare';
import { firestore, storage } from '../config/firebase';
import { getUserById, withFirebaseRetry, handleFirebaseError } from './firebaseService';
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
// No additional imports needed - storage is imported from config/firebase

// Utility function to convert Firestore Timestamps to Date objects
const convertTimestampToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date();
};

// Convert FlareChain document with nested timestamps
const convertChainTimestamps = (data: any): any => {
  return {
    ...data,
    // Main chain timestamps
    createdAt: convertTimestampToDate(data.createdAt),
    expiresAt: convertTimestampToDate(data.expiresAt),
    currentTurnExpiresAt: convertTimestampToDate(data.currentTurnExpiresAt),
    completedAt: data.completedAt ? convertTimestampToDate(data.completedAt) : undefined,
    
    // Participants array timestamps
    participants: data.participants?.map((participant: any) => ({
      ...participant,
      invitedAt: convertTimestampToDate(participant.invitedAt),
      respondedAt: participant.respondedAt ? convertTimestampToDate(participant.respondedAt) : undefined,
    })) || [],
    
    // Photos array timestamps
    photos: data.photos?.map((photo: any) => ({
      ...photo,
      createdAt: convertTimestampToDate(photo.createdAt),
      reactions: photo.reactions?.map((reaction: any) => ({
        ...reaction,
        createdAt: convertTimestampToDate(reaction.createdAt),
      })) || [],
    })) || [],
    
    // Turn history timestamps
    turnHistory: data.turnHistory?.map((turn: any) => ({
      ...turn,
      startedAt: convertTimestampToDate(turn.startedAt),
      completedAt: turn.completedAt ? convertTimestampToDate(turn.completedAt) : undefined,
    })) || [],
    
    // Prompt timestamps
    prompt: data.prompt ? {
      ...data.prompt,
      createdAt: convertTimestampToDate(data.prompt.createdAt),
    } : undefined,
  };
};

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
      console.log('🔥 Starting chain creation...', { 
        creatorId, 
        participants: participantUserIds.length, 
        hasPhoto: !!firstPhotoUri 
      });
      
      // Get creator's user data
      console.log('📱 Fetching creator user data...', creatorId);
      const creatorUser = await getUserById(creatorId);
      if (!creatorUser) {
        console.error('❌ Creator user not found:', creatorId);
        throw new Error('Creator user not found');
      }
      console.log('✅ Creator user found:', { 
        username: creatorUser.username, 
        displayName: creatorUser.displayName 
      });
      
      // Create chain document
      const chainRef = doc(collection(firestore, 'flareChains'));
      const chainId = chainRef.id;
      
      // Calculate expiration time (total chain safety limit: 24 hours)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // Calculate current turn expiration (1 hour from now for first participant)  
      const currentTurnExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);
      
      console.log('⏰ Timestamps calculated:', { 
        now: now.toISOString(), 
        expiresAt: expiresAt.toISOString(),
        currentTurnExpiresAt: currentTurnExpiresAt.toISOString()
      });
      
      // Create participants array with creator first
      const participants: ChainParticipant[] = [
        {
          userId: creatorId,
          username: creatorUser.username || creatorUser.displayName || 'User',
          status: firstPhotoUri ? ParticipantStatus.RESPONDED : ParticipantStatus.CURRENT_TURN,
          position: 0,
          invitedAt: now,
          respondedAt: firstPhotoUri ? now : undefined,
        }
      ];

      // Add selected participants (they start in waiting status)
      // Note: For performance, we'll fetch participant usernames when needed
      // The security rules only require userId fields to match
      participantUserIds.forEach((userId, index) => {
        participants.push({
          userId,
          username: `user-${userId}`, // Will be updated when they first interact
          status: ParticipantStatus.WAITING_TURN,
          position: index + 1,
          invitedAt: now,
        });
      });

      // Initialize turn history
      const turnHistory: TurnRecord[] = [];
      
      // Start first turn record
      const firstTurnRecord: TurnRecord = {
        userId: creatorId,
        username: creatorUser.username || creatorUser.displayName || 'User',
        position: 0,
        startedAt: now,
        photoSubmitted: !!firstPhotoUri,
        turnDurationMinutes: 0,
        completedAt: firstPhotoUri ? now : undefined,
      };
      turnHistory.push(firstTurnRecord);

      // Create participantIds array for Firestore queries (primitive values only)
      const participantIds = [creatorId, ...participantUserIds];

      const newChain: FlareChain = {
        id: chainId,
        creatorId,
        creatorUsername: creatorUser.username || creatorUser.displayName || 'User',
        prompt,
        status: ChainStatus.ACTIVE,
        participants,
        participantIds, // Add this for efficient querying
        photos: [],
        maxParticipants,
        currentParticipantIndex: firstPhotoUri ? 1 : 0,
        currentTurnExpiresAt, // Individual turn timer
        turnHistory, // Track each person's turn
        timeLimit: 60, // minutes per person
        createdAt: now,
        expiresAt, // Overall safety expiration
      };

      // Upload first photo if provided
      if (firstPhotoUri) {
        console.log('📸 Uploading first photo...', firstPhotoUri);
        const photoUrl = await this.uploadChainPhoto(chainId, creatorId, firstPhotoUri);
        console.log('✅ Photo uploaded successfully:', photoUrl);
        
        const firstPhoto: ChainPhoto = {
          id: `${chainId}-0`,
          chainId,
          userId: creatorId,
          username: creatorUser.username || creatorUser.displayName || 'User',
          photoUrl,
          position: 0,
          createdAt: now,
          likes: [],
          reactions: [],
        };
        newChain.photos = [firstPhoto];
      }

      // Save to Firestore with enhanced error handling
      console.log('💾 Saving chain to Firestore...', chainId);
      await withFirebaseRetry(async () => {
        const chainData = {
          ...newChain,
          createdAt: serverTimestamp(),
          // Keep calculated future timestamps as Date objects - Firestore will convert properly
          expiresAt: newChain.expiresAt,
          currentTurnExpiresAt: newChain.currentTurnExpiresAt
        };
        
        console.log('📄 Document data structure:', {
          id: chainData.id,
          creatorId: chainData.creatorId,
          participantIds: chainData.participantIds,
          status: chainData.status,
          photosCount: chainData.photos.length
        });
        
        await setDoc(chainRef, chainData);
      }, 'create flare chain');
      console.log('✅ Chain saved to Firestore successfully');

      // Create notifications for invited participants
      try {
        await this.sendChainInvitations(chainId, participantUserIds, prompt.title);
      } catch (error) {
        // Don't fail chain creation if notifications fail
        console.warn('Failed to send chain invitations:', error);
      }

      // TODO: Create group chat
      // newChain.groupChatId = await this.createGroupChat(chainId, participants);

      console.log('🎉 Chain created successfully!', chainId);
      return newChain;
    } catch (error: any) {
      console.error('💥 Error creating chain:', error);
      console.error('Error details:', { 
        message: error.message, 
        code: error.code, 
        stack: error.stack 
      });
      throw handleFirebaseError(error, 'create flare chain');
    }
  },

  // Start the next person's turn in the sequence
  async startNextTurn(chainId: string): Promise<void> {
    try {
      const chainDoc = await getDoc(doc(firestore, 'flareChains', chainId));
      if (!chainDoc.exists()) {
        throw new Error('Chain not found');
      }

      const chainData = chainDoc.data() as FlareChain;
      const nextIndex = chainData.currentParticipantIndex;
      
      // Check if chain is complete
      if (nextIndex >= chainData.participants.length) {
        await this.completeChain(chainId);
        return;
      }

      const nextParticipant = chainData.participants[nextIndex];
      const now = new Date();
      const turnExpiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      // Update participant statuses
      const updatedParticipants = chainData.participants.map((p, index) => {
        if (index === nextIndex) {
          return { ...p, status: ParticipantStatus.CURRENT_TURN };
        } else if (p.status === ParticipantStatus.CURRENT_TURN) {
          return { ...p, status: ParticipantStatus.RESPONDED };
        }
        return p;
      });

      // Create new turn record
      const newTurnRecord: TurnRecord = {
        userId: nextParticipant.userId,
        username: nextParticipant.username,
        position: nextIndex,
        startedAt: now,
        photoSubmitted: false,
        turnDurationMinutes: 0,
      };

      // Update chain
      await updateDoc(doc(firestore, 'flareChains', chainId), {
        participants: updatedParticipants,
        currentTurnExpiresAt: turnExpiresAt,
        turnHistory: arrayUnion(newTurnRecord),
      });

      console.log(`Started turn for participant ${nextIndex}: ${nextParticipant.username}`);
    } catch (error) {
      console.error('Error starting next turn:', error);
      throw error;
    }
  },

  // Handle when a participant's turn expires
  async handleTurnExpiry(chainId: string, expiredUserId: string): Promise<void> {
    try {
      const chainDoc = await getDoc(doc(firestore, 'flareChains', chainId));
      if (!chainDoc.exists()) {
        throw new Error('Chain not found');
      }

      const chainData = chainDoc.data() as FlareChain;
      const now = new Date();

      // Mark expired participant
      const updatedParticipants = chainData.participants.map(p => 
        p.userId === expiredUserId 
          ? { ...p, status: ParticipantStatus.TURN_EXPIRED }
          : p
      );

      // Update turn history
      const updatedTurnHistory = chainData.turnHistory.map(turn => 
        turn.userId === expiredUserId && !turn.completedAt
          ? { 
              ...turn, 
              expiredAt: now,
              turnDurationMinutes: Math.round((now.getTime() - turn.startedAt.getTime()) / (1000 * 60))
            }
          : turn
      );

      // Update chain
      await updateDoc(doc(firestore, 'flareChains', chainId), {
        participants: updatedParticipants,
        turnHistory: updatedTurnHistory,
        currentParticipantIndex: increment(1),
      });

      // Start next person's turn
      await this.startNextTurn(chainId);

      console.log(`Turn expired for user ${expiredUserId}, advancing to next participant`);
    } catch (error) {
      console.error('Error handling turn expiry:', error);
      throw error;
    }
  },

  // Get current turn information
  async getCurrentTurnInfo(chainId: string): Promise<{
    currentParticipant: ChainParticipant | null;
    timeRemaining: number; // minutes
    isUsersTurn: (userId: string) => boolean;
  }> {
    try {
      const chainDoc = await getDoc(doc(firestore, 'flareChains', chainId));
      if (!chainDoc.exists()) {
        throw new Error('Chain not found');
      }

      const chainData = chainDoc.data() as FlareChain;
      const now = new Date();
      
      const currentParticipant = chainData.participants.find(p => 
        p.status === ParticipantStatus.CURRENT_TURN
      ) || null;

      const timeRemaining = currentParticipant 
        ? Math.max(0, Math.round((chainData.currentTurnExpiresAt.getTime() - now.getTime()) / (1000 * 60)))
        : 0;

      const isUsersTurn = (userId: string) => 
        currentParticipant?.userId === userId;

      return {
        currentParticipant,
        timeRemaining,
        isUsersTurn,
      };
    } catch (error) {
      console.error('Error getting current turn info:', error);
      return {
        currentParticipant: null,
        timeRemaining: 0,
        isUsersTurn: () => false,
      };
    }
  },

  // Upload photo to Firebase Storage using React Native Firebase v6 API
  async uploadChainPhoto(chainId: string, userId: string, photoUri: string): Promise<string> {
    try {
      console.log('Starting chain photo upload...', { chainId, userId, photoUri });
      
      // Create filename and storage reference using React Native Firebase v6 API
      const filename = `chains/${chainId}/${userId}-${Date.now()}.jpg`;
      const storageRef = storage.ref(filename);
      
      console.log('Uploading to:', filename);
      
      // Use putFile() for React Native Firebase v6 - handles local file URIs directly
      const task = storageRef.putFile(photoUri);
      
      // Wait for upload completion
      await task;
      
      console.log('Upload completed, getting download URL...');
      
      // Get download URL using React Native Firebase v6 API
      const downloadURL = await storageRef.getDownloadURL();
      
      console.log('Chain photo uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading chain photo:', error);
      throw new Error(`Failed to upload chain photo: ${error.message}`);
    }
  },

  // Add a photo response to a chain (sequential version)
  async respondToChain(
    chainId: string, 
    userId: string, 
    photoUri: string, 
    interpretation?: string
  ): Promise<ChainPhoto> {
    try {
      // Get current chain data
      const chainDoc = await getDoc(doc(firestore, 'flareChains', chainId));
      if (!chainDoc.exists()) {
        throw new Error('Chain not found');
      }
      
      const chainData = chainDoc.data() as FlareChain;
      const now = new Date();
      
      // Verify it's the user's turn
      const currentParticipant = chainData.participants.find(p => 
        p.status === ParticipantStatus.CURRENT_TURN
      );
      
      if (!currentParticipant || currentParticipant.userId !== userId) {
        throw new Error('It is not your turn to respond');
      }

      // Check if turn has expired
      if (now > chainData.currentTurnExpiresAt) {
        await this.handleTurnExpiry(chainId, userId);
        throw new Error('Your turn has expired');
      }

      // Upload photo
      const photoUrl = await this.uploadChainPhoto(chainId, userId, photoUri);
      
      const currentPosition = chainData.photos.length;
      
      // Create photo document
      const newPhoto: ChainPhoto = {
        id: `${chainId}-${currentPosition}`,
        chainId,
        userId,
        username: currentParticipant.username,
        photoUrl,
        interpretation,
        position: currentPosition,
        createdAt: now,
        likes: [],
        reactions: [],
      };

      // Calculate turn duration
      const currentTurn = chainData.turnHistory.find(turn => 
        turn.userId === userId && !turn.completedAt
      );
      const turnDuration = currentTurn 
        ? Math.round((now.getTime() - currentTurn.startedAt.getTime()) / (1000 * 60))
        : 0;

      // Calculate next participant index
      const nextIndex = chainData.currentParticipantIndex + 1;
      const turnExpiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      // Update participant statuses - mark current as responded, next as current_turn
      const updatedParticipants = chainData.participants.map((p, index) => {
        if (p.userId === userId) {
          // Current participant who just responded
          return { ...p, status: ParticipantStatus.RESPONDED, respondedAt: now };
        } else if (index === nextIndex && nextIndex < chainData.participants.length) {
          // Next participant gets current turn
          return { ...p, status: ParticipantStatus.CURRENT_TURN };
        }
        return p;
      });

      // Update turn history for current user
      const updatedTurnHistory = chainData.turnHistory.map(turn => 
        turn.userId === userId && !turn.completedAt
          ? { 
              ...turn, 
              completedAt: now,
              photoSubmitted: true,
              turnDurationMinutes: turnDuration
            }
          : turn
      );

      // Create new turn record for next participant (if exists)
      let newTurnRecord = null;
      if (nextIndex < chainData.participants.length) {
        const nextParticipant = chainData.participants[nextIndex];
        newTurnRecord = {
          userId: nextParticipant.userId,
          username: nextParticipant.username,
          position: nextIndex,
          startedAt: now,
          photoSubmitted: false,
          turnDurationMinutes: 0,
        };
      }

      // Prepare update data
      const updateData: any = {
        photos: arrayUnion(newPhoto),
        participants: updatedParticipants,
        turnHistory: newTurnRecord ? arrayUnion(newTurnRecord) : updatedTurnHistory,
        currentParticipantIndex: nextIndex,
      };

      // Only update turn expiration if there's a next participant
      if (nextIndex < chainData.participants.length) {
        updateData.currentTurnExpiresAt = turnExpiresAt;
      }

      // Update chain document
      await updateDoc(doc(firestore, 'flareChains', chainId), updateData);

      // Complete chain if this was the last participant
      if (nextIndex >= chainData.participants.length) {
        await this.completeChain(chainId);
      }

      console.log(`Photo submitted successfully by ${userId}, turn duration: ${turnDuration} minutes`);
      return newPhoto;
    } catch (error) {
      console.error('Error responding to chain:', error);
      throw error;
    }
  },

  // Get active chains for a user
  async getActiveChains(userId: string): Promise<FlareChain[]> {
    try {
      if (!userId) {
        console.error('Error getting active chains: userId is required');
        return [];
      }

      const q = query(
        collection(firestore, 'flareChains'),
        where('participantIds', 'array-contains', userId),
        where('status', '==', ChainStatus.ACTIVE),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const chains: FlareChain[] = [];
      
      querySnapshot.forEach((doc) => {
        const rawData = doc.data();
        const convertedData = convertChainTimestamps(rawData);
        chains.push({ id: doc.id, ...convertedData } as FlareChain);
      });
      
      console.log(`Found ${chains.length} active chains for user ${userId}`);
      return chains;
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.error('Permission denied accessing flareChains collection. Please check Firestore security rules.', error);
      } else if (error?.code === 'unauthenticated') {
        console.error('User not authenticated when accessing flareChains collection.', error);
      } else {
        console.error('Error getting active chains:', error);
      }
      return [];
    }
  },

  // Get a specific chain by ID
  async getChainById(chainId: string): Promise<FlareChain | null> {
    try {
      console.log('🔍 Fetching chain by ID:', chainId);
      const chainDoc = await getDoc(doc(firestore, 'flareChains', chainId));
      
      if (!chainDoc.exists()) {
        console.log('❌ Chain document not found:', chainId);
        return null;
      }
      
      const rawData = chainDoc.data();
      console.log('📄 Raw chain data retrieved:', { 
        id: chainDoc.id, 
        hasTimestamps: !!rawData?.currentTurnExpiresAt 
      });
      
      // Convert Firestore Timestamps to Date objects
      const convertedData = convertChainTimestamps(rawData);
      
      const result = { 
        id: chainDoc.id, 
        ...convertedData 
      } as FlareChain;
      
      console.log('✅ Chain data with converted timestamps:', {
        id: result.id,
        currentTurnExpiresAt: result.currentTurnExpiresAt,
        expiresAt: result.expiresAt,
        participantsCount: result.participants?.length || 0,
        photosCount: result.photos?.length || 0
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error getting chain:', error);
      return null;
    }
  },

  // Get chain history for a user
  async getChainHistory(userId: string, limitCount = 20): Promise<FlareChain[]> {
    try {
      if (!userId) {
        console.error('Error getting chain history: userId is required');
        return [];
      }

      const q = query(
        collection(firestore, 'flareChains'),
        where('participantIds', 'array-contains', userId),
        where('status', 'in', [ChainStatus.COMPLETED, ChainStatus.EXPIRED]),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const chains: FlareChain[] = [];
      
      querySnapshot.forEach((doc) => {
        const rawData = doc.data();
        const convertedData = convertChainTimestamps(rawData);
        chains.push({ id: doc.id, ...convertedData } as FlareChain);
      });
      
      console.log(`Found ${chains.length} chain history items for user ${userId}`);
      return chains;
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.error('Permission denied accessing flareChains collection for history. Please check Firestore security rules.', error);
      } else if (error?.code === 'unauthenticated') {
        console.error('User not authenticated when accessing flareChains history.', error);
      } else {
        console.error('Error getting chain history:', error);
      }
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
        status: ParticipantStatus.WAITING_TURN,
        position: chain.participants.length + index,
        invitedAt: new Date(),
      }));
      
      await updateDoc(doc(firestore, 'flareChains', chainId), {
        participants: arrayUnion(...newParticipants),
        participantIds: arrayUnion(...userIds),
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
        participantIds: arrayRemove(userId),
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

  // Get chains that a user needs to respond to (sequential version)
  async getChainsAwaitingResponse(userId: string): Promise<FlareChain[]> {
    try {
      const activeChains = await this.getActiveChains(userId);
      
      return activeChains.filter(chain => {
        const userParticipant = chain.participants.find(p => p.userId === userId);
        
        // Only return chains where it's currently the user's turn
        return userParticipant && 
               userParticipant.status === ParticipantStatus.CURRENT_TURN &&
               new Date() < chain.currentTurnExpiresAt; // Not expired
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

  // Get chains for feed display (user's current turns only)
  async getUserCurrentTurnChains(userId: string): Promise<FlareChain[]> {
    try {
      if (!userId) {
        console.error('Error getting user current turn chains: userId is required');
        return [];
      }

      const q = query(
        collection(firestore, 'flareChains'),
        where('participantIds', 'array-contains', userId),
        where('status', '==', ChainStatus.ACTIVE),
        orderBy('currentTurnExpiresAt', 'asc') // Most urgent first
      );
      
      const querySnapshot = await getDocs(q);
      const chains: FlareChain[] = [];
      
      querySnapshot.forEach((doc) => {
        const rawData = doc.data();
        const convertedData = convertChainTimestamps(rawData);
        const chain = { id: doc.id, ...convertedData } as FlareChain;
        
        // Only include chains where it's currently this user's turn
        if (this.isUserCurrentTurn(chain, userId)) {
          chains.push(chain);
        }
      });
      
      console.log(`Found ${chains.length} current turn chains for user ${userId}`);
      return chains;
    } catch (error: any) {
      console.error('Error getting user current turn chains:', error);
      return [];
    }
  },

  // Check if it's currently the user's turn in a chain
  isUserCurrentTurn(chain: FlareChain, userId: string): boolean {
    const currentParticipant = chain.participants[chain.currentParticipantIndex];
    return currentParticipant?.userId === userId && 
           currentParticipant?.status === ParticipantStatus.CURRENT_TURN &&
           new Date() < chain.currentTurnExpiresAt; // Not expired
  },

  // Subscribe to user's current turn chains for real-time feed updates
  subscribeToUserCurrentTurnChains(userId: string, callback: (chains: FlareChain[]) => void): () => void {
    if (!userId) {
      console.error('Error subscribing to user current turn chains: userId is required');
      return () => {};
    }

    const q = query(
      collection(firestore, 'flareChains'),
      where('participantIds', 'array-contains', userId),
      where('status', '==', ChainStatus.ACTIVE),
      orderBy('currentTurnExpiresAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const chains: FlareChain[] = [];
        
        console.log(`🔍 Raw query returned ${querySnapshot.size} chains for user ${userId}`);
        
        querySnapshot.forEach((doc) => {
          const rawData = doc.data();
          const convertedData = convertChainTimestamps(rawData);
          const chain = { id: doc.id, ...convertedData } as FlareChain;
          
          const currentParticipant = chain.participants[chain.currentParticipantIndex];
          const isUserTurn = this.isUserCurrentTurn(chain, userId);
          
          console.log(`📋 Chain ${chain.id}: currentIndex=${chain.currentParticipantIndex}, participant=${currentParticipant?.userId}, status=${currentParticipant?.status}, isUserTurn=${isUserTurn}`);
          
          // Only include chains where it's currently this user's turn
          if (isUserTurn) {
            chains.push(chain);
          }
        });
        
        console.log(`✅ Filtered to ${chains.length} current turn chains for user ${userId}`);
        callback(chains);
      },
      (error) => {
        console.error('Error listening to user current turn chains:', error);
        
        // Handle specific Firebase errors
        if (error?.code === 'failed-precondition') {
          console.warn('Index is still building. Chains will appear in feed once ready.');
          // Return empty array while index builds
          callback([]);
        } else if (error?.code === 'permission-denied') {
          console.error('Permission denied for flareChains collection. Check Firestore rules.');
          callback([]);
        } else {
          console.error('Unexpected error in chain subscription:', error);
          callback([]);
        }
      }
    );
    
    return unsubscribe;
  },

  // Skip current user's turn
  async skipTurn(chainId: string, userId: string): Promise<void> {
    try {
      const chainDoc = await getDoc(doc(firestore, 'flareChains', chainId));
      if (!chainDoc.exists()) {
        throw new Error('Chain not found');
      }

      const chainData = chainDoc.data() as FlareChain;
      const now = new Date();

      // Verify it's the user's turn
      const currentParticipant = chainData.participants.find(p => 
        p.status === ParticipantStatus.CURRENT_TURN
      );
      
      if (!currentParticipant || currentParticipant.userId !== userId) {
        throw new Error('It is not your turn to skip');
      }

      // Update participant status to skipped
      const updatedParticipants = chainData.participants.map(p => 
        p.userId === userId 
          ? { ...p, status: ParticipantStatus.SKIPPED, respondedAt: now }
          : p
      );

      // Update turn history
      const updatedTurnHistory = chainData.turnHistory.map(turn => 
        turn.userId === userId && !turn.completedAt
          ? { 
              ...turn, 
              completedAt: now,
              photoSubmitted: false,
              turnDurationMinutes: Math.round((now.getTime() - turn.startedAt.getTime()) / (1000 * 60)),
              skipped: true
            }
          : turn
      );

      // Update chain document
      await updateDoc(doc(firestore, 'flareChains', chainId), {
        participants: updatedParticipants,
        turnHistory: updatedTurnHistory,
        currentParticipantIndex: increment(1),
      });

      // Start next person's turn
      await this.startNextTurn(chainId);

      console.log(`Turn skipped by user ${userId}`);
    } catch (error) {
      console.error('Error skipping turn:', error);
      throw error;
    }
  },

  // One-time fix for existing chains stuck in wrong state
  async fixExistingChainStates(): Promise<void> {
    try {
      console.log('🔧 Fixing existing chain states...');
      
      const q = query(
        collection(firestore, 'flareChains'),
        where('status', '==', ChainStatus.ACTIVE)
      );
      
      const querySnapshot = await getDocs(q);
      const fixes: Promise<any>[] = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const chain = docSnapshot.data() as FlareChain;
        const currentIndex = chain.currentParticipantIndex;
        
        // Check if current participant has wrong status
        if (currentIndex < chain.participants.length) {
          const currentParticipant = chain.participants[currentIndex];
          
          if (currentParticipant.status === ParticipantStatus.WAITING_TURN) {
            console.log(`🔧 Fixing chain ${chain.id}: setting participant ${currentParticipant.userId} to CURRENT_TURN`);
            
            // Fix participant status
            const fixedParticipants = chain.participants.map((p, index) => {
              if (index === currentIndex) {
                return { ...p, status: ParticipantStatus.CURRENT_TURN };
              }
              return p;
            });
            
            // Update the document
            const fix = updateDoc(doc(firestore, 'flareChains', chain.id), {
              participants: fixedParticipants
            });
            
            fixes.push(fix);
          }
        }
      });
      
      await Promise.all(fixes);
      console.log(`✅ Fixed ${fixes.length} chains`);
      
    } catch (error) {
      console.error('❌ Error fixing chain states:', error);
    }
  },
};