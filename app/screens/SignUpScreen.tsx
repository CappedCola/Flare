import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Input, Button } from '@ui-kitten/components';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export const SignUpScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { signUp, loading, error } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await signUp(formData.email.trim(), formData.password, formData.username.trim());
      // Navigation will be handled automatically by auth state change
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.message || 'Please try again');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderPasswordIcon = (visible: boolean, onPress: () => void) => (
    <TouchableOpacity onPress={onPress} style={styles.eyeIcon}>
      {visible ? (
        <EyeOff size={20} color={theme['text-hint-color'] || '#999'} />
      ) : (
        <Eye size={20} color={theme['text-hint-color'] || '#999'} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color={theme['text-basic-color']} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme['text-basic-color'] }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme['text-hint-color'] }]}>
              Join Flare and start sharing your daily moments
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Input
                placeholder="Username"
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                status={formErrors.username ? 'danger' : 'basic'}
                caption={formErrors.username}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Input
                placeholder="Email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                status={formErrors.email ? 'danger' : 'basic'}
                caption={formErrors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Input
                placeholder="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                status={formErrors.password ? 'danger' : 'basic'}
                caption={formErrors.password}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                accessoryRight={() => renderPasswordIcon(showPassword, () => setShowPassword(!showPassword))}
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Input
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                status={formErrors.confirmPassword ? 'danger' : 'basic'}
                caption={formErrors.confirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                accessoryRight={() => renderPasswordIcon(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
              />
            </View>

            {/* General Error */}
            {error && (
              <Text style={[styles.errorText, { color: theme['color-danger-default'] }]}>
                {error}
              </Text>
            )}

            {/* Sign Up Button */}
            <Button
              style={[styles.signUpButton, { backgroundColor: theme['color-primary-default'] }]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </View>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={[styles.signInPrompt, { color: theme['text-hint-color'] }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn' as never)}>
              <Text style={[styles.signInLink, { color: theme['color-primary-default'] }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Inter_400Regular',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
  },
  signUpButton: {
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 12,
    paddingVertical: 4,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
  },
  signInPrompt: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
  },
});