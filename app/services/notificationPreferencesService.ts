import { firestore } from '../config/firebase';
import { NotificationPreferences } from '../types';

class NotificationPreferencesService {
  private static instance: NotificationPreferencesService;
  private readonly collection = 'users';
  private readonly preferencesSubcollection = 'preferences';
  private readonly preferencesDoc = 'notifications';

  private constructor() {}

  static getInstance(): NotificationPreferencesService {
    if (!NotificationPreferencesService.instance) {
      NotificationPreferencesService.instance = new NotificationPreferencesService();
    }
    return NotificationPreferencesService.instance;
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const docRef = firestore
        .collection(this.collection)
        .doc(userId)
        .collection(this.preferencesSubcollection)
        .doc(this.preferencesDoc);

      const doc = await docRef.get();

      if (doc.exists) {
        const data = doc.data();
        return {
          id: doc.id,
          userId,
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date(),
          updatedAt: data?.updatedAt?.toDate() || new Date(),
        } as NotificationPreferences;
      }

      return null;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      throw error;
    }
  }

  /**
   * Create default notification preferences for a user
   */
  async createDefaultPreferences(userId: string, pushToken?: string): Promise<NotificationPreferences> {
    try {
      const now = new Date();
      const defaultPreferences: Omit<NotificationPreferences, 'id'> = {
        userId,
        allNotificationsEnabled: true,
        chainInvitations: true,
        chainTurns: true,
        chainCompleted: true,
        likes: true,
        comments: true,
        friendRequests: true,
        pushToken,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = firestore
        .collection(this.collection)
        .doc(userId)
        .collection(this.preferencesSubcollection)
        .doc(this.preferencesDoc);

      await docRef.set({
        ...defaultPreferences,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      return {
        id: this.preferencesDoc,
        ...defaultPreferences,
      };
    } catch (error) {
      console.error('Failed to create notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string, 
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const docRef = firestore
        .collection(this.collection)
        .doc(userId)
        .collection(this.preferencesSubcollection)
        .doc(this.preferencesDoc);

      // Remove fields that shouldn't be updated directly
      const { id, userId: _, createdAt, ...updateData } = updates;

      await docRef.update({
        ...updateData,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Return updated preferences
      const updatedDoc = await docRef.get();
      const data = updatedDoc.data();
      
      return {
        id: updatedDoc.id,
        userId,
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
      } as NotificationPreferences;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get or create notification preferences for a user
   */
  async getOrCreatePreferences(userId: string, pushToken?: string): Promise<NotificationPreferences> {
    try {
      let preferences = await this.getUserPreferences(userId);
      
      if (!preferences) {
        preferences = await this.createDefaultPreferences(userId, pushToken);
      }

      return preferences;
    } catch (error) {
      console.error('Failed to get or create notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update push token for a user
   */
  async updatePushToken(userId: string, pushToken: string): Promise<void> {
    try {
      await this.updatePreferences(userId, { pushToken });
    } catch (error) {
      console.error('Failed to update push token:', error);
      throw error;
    }
  }

  /**
   * Remove push token for a user (e.g., on logout)
   */
  async removePushToken(userId: string): Promise<void> {
    try {
      await this.updatePreferences(userId, { pushToken: undefined });
    } catch (error) {
      console.error('Failed to remove push token:', error);
      throw error;
    }
  }

  /**
   * Enable all notifications for a user
   */
  async enableAllNotifications(userId: string): Promise<NotificationPreferences> {
    try {
      return await this.updatePreferences(userId, {
        allNotificationsEnabled: true,
        chainInvitations: true,
        chainTurns: true,
        chainCompleted: true,
        likes: true,
        comments: true,
        friendRequests: true,
      });
    } catch (error) {
      console.error('Failed to enable all notifications:', error);
      throw error;
    }
  }

  /**
   * Disable all notifications for a user
   */
  async disableAllNotifications(userId: string): Promise<NotificationPreferences> {
    try {
      return await this.updatePreferences(userId, {
        allNotificationsEnabled: false,
        chainInvitations: false,
        chainTurns: false,
        chainCompleted: false,
        likes: false,
        comments: false,
        friendRequests: false,
      });
    } catch (error) {
      console.error('Failed to disable all notifications:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time changes in notification preferences
   */
  subscribeToPreferences(
    userId: string,
    callback: (preferences: NotificationPreferences | null) => void
  ): () => void {
    const docRef = firestore
      .collection(this.collection)
      .doc(userId)
      .collection(this.preferencesSubcollection)
      .doc(this.preferencesDoc);

    return docRef.onSnapshot(
      (doc) => {
        if (doc.exists) {
          const data = doc.data();
          const preferences: NotificationPreferences = {
            id: doc.id,
            userId,
            ...data,
            createdAt: data?.createdAt?.toDate() || new Date(),
            updatedAt: data?.updatedAt?.toDate() || new Date(),
          } as NotificationPreferences;
          callback(preferences);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error subscribing to notification preferences:', error);
        callback(null);
      }
    );
  }

  /**
   * Check if a specific notification type is enabled for a user
   */
  async isNotificationTypeEnabled(
    userId: string,
    notificationType: keyof Omit<NotificationPreferences, 'id' | 'userId' | 'pushToken' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences || !preferences.allNotificationsEnabled) {
        return false;
      }

      return preferences[notificationType] === true;
    } catch (error) {
      console.error('Failed to check notification type:', error);
      return false;
    }
  }

  /**
   * Get all users with push notifications enabled for a specific type
   * (Useful for batch notifications)
   */
  async getUsersWithNotificationEnabled(
    userIds: string[],
    notificationType: keyof Omit<NotificationPreferences, 'id' | 'userId' | 'pushToken' | 'createdAt' | 'updatedAt'>
  ): Promise<{ userId: string; pushToken: string }[]> {
    try {
      const results: { userId: string; pushToken: string }[] = [];

      // Process users in batches to avoid Firestore query limits
      const batchSize = 10;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (userId) => {
            try {
              const preferences = await this.getUserPreferences(userId);
              
              if (
                preferences &&
                preferences.allNotificationsEnabled &&
                preferences[notificationType] === true &&
                preferences.pushToken
              ) {
                results.push({
                  userId,
                  pushToken: preferences.pushToken,
                });
              }
            } catch (error) {
              console.error(`Failed to check preferences for user ${userId}:`, error);
            }
          })
        );
      }

      return results;
    } catch (error) {
      console.error('Failed to get users with notification enabled:', error);
      return [];
    }
  }
}

export default NotificationPreferencesService;