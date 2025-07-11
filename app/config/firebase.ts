import '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Your Firebase configuration from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAj0kfkyD3r7Hhv0plQKtNBsvttSjZdoWk",
  authDomain: "flare-app-a2b12.firebaseapp.com",
  databaseURL: "https://flare-app-a2b12-default-rtdb.firebaseio.com",
  projectId: "flare-app-a2b12",
  storageBucket: "flare-app-a2b12.firebasestorage.app",
  messagingSenderId: "151946802455",
  appId: "1:151946802455:web:7e0527857676a74fe2f352",
  measurementId: "G-5THJRD95BP"
};

// Note: React Native Firebase automatically initializes the app
// We just need to export the services for use throughout the app

export { auth, firestore, storage };
export default firebaseConfig;