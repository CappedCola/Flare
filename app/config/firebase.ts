import firebase from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, connectFirestoreEmulator } from '@react-native-firebase/firestore';
import { getStorage, connectStorageEmulator } from '@react-native-firebase/storage';

// Your Firebase configuration from Firebase Console
const firebaseConfig = {
  apiKey: "REDACTED_FIREBASE_API_KEY",
  authDomain: "flare-app-a2b12.firebaseapp.com",
  databaseURL: "https://flare-app-a2b12-default-rtdb.firebaseio.com",
  projectId: "flare-app-a2b12",
  storageBucket: "flare-app-a2b12.firebasestorage.app",
  messagingSenderId: "151946802455",
  appId: "1:151946802455:web:7e0527857676a74fe2f352",
  measurementId: "G-5THJRD95BP"
};

// Initialize Firebase app if not already initialized
let app = firebase.app();
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app(); // if already initialized, use that one
}

// React Native Firebase v22+ modular API
// Initialize Firebase services using the new modular approach
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Development environment setup with emulators
// DISABLED temporarily to isolate SSL/TLS connection issues
// Re-enable after fixing production Firebase connection
if (__DEV__ && false) { // Disabled for debugging SSL issues
  // Connect to emulators in development mode
  try {
    // Only connect to emulators if not already connected
    if (!firestore._delegate._databaseId.host.includes('localhost')) {
      connectFirestoreEmulator(firestore, 'localhost', 8080);
    }
    if (!storage._delegate._host.includes('localhost')) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
  } catch (error) {
    // Emulators might already be connected, ignore connection errors
    console.warn('Firebase emulator connection:', error);
  }
}

// Firebase connection state monitoring
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing Firebase connection...');
    
    // Try to get auth state to test connection
    const user = auth.currentUser;
    console.log('✅ Auth accessible:', !!user);
    
    // Try a simple Firestore operation to test SSL/TLS
    const testDoc = firestore.collection('users').limit(1);
    await testDoc.get();
    console.log('✅ Firestore connection test passed');
    
    return true;
  } catch (error: any) {
    console.error('❌ Firebase connection check failed:', error);
    
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
    
    return false;
  }
};

// Firebase initialization status
export const isFirebaseInitialized = (): boolean => {
  try {
    return firebase.apps.length > 0 && !!auth && !!firestore && !!storage;
  } catch (error) {
    console.error('Firebase initialization check failed:', error);
    return false;
  }
};

export { auth, firestore, storage, app };
export default firebaseConfig;