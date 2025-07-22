import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, StatusBar, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, BellOff, Smartphone, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotificationPermissions } from '../hooks/useNotificationPermissions';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { NotificationPreferences } from '../types';

interface SettingRowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  theme: any;
}

const SettingRow = ({ title, subtitle, value, onValueChange, disabled = false, theme }: SettingRowProps) => (
  <View style={[
    styles.settingRow,
    { borderBottomColor: theme['border-basic-color-2'] }
  ]}>
    <View style={styles.settingContent}>
      <Text category='s1' style={[
        styles.settingTitle,
        { 
          color: disabled ? theme['text-hint-color'] : theme['text-primary-color']
        }
      ]}>
        {title}
      </Text>
      {subtitle && (
        <Text category='c2' style={[
          styles.settingSubtitle,
          { color: theme['text-secondary-color'] }
        ]}>
          {subtitle}
        </Text>
      )}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{
        false: theme['color-basic-400'],
        true: theme['color-primary-500']
      }}
      thumbColor={value ? theme['color-primary-600'] : theme['color-basic-600']}
    />
  </View>
);

interface PermissionRowProps {
  title: string;
  subtitle: string;
  icon: any;
  onPress: () => void;
  theme: any;
  status?: 'granted' | 'denied' | 'undetermined';
}

const PermissionRow = ({ title, subtitle, icon: Icon, onPress, theme, status }: PermissionRowProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'granted':
        return theme['color-success-500'];
      case 'denied':
        return theme['color-danger-500'];
      default:
        return theme['color-warning-500'];
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'granted':
        return 'Enabled';
      case 'denied':
        return 'Disabled';
      default:
        return 'Not Set';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.permissionRow,
        { borderBottomColor: theme['border-basic-color-2'] }
      ]}
      onPress={onPress}
    >
      <Icon size={24} color={theme['color-basic-600']} />
      <View style={styles.permissionContent}>
        <Text category='s1' style={[
          styles.permissionTitle,
          { color: theme['text-primary-color'] }
        ]}>
          {title}
        </Text>
        <Text category='c2' style={[
          styles.permissionSubtitle,
          { color: theme['text-secondary-color'] }
        ]}>
          {subtitle}
        </Text>
        {status && (
          <Text category='c2' style={[
            styles.permissionStatus,
            { color: getStatusColor() }
          ]}>
            {getStatusText()}
          </Text>
        )}
      </View>
      <ChevronRight size={20} color={theme['color-basic-500']} />
    </TouchableOpacity>
  );
};

