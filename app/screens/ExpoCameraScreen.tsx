import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, StatusBar, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RotateCcw, Check } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PostOptionsModal } from '../components/PostOptionsModal';

export const ExpoCameraScreen = ({ navigation }: { navigation: any }) => {
  const theme = useTheme();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const previewOpacity = useRef(new Animated.Value(0)).current;

  // Mock photo capture for Expo Go compatibility
  const takePicture = async () => {
    if (isCapturing) return;
    
    try {
      setIsCapturing(true);
      
      // Simulate photo capture with a placeholder
      const mockPhotoUri = 'https://picsum.photos/400/600?random=' + Date.now();
      
      setCapturedPhoto(mockPhotoUri);
      setShowPreview(true);
      
      // Animate preview in
      Animated.timing(previewOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Mock photo capture error:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const retakePicture = () => {
    // Animate preview out
    Animated.timing(previewOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowPreview(false);
      setCapturedPhoto(null);
    });
  };

  const confirmPicture = () => {
    if (!capturedPhoto) {
      console.error('No photo captured');
      retakePicture();
      return;
    }

    // Show post options modal instead of navigating directly
    setShowPostOptions(true);
  };

  const handleRegularPost = () => {
    setShowPostOptions(false);
    // Navigate to PostUploadScreen with the captured photo
    navigation.navigate('PostUpload', {
      photoUri: capturedPhoto,
      photoOrientation: 'portrait' // Expo camera default
    });
  };

  const handleFlareChain = () => {
    setShowPostOptions(false);
    // Navigate to FlareCreationScreen with the captured photo
    navigation.navigate('FlareCreation', {
      photoUri: capturedPhoto,
      photoOrientation: 'portrait'
    });
  };

  const handleClosePostOptions = () => {
    setShowPostOptions(false);
  };

  // Expose takePicture function to be called from navigation
  useFocusEffect(
    React.useCallback(() => {
      (global as any).cameraCapture = takePicture;
      
      return () => {
        (global as any).cameraCapture = null;
      };
    }, [])
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.cameraContainer}>
          {/* Mock camera view for Expo Go */}
          <View style={[styles.mockCamera, { backgroundColor: theme['background-basic-color-3'] }]}>
            <Text style={styles.mockCameraText}>📷</Text>
            <Text style={styles.mockCameraSubtext}>Expo Go Camera Mode</Text>
            <Text style={styles.mockCameraInfo}>
              For full camera features, use the development build
            </Text>
          </View>
          
          {/* Simple zoom indicator for compatibility */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={[styles.zoomButton, styles.zoomButtonActive]}>
              <Text style={[styles.zoomText, styles.zoomTextActive]}>1x</Text>
            </TouchableOpacity>
          </View>
          
          {/* Photo Preview Overlay */}
          {showPreview && capturedPhoto && (
            <Animated.View 
              style={[
                styles.previewOverlay,
                { opacity: previewOpacity }
              ]}
            >
              <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
              
              {/* Modern Top Corner Action Buttons */}
              <TouchableOpacity 
                style={[styles.modernActionButton, styles.retakeButtonCorner]}
                onPress={retakePicture}
                activeOpacity={0.7}
              >
                <RotateCcw size={28} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modernActionButton, styles.confirmButtonCorner]}
                onPress={confirmPicture}
                activeOpacity={0.7}
              >
                <Check size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
        
        {/* Post Options Modal */}
        <PostOptionsModal
          visible={showPostOptions}
          onClose={handleClosePostOptions}
          onRegularPost={handleRegularPost}
          onFlareChain={handleFlareChain}
          photoUri={capturedPhoto || undefined}
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  mockCamera: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockCameraText: {
    fontSize: 60,
    marginBottom: 20,
  },
  mockCameraSubtext: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  mockCameraInfo: {
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  zoomControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    zIndex: 5,
  },
  zoomButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  zoomButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  zoomText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  zoomTextActive: {
    color: '#FFFFFF',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 10,
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  modernActionButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  retakeButtonCorner: {
    top: 60,
    left: 20,
  },
  confirmButtonCorner: {
    top: 60,
    right: 20,
  },
});