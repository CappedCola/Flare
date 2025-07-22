import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { ChainPhotoReaction } from '../types';

export class ReactionService {
  // Available reaction emojis
  static readonly REACTION_EMOJIS = ['❤️', '😂', '😮', '👏', '🔥', '😍', '🤩', '😊'];

  // Add a reaction to a photo
  async addReaction(
    photoId: string,
    userId: string,
    username: string,
    emoji: string
  ): Promise<void> {
    try {
      // Check if user already reacted with this emoji
      const existingReaction = await this.getUserReaction(photoId, userId, emoji);
      if (existingReaction) {
        throw new Error('You already reacted with this emoji');
      }

      // Create new reaction
      const reaction: Omit<ChainPhotoReaction, 'id'> = {
        userId,
        username,
        emoji,
        createdAt: new Date(),
      };

      await addDoc(collection(firestore, 'photoReactions'), {
        ...reaction,
        photoId,
        createdAt: serverTimestamp(),
      });

      // Update photo document with reaction count
      await this.updatePhotoReactionCount(photoId, emoji, 'add');

    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Remove a reaction from a photo
  async removeReaction(
    photoId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    try {
      const reaction = await this.getUserReaction(photoId, userId, emoji);
      if (!reaction) {
        throw new Error('Reaction not found');
      }

      await deleteDoc(doc(firestore, 'photoReactions', reaction.id));

      // Update photo document with reaction count
      await this.updatePhotoReactionCount(photoId, emoji, 'remove');

    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  // Toggle reaction (add if not exists, remove if exists)
  async toggleReaction(
    photoId: string,
    userId: string,
    username: string,
    emoji: string
  ): Promise<'added' | 'removed'> {
    try {
      const existingReaction = await this.getUserReaction(photoId, userId, emoji);
      
      if (existingReaction) {
        await this.removeReaction(photoId, userId, emoji);
        return 'removed';
      } else {
        await this.addReaction(photoId, userId, username, emoji);
        return 'added';
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      throw error;
    }
  }

  // Get user's specific reaction for a photo
  private async getUserReaction(
    photoId: string,
    userId: string,
    emoji: string
  ): Promise<ChainPhotoReaction | null> {
    try {
      const q = query(
        collection(firestore, 'photoReactions'),
        where('photoId', '==', photoId),
        where('userId', '==', userId),
        where('emoji', '==', emoji)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot && snapshot.docs && !snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          username: data.username,
          emoji: data.emoji,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user reaction:', error);
      return null;
    }
  }

  // Subscribe to reactions for a photo
  subscribeToPhotoReactions(
    photoId: string,
    callback: (reactions: ChainPhotoReaction[]) => void
  ): () => void {
    const q = query(
      collection(firestore, 'photoReactions'),
      where('photoId', '==', photoId)
    );

    return onSnapshot(q, (snapshot) => {
      const reactions: ChainPhotoReaction[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        reactions.push({
          id: doc.id,
          userId: data.userId,
          username: data.username,
          emoji: data.emoji,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      callback(reactions);
    });
  }

  // Get reaction summary for a photo
  async getPhotoReactionSummary(photoId: string): Promise<{
    [emoji: string]: {
      count: number;
      users: { userId: string; username: string }[];
    };
  }> {
    try {
      const q = query(
        collection(firestore, 'photoReactions'),
        where('photoId', '==', photoId)
      );

      const snapshot = await getDocs(q);
      const summary: {
        [emoji: string]: {
          count: number;
          users: { userId: string; username: string }[];
        };
      } = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const emoji = data.emoji;

        if (!summary[emoji]) {
          summary[emoji] = { count: 0, users: [] };
        }

        summary[emoji].count++;
        summary[emoji].users.push({
          userId: data.userId,
          username: data.username,
        });
      });

      return summary;
    } catch (error) {
      console.error('Error getting reaction summary:', error);
      return {};
    }
  }

  // Update photo document with reaction count (for quick access)
  private async updatePhotoReactionCount(
    photoId: string,
    emoji: string,
    action: 'add' | 'remove'
  ): Promise<void> {
    try {
      const photoRef = doc(firestore, 'chainPhotos', photoId);
      
      if (action === 'add') {
        await updateDoc(photoRef, {
          [`reactionCounts.${emoji}`]: arrayUnion(1),
        });
      } else {
        await updateDoc(photoRef, {
          [`reactionCounts.${emoji}`]: arrayRemove(1),
        });
      }
    } catch (error) {
      // This is optional optimization, don't throw if it fails
      console.warn('Could not update photo reaction count:', error);
    }
  }

  // Get user's reactions for a photo
  async getUserReactionsForPhoto(
    photoId: string,
    userId: string
  ): Promise<string[]> {
    try {
      const q = query(
        collection(db, 'photoReactions'),
        where('photoId', '==', photoId),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const emojis: string[] = [];

      snapshot.forEach((doc) => {
        emojis.push(doc.data().emoji);
      });

      return emojis;
    } catch (error) {
      console.error('Error getting user reactions:', error);
      return [];
    }
  }

  // Get most reacted photos in a chain
  async getTopReactedPhotos(chainId: string, limit: number = 5): Promise<{
    photoId: string;
    totalReactions: number;
    topEmoji: string;
  }[]> {
    try {
      // This would require a more complex query or aggregation
      // For now, return empty array - can be implemented with Cloud Functions
      return [];
    } catch (error) {
      console.error('Error getting top reacted photos:', error);
      return [];
    }
  }

  // Clean up reactions for a deleted photo
  async deletePhotoReactions(photoId: string): Promise<void> {
    try {
      const q = query(
        collection(firestore, 'photoReactions'),
        where('photoId', '==', photoId)
      );

      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting photo reactions:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const reactionService = new ReactionService();