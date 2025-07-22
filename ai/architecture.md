# Flare App - Notifications System Technical Architecture

## Document Version: 1.0
## Date: 2025-07-22
## Feature: Notifications System Implementation

---

## Executive Summary

This document provides the technical architecture for implementing a comprehensive notifications system in the Flare app. The system will integrate with Expo's notification services and Firebase to provide real-time push notifications, starting with chain invitations and expandable to future notification types.

### Key Technical Decisions
- **Push Notifications**: Expo Notifications API for cross-platform compatibility
- **Data Storage**: Firestore subcollection for user notification preferences
- **Integration Pattern**: Extends existing NotificationContext and service architecture
- **Permission Management**: Runtime permission requests with graceful degradation

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Flare App Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                    UI Layer                                 │
│  ┌─────────────────┐    ┌──────────────────────────────────┐│
│  │ ProfileScreen   │───▶│ NotificationSettingsScreen       ││
│  │ (Settings Tab)  │    │ - Master toggle                  ││
│  └─────────────────┘    │ - Chain invitations toggle      ││
│                         │ - Future notification types     ││
│                         └──────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                   Context & State Layer                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Enhanced NotificationContext                             ││
│  │ - Permission state                                      ││
│  │ - Push notification handling                            ││
│  │ - Foreground/background event management               ││
│  │ - Integration with existing in-app notifications       ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                            │
│  ┌──────────────────┐  ┌─────────────────┐ ┌──────────────┐│
│  │ NotificationService│  │PreferencesService│ │FlareChainService││
│  │ - Push registration│  │ - Preference CRUD│ │ - Chain events ││
│  │ - Token management │  │ - Real-time sync │ │ - Invite logic ││
│  │ - Event handling  │  │ - Firebase ops   │ │ - Notifications││
│  └──────────────────┘  └─────────────────┘ └──────────────┘│
├─────────────────────────────────────────────────────────────┤
│                   Firebase Integration                      │
│  ┌─────────────────┐    ┌──────────────────────────────────┐│
│  │ Firestore       │    │ Expo Push Notification Service   ││
│  │ users/{id}/     │    │ - Cross-platform delivery        ││
│  │  preferences/   │────│ - Token management               ││
│  │   notifications │    │ - Receipt tracking               ││
│  └─────────────────┘    └──────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Screen Components

#### NotificationSettingsScreen (`app/screens/NotificationSettingsScreen.tsx`)

```typescript
interface NotificationSettingsProps {
  navigation: StackNavigationProp<RootStackParamList, 'NotificationSettings'>;
}

export const NotificationSettingsScreen: React.FC<NotificationSettingsProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { 
    preferences, 
    loading, 
    updatePreference, 
    requestPermissions,
    permissionStatus 
  } = useNotificationPreferences(user?.id);
  
  const {
    hasPermissions,
    permissionLoading,
    openSystemSettings
  } = useNotificationPermissions();

  // Component implementation with UI Kitten components
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Master Toggle Section */}
        <Card style={styles.section}>
          <Text category="h6">Push Notifications</Text>
          <Text category="c1" appearance="hint">
            Receive notifications about your Flare activity
          </Text>
          
          <Toggle
            checked={preferences?.notificationsEnabled || false}
            onChange={handleMasterToggle}
            disabled={loading}
            style={styles.toggle}
          />
        </Card>

        {/* Chain Notifications Section */}
        <Card style={[styles.section, !preferences?.notificationsEnabled && styles.disabled]}>
          <Text category="s1">Flare Chains</Text>
          
          <View style={styles.toggleRow}>
            <View style={styles.toggleContent}>
              <Text category="p2">New Chain Invitations</Text>
              <Text category="c2" appearance="hint">
                Get notified when friends invite you to chains
              </Text>
            </View>
            <Toggle
              checked={preferences?.chainInvitations || false}
              onChange={(checked) => updatePreference('chainInvitations', checked)}
              disabled={!preferences?.notificationsEnabled || loading}
            />
          </View>
        </Card>

        {/* Permission Status Section */}
        {!hasPermissions && preferences?.notificationsEnabled && (
          <Card style={styles.warningSection}>
            <Text category="s1" status="warning">Permissions Required</Text>
            <Text category="c1">
              Notifications are enabled but system permissions are required.
            </Text>
            <Button
              size="small"
              appearance="outline"
              onPress={openSystemSettings}
              style={styles.permissionButton}
            >
              Open Settings
            </Button>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6EC',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  toggle: {
    marginTop: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  warningSection: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    backgroundColor: '#FFF8E1',
    borderColor: '#FFAA00',
    borderWidth: 1,
  },
  permissionButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
});
```

