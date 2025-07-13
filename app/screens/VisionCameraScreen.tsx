import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, StatusBar, Text, Image, TouchableOpacity, Animated, Linking, Dimensions } from 'react-native';
import { useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { RotateCcw, Check, X, Settings } from 'lucide-react-native';
import { createPost } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

type LensType = 'ultra-wide' | 'standard';

export const VisionCameraScreen = () => {
  const theme = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'checking'>('checking');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [photoOrientation, setPhotoOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [availableLenses, setAvailableLenses] = useState<LensType[]>([]);
  const [currentLens, setCurrentLens] = useState<LensType>('standard');
  const [isDetectingCameras, setIsDetectingCameras] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [visionCameraFailed, setVisionCameraFailed] = useState(false);
  const [isPollingPermissions, setIsPollingPermissions] = useState(false);
  const [hasTriedPermissionRequest, setHasTriedPermissionRequest] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const cameraRef = useRef<Camera>(null);
  const previewOpacity = useRef(new Animated.Value(0)).current;

  // Camera device selection based on current lens (with crash protection)
  let ultraWideDevice, standardDevice, fallbackDevice;
  
  try {
    ultraWideDevice = useCameraDevice('back', {
      physicalDevices: ['ultra-wide-angle-camera']
    });
  } catch (error) {
    if (__DEV__) console.error('🔴 Failed to get ultra-wide device:', error);
    setVisionCameraFailed(true);
  }
  
  try {
    standardDevice = useCameraDevice('back', {
      physicalDevices: ['wide-angle-camera']
    });
  } catch (error) {
    if (__DEV__) console.error('🔴 Failed to get standard device:', error);
    setVisionCameraFailed(true);
  }
  
  try {
    fallbackDevice = useCameraDevice('back');
  } catch (error) {
    if (__DEV__) console.error('🔴 Failed to get fallback device:', error);
    setVisionCameraFailed(true);
  }

  // Get the appropriate device based on current lens
  const activeDevice = useMemo(() => {
    let device;
    switch (currentLens) {
      case 'ultra-wide':
        device = ultraWideDevice || fallbackDevice;
        break;
      case 'standard':
        device = standardDevice || fallbackDevice;
        break;
      default:
        device = fallbackDevice;
        break;
    }
    
    return device;
  }, [currentLens, ultraWideDevice, standardDevice, fallbackDevice]);

  // Safe camera permission check using react-native-permissions
  const safeCameraPermissionCheck = async () => {
    try {
      const result = await check(PERMISSIONS.IOS.CAMERA);
      
      // Convert react-native-permissions results to Vision Camera format
      switch (result) {
        case RESULTS.GRANTED:
          return 'granted';
        case RESULTS.DENIED:
          return 'not-determined';
        case RESULTS.BLOCKED:
          return 'denied';
        case RESULTS.UNAVAILABLE:
          return 'denied';
        case RESULTS.LIMITED:
          return 'granted'; // Treat limited as granted for our purposes
        default:
          return 'denied';
      }
    } catch (error) {
      if (__DEV__) console.error('🔴 Error in react-native-permissions check:', error);
      setVisionCameraFailed(true);
      return 'denied';
    }
  };
  
  // Safe camera permission request using react-native-permissions
  const safeCameraPermissionRequest = async () => {
    try {
      const result = await request(PERMISSIONS.IOS.CAMERA);
      
      // Convert react-native-permissions results to Vision Camera format
      switch (result) {
        case RESULTS.GRANTED:
          return 'granted';
        case RESULTS.DENIED:
          return 'denied';
        case RESULTS.BLOCKED:
          return 'denied';
        case RESULTS.UNAVAILABLE:
          return 'denied';
        case RESULTS.LIMITED:
          return 'granted'; // Treat limited as granted for our purposes
        default:
          return 'denied';
      }
    } catch (error) {
      if (__DEV__) console.error('🔴 Error in react-native-permissions request:', error);
      setVisionCameraFailed(true);
      throw error;
    }
  };
  
  // REMOVED: attemptOneTimePermissionRequest - this function caused all the crashes
  // Camera.requestCameraPermission() is fundamentally broken and causes native iOS crashes
  // We now use pure manual permission flow only
  
  // Check camera permissions with full crash protection
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const status = await safeCameraPermissionCheck();
        
        if (status !== 'granted') {
          // Try react-native-permissions request if status is not-determined
          if (status === 'not-determined' && !hasTriedPermissionRequest) {
            setHasTriedPermissionRequest(true);
            
            try {
              const newStatus = await safeCameraPermissionRequest();
              console.log('🟢 react-native-permissions request succeeded! New status:', newStatus);
              setPermissionStatus(newStatus);
              if (newStatus === 'granted') {
                return; // Exit early, permission granted
              }
            } catch (error) {
              if (__DEV__) console.error('🔴 react-native-permissions request failed:', error);
              setVisionCameraFailed(true);
            }
          }
          
          setPermissionStatus('denied');
          setPermissionError('Camera access required. Please grant permission manually in Settings.');
          // Complete camera detection process even with denied permissions
          setIsDetectingCameras(false);
          setIsCameraReady(false);
          // Start polling immediately to detect manual permission grants
          if (!isPollingPermissions) {
            startPermissionPolling();
          }
        } else if (visionCameraFailed) {
          setPermissionStatus('denied');
          setPermissionError('Camera system unavailable. Please grant camera access manually in Settings > Privacy & Security > Camera.');
          // Complete detection process for failed Vision Camera
          setIsDetectingCameras(false);
          setIsCameraReady(false);
        } else {
          setPermissionStatus(status);
        }
      } catch (error) {
        if (__DEV__) console.error('🔴 Outer error in permission check:', error);
        setPermissionStatus('denied');
        setVisionCameraFailed(true);
        // Trigger fallback to Expo Camera
        if ((global as any).fallbackToExpoCamera) {
          if (__DEV__) console.log('🔴 Triggering fallback to Expo Camera due to critical Vision Camera failure');
          (global as any).fallbackToExpoCamera();
        }
      }
    };
    checkPermissions();
  }, [visionCameraFailed]);

  // Permission polling for manual grants
  const startPermissionPolling = () => {
    setIsPollingPermissions(true);
    
    const pollInterval = setInterval(async () => {
      try {
        const status = await safeCameraPermissionCheck();
        
        if (status === 'granted') {
          setPermissionStatus('granted');
          setPermissionError(null);
          setIsPollingPermissions(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        if (__DEV__) console.error('🔴 Error in permission polling:', error);
      }
    }, 2000);
    
    // Stop polling after 60 seconds
    setTimeout(() => {
      setIsPollingPermissions(false);
      clearInterval(pollInterval);
    }, 60000);
  };
  
  // Detect available camera lenses
  useEffect(() => {
    const detectCameras = async () => {
      try {
        setIsDetectingCameras(true);
        
        const devices = Camera.getAvailableCameraDevices();
        const backDevices = devices.filter(d => d.position === 'back');
        
        const lenses: LensType[] = [];
        
        // Check for ultra-wide camera
        const hasUltraWide = backDevices.some(d => d.physicalDevices?.includes('ultra-wide-angle-camera'));
        if (hasUltraWide) {
          lenses.push('ultra-wide');
        }
        
        // Check for standard wide-angle camera
        const hasStandard = backDevices.some(d => d.physicalDevices?.includes('wide-angle-camera'));
        if (hasStandard) {
          lenses.push('standard');
        }
        
        // If no specific lenses found but we have back cameras, assume standard
        if (lenses.length === 0 && backDevices.length > 0) {
          lenses.push('standard');
        }
        
        setAvailableLenses(lenses);
        
        // Set default lens based on available cameras
        if (lenses.includes('standard')) {
          setCurrentLens('standard');
        } else if (lenses.includes('ultra-wide')) {
          setCurrentLens('ultra-wide');
        }
      } catch (error) {
        if (__DEV__) {
          console.error('🔴 Error detecting cameras:', error);
          console.error('🔴 Error details:', JSON.stringify(error, null, 2));
        }
        // Fallback to standard lens
        setAvailableLenses(['standard']);
        setCurrentLens('standard');
      } finally {
        setIsDetectingCameras(false);
        // Camera detection complete, but don't mark as ready yet
        // Camera will be marked ready when onInitialized callback fires
      }
    };
    
    if (permissionStatus === 'granted') {
      detectCameras();
    }
  }, [permissionStatus]);

  // Expose takePicture function to be called from navigation
  useFocusEffect(
    React.useCallback(() => {
      // Store the takePicture function in a global reference
      // This allows the bottom tab navigation to trigger it
      console.log('Setting up global camera capture function');
      (global as any).cameraCapture = takePicture;
      
      return () => {
        console.log('Cleaning up global camera capture function');
        (global as any).cameraCapture = null;
      };
    }, [takePicture])
  );

  const takePicture = async () => {
    console.log('=== takePicture called ===');
    console.log('Camera ref exists:', !!cameraRef.current);
    console.log('Is capturing:', isCapturing);
    console.log('Is camera ready:', isCameraReady);
    console.log('Active device:', !!activeDevice);
    console.log('Permission status:', permissionStatus);
    console.log('Is detecting cameras:', isDetectingCameras);
    
    // Essential validation before capture
    if (!cameraRef.current) {
      console.error('Camera ref is null - cannot capture');
      return;
    }
    
    if (isCapturing) {
      console.warn('Already capturing - ignoring duplicate request');
      return;
    }
    
    if (!activeDevice) {
      console.error('No active camera device - cannot capture');
      return;
    }
    
    if (permissionStatus === 'denied') {
      console.error('Camera permission denied, cannot capture');
      return;
    }
    
    
    // Proceed with capture even if isCameraReady is false - the camera component
    // may be functional even if the onInitialized callback hasn't fired yet
    
    try {
      console.log('Starting photo capture...');
      setIsCapturing(true);
      
      const photo = await cameraRef.current.takePhoto({
        quality: 80,
        enableAutoStabilization: true,
        enableShutterSound: false,
      });
      
      console.log('Photo captured successfully:', !!photo);
      
      if (photo) {
        console.log('Photo path:', photo.path);
        setCapturedPhoto(photo.path);
        
        // Detect photo orientation based on dimensions
        Image.getSize(`file://${photo.path}`, (width, height) => {
          const orientation = width > height ? 'landscape' : 'portrait';
          console.log(`Photo dimensions: ${width}x${height}, orientation: ${orientation}`);
          setPhotoOrientation(orientation);
          setShowPreview(true);
          
          // Animate preview in
          Animated.timing(previewOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, (error) => {
          if (__DEV__) console.error('Error getting photo dimensions:', error);
          // Fallback to showing preview without orientation detection
          setPhotoOrientation('portrait');
          setShowPreview(true);
          
          // Animate preview in
          Animated.timing(previewOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      if (__DEV__) console.error('Error details:', JSON.stringify(error, null, 2));
    } finally {
      console.log('Photo capture completed, resetting capturing state');
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

  const confirmPicture = async () => {
    if (!capturedPhoto || !user) {
      console.error('No photo captured or user not authenticated');
      retakePicture();
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      
      // Create post with captured photo
      await createPost(capturedPhoto, '', user.id);
      
      console.log('Post created successfully!');
      
      // Close preview after successful upload
      retakePicture();
    } catch (error) {
      console.error('Error creating post:', error);
      setUploadError('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle lens switching
  const handleLensSwitch = (targetLens: LensType) => {
    if (availableLenses.includes(targetLens)) {
      setCurrentLens(targetLens);
    }
  };

  // Loading state while detecting cameras or checking permissions (but not if permission denied)
  if ((isDetectingCameras || permissionStatus === 'checking') && permissionStatus !== 'denied') {
    return (
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {permissionStatus === 'checking' 
              ? 'Checking camera permissions...' 
              : isDetectingCameras 
                ? 'Detecting camera capabilities...' 
                : 'Initializing camera...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied state with manual guidance
  if (permissionStatus === 'denied') {
    return (
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera Access Required</Text>
          <Text style={styles.permissionSubtext}>
            {permissionError || 'Please allow camera access in settings'}
          </Text>
          
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>
              {visionCameraFailed ? 'Manual Setup Required:' : 'Grant Camera Access:'}
            </Text>
            {hasTriedPermissionRequest ? (
              <>
                <Text style={styles.instructionsText}>1. Tap "Open Settings" below</Text>
                <Text style={styles.instructionsText}>2. Scroll down and tap "Flare"</Text>
                <Text style={styles.instructionsText}>3. Tap "Camera" and enable access</Text>
                <Text style={styles.instructionsText}>4. Return to app - wide-angle camera (.5x) will work!</Text>
              </>
            ) : (
              <>
                <Text style={styles.instructionsText}>1. Tap "Check Again" to request permission</Text>
                <Text style={styles.instructionsText}>2. iOS will show a permission dialog</Text>
                <Text style={styles.instructionsText}>3. Tap "Allow" to grant camera access</Text>
                <Text style={styles.instructionsText}>4. Wide-angle camera (.5x) will work immediately!</Text>
              </>
            )}
            
            {!visionCameraFailed && (
              <View style={styles.noteContainer}>
                <Text style={styles.noteText}>
                  💡 We'll automatically detect when you grant permission
                </Text>
              </View>
            )}
            
            <View style={styles.featureContainer}>
              <Text style={styles.featureText}>
                🎯 Once enabled, you'll get ultra-wide (.5x) and standard (1x) camera lenses!
              </Text>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.settingsButton]}
              onPress={() => {
                // Open app-specific settings where camera toggle should appear
                Linking.openSettings();
                if (!isPollingPermissions) {
                  startPermissionPolling();
                }
              }}
              activeOpacity={0.7}
            >
              <Settings size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Open Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.retryButton]}
              onPress={() => {
                setPermissionStatus('checking');
                setPermissionError(null);
                // Reset hasTriedPermissionRequest to allow new permission request
                setHasTriedPermissionRequest(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Check Again</Text>
            </TouchableOpacity>
          </View>
          
          {isPollingPermissions && (
            <Text style={styles.pollingText}>
              Waiting for permission... Grant access in Settings and return to app.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // No device available
  if (!activeDevice) {
    console.log('🔴 No active device available - rendering error state');
    return (
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: theme['background-basic-color-1'] }
      ]}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>No camera device found</Text>
          <Text style={styles.permissionSubtext}>Please check your device's camera availability</Text>
        </View>
      </SafeAreaView>
    );
  }

  
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={activeDevice}
            isActive={true}
            photo={true}
            outputOrientation="device"
            enableZoomGesture={false}
            onInitialized={() => {
              console.log('🟢 Camera initialized successfully');
              setIsCameraReady(true);
            }}
            onError={(error) => {
              console.error('🔴 Camera error:', error);
              if (__DEV__) console.error('🔴 Camera error details:', JSON.stringify(error, null, 2));
              setIsCameraReady(false);
            }}
          />
          
          {/* Adaptive Zoom Controls */}
          {availableLenses.length > 1 && (
            <View style={styles.zoomControls}>
              {availableLenses.includes('ultra-wide') && (
                <TouchableOpacity
                  style={[
                    styles.zoomButton,
                    currentLens === 'ultra-wide' && styles.zoomButtonActive
                  ]}
                  onPress={() => handleLensSwitch('ultra-wide')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.zoomText,
                    currentLens === 'ultra-wide' && styles.zoomTextActive
                  ]}>
                    .5x
                  </Text>
                </TouchableOpacity>
              )}
              
              {availableLenses.includes('standard') && (
                <TouchableOpacity
                  style={[
                    styles.zoomButton,
                    currentLens === 'standard' && styles.zoomButtonActive
                  ]}
                  onPress={() => handleLensSwitch('standard')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.zoomText,
                    currentLens === 'standard' && styles.zoomTextActive
                  ]}>
                    1x
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Photo Preview Overlay */}
          {showPreview && capturedPhoto && (
            <Animated.View 
              style={[
                styles.previewOverlay,
                photoOrientation === 'landscape' && styles.previewOverlayLandscape,
                { opacity: previewOpacity }
              ]}
            >
              <Image source={{ uri: `file://${capturedPhoto}` }} style={styles.previewImage} />
              
              {/* Modern Top Corner Action Buttons */}
              <TouchableOpacity 
                style={[
                  styles.modernActionButton, 
                  photoOrientation === 'landscape' ? styles.retakeButtonCornerLandscape : styles.retakeButtonCorner
                ]}
                onPress={retakePicture}
                activeOpacity={0.7}
              >
                <RotateCcw size={28} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modernActionButton, 
                  photoOrientation === 'landscape' ? styles.confirmButtonCornerLandscape : styles.confirmButtonCorner,
                  isUploading && styles.disabledButton
                ]}
                onPress={confirmPicture}
                activeOpacity={isUploading ? 1 : 0.7}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Text style={styles.uploadingText}>...</Text>
                ) : (
                  <Check size={28} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              
              {/* Upload Error Message */}
              {uploadError && (
                <View style={[
                  styles.errorMessage,
                  photoOrientation === 'landscape' && styles.errorMessageLandscape
                ]}>
                  <Text style={styles.errorText}>{uploadError}</Text>
                  <TouchableOpacity onPress={() => setUploadError(null)}>
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          )}
        </View>
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
  camera: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionSubtext: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionSubtext: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 10,
  },
  previewOverlayLandscape: {
    transform: [{ rotate: '90deg' }],
    width: Dimensions.get('window').height,
    height: Dimensions.get('window').width,
    top: '50%',
    left: '50%',
    marginTop: -Dimensions.get('window').width / 2,
    marginLeft: -Dimensions.get('window').height / 2,
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 12,
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
  retakeButtonCornerLandscape: {
    top: 60,
    left: 60,
  },
  confirmButtonCornerLandscape: {
    bottom: 60,
    left: 60,
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
  retryButton: {
    backgroundColor: 'rgba(93, 95, 239, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
  },
  instructionsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionsText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 4,
    paddingLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  settingsButton: {
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  pollingText: {
    color: '#FFAA00',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  noteContainer: {
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(93, 95, 239, 0.3)',
  },
  noteText: {
    color: '#E0E0FF',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 170, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 0, 0.3)',
  },
  warningText: {
    color: '#FFCC80',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  featureContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  featureText: {
    color: '#A5D6A7',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    opacity: 0.6,
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorMessage: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorMessageLandscape: {
    bottom: 20,
    left: 120,
    right: 120,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
});