// Feature flags for hybrid development
export const FEATURE_FLAGS = {
  // Use react-native-vision-camera when in development build
  // Falls back to expo-camera when in Expo Go
  USE_VISION_CAMERA: process.env.EXPO_PUBLIC_USE_VISION_CAMERA === 'true'
};

// Helper function to check if we're in a development build
export const isUsingVisionCamera = () => FEATURE_FLAGS.USE_VISION_CAMERA;

// Helper to log current environment (disabled for cleaner console)
export const logCameraEnvironment = () => {
  // Logging disabled to reduce console noise
  // if (__DEV__) {
  //   console.log(`Camera Environment: ${FEATURE_FLAGS.USE_VISION_CAMERA ? 'Vision Camera (Development Build)' : 'Expo Camera (Expo Go)'}`);
  // }
};