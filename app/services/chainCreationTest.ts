// Chain Creation Testing Service
// This file contains systematic tests to isolate Firebase issues

import { firestore, storage, auth } from '../config/firebase';
import { serverTimestamp } from '@react-native-firebase/firestore';

export const chainCreationTests = {
  // Test 0: Check if we can connect to Firebase at all
  async testFirebaseConnection(): Promise<boolean> {
    try {
      console.log('🧪 TEST 0: Testing basic Firebase connection...');
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ TEST 0 FAILED: No authenticated user');
        return false;
      }
      
      console.log('✅ TEST 0: User authenticated:', currentUser.uid);
      
      // Try a simple Firestore read operation
      console.log('📡 TEST 0: Testing Firestore connection...');
      
      // This should work if Firebase connection is OK
      const testQuery = firestore.collection('users').limit(1);
      await testQuery.get();
      
      console.log('✅ TEST 0 SUCCESS: Firebase connection working');
      return true;
      
    } catch (error: any) {
      console.error('❌ TEST 0 FAILED: Firebase connection error:', error);
      if (error.message && error.message.includes('Failed to create chain')) {
        console.error('🚨 FOUND THE SSL/TLS ISSUE: This is the "Failed to create chain" error!');
        console.error('This is likely an SSL certificate validation problem, not a code issue.');
      }
      return false;
    }
  },
  // Test 1: Basic Firestore document creation without photos
  async testBasicFirestoreWrite(): Promise<boolean> {
    try {
      console.log('🧪 TEST 1: Starting basic Firestore write test...');
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ TEST 1 FAILED: No authenticated user');
        return false;
      }
      
      console.log('✅ TEST 1: User authenticated:', currentUser.uid);
      
      const testDoc = {
        test_name: 'Test Chain from App',
        test_description: 'This is a test document to verify Firestore write access',
        creatorId: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'test',
        participantIds: [currentUser.uid],
        testTimestamp: new Date().toISOString()
      };
      
      console.log('📄 TEST 1: Creating test document with data:', testDoc);
      
      const docRef = await firestore.collection('flareChains').add(testDoc);
      
      console.log('✅ TEST 1 SUCCESS: Firestore document created with ID:', docRef.id);
      return true;
      
    } catch (error: any) {
      console.error('❌ TEST 1 FAILED: Firestore write error:', error);
      console.error('Error details:', { 
        message: error.message, 
        code: error.code 
      });
      return false;
    }
  },

  // Test 2: Storage upload test (independent of Firestore)
  async testStorageUpload(dummyFileUri: string): Promise<string | null> {
    try {
      console.log('🧪 TEST 2: Starting storage upload test...');
      console.log('📁 TEST 2: File URI:', dummyFileUri);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ TEST 2 FAILED: No authenticated user');
        return null;
      }
      
      const filename = `test_uploads/${currentUser.uid}/test_${Date.now()}.jpg`;
      console.log('📂 TEST 2: Upload path:', filename);
      
      const storageRef = storage.ref(filename);
      console.log('📤 TEST 2: Starting upload...');
      
      const task = storageRef.putFile(dummyFileUri);
      
      // Monitor upload progress
      task.on('state_changed', snapshot => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`📊 TEST 2: Upload progress: ${progress.toFixed(2)}%`);
      });
      
      await task;
      console.log('✅ TEST 2: Upload completed');
      
      const downloadURL = await storageRef.getDownloadURL();
      console.log('✅ TEST 2 SUCCESS: Download URL:', downloadURL);
      
      return downloadURL;
      
    } catch (error: any) {
      console.error('❌ TEST 2 FAILED: Storage upload error:', error);
      console.error('Error details:', { 
        message: error.message, 
        code: error.code 
      });
      return null;
    }
  },

  // Test 3: Complete chain creation flow with step-by-step logging
  async testCompleteChainCreation(photoUri?: string): Promise<string | null> {
    try {
      console.log('🧪 TEST 3: Starting complete chain creation test...');
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ TEST 3 FAILED: No authenticated user');
        return null;
      }
      
      console.log('✅ TEST 3: User authenticated:', currentUser.uid);
      
      let photoUrl: string | undefined;
      
      // Step 1: Upload photo if provided
      if (photoUri) {
        console.log('📸 TEST 3: Step 1 - Uploading photo...');
        photoUrl = await this.testStorageUpload(photoUri);
        if (!photoUrl) {
          console.error('❌ TEST 3 FAILED: Photo upload failed');
          return null;
        }
        console.log('✅ TEST 3: Step 1 complete - Photo uploaded');
      } else {
        console.log('⏭️ TEST 3: Step 1 skipped - No photo provided');
      }
      
      // Step 2: Create Firestore document
      console.log('💾 TEST 3: Step 2 - Creating Firestore document...');
      
      const chainData = {
        test_name: 'Complete Test Chain',
        test_description: 'Full chain creation test with photo',
        creatorId: currentUser.uid,
        participantIds: [currentUser.uid],
        status: 'test_active',
        photos: photoUrl ? [{
          id: 'test-photo-1',
          photoUrl: photoUrl,
          userId: currentUser.uid,
          createdAt: new Date()
        }] : [],
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        testTimestamp: new Date().toISOString()
      };
      
      console.log('📄 TEST 3: Document structure:', {
        hasPhoto: !!photoUrl,
        participantIds: chainData.participantIds,
        creatorId: chainData.creatorId
      });
      
      const docRef = await firestore.collection('flareChains').add(chainData);
      
      console.log('✅ TEST 3 SUCCESS: Complete chain created with ID:', docRef.id);
      return docRef.id;
      
    } catch (error: any) {
      console.error('❌ TEST 3 FAILED: Complete chain creation error:', error);
      console.error('Error details:', { 
        message: error.message, 
        code: error.code,
        stack: error.stack 
      });
      return null;
    }
  },

  // Test 4: Run all tests in sequence
  async runAllTests(photoUri?: string): Promise<void> {
    console.log('🚀 STARTING COMPREHENSIVE CHAIN CREATION TESTS');
    console.log('===============================================');
    
    // Test 0: Basic Firebase connection
    const test0Result = await this.testFirebaseConnection();
    console.log(`TEST 0 RESULT: ${test0Result ? 'PASS ✅' : 'FAIL ❌'}`);
    if (!test0Result) {
      console.log('🚨 STOPPING TESTS: Basic Firebase connection failed');
      console.log('This appears to be an SSL/TLS certificate validation issue.');
      console.log('Check device time, network connection, and VPN settings.');
      return;
    }
    console.log('-----------------------------------------------');
    
    // Test 1: Basic Firestore write
    const test1Result = await this.testBasicFirestoreWrite();
    console.log(`TEST 1 RESULT: ${test1Result ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log('-----------------------------------------------');
    
    // Test 2: Storage upload (only if photoUri provided)
    let test2Result = true;
    if (photoUri) {
      const uploadResult = await this.testStorageUpload(photoUri);
      test2Result = !!uploadResult;
      console.log(`TEST 2 RESULT: ${test2Result ? 'PASS ✅' : 'FAIL ❌'}`);
    } else {
      console.log('TEST 2 SKIPPED: No photo URI provided');
    }
    console.log('-----------------------------------------------');
    
    // Test 3: Complete flow
    const test3Result = await this.testCompleteChainCreation(photoUri);
    console.log(`TEST 3 RESULT: ${test3Result ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log('-----------------------------------------------');
    
    // Summary
    console.log('🏁 TEST SUMMARY');
    console.log(`Firebase Connection: ${test0Result ? 'PASS' : 'FAIL'}`);
    console.log(`Basic Firestore Write: ${test1Result ? 'PASS' : 'FAIL'}`);
    console.log(`Storage Upload: ${photoUri ? (test2Result ? 'PASS' : 'FAIL') : 'SKIPPED'}`);
    console.log(`Complete Flow: ${test3Result ? 'PASS' : 'FAIL'}`);
    console.log('===============================================');
    
    // Diagnostic recommendations
    if (!test0Result) {
      console.log('🔧 TROUBLESHOOTING RECOMMENDATIONS:');
      console.log('1. Check device date/time is correct');
      console.log('2. Try different network (WiFi vs cellular)');
      console.log('3. Disable VPN if active');
      console.log('4. Clear app cache and rebuild');
      console.log('5. Test on different device/emulator');
    }
  }
};