import '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

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

// React Native Firebase v22+ modular API
// Initialize Firebase services using the new modular approach
const auth = getAuth();
const firestore = getFirestore();
const storage = getStorage();

export { auth, firestore, storage };
export default firebaseConfig;