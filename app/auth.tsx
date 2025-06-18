import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Auth() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to PMS</Text>
      <View style={styles.buttonContainer}>
        <Button 
          title="Login" 
          onPress={() => router.push('/login')}
        />
        <View style={styles.buttonSpacer} />
        <Button 
          title="Sign Up" 
          onPress={() => router.push('/signup')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 200,
  },
  buttonSpacer: {
    height: 16,
  },
}); 