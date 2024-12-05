import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Dimensions,
  PermissionsAndroid,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Picker } from '@react-native-picker/picker';

// Import Firestore
import { db } from '../firebaseConfig'; // Your firebase config
import { doc, getDoc } from 'firebase/firestore';

const LoginScreen = () => {
  const [customerID, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff'); // Default role is 'staff'
  const navigation = useNavigation();
  const width = Dimensions.get('window').width;

  // Animation shared values
  const usernameFocus = useSharedValue(1);
  const passwordFocus = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const cardScale = useSharedValue(0);
  const cardTranslateY = useSharedValue(100);

  const handleFocusUsername = () => {
    usernameFocus.value = withTiming(1.1);
  };

  const handleBlurUsername = () => {
    usernameFocus.value = withTiming(1);
  };

  const handleFocusPassword = () => {
    passwordFocus.value = withTiming(1.1);
  };

  const handleBlurPassword = () => {
    passwordFocus.value = withTiming(1);
  };

  const handleLogin = async () => {
    if (!customerID || !password) {
      Alert.alert('Validation Error', 'Please enter both username and password.');
      return;
    }

    try {
      // Check if the user exists in the Firestore collection
      const userDocRef = doc(db, 'users', customerID);  // Assuming `customerID` is used as the document ID
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // If the user exists, get the stored password and compare it
        const userData = userDoc.data();
        const storedPassword = userData.Password; // Assuming password is stored in 'password' field

        // Compare the provided password with the stored password
        if (storedPassword === password) {
          const { Role: userRole, ccode } = userData;

          // Store the user's role and ccode in AsyncStorage
          await AsyncStorage.setItem('userRole', JSON.stringify(userRole));
          await AsyncStorage.setItem('userCcode', ccode);

          // Navigate based on user role
          if (userRole === 'Admin') {
            navigation.navigate('Order'); // Admin route
          } else {
            navigation.navigate('Order');  // Staff route
          }
         console.log(role,ccode);
        } else {
          Alert.alert('Error', 'Wrong credentials');
        }
      } else {
        Alert.alert('Error', 'User not found');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    }
  };

  // Request storage permission
  const requestStoragePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'This app needs access to your storage to function properly.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Storage permission granted');
      } else {
        Alert.alert('Storage permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Animated styles
  const animatedUsernameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: usernameFocus.value }],
  }));

  const animatedPasswordStyle = useAnimatedStyle(() => ({
    transform: [{ scale: passwordFocus.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value },
    ],
  }));

  useEffect(() => {
    requestStoragePermission();
    cardScale.value = withTiming(1, { duration: 1000 });
    cardTranslateY.value = withTiming(0, { duration: 1000 });
  }, []);

  return (
    <LinearGradient
      colors={['#4c669f', '#3b5998', '#192f6a']}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.card, animatedCardStyle]}>
          <Text style={styles.title}>Login</Text>

          {/* Role Selection */
          /*<View style={styles.pickerContainer}>
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue)}
              style={[styles.picker, { width: '40%' }]}
              dropdownIconColor="#1E2A5E" // Change the dropdown arrow color
            >
              <Picker.Item label="Staff" value="staff" style={styles.pickerItem} />
              <Picker.Item label="Admin" value="admin" style={styles.pickerItem} />
            </Picker>
          </View>*/}

          <Animated.View style={[animatedUsernameStyle, { width: width / 3 }]}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor='grey'
              value={customerID}
              onChangeText={setUsername}
              onFocus={handleFocusUsername}
              onBlur={handleBlurUsername}
            />
          </Animated.View>
          <Animated.View style={[animatedPasswordStyle, { width: width / 3 }]}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor='grey'
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={handleFocusPassword}
              onBlur={handleBlurPassword}
            />
          </Animated.View>
          <Animated.View style={[animatedButtonStyle, { width: width / 3 }]}>
            <Button
              title="Login"
              onPress={handleLogin}
              disabled={!customerID || !password}
            />
          </Animated.View>
          <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
            <Text>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color:'#1E2A5E',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    color:'#888',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#E8EAF6', // Light background for better contrast
    width: Dimensions.get('screen').width / 3,
    alignSelf: 'center',
  },
  
  picker: {
    height: 50,
    color: '#1E2A5E', // Text color inside the picker
    paddingLeft: 10, // Add some padding for a better look
  },
  
  pickerItem: {
    fontSize: 16,
  },
});

export default LoginScreen;
