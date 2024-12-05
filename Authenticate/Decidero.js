import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../Screens/LoginScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Admin from '../Authenticate/Admin';

const Stack = createNativeStackNavigator();
const Decidero = () => {
    const [role, setRole] = useState(null); // Allow role to be string or null
    const [loading, setLoading] = useState(true); // State to handle loading
  
    useEffect(() => {
      const fetchUserRole = async () => {
        const storedRoleString = await AsyncStorage.getItem('userRole');
        if (storedRoleString) {
          const storedRole = JSON.parse(storedRoleString); // Parse the string back into an object
          setRole(storedRole.Role); // Access the Role property
        }
        setLoading(false); // Set loading to false after fetching
      };
  
      fetchUserRole();
    }, []);
  
    if (loading) {
      // Optionally, return a loading indicator while checking the role
      return null; // or a loading component
    }
  
    return (
        <Stack.Navigator>
            {role === null ? ( // Check if role is null
           <Stack.Screen
           name="LoginScreen"
           component={LoginScreen}
           options={{ headerShown: false }}
         />
        ) : (
        <Stack.Screen
           name="Admin"
           component={Admin}
           options={{ headerShown: false }}
       />
       
          )}
        </Stack.Navigator>
    );
};

export default Decidero;