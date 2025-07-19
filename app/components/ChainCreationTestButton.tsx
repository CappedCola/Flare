import React from 'react';
import { Alert } from 'react-native';
import { Button } from '@ui-kitten/components';
import { chainCreationTests } from '../services/chainCreationTest';

interface ChainCreationTestButtonProps {
  photoUri?: string;
  onTestComplete?: (results: any) => void;
}

export const ChainCreationTestButton: React.FC<ChainCreationTestButtonProps> = ({ 
  photoUri, 
  onTestComplete 
}) => {
  const runTests = async () => {
    try {
      console.log('Starting chain creation diagnostic tests...');
      Alert.alert('Running Tests', 'Tests starting... Results will appear in alerts.');
      
      // Run individual tests and capture results
      const test0Result = await chainCreationTests.testFirebaseConnection();
      const test1Result = await chainCreationTests.testBasicFirestoreWrite();
      
      let test2Result = true;
      if (photoUri) {
        const uploadResult = await chainCreationTests.testStorageUpload(photoUri);
        test2Result = !!uploadResult;
      }
      
      const test3Result = await chainCreationTests.testCompleteChainCreation(photoUri);
      
      // Show results in alert
      const results = [
        `🔗 Firebase Connection: ${test0Result ? 'PASS ✅' : 'FAIL ❌'}`,
        `📄 Firestore Write: ${test1Result ? 'PASS ✅' : 'FAIL ❌'}`,
        `📤 Storage Upload: ${photoUri ? (test2Result ? 'PASS ✅' : 'FAIL ❌') : 'SKIPPED'}`,
        `🔥 Complete Chain: ${test3Result ? 'PASS ✅' : 'FAIL ❌'}`
      ].join('\n\n');
      
      Alert.alert('🧪 Test Results', results);
      
      // If any test failed, show troubleshooting
      if (!test0Result) {
        setTimeout(() => {
          Alert.alert(
            '🔧 SSL/TLS Issue Detected', 
            'This looks like a certificate validation problem.\n\nTry:\n• Check device date/time\n• Switch networks\n• Disable VPN\n• Restart app'
          );
        }, 2000);
      }
      
      if (onTestComplete) {
        onTestComplete({ 
          test0: test0Result, 
          test1: test1Result, 
          test2: test2Result, 
          test3: test3Result 
        });
      }
    } catch (error: any) {
      console.error('Test runner error:', error);
      Alert.alert(
        'Test Error', 
        `Failed to run tests:\n${error.message}\n\nThis might be the SSL issue we're looking for!`
      );
    }
  };

  return (
    <Button 
      onPress={runTests}
      status="info"
      size="small"
    >
      🧪 Test Chain Creation
    </Button>
  );
};

export default ChainCreationTestButton;