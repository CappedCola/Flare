import firebase from '@react-native-firebase/app';
import firebaseConfig, {
  auth,
  firestore,
  isFirebaseInitialized,
  storage,
} from '../../app/config/firebase';

describe('Firebase module boundary', () => {
  it('initializes the application through local adapters without a native connection', () => {
    expect(firebase.initializeApp).toHaveBeenCalledWith(firebaseConfig);
    expect(isFirebaseInitialized()).toBe(true);
    expect(auth.currentUser).toBeNull();
    expect(firestore).toBeDefined();
    expect(storage).toBeDefined();
  });
});