### 2. Service Layer Architecture

#### NotificationService (`app/services/notificationService.ts`)

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Notification configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationServiceType {
  registerForPushNotifications(): Promise<string | null>;
  getPermissionStatus(): Promise<PermissionStatus>;
  requestPermissions(): Promise<boolean>;
  schedulePushNotification(notification: NotificationRequest): Promise<string>;
  addNotificationListener(handler: (notification: Notification) => void): Subscription;
  addNotificationResponseListener(handler: (response: NotificationResponse) => void): Subscription;
  openSystemSettings(): Promise<void>;
}

class NotificationServiceImpl implements NotificationServiceType {
  private static instance: NotificationServiceImpl;
  
  public static getInstance(): NotificationServiceImpl {
    if (!NotificationServiceImpl.instance) {
      NotificationServiceImpl.instance = new NotificationServiceImpl();
    }
    return NotificationServiceImpl.instance;
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check device compatibility
      if (!Device.isDevice) {
        console.warn('Push notifications require a physical device');
        return null;
      }

      // Get existing permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      let finalStatus = existingStatus;
      
      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Permission not granted for push notifications');
        return null;
      }

      // Get push token
      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      console.log('Push token:', pushToken.data);

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('flare-default', {
          name: 'Flare Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF4D4D',
        });

        await Notifications.setNotificationChannelAsync('flare-chains', {
          name: 'Chain Invitations',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF4D4D',
        });
      }

      return pushToken.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async schedulePushNotification(notification: NotificationRequest): Promise<string> {
    return Notifications.scheduleNotificationAsync(notification);
  }

  addNotificationListener(handler: (notification: Notification) => void): Subscription {
    return Notifications.addNotificationReceivedListener(handler);
  }

  addNotificationResponseListener(handler: (response: NotificationResponse) => void): Subscription {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  async openSystemSettings(): Promise<void> {
    await Notifications.openSettingsAsync();
  }
}

export const notificationService = NotificationServiceImpl.getInstance();

// Notification payload interfaces
export interface ChainInvitationNotification {
  type: 'chain_invitation';
  chainId: string;
  inviterId: string;
  inviterUsername: string;
  promptPreview: string;
}

export type NotificationPayload = ChainInvitationNotification;

// Helper function to create chain invitation notification
export const createChainInvitationNotification = (
  inviterUsername: string,
  promptPreview: string,
  chainId: string,
  inviterId: string
): NotificationRequest => ({
  content: {
    title: 'New Chain Invitation 🔥',
    body: `@${inviterUsername} invited you to: ${promptPreview}`,
    data: {
      type: 'chain_invitation',
      chainId,
      inviterId,
      inviterUsername,
      promptPreview,
    } as ChainInvitationNotification,
    sound: 'default',
    priority: 'high',
  },
  trigger: null, // Send immediately
  identifier: `chain_invitation_${chainId}_${Date.now()}`,
});
```

#### NotificationPreferencesService (`app/services/notificationPreferencesService.ts`)

```typescript
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  Unsubscribe 
} from '@react-native-firebase/firestore';
import { firestore } from '../config/firebase';
import { withFirebaseRetry, handleFirebaseError } from './firebaseService';

