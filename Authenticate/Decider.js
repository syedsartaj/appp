import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Admin from './Admin';
import NonAdmin from './NonAdmin';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

const Decider = () => {
  const [role, setRole] = useState(null); // Initialize as null

  useEffect(() => {
    const fetchUserRole = async () => {
      const storedRoleString = await AsyncStorage.getItem('userRole');
      if (storedRoleString) {
        const storedRole = JSON.parse(storedRoleString); // Parse the string back into an object
        setRole(storedRole.Role); // Access the Role property
      }
    };

    fetchUserRole();
  }, []);

  return (
    <Stack.Navigator>
      {role === 'waiter' ? (
        <Stack.Screen
          name="Waitersl"
          component={NonAdmin} // Wrap in Stack.Screen
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen
          name="Admin"
          component={Admin} // Wrap in Stack.Screen
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default Decider;
