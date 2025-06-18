import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function MfaVerificationPage() {
  const router = useRouter();
  const { verifyTOTP } = useAuth();
  
  const [mfaCode, setMfaCode] = useState('');

  const handleVerifyMfa = async () => {
    try {
      await verifyTOTP(mfaCode);
      router.replace('/welcome');
    } catch (error: any) {
      console.error('MFA verification error:', error);
      Alert.alert('Error', error.message || 'Invalid MFA code');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter MFA Code</Text>
      
      <View style={styles.form}>
        <Text style={styles.description}>
          Please enter the 6-digit code from your authenticator app
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="6-digit code"
          placeholderTextColor="#94a3b8"
          value={mfaCode}
          onChangeText={setMfaCode}
          keyboardType="number-pad"
          maxLength={6}
        />

        <TouchableOpacity style={styles.button} onPress={handleVerifyMfa}>
          <Text style={styles.buttonText}>Verify</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    gap: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0891b2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 