export interface UserNotificationPreferences {
  userId: string;
  notificationsEnabled: boolean;
  pushToken?: string;
  chainInvitations: boolean;
  // Future notification types
  friendRequests?: boolean;
  likes?: boolean;
  comments?: boolean;
  dailyReminders?: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

export interface NotificationPreferencesServiceType {
  getUserPreferences(userId: string): Promise<UserNotificationPreferences | null>;
  updatePreferences(userId: string, updates: Partial<UserNotificationPreferences>): Promise<void>;
  subscribeToPreferences(userId: string, callback: (prefs: UserNotificationPreferences | null) => void): Unsubscribe;
  initializePreferences(userId: string, pushToken?: string): Promise<UserNotificationPreferences>;
  updatePushToken(userId: string, pushToken: string): Promise<void>;
}

class NotificationPreferencesServiceImpl implements NotificationPreferencesServiceType {
  private static instance: NotificationPreferencesServiceImpl;
  
  public static getInstance(): NotificationPreferencesServiceImpl {
    if (!NotificationPreferencesServiceImpl.instance) {
      NotificationPreferencesServiceImpl.instance = new NotificationPreferencesServiceImpl();
    }
    return NotificationPreferencesServiceImpl.instance;
  }

  async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    return withFirebaseRetry(async () => {
      const docRef = doc(firestore, 'users', userId, 'preferences', 'notifications');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        } as UserNotificationPreferences;
      }
      
      return null;
    }, 'getUserPreferences');
  }

  async updatePreferences(userId: string, updates: Partial<UserNotificationPreferences>): Promise<void> {
    return withFirebaseRetry(async () => {
      const docRef = doc(firestore, 'users', userId, 'preferences', 'notifications');
      
      const updateData = {
        ...updates,
        lastUpdated: serverTimestamp(),
      };
      
      delete updateData.userId;
      delete updateData.createdAt;
      
      await updateDoc(docRef, updateData);
    }, 'updatePreferences');
  }

  subscribeToPreferences(
    userId: string, 
    callback: (prefs: UserNotificationPreferences | null) => void
  ): Unsubscribe {
    const docRef = doc(firestore, 'users', userId, 'preferences', 'notifications');
    
    return onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          callback({
            ...data,
            userId,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
          } as UserNotificationPreferences);
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

  async initializePreferences(userId: string, pushToken?: string): Promise<UserNotificationPreferences> {
    return withFirebaseRetry(async () => {
      const preferences: Omit<UserNotificationPreferences, 'userId'> = {
        notificationsEnabled: false, // Default to false, user must opt-in
        pushToken,
        chainInvitations: true, // Default enabled if notifications are enabled
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      };
      
      const docRef = doc(firestore, 'users', userId, 'preferences', 'notifications');
      await setDoc(docRef, preferences);
      
      return {
        ...preferences,
        userId,
        createdAt: new Date(),
        lastUpdated: new Date(),
      } as UserNotificationPreferences;
    }, 'initializePreferences');
  }

  async updatePushToken(userId: string, pushToken: string): Promise<void> {
    return withFirebaseRetry(async () => {
      const docRef = doc(firestore, 'users', userId, 'preferences', 'notifications');
      await updateDoc(docRef, {
        pushToken,
        lastUpdated: serverTimestamp(),
      });
    }, 'updatePushToken');
  }
}

export const notificationPreferencesService = NotificationPreferencesServiceImpl.getInstance();
```

### 3. Custom Hooks

#### useNotificationPermissions (`app/hooks/useNotificationPermissions.ts`)

```typescript
import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';

export interface UseNotificationPermissionsReturn {
  hasPermissions: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  loading: boolean;
  error: string | null;
  requestPermissions: () => Promise<boolean>;
  openSystemSettings: () => Promise<void>;
  checkPermissions: () => Promise<void>;
}

