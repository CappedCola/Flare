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
      Alert.alert('Running Tests', 'Check console for detailed results');
      
      await chainCreationTests.runAllTests(photoUri);
      
      Alert.alert(
        'Tests Complete', 
        'Check console logs for detailed results. Look for TEST SUMMARY.'
      );
      
      if (onTestComplete) {
        onTestComplete({ completed: true });
      }
    } catch (error) {
      console.error('Test runner error:', error);
      Alert.alert('Test Error', 'Failed to run tests. Check console for details.');
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