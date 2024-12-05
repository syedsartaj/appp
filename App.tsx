import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Admin from './Authenticate/Admin';

const Stack = createNativeStackNavigator();

const App = () => {
 
  return (
    <NavigationContainer>
      <Stack.Navigator>
      <Stack.Screen
           name="Admin"
           component={Admin}
           options={{ headerShown: false }}
       />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