export const useNotificationPermissions = (): UseNotificationPermissionsReturn => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const status = await notificationService.getPermissionStatus();
      setPermissionStatus(status);
      setHasPermissions(status === 'granted');
    } catch (err) {
      console.error('Error checking permissions:', err);
      setError('Failed to check notification permissions');
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const granted = await notificationService.requestPermissions();
      setHasPermissions(granted);
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      return granted;
    } catch (err) {
      console.error('Error requesting permissions:', err);
      setError('Failed to request notification permissions');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openSystemSettings = async () => {
    try {
      await notificationService.openSystemSettings();
    } catch (err) {
      console.error('Error opening system settings:', err);
      setError('Failed to open system settings');
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  return {
    hasPermissions,
    permissionStatus,
    loading,
    error,
    requestPermissions,
    openSystemSettings,
    checkPermissions,
  };
};
```

#### useNotificationPreferences (`app/hooks/useNotificationPreferences.ts`)

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Unsubscribe } from '@react-native-firebase/firestore';
import { notificationPreferencesService, UserNotificationPreferences } from '../services/notificationPreferencesService';
import { notificationService } from '../services/notificationService';

export interface UseNotificationPreferencesReturn {
  preferences: UserNotificationPreferences | null;
  loading: boolean;
  error: string | null;
  updatePreference: <K extends keyof UserNotificationPreferences>(
    key: K, 
    value: UserNotificationPreferences[K]
  ) => Promise<void>;
  initializePreferences: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

export const useNotificationPreferences = (userId?: string): UseNotificationPreferencesReturn => {
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences on mount and when userId changes
  useEffect(() => {
    if (!userId) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    let unsubscribe: Unsubscribe;
    
    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);

        // Subscribe to real-time preferences
        unsubscribe = notificationPreferencesService.subscribeToPreferences(
          userId,
          (prefs) => {
            setPreferences(prefs);
            setLoading(false);
          }
        );

        // Also do an initial load
        const initialPrefs = await notificationPreferencesService.getUserPreferences(userId);
        if (initialPrefs) {
          setPreferences(initialPrefs);
        }
      } catch (err) {
        console.error('Error loading notification preferences:', err);
        setError('Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId]);

  const updatePreference = useCallback(async <K extends keyof UserNotificationPreferences>(
    key: K,
    value: UserNotificationPreferences[K]
  ) => {
    if (!userId) {
      throw new Error('User ID required to update preferences');
    }

    try {
      setError(null);
      
      // Special handling for master toggle
      if (key === 'notificationsEnabled') {
        if (value === true) {
          // When enabling notifications, request permissions and get push token
          const hasPermissions = await notificationService.requestPermissions();
          if (hasPermissions) {
            const pushToken = await notificationService.registerForPushNotifications();
            await notificationPreferencesService.updatePreferences(userId, {
              [key]: value,
              pushToken,
            });
          } else {
            // Still update the preference but note no permissions
            await notificationPreferencesService.updatePreferences(userId, {
              [key]: value,
            });
          }
        } else {
          // When disabling notifications
          await notificationPreferencesService.updatePreferences(userId, {
            [key]: value,
          });
        }
      } else {
        // Regular preference update
        await notificationPreferencesService.updatePreferences(userId, {
          [key]: value,
        });
      }
    } catch (err) {
      console.error('Error updating notification preference:', err);
      setError('Failed to update notification preferences');
      throw err;
    }
  }, [userId]);

  const initializePreferences = useCallback(async () => {
    if (!userId) {
      throw new Error('User ID required to initialize preferences');
    }

    try {
      setError(null);
      setLoading(true);
      
      const pushToken = await notificationService.registerForPushNotifications();
      const prefs = await notificationPreferencesService.initializePreferences(userId, pushToken || undefined);
      setPreferences(prefs);
    } catch (err) {
      console.error('Error initializing preferences:', err);
      setError('Failed to initialize notification preferences');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);
      const prefs = await notificationPreferencesService.getUserPreferences(userId);
      setPreferences(prefs);
    } catch (err) {
      console.error('Error refreshing preferences:', err);
      setError('Failed to refresh preferences');
    }
  }, [userId]);

  return {
    preferences,
    loading,
    error,
    updatePreference,
    initializePreferences,
    refreshPreferences,
  };
};
```

---

## Database Schema Design

### Firestore Structure

```typescript
// Extended Firestore Collections
users/{userId}/preferences/notifications
{
  notificationsEnabled: boolean,
  pushToken?: string,
  chainInvitations: boolean,
  friendRequests?: boolean,
  likes?: boolean,
  comments?: boolean,
  dailyReminders?: boolean,
  createdAt: Timestamp,
  lastUpdated: Timestamp
}

// Notification analytics (optional)
notificationEvents/{eventId}
{
  userId: string,
  type: 'permission_requested' | 'permission_granted' | 'permission_denied' | 
        'notification_sent' | 'notification_received' | 'notification_tapped',
  notificationType?: 'chain_invitation' | 'friend_request' | 'like' | 'comment',
  metadata?: any,
  timestamp: Timestamp
}
```

### Security Rules

```javascript
// Addition to existing firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules...
    
    // Notification preferences - user can only access their own
    match /users/{userId}/preferences/notifications {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Notification events for analytics (optional)
    match /notificationEvents/{eventId} {
      allow create: if request.auth != null && 
                   request.auth.uid == request.resource.data.userId;
      allow read: if request.auth != null && 
                 request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## Context Integration

### Enhanced NotificationContext (`app/context/NotificationContext.tsx`)

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Subscription } from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { PersonalPost } from '../types';
import { subscribeToPersonalPosts } from '../services/firebaseService';
import { notificationService, NotificationPayload } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  // Existing in-app notification functionality
  currentNotification: PersonalPost | null;
  showNotification: (post: PersonalPost) => void;
  hideNotification: () => void;
  markAsViewed: (postId: string) => void;
  markAsDismissed: (postId: string) => void;
  
  // New push notification functionality
  lastPushNotification: any;
  pushNotificationData: NotificationPayload | null;
  handlePushNotificationResponse: (response: any) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  
  // Existing state
  const [currentNotification, setCurrentNotification] = useState<PersonalPost | null>(null);
  const [processedPostIds, setProcessedPostIds] = useState<Set<string>>(new Set());
  
  // New push notification state
  const [lastPushNotification, setLastPushNotification] = useState<any>(null);
  const [pushNotificationData, setPushNotificationData] = useState<NotificationPayload | null>(null);

  // Existing personal posts subscription (unchanged)
  useEffect(() => {
    if (!user?.id) return;
    
    const enablePersonalPosts = false;
    if (!enablePersonalPosts) {
      if (__DEV__) console.log('Personal posts subscription disabled');
      return;
    }
    
    const unsubscribe = subscribeToPersonalPosts(
      user.id,
      (personalPosts) => {
        const newPosts = personalPosts.filter(post => 
          post.status === 'sent' && !processedPostIds.has(post.id)
        );
        
        if (newPosts.length > 0) {
          const latestPost = newPosts[0];
          setCurrentNotification(latestPost);
          setProcessedPostIds(prev => new Set([...prev, latestPost.id]));
        }
      },
      (error) => {
        if (error.message && !error.message.includes('permission')) {
          console.error('Error subscribing to personal posts:', error);
        }
      }
    );
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id, processedPostIds]);

  // New push notification listeners
  useEffect(() => {
    let notificationListener: Subscription;
    let responseListener: Subscription;

    const setupPushNotificationListeners = async () => {
      // Listen for notifications received while app is foregrounded
      notificationListener = notificationService.addNotificationListener((notification) => {
        console.log('Foreground notification:', notification);
        setLastPushNotification(notification);
        
        if (notification.request.content.data) {
          setPushNotificationData(notification.request.content.data as NotificationPayload);
        }
      });

      // Listen for user interactions with notifications
      responseListener = notificationService.addNotificationResponseListener((response) => {
        console.log('Notification response:', response);
        handlePushNotificationResponse(response);
      });
    };

    setupPushNotificationListeners();

    return () => {
      if (notificationListener) {
        notificationListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, []);

  const handlePushNotificationResponse = (response: any) => {
    const data = response.notification.request.content.data as NotificationPayload;
    
    if (data?.type === 'chain_invitation') {
      // Navigate to the specific chain
      navigation.navigate('FlareChainView', { chainId: data.chainId });
      
      // Clear the notification data
      setPushNotificationData(null);
    }
    
    // Add analytics tracking here
    console.log('Push notification tapped:', data);
  };

  // Existing methods (unchanged)
  const showNotification = (post: PersonalPost) => {
    setCurrentNotification(post);
  };
  
  const hideNotification = () => {
    setCurrentNotification(null);
  };
  
  const markAsViewed = (postId: string) => {
    if (currentNotification?.id === postId) {
      setCurrentNotification(null);
    }
  };
  
  const markAsDismissed = (postId: string) => {
    if (currentNotification?.id === postId) {
      setCurrentNotification(null);
    }
  };

  const value: NotificationContextType = {
    // Existing
    currentNotification,
    showNotification,
    hideNotification,
    markAsViewed,
    markAsDismissed,
    
    // New
    lastPushNotification,
    pushNotificationData,
    handlePushNotificationResponse,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
```

---

## Integration with Existing Systems

### 1. Navigation Integration

Add the new screen to the existing navigation stack:

```typescript
// app/navigation/RootNavigator.tsx - MainStack screens
<MainStack.Screen 
  name="NotificationSettings" 
  component={NotificationSettingsScreen}
  options={{ 
    headerShown: true,
    title: 'Notifications',
    headerStyle: {
      backgroundColor: '#FDF6EC'
    },
    headerTintColor: '#FF4D4D'
  }} 
/>
```

Update navigation types:

```typescript
// app/types/index.ts - RootStackParamList
type RootStackParamList = {
  // Existing screens...
  NotificationSettings: undefined;
};
```

### 2. ProfileScreen Integration

Make the Notifications menu item clickable:

```typescript
// app/screens/ProfileScreen.tsx - handleMenuPress function
const handleMenuPress = (item: string) => {
  console.log(`Pressed ${item}`);
  
  switch (item) {
    case 'Notifications':
      navigation.navigate('NotificationSettings');
      break;
    // Other cases...
  }
};
```

### 3. FlareChainService Integration

Extend the chain creation service to send notifications:

```typescript
// app/services/flareChainService.ts - Enhanced createChain function
export const createChain = async (
  prompt: ChainPrompt,
  participantUserIds: string[],
  maxParticipants: number,
  creatorId: string,
  firstPhotoUri?: string
): Promise<FlareChain> => {
  const chain = await withFirebaseRetry(async () => {
    // Existing chain creation logic...
    
    // After successful chain creation, send notifications to participants
    if (participantUserIds.length > 0) {
      await sendChainInvitationNotifications(chainId, creatorId, participantUserIds, prompt);
    }
    
    return { id: chainId, ...chainData };
  }, 'createChain');
  
  return chain;
};

// New function to send chain invitation notifications
const sendChainInvitationNotifications = async (
  chainId: string,
  creatorId: string,
  participantUserIds: string[],
  prompt: ChainPrompt
): Promise<void> => {
  try {
    // Get creator info
    const creatorDoc = await getDoc(doc(firestore, 'users', creatorId));
    if (!creatorDoc.exists()) return;
    
    const creatorData = creatorDoc.data();
    const creatorUsername = creatorData.username || 'Someone';
    
    // Send notifications to each participant
    const notificationPromises = participantUserIds.map(async (userId) => {
      try {
        // Get participant's notification preferences
        const preferences = await notificationPreferencesService.getUserPreferences(userId);
        
        // Only send if notifications are enabled and user has chain invitations enabled
        if (preferences?.notificationsEnabled && preferences?.chainInvitations && preferences?.pushToken) {
          // Create notification content
          const notification = createChainInvitationNotification(
            creatorUsername,
            prompt.text.substring(0, 50) + (prompt.text.length > 50 ? '...' : ''),
            chainId,
            creatorId
          );
          
          // Note: In Phase 2, this would send via Firebase Cloud Functions
          // For now, we'll schedule local notifications
          await notificationService.schedulePushNotification(notification);
          
          console.log(`Sent chain invitation notification to user ${userId}`);
        }
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
        // Don't throw - continue sending to other users
      }
    });
    
    await Promise.allSettled(notificationPromises);
  } catch (error) {
    console.error('Error sending chain invitation notifications:', error);
    // Don't throw - chain creation should still succeed
  }
};
```

---

## Platform-Specific Configuration

### iOS Configuration (`ios/Flare/Info.plist`)

```xml
<key>NSUserNotificationsUsageDescription</key>
<string>Flare sends notifications to keep you updated on chain invitations and other important activity from your friends.</string>
```

### Android Configuration

The Expo managed workflow handles most Android configuration automatically, but we can customize notification channels:

```typescript
// app/config/notifications.ts
export const NOTIFICATION_CHANNELS = {
  DEFAULT: 'flare-default',
  CHAINS: 'flare-chains',
  SOCIAL: 'flare-social',
};

export const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DEFAULT, {
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF4D4D',
    });

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.CHAINS, {
      name: 'Chain Invitations',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF4D4D',
    });
  }
};
```

---

## Dependencies & Installation

### Package Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "expo-notifications": "~0.28.14",
    "expo-device": "~6.0.2", 
    "expo-constants": "~16.0.2"
  }
}
```

### Installation Commands

```bash
# Install new dependencies
npx expo install expo-notifications expo-device expo-constants

