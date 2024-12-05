import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { db } from '../firebaseConfig'; // Import Firestore from config
import { doc, setDoc, getDoc } from 'firebase/firestore';

const SignupScreen = () => {
  const [cname, setCName] = useState('');
  const [cphn, setCPhn] = useState('');
  const [ccode, setCCode] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [cid, setCid] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // New state for role (default to 'user')
  const navigation = useNavigation();
  const width = Dimensions.get('window').width;

  // Animation shared values
  const cardScale = useSharedValue(0);
  const cardTranslateY = useSharedValue(100);

  const handleSignup = async () => {
    if (!cname || !cphn || !ccode || !address || !message || !cid || !password || !role) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    try {
      // Check if the user with the same cid or ccode already exists
      const userDocRef = doc(db, 'users', cid);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        Alert.alert('Error', 'Customer ID already exists. Please use a different one.');
        return;
      }

      // If new user, create document in Firestore with the role field
      await setDoc(userDocRef, {
        cname,
        cphn,
        ccode,
        address,
        message,
        password,
        role, // Include the role field
      });

      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate('LoginScreen');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Signup Failed', error.message || 'An unexpected error occurred.');
    }
  };

  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value },
    ],
  }));

  useEffect(() => {
    cardScale.value = withTiming(1, { duration: 1000 });
    cardTranslateY.value = withTiming(0, { duration: 1000 });
  }, []);

  return (
    <LinearGradient
      colors={['#4c669f', '#3b5998', '#192f6a']}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={[styles.card, animatedCardStyle]}>
          <Text style={styles.title}>Sign Up</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor='grey'
            value={cname}
            onChangeText={setCName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor='grey'
            value={cphn}
            onChangeText={setCPhn}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="User Code"
            placeholderTextColor='grey'
            value={ccode}
            onChangeText={setCCode}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            placeholderTextColor='grey'
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor='grey'
            value={message}
            onChangeText={setMessage}
          />
          <TextInput
            style={styles.input}
            placeholder="Customer ID"
            placeholderTextColor='grey'
            value={cid}
            onChangeText={setCid}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor='grey'
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          {/* Role Input: You can replace this with a dropdown or picker if needed */}
          <TextInput
            style={styles.input}
            placeholder="Role (e.g. user, admin)"
            placeholderTextColor='grey'
            value={role}
            onChangeText={setRole}
          />

          <Button title="Sign Up" onPress={handleSignup} />
          <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
            <Text style={styles.link}>Already have an account? Login</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#E1D7B7',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    width: '90%',
    marginTop: 20,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#1E2A5E',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    color: '#888',
    borderRadius: 5,
  },
  link: {
    marginTop: 15,
    color: '#1E2A5E',
    textAlign: 'center',
  },
});

export default SignupScreen;
