import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationPreferencesService from '../services/notificationPreferencesService';
import NotificationService from '../services/notificationService';
import { NotificationPreferences } from '../types';

interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: string | null;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  enableAllNotifications: () => Promise<void>;
  disableAllNotifications: () => Promise<void>;
  updatePushToken: () => Promise<void>;
  isNotificationEnabled: (type: keyof NotificationPreferences) => boolean;
  refresh: () => Promise<void>;
}

export const useNotificationPreferences = (): UseNotificationPreferencesReturn => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const preferencesService = NotificationPreferencesService.getInstance();
  const notificationService = NotificationService.getInstance();

  /**
   * Load user notification preferences
   */
  const loadPreferences = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setPreferences(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userPreferences = await preferencesService.getOrCreatePreferences(user.id);
      setPreferences(userPreferences);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preferences';
      setError(errorMessage);
      console.error('Failed to load notification preferences:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, preferencesService]);

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const updatedPreferences = await preferencesService.updatePreferences(user.id, updates);
      setPreferences(updatedPreferences);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      console.error('Failed to update notification preferences:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, preferencesService]);

  /**
   * Enable all notification types
   */
  const enableAllNotifications = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const updatedPreferences = await preferencesService.enableAllNotifications(user.id);
      setPreferences(updatedPreferences);

      // Also make sure we have push token registered
      await updatePushToken();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable notifications';
      setError(errorMessage);
      console.error('Failed to enable all notifications:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, preferencesService]);

  /**
   * Disable all notification types
   */
  const disableAllNotifications = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const updatedPreferences = await preferencesService.disableAllNotifications(user.id);
      setPreferences(updatedPreferences);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disable notifications';
      setError(errorMessage);
      console.error('Failed to disable all notifications:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, preferencesService]);

  /**
   * Update push token in user preferences
   */
  const updatePushToken = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      return;
    }

    try {
      // Get fresh push token
      const pushToken = await notificationService.registerForPushNotifications();
      
      if (pushToken) {
        await preferencesService.updatePushToken(user.id, pushToken);
        
        // Update local state
        if (preferences) {
          setPreferences({
            ...preferences,
            pushToken,
            updatedAt: new Date(),
          });
        }
      }
    } catch (err) {
      console.error('Failed to update push token:', err);
      // Don't throw here as this is often called automatically
    }
  }, [user?.id, notificationService, preferencesService, preferences]);

  /**
   * Check if a specific notification type is enabled
   */
  const isNotificationEnabled = useCallback((
    type: keyof NotificationPreferences
  ): boolean => {
    if (!preferences || !preferences.allNotificationsEnabled) {
      return false;
    }

    // Handle boolean preference types
    if (typeof preferences[type] === 'boolean') {
      return preferences[type] as boolean;
    }

    return false;
  }, [preferences]);

  /**
   * Refresh preferences from server
   */
  const refresh = useCallback(async (): Promise<void> => {
    await loadPreferences();
  }, [loadPreferences]);

  /**
   * Set up real-time subscription to preferences
   */
  useEffect(() => {
    if (!user?.id) {
      setPreferences(null);
      return;
    }

    // Initial load
    loadPreferences();

    // Set up real-time subscription
    const unsubscribe = preferencesService.subscribeToPreferences(
      user.id,
      (updatedPreferences) => {
        setPreferences(updatedPreferences);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.id, preferencesService, loadPreferences]);

  /**
   * Update push token when app becomes active or user changes
   */
  useEffect(() => {
    if (user?.id && preferences?.allNotificationsEnabled) {
      updatePushToken();
    }
  }, [user?.id, preferences?.allNotificationsEnabled, updatePushToken]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    enableAllNotifications,
    disableAllNotifications,
    updatePushToken,
    isNotificationEnabled,
    refresh,
  };
};