# Update app.json for notifications
# Add to app.json:
{
  "expo": {
    "notifications": {
      "icon": "./assets/notification-icon.png",
      "color": "#FF4D4D",
      "sounds": [
        "./assets/notification-sound.wav"
      ]
    }
  }
}
```

---

## Performance Considerations

### 1. Efficient Data Subscriptions

```typescript
// Use cleanup patterns to prevent memory leaks
useEffect(() => {
  if (!userId) return;
  
  const unsubscribe = notificationPreferencesService.subscribeToPreferences(
    userId,
    setPreferences
  );
  
  return unsubscribe; // Cleanup subscription
}, [userId]);
```

### 2. Background Task Optimization

```typescript
// Handle notifications efficiently when app is backgrounded
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const shouldShow = await shouldDisplayNotification(notification);
    
    return {
      shouldShowAlert: shouldShow,
      shouldPlaySound: shouldShow,
      shouldSetBadge: true,
    };
  },
});
```

### 3. Token Management

```typescript
// Efficiently manage push tokens with caching
class TokenManager {
  private static cachedToken: string | null = null;
  private static tokenExpiry: number = 0;
  
  static async getValidToken(): Promise<string | null> {
    const now = Date.now();
    
    if (this.cachedToken && now < this.tokenExpiry) {
      return this.cachedToken;
    }
    
    const token = await notificationService.registerForPushNotifications();
    if (token) {
      this.cachedToken = token;
      this.tokenExpiry = now + (24 * 60 * 60 * 1000); // 24 hours
    }
    
    return token;
  }
}
```

---

## Error Handling & Resilience

### 1. Permission Handling

```typescript
// Graceful handling of permission states
const handlePermissionDenied = async () => {
  // Show informative message to user
  Alert.alert(
    'Notifications Disabled',
    'To receive chain invitations, please enable notifications in your device settings.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => notificationService.openSystemSettings() }
    ]
  );
};
```

### 2. Network Resilience

```typescript
// Retry logic for notification operations
const withNotificationRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  throw new Error('Max retries exceeded');
};
```

---

## Testing Strategy

### 1. Unit Testing

```typescript
// __tests__/services/notificationService.test.ts
describe('NotificationService', () => {
  test('should register for push notifications', async () => {
    const token = await notificationService.registerForPushNotifications();
    expect(token).toBeTruthy();
  });

  test('should handle permission denial gracefully', async () => {
    // Mock permission denial
    const result = await notificationService.requestPermissions();
    // Test graceful handling
  });
});

