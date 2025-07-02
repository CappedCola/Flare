import React from 'react';
import { FEATURE_FLAGS, logCameraEnvironment } from '../config/featureFlags';

export const CameraScreen = () => {
  const [shouldFallback, setShouldFallback] = React.useState(false);
  
  // Log the current environment for debugging
  React.useEffect(() => {
    logCameraEnvironment();
  }, []);

  // Listen for Vision Camera failures and trigger fallback
  React.useEffect(() => {
    const handleVisionCameraFailure = () => {
      console.log('🔴 Vision Camera failed, switching to Expo Camera fallback');
      setShouldFallback(true);
    };
    
    // Add global listener for Vision Camera failures
    (global as any).fallbackToExpoCamera = handleVisionCameraFailure;
    
    return () => {
      (global as any).fallbackToExpoCamera = null;
    };
  }, []);

  if (FEATURE_FLAGS.USE_VISION_CAMERA && !shouldFallback) {
    // Use Vision Camera for development builds
    try {
      const { VisionCameraScreen } = require('./VisionCameraScreen');
      return React.createElement(VisionCameraScreen);
    } catch (error) {
      console.warn('Vision Camera module failed to load, falling back to Expo Camera:', error);
      // Fallback to Expo Camera if Vision Camera fails to load
      const { ExpoCameraScreen } = require('./ExpoCameraScreen');
      return React.createElement(ExpoCameraScreen);
    }
  }
  
  // Use Expo Camera for Expo Go compatibility or when Vision Camera fails
  console.log('🔵 Using Expo Camera fallback');
  const { ExpoCameraScreen } = require('./ExpoCameraScreen');
  return React.createElement(ExpoCameraScreen);
};