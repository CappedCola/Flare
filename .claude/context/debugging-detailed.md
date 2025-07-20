# Flare - Comprehensive Debugging Guide

This document provides a complete debugging and troubleshooting reference for the Flare social photo chain app, covering all major systems, common issues, and debugging strategies.

## Table of Contents

1. [Debugging Infrastructure](#debugging-infrastructure)
2. [Firebase Issues & Solutions](#firebase-issues--solutions)
3. [Camera & Permission Problems](#camera--permission-problems)
4. [Platform-Specific Issues](#platform-specific-issues)
5. [TypeScript Errors](#typescript-errors)
6. [Performance Issues](#performance-issues)
7. [Memory Management](#memory-management)
8. [Testing & Validation](#testing--validation)
9. [Development Tools](#development-tools)
10. [Common Error Patterns](#common-error-patterns)

---

## Debugging Infrastructure

### Console Logging System

The Flare app uses extensive console logging (297 statements across 17 TypeScript files) for debugging:

```typescript
// Development-only logging pattern
if (__DEV__) {
  console.log('🔍 [DEBUG] Starting operation:', { userId, operation });
  console.error('❌ [ERROR] Operation failed:', error);
  console.warn('⚠️ [WARNING] Potential issue detected:', warning);
}
```

### Logging Categories

- **🔍 [DEBUG]** - General debugging information
- **❌ [ERROR]** - Error conditions and failures  
- **⚠️ [WARNING]** - Potential issues and fallbacks
- **✅ [SUCCESS]** - Successful operations
- **🔄 [RETRY]** - Retry attempts and recovery
- **🧪 [TEST]** - Testing and validation output

### Debug Configuration

#### Feature Flags (`app/config/featureFlags.ts`)
```typescript
export const FEATURE_FLAGS = {
  USE_VISION_CAMERA: process.env.EXPO_PUBLIC_USE_VISION_CAMERA === 'true'
};

export const logCameraEnvironment = () => {
  console.log('📱 Camera Environment:', {
    platform: Platform.OS,
    useVisionCamera: FEATURE_FLAGS.USE_VISION_CAMERA,
    isDevClient: Constants.appOwnership === 'expo'
  });
};
```

---

## Firebase Issues & Solutions

### SSL/TLS Connection Problems

**Primary Issue:** SSL certificate validation failures

#### Detection System (`app/config/firebase.ts`)
```typescript
// Check for SSL/TLS specific errors
if (error.message && (
  error.message.includes('Failed to create chain') ||
  error.message.includes('SSL') ||
  error.message.includes('TLS') ||
  error.message.includes('certificate') ||
  error.message.includes('handshake')
)) {
  console.error('🚨 SSL/TLS ERROR DETECTED:');
  console.error('This is likely a certificate validation issue.');
  console.error('Check device time, network, and VPN settings.');
}
```

#### Solutions
1. **Check device time/date settings**
2. **Disable VPN connections**
3. **Clear app data and restart**
4. **Verify network connectivity**
5. **Check Firebase project configuration**

### Permission Denied Errors

#### Debugging Security Rules
```typescript
// Enhanced debugging for permission errors
if (error.code === 'firestore/permission-denied') {
  if (__DEV__) {
    console.error('PERMISSION DENIED during operation!');
    console.error('Current user ID:', userId);
    console.error('Auth user ID:', auth.currentUser?.uid);
    console.error('Check Firebase security rules for collection:', collection);
  }
  throw new Error('Permission denied. Security rules may not be deployed correctly.');
}
```

#### Common Causes & Solutions
1. **Security rules not deployed** - Deploy latest rules
2. **User not authenticated** - Check auth state
3. **Incorrect user permissions** - Verify user document structure
4. **Collection access restrictions** - Review Firestore rules

### Connection Testing Service

#### Firebase Connection Validator (`app/services/chainCreationTest.ts`)
```typescript
export const chainCreationTests = {
  async testFirebaseConnection(): Promise<boolean> {
    try {
      console.log('🧪 TEST 0: Testing basic Firebase connection...');
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ TEST 0 FAILED: No authenticated user');
        return false;
      }
      
      const testQuery = firestore.collection('users').limit(1);
      await testQuery.get();
      
      console.log('✅ TEST 0 SUCCESS: Firebase connection working');
      return true;
    } catch (error: any) {
      if (error.message && error.message.includes('Failed to create chain')) {
        console.error('🚨 FOUND THE SSL/TLS ISSUE: This is the "Failed to create chain" error!');
        console.error('This is likely an SSL certificate validation problem.');
      }
      return false;
    }
  },

  async testBasicFirestoreWrite(): Promise<boolean> {
    try {
      console.log('🧪 TEST 1: Testing basic Firestore write...');
      const testDoc = {
        testField: 'test_value',
        timestamp: new Date(),
        userId: auth.currentUser?.uid
      };
      
      await firestore.collection('test_collection').add(testDoc);
      console.log('✅ TEST 1 SUCCESS: Firestore write working');
      return true;
    } catch (error) {
      console.error('❌ TEST 1 FAILED: Firestore write error:', error);
      return false;
    }
  }
};
```

---

## Camera & Permission Problems

### Vision Camera vs Expo Camera Fallback

#### Dynamic Camera Selection (`app/screens/CameraScreen.tsx`)
```typescript
export const CameraScreen = ({ navigation }: { navigation: any }) => {
  const [shouldFallback, setShouldFallback] = React.useState(false);
  
  // Listen for Vision Camera failures and trigger fallback
  React.useEffect(() => {
    const handleVisionCameraFailure = () => {
      console.log('🔴 Vision Camera failed, switching to Expo Camera fallback');
      setShouldFallback(true);
    };
    
    (global as any).fallbackToExpoCamera = handleVisionCameraFailure;
    
    return () => {
      (global as any).fallbackToExpoCamera = null;
    };
  }, []);

  if (FEATURE_FLAGS.USE_VISION_CAMERA && !shouldFallback) {
    try {
      const { VisionCameraScreen } = require('./VisionCameraScreen');
      return React.createElement(VisionCameraScreen, { navigation });
    } catch (error) {
      console.warn('Vision Camera module failed to load, falling back to Expo Camera:', error);
      const { ExpoCameraScreen } = require('./ExpoCameraScreen');
      return React.createElement(ExpoCameraScreen, { navigation });
    }
  }
  
  console.log('🔵 Using Expo Camera fallback');
  const { ExpoCameraScreen } = require('./ExpoCameraScreen');
  return React.createElement(ExpoCameraScreen, { navigation });
};
```

### Permission Issues

#### iOS Permission Handling (`app/screens/VisionCameraScreen.tsx`)
```typescript
const safeCameraPermissionCheck = async () => {
  try {
    const result = await check(PERMISSIONS.IOS.CAMERA);
    
    switch (result) {
      case RESULTS.GRANTED:
        return 'granted';
      case RESULTS.DENIED:
        return 'not-determined';
      case RESULTS.BLOCKED:
        return 'denied';
      case RESULTS.LIMITED:
        return 'denied';
      case RESULTS.UNAVAILABLE:
        return 'denied';
      default:
        return 'denied';
    }
  } catch (error) {
    console.error('🔴 Error in react-native-permissions check:', error);
    setVisionCameraFailed(true);
    return 'denied';
  }
};
```

#### Permission Polling System
```typescript
const startPermissionPolling = () => {
  console.log('🔄 Starting permission polling (60 second timeout)...');
  
  const pollInterval = setInterval(async () => {
    try {
      const status = await safeCameraPermissionCheck();
      if (status === 'granted') {
        console.log('✅ Permission granted during polling!');
        setPermissionStatus('granted');
        clearInterval(pollInterval);
      }
    } catch (error) {
      console.error('🔴 Error in permission polling:', error);
    }
  }, 2000);

  setTimeout(() => {
    clearInterval(pollInterval);
    console.log('⏰ Permission polling timed out after 60 seconds');
  }, 60000);
};
```

### Camera Device Issues

#### Device Detection Problems
```typescript
// Multiple try-catch blocks for device detection
try {
  ultraWideDevice = useCameraDevice('back', {
    physicalDevices: ['ultra-wide-angle-camera']
  });
} catch (error) {
  console.error('🔴 Failed to get ultra-wide device:', error);
  setVisionCameraFailed(true);
}

try {
  standardDevice = useCameraDevice('back', {
    physicalDevices: ['wide-angle-camera']
  });
} catch (error) {
  console.error('🔴 Failed to get standard device:', error);
}
```

---

## Platform-Specific Issues

### iOS vs Android Differences

#### Keyboard Handling
```typescript
// Platform-specific keyboard event listeners
const keyboardWillShow = Keyboard.addListener(
  Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
  () => setIsKeyboardVisible(true)
);

// Platform-specific KeyboardAvoidingView behavior
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 45 : 0}
>
```

#### Permission Configuration
```typescript
// iOS-specific permission setup
const PERMISSIONS = {
  IOS: {
    CAMERA: 'ios.permission.CAMERA'
  },
  ANDROID: {
    CAMERA: 'android.permission.CAMERA' // Not implemented
  }
};
```

### Android-Specific Issues

**Problem:** The codebase shows heavy iOS bias with limited Android support:
- No Android camera permission handling
- iOS-only permission constants used
- Missing Android-specific configurations

**Solutions:**
1. Add Android permission handling in `VisionCameraScreen.tsx`
2. Implement `PERMISSIONS.ANDROID.CAMERA` checks
3. Add Android-specific camera configurations
4. Test camera functionality on Android devices

---

## TypeScript Errors

### Common Type Safety Issues

#### Firebase Service Type Problems
```typescript
// ❌ Problem: Using 'any' types
const postData: any = {
  userId,
  username: userData?.username || 'Unknown',
  // ...
};

// ✅ Solution: Proper typing
interface PostData {
  userId: string;
  username: string;
  photoUrl: string;
  caption: string;
  streakDay: number;
  createdAt: FieldValue;
  likes: string[];
  comments: Comment[];
  isVisible: boolean;
  userAvatar?: string;
}

const postData: PostData = {
  userId,
  username: userData?.username || 'Unknown',
  // ... rest with proper typing
};
```

#### Navigation Type Issues
```typescript
// ❌ Problem: Generic navigation types
interface ScreenProps {
  navigation: any;
  route: any;
}

// ✅ Solution: Proper navigation typing
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  PostUpload: { photoUri: string; photoOrientation?: 'portrait' | 'landscape' };
  FlareChainView: { chainId: string };
};

type ScreenProps = NativeStackScreenProps<RootStackParamList, 'PostUpload'>;
```

#### Null Safety Violations
```typescript
// ❌ Problem: Object is possibly 'undefined'
summary[reaction.emoji].count++;

// ✅ Solution: Null safety
if (summary[reaction.emoji]) {
  summary[reaction.emoji].count++;
}

// Or using optional chaining
summary[reaction.emoji]?.count++;
```

---

## Performance Issues

### FlatList Optimization Problems

#### Current Implementation
```typescript
// ❌ Missing optimizations
<FlatList
  data={posts}
  renderItem={({ item }) => <FeedPost ... />}
  keyExtractor={(item) => item.id}
  // Missing: getItemLayout, removeClippedSubviews, etc.
/>
```

#### Optimized Implementation
```typescript
// ✅ Performance optimized
const ITEM_HEIGHT = 400;

<FlatList
  data={posts}
  renderItem={renderPost}
  keyExtractor={keyExtractor}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index
  })}
  initialNumToRender={5}
  removeClippedSubviews={true}
  windowSize={10}
  maxToRenderPerBatch={5}
  updateCellsBatchingPeriod={50}
/>
```

### Image Performance Issues
```typescript
// ❌ Problem: No image optimization
<Image source={{ uri: post.photoUrl }} />

// ✅ Solution: Add react-native-fast-image
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: post.photoUrl,
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable
  }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

---

## Memory Management

### Subscription Cleanup Patterns

#### Firebase Subscription Management
```typescript
// ✅ Proper cleanup pattern
useEffect(() => {
  if (!user) return;
  
  const unsubscribeFriends = subscribeToUserFriends(user.id, setFriends);
  const unsubscribeRequests = subscribeToFriendRequests(user.id, setRequests);
  
  return () => {
    unsubscribeFriends();
    unsubscribeRequests();
  };
}, [user]);
```

#### Timer Management
```typescript
// Timer service with proper cleanup
class ChainTimerService {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  stopAllTimers(): void {
    this.timers.forEach((timerId) => {
      clearInterval(timerId);
    });
    this.timers.clear();
  }
}
```

---

## Testing & Validation

### Manual Testing Framework

#### Interactive Test Runner (`app/components/ChainCreationTestButton.tsx`)
```typescript
export const ChainCreationTestButton: React.FC = ({ photoUri, onTestComplete }) => {
  const runTests = async () => {
    console.log('🧪 Starting comprehensive Firebase tests...');
    
    const test0Result = await chainCreationTests.testFirebaseConnection();
    const test1Result = await chainCreationTests.testBasicFirestoreWrite();
    const test2Result = await chainCreationTests.testStorageUpload(photoUri);
    const test3Result = await chainCreationTests.testCompleteChainCreation(photoUri);
    
    const results = `Test Results:\n` +
      `🔌 Connection: ${test0Result ? '✅' : '❌'}\n` +
      `📝 Firestore: ${test1Result ? '✅' : '❌'}\n` +
      `📤 Storage: ${test2Result ? '✅' : '❌'}\n` +
      `⛓️ Chain: ${test3Result ? '✅' : '❌'}`;
    
    Alert.alert('Test Results', results);
    onTestComplete?.(results);
  };

  return (
    <TouchableOpacity onPress={runTests} style={styles.testButton}>
      <Text>🧪 Run Firebase Tests</Text>
    </TouchableOpacity>
  );
};
```

### Validation Utilities (`app/utils/helpers.ts`)
```typescript
export const validateUser = (user: Partial<User>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!user.username || user.username.length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters' });
  }
  
  if (!user.email || !validateEmail(user.email)) {
    errors.push({ field: 'email', message: 'Valid email address required' });
  }
  
  return errors;
};
```

---

## Development Tools

### Environment Detection
```typescript
// Check build environment
if (__DEV__) {
  console.log('Development build detected');
}

if (Constants.appOwnership === 'expo') {
  console.log('Running in Expo Go');
}
```

### Performance Monitoring
```typescript
// Performance timing
const startTime = performance.now();
await performExpensiveOperation();
const endTime = performance.now();
console.log(`Operation took ${endTime - startTime} milliseconds`);

// Memory usage tracking (development only)
if (__DEV__) {
  setInterval(() => {
    console.log('JS Memory:', global.performance.memory?.usedJSHeapSize);
  }, 5000);
}
```

---

## Common Error Patterns

### Firebase Authentication Errors
```typescript
// Common auth error codes and solutions
const authErrorMessages = {
  'auth/network-request-failed': 'Check internet connection',
  'auth/user-not-found': 'Account does not exist',
  'auth/wrong-password': 'Incorrect password',
  'auth/invalid-email': 'Invalid email format',
  'auth/user-disabled': 'Account has been disabled',
  'auth/too-many-requests': 'Too many failed attempts'
};
```

### Firestore Permission Errors
```typescript
// Permission error debugging
if (error.code === 'firestore/permission-denied') {
  console.error('Security rules checklist:');
  console.error('1. Is user authenticated?', !!auth.currentUser);
  console.error('2. Does user document exist?');
  console.error('3. Are security rules deployed?');
  console.error('4. Does user have access to this collection?');
}
```

### Camera Initialization Failures
```typescript
// Camera error recovery flow
const handleCameraError = (error: any) => {
  if (error.code === 'device/no-device') {
    console.error('No camera device available');
    // Fallback to photo library
  } else if (error.code === 'permission/microphone-permission-denied') {
    console.error('Microphone permission required for video');
    // Disable video features
  } else {
    console.error('Unknown camera error:', error);
    // Fallback to Expo Camera
    if ((global as any).fallbackToExpoCamera) {
      (global as any).fallbackToExpoCamera();
    }
  }
};
```

---

## Quick Debug Commands

### Firebase Connection Test
```bash
# Test Firebase connection
npm run firebase:test

# Check security rules
npm run firebase:rules:test
```

### Performance Profiling
```bash
# React Native performance monitor
npx react-native profile

# Bundle analyzer
npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output main.jsbundle --analyze
```

### Development Reset
```bash
# Clear all caches
npm start -- --reset-cache

# Clear device storage (iOS)
xcrun simctl erase all

# Clear device storage (Android)
adb shell pm clear com.your.package.name
```

This debugging guide provides comprehensive troubleshooting strategies for all major components of the Flare application. Use the console logging patterns and test utilities to diagnose issues effectively.