// __tests__/hooks/useNotificationPreferences.test.ts
describe('useNotificationPreferences', () => {
  test('should load user preferences', async () => {
    const { result } = renderHook(() => useNotificationPreferences('test-user-id'));
    // Test preference loading
  });
});
```

### 2. Integration Testing

```typescript
// Test notification flow end-to-end
describe('Chain Invitation Notification Flow', () => {
  test('should send notification when chain is created', async () => {
    // Create chain with participants
    // Verify notification was sent
    // Verify notification content
  });
});
```

### 3. Manual Testing Checklist

- [ ] Notification permissions request on first enable
- [ ] Toggle states persist across app restarts
- [ ] Notifications appear when app is backgrounded
- [ ] Tapping notification opens correct chain
- [ ] Master toggle disables all sub-toggles
- [ ] Settings link works when permissions denied

---

## Analytics & Monitoring

### 1. Event Tracking

```typescript
// Analytics events for notification system
export const trackNotificationEvent = (
  eventType: string,
  properties?: Record<string, any>
) => {
  // Integration with existing analytics service
  analyticsService.track(`notification_${eventType}`, {
    timestamp: new Date().toISOString(),
    ...properties,
  });
};

// Usage in components
trackNotificationEvent('permission_requested');
trackNotificationEvent('preference_changed', { 
  type: 'chainInvitations', 
  enabled: true 
});
```

### 2. Performance Monitoring

```typescript
// Monitor notification delivery success
const monitorNotificationDelivery = async (notificationId: string) => {
  try {
    const receipt = await Notifications.getPushReceiptAsync([notificationId]);
    if (receipt[notificationId]?.status === 'error') {
      console.error('Notification delivery failed:', receipt[notificationId]);
    }
  } catch (error) {
    console.error('Error checking notification receipt:', error);
  }
};
```

---

## Security Considerations

### 1. Data Protection

- Push tokens stored securely in Firestore with user-based access control
- Notification preferences only accessible by the owning user
- Sensitive data not included in notification payloads

### 2. Firebase Security Rules

```javascript
// Secure notification preferences access
match /users/{userId}/preferences/notifications {
  allow read, write: if request.auth != null && 
                      request.auth.uid == userId;
  
  // Prevent unauthorized token updates
  allow update: if request.auth != null && 
                request.auth.uid == userId &&
                request.resource.data.keys().hasAll(['lastUpdated']);
}
```

---

## Future Enhancements & Extensibility

### 1. Server-Side Notifications (Phase 3)

```typescript
// Firebase Cloud Function structure for server-side notifications
export const sendNotificationFunction = functions.firestore
  .document('flareChains/{chainId}')
  .onCreate(async (snapshot, context) => {
    const chainData = snapshot.data();
    
    // Send notifications to all participants
    await sendBatchNotifications(chainData.participantIds, {
      title: 'New Chain Invitation',
      body: `You've been invited to: ${chainData.prompt.text}`,
      data: {
        type: 'chain_invitation',
        chainId: context.params.chainId,
      }
    });
  });