export const NotificationSettingsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
    requestPermissions,
    checkPermissions
  } = useNotificationPermissions();
  
  const {
    preferences,
    loading: preferencesLoading,
    error: preferencesError,
    updatePreferences,
    enableAllNotifications,
    disableAllNotifications
  } = useNotificationPreferences();

  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);

  // Sync local state with preferences
  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleToggleAllNotifications = async (enabled: boolean) => {
    try {
      if (enabled) {
        // Check permissions first
        if (permissions?.status !== 'granted') {
          const granted = await requestPermissions();
          if (!granted) {
            Alert.alert(
              'Permissions Required',
              'Push notification permissions are required to enable notifications. Please grant permissions and try again.',
              [{ text: 'OK', style: 'default' }]
            );
            return;
          }
        }
        
        await enableAllNotifications();
      } else {
        await disableAllNotifications();
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
      Alert.alert(
        'Error',
        'Failed to update notification settings. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleToggleSpecificNotification = async (
    key: keyof NotificationPreferences,
    enabled: boolean
  ) => {
    if (!localPreferences) return;

    try {
      // If trying to enable but all notifications are disabled, enable all first
      if (enabled && !localPreferences.allNotificationsEnabled) {
        const shouldEnableAll = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Enable All Notifications?',
            'To enable this notification type, all notifications must be enabled first.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Enable All', style: 'default', onPress: () => resolve(true) },
            ]
          );
        });

        if (!shouldEnableAll) return;

        // Check permissions
        if (permissions?.status !== 'granted') {
          const granted = await requestPermissions();
          if (!granted) {
            Alert.alert(
              'Permissions Required',
              'Push notification permissions are required. Please grant permissions first.',
              [{ text: 'OK', style: 'default' }]
            );
            return;
          }
        }

        await enableAllNotifications();
        return;
      }

      await updatePreferences({ [key]: enabled });
    } catch (error) {
      console.error(`Failed to toggle ${key}:`, error);
      Alert.alert(
        'Error',
        'Failed to update notification setting. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handlePermissionPress = async () => {
    try {
      const granted = await requestPermissions();
      if (granted) {
        // Refresh permissions after granting
        await checkPermissions();
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
    }
  };

  const loading = permissionsLoading || preferencesLoading;
  const error = permissionsError || preferencesError;

  // Loading state
  if (loading && !localPreferences) {
    return (
      <SafeAreaView style={[
        styles.container,
        styles.centered,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        <ActivityIndicator size="large" color={theme['color-primary-500']} />
        <Text category='s1' style={[
          styles.loadingText,
          { color: theme['text-secondary-color'] }
        ]}>
          Loading notification settings...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme['background-basic-color-1']} />
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        {/* Header */}
        <View style={[
          styles.header,
          { borderBottomColor: theme['border-basic-color-2'] }
        ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <ArrowLeft size={24} color={theme['text-primary-color']} />
          </TouchableOpacity>
          <Text category='h6' style={[
            styles.headerTitle,
            { color: theme['text-primary-color'] }
          ]}>
            Notification Settings
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Permission Status */}
          <View style={styles.section}>
            <Text category='s2' style={[
              styles.sectionHeader,
              { color: theme['text-secondary-color'] }
            ]}>
              Push Notification Permission
            </Text>
            <PermissionRow
              title="Device Permissions"
              subtitle="Allow Flare to send push notifications to this device"
              icon={Smartphone}
              onPress={handlePermissionPress}
              theme={theme}
              status={permissions?.status}
            />
          </View>

          {/* All Notifications Toggle */}
          <View style={styles.section}>
            <Text category='s2' style={[
              styles.sectionHeader,
              { color: theme['text-secondary-color'] }
            ]}>
              Notification Settings
            </Text>
            <SettingRow
              title="All Notifications"
              subtitle="Master toggle for all notification types"
              value={localPreferences?.allNotificationsEnabled || false}
              onValueChange={handleToggleAllNotifications}
              disabled={permissions?.status !== 'granted'}
              theme={theme}
            />
          </View>

          {/* Specific Notification Types */}
          {localPreferences && (
            <View style={styles.section}>
              <Text category='s2' style={[
                styles.sectionHeader,
                { color: theme['text-secondary-color'] }
              ]}>
                Notification Types
              </Text>
              
              <SettingRow
                title="Chain Invitations"
                subtitle="Get notified when someone invites you to a chain"
                value={localPreferences.chainInvitations}
                onValueChange={(value) => handleToggleSpecificNotification('chainInvitations', value)}
                disabled={!localPreferences.allNotificationsEnabled}
                theme={theme}
              />
              
              <SettingRow
                title="Your Turn"
                subtitle="Get notified when it's your turn in a chain"
                value={localPreferences.chainTurns}
                onValueChange={(value) => handleToggleSpecificNotification('chainTurns', value)}
                disabled={!localPreferences.allNotificationsEnabled}
                theme={theme}
              />
              
              <SettingRow
                title="Chain Completed"
                subtitle="Get notified when a chain you're in is completed"
                value={localPreferences.chainCompleted}
                onValueChange={(value) => handleToggleSpecificNotification('chainCompleted', value)}
                disabled={!localPreferences.allNotificationsEnabled}
                theme={theme}
              />
              
              <SettingRow
                title="Likes"
                subtitle="Get notified when someone likes your photos"
                value={localPreferences.likes}
                onValueChange={(value) => handleToggleSpecificNotification('likes', value)}
                disabled={!localPreferences.allNotificationsEnabled}
                theme={theme}
              />
              
              <SettingRow
                title="Comments"
                subtitle="Get notified when someone comments on your photos"
                value={localPreferences.comments}
                onValueChange={(value) => handleToggleSpecificNotification('comments', value)}
                disabled={!localPreferences.allNotificationsEnabled}
                theme={theme}
              />
              
              <SettingRow
                title="Friend Requests"
                subtitle="Get notified when you receive friend requests"
                value={localPreferences.friendRequests}
                onValueChange={(value) => handleToggleSpecificNotification('friendRequests', value)}
                disabled={!localPreferences.allNotificationsEnabled}
                theme={theme}
              />
            </View>
          )}

          {/* Error State */}
          {error && (
            <View style={styles.section}>
              <View style={[
                styles.errorContainer,
                { backgroundColor: theme['color-danger-100'] }
              ]}>
                <Text category='c2' style={[
                  styles.errorText,
                  { color: theme['color-danger-500'] }
                ]}>
                  {error}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: 18,
  },
  headerSpacer: {
    width: 40, // Same width as back button for centering
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  permissionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  permissionStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});