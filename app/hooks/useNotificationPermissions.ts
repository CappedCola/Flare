import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import NotificationService from '../services/notificationService';
import { PushNotificationPermission } from '../types';

interface UseNotificationPermissionsReturn {
  permissions: PushNotificationPermission | null;
  loading: boolean;
  error: string | null;
  requestPermissions: () => Promise<boolean>;
  checkPermissions: () => Promise<void>;
  openSettings: () => void;
}

export const useNotificationPermissions = (): UseNotificationPermissionsReturn => {
  const [permissions, setPermissions] = useState<PushNotificationPermission | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const notificationService = NotificationService.getInstance();

  /**
   * Check current notification permissions
   */
  const checkPermissions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const currentPermissions = await notificationService.getPermissions();
      setPermissions(currentPermissions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check permissions';
      setError(errorMessage);
      console.error('Failed to check notification permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [notificationService]);

  /**
   * Request notification permissions from the user
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // First check if we can ask again
      const currentPermissions = await notificationService.getPermissions();
      
      if (currentPermissions.status === 'denied' && !currentPermissions.canAskAgain) {
        // Show alert directing user to settings
        Alert.alert(
          'Notifications Disabled',
          'Notifications are disabled for this app. To enable them, go to your device settings and allow notifications for Flare.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
        return false;
      }

      if (currentPermissions.status === 'granted') {
        setPermissions(currentPermissions);
        return true;
      }

      // Request permissions
      const newPermissions = await notificationService.requestPermissions();
      setPermissions(newPermissions);

      if (newPermissions.status === 'granted') {
        // Also register for push notifications to get token
        await notificationService.registerForPushNotifications();
        return true;
      } else if (newPermissions.status === 'denied') {
        if (!newPermissions.canAskAgain) {
          Alert.alert(
            'Notifications Disabled',
            'You have denied notification permissions. To enable notifications, please go to your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: openSettings },
            ]
          );
        } else {
          Alert.alert(
            'Notifications Disabled',
            'Notifications are required to receive chain invitations and updates. You can enable them in Settings.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permissions';
      setError(errorMessage);
      console.error('Failed to request notification permissions:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [notificationService]);

  /**
   * Open device settings (platform-specific)
   */
  const openSettings = useCallback((): void => {
    // On mobile platforms, this would open the app settings
    // For now, we'll show a helpful alert
    Alert.alert(
      'Open Settings',
      'Please go to your device Settings > Apps > Flare > Notifications and enable notifications.',
      [{ text: 'OK', style: 'default' }]
    );
  }, []);

  /**
   * Initialize permissions check on mount
   */
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    permissions,
    loading,
    error,
    requestPermissions,
    checkPermissions,
    openSettings,
  };
};