```

### 2. Rich Notifications

```typescript
// Support for rich notifications with images
const createRichNotification = (
  title: string,
  body: string,
  imageUrl?: string
): NotificationRequest => ({
  content: {
    title,
    body,
    data: { /* payload */ },
    attachments: imageUrl ? [{
      identifier: 'image',
      url: imageUrl,
      type: 'image'
    }] : undefined,
  },
  trigger: null,
});
```

### 3. Notification Scheduling

```typescript
// Support for scheduled notifications (daily reminders, etc.)
const scheduleWeeklyReminder = async (userId: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekly Flare Summary 🔥',
      body: 'See what your friends have been up to this week!',
    },
    trigger: {
      weekday: 1, // Monday
      hour: 10,
      minute: 0,
      repeats: true,
    },
  });
};
```

---

## Conclusion

This technical architecture provides a comprehensive, scalable foundation for the Flare app's notification system. The design:

- **Integrates seamlessly** with existing Flare architecture patterns
- **Supports extensibility** for future notification types
- **Follows security best practices** with proper access control
- **Provides excellent UX** with graceful permission handling
- **Maintains performance** with efficient data subscriptions
- **Includes comprehensive testing** strategies

The implementation can be completed in phases, starting with the basic UI and preferences storage, then adding push notification functionality, and finally extending with advanced features.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Analyze PRD and current architecture for notification integration", "status": "completed", "priority": "high"}, {"id": "2", "content": "Design notification system components and services", "status": "completed", "priority": "high"}, {"id": "3", "content": "Define Firestore schema for notification preferences", "status": "completed", "priority": "high"}, {"id": "4", "content": "Design push notification integration with expo-notifications", "status": "completed", "priority": "medium"}, {"id": "5", "content": "Create security rules and API specifications", "status": "completed", "priority": "medium"}, {"id": "6", "content": "Save technical architecture document to ai/architecture.md", "status": "completed", "priority": "medium"}]