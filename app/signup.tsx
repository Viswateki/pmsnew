import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  let authError = null;
  let authContext: any = null;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('useAuth error:', error);
    authError = error;
  }

  const { signUp, confirmSignUp, setupTOTP, verifyTOTP, setupSMS, verifySMS, signIn, setTempPassword } = authContext || {};
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaType, setMfaType] = useState<'TOTP' | 'SMS' | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  if (authError || !authContext) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Error</Text>
        <Text style={styles.errorText}>Authentication not available</Text>
      </View>
    );
  }

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Phone number is required for verification');
      return;
    }

    // Format phone number to E.164 format
    let formattedPhoneNumber = phoneNumber.trim();
    if (!formattedPhoneNumber.startsWith('+')) {
      const digitsOnly = formattedPhoneNumber.replace(/\D/g, '');
      if (digitsOnly.length === 10) {
        formattedPhoneNumber = `+91${digitsOnly}`;
      } else {
        Alert.alert('Error', 'Please enter a valid 10-digit phone number');
        return;
      }
    }

    try {
      console.log('Attempting to sign up with:', { email, password, fullName, phoneNumber: formattedPhoneNumber });
      await signUp(email, password, fullName, formattedPhoneNumber);
      setTempPassword(password); // Store password for MFA setup
      setShowConfirmation(true);
    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert('Error', error.message || 'Sign up failed');
    }
  };

  const handleConfirmSignUp = async () => {
    if (!confirmSignUp) {
      Alert.alert('Error', 'Confirm sign up function not available');
      return;
    }

    try {
      console.log('Starting confirmation process...');
      await confirmSignUp(email, confirmationCode);
      console.log('Confirmation successful');
      
      Alert.alert(
        'Success',
        'Your account has been confirmed. Please sign in to continue and set up MFA.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (error: any) {
      console.error('Confirm sign up error:', error);
      Alert.alert('Error', error.message || 'Confirmation failed');
    }
  };

  const handleMfaSetup = async (type: 'TOTP' | 'SMS') => {
    try {
      // First ensure we're signed in
      try {
        await signIn(email, password);
        console.log('Successfully signed in before MFA setup');
      } catch (signInError: any) {
        console.error('Sign in error before MFA setup:', signInError);
        Alert.alert('Error', 'Please ensure you are signed in before setting up MFA');
        return;
      }

      if (type === 'TOTP') {
        if (!setupTOTP) {
          Alert.alert('Error', 'TOTP setup not available');
          return;
        }
        const secretKey = await setupTOTP();
        Alert.alert(
          'TOTP Setup',
          `Please setup your authenticator app with this secret key:\n\n${secretKey}\n\nAfter setting up, enter the 6-digit code from your authenticator app below.`
        );
      } else if (type === 'SMS') {
        if (!setupSMS) {
          Alert.alert('Error', 'SMS setup not available');
          return;
        }
        if (!phoneNumber) {
          Alert.alert('Error', 'Please enter your phone number first.');
          return;
        }
        await setupSMS(phoneNumber);
        Alert.alert('SMS Setup', 'Please enter the verification code sent to your phone.');
      }
      setMfaType(type);
    } catch (error: any) {
      console.error('MFA setup error:', error);
      Alert.alert('Error', error.message || 'Failed to setup MFA');
    }
  };

  const handleMfaVerification = async () => {
    try {
      if (mfaType === 'TOTP') {
        if (!verifyTOTP) {
          Alert.alert('Error', 'TOTP verification not available');
          return;
        }
        await verifyTOTP(mfaCode);
        Alert.alert(
          'Success', 
          'MFA setup complete. Please login with your credentials and use your authenticator app for the code.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      } else if (mfaType === 'SMS') {
        if (!verifySMS) {
          Alert.alert('Error', 'SMS verification not available');
          return;
        }
        await verifySMS(mfaCode);
        Alert.alert(
          'Success',
          'MFA setup complete. Please login with your credentials.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      }
    } catch (error: any) {
      console.error('MFA verification error:', error);
      if (error.code === 'NotAuthorizedException' || error.message?.includes('Unauthenticated')) {
        Alert.alert('Error', 'Session expired. Please try logging in again.');
        router.replace('/login');
      } else {
        Alert.alert('Error', error.message || 'Invalid MFA code');
      }
    }
  };

  console.log('Render states:', { showConfirmation, showMfaSetup, mfaType });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <View style={styles.form}>
        {!showConfirmation && !showMfaSetup ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor="#94a3b8"
              value={fullName}
              onChangeText={setFullName}
            />

            <TextInput
              style={styles.input}
              placeholder="Email *"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password *"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number * (10 digits)"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={10}
            />

            <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </>
        ) : showConfirmation && !showMfaSetup ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Confirmation Code"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              value={confirmationCode}
              onChangeText={setConfirmationCode}
            />

            <TouchableOpacity 
              style={styles.signupButton}
              onPress={handleConfirmSignUp}
            >
              <Text style={styles.signupButtonText}>Confirm Sign Up</Text>
            </TouchableOpacity>
          </>
        ) : showMfaSetup && (
          <>
            {!mfaType ? (
              <>
                <Text style={styles.mfaTitle}>Choose MFA Method</Text>
                <TouchableOpacity 
                  style={styles.mfaButton}
                  onPress={() => handleMfaSetup('TOTP')}
                >
                  <Text style={styles.mfaButtonText}>Setup TOTP (Authenticator App)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.mfaButton}
                  onPress={() => handleMfaSetup('SMS')}
                >
                  <Text style={styles.mfaButtonText}>Setup SMS</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="MFA Code"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  value={mfaCode}
                  onChangeText={setMfaCode}
                />
                <TouchableOpacity 
                  style={styles.signupButton}
                  onPress={handleMfaVerification}
                >
                  <Text style={styles.signupButtonText}>Verify</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => router.back()}
        >
          <Text style={styles.loginLinkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: 60,
    marginBottom: 40,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 20,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#1e293b',
  },
  signupButton: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  signupButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#2563eb',
    fontSize: 16,
  },
  mfaTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  mfaButton: {
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  mfaButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
}); 