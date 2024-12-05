import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Dashboard from '../Screens/Dashboard';
import POS from '../Screens/POS';
import Products from '../Screens/Products';
import Order from "../Screens/Order";
import BillPayments from "../Screens/BillPayments";
import Stocks from "../Screens/Stocks";
import LoginScreen from "../Screens/LoginScreen"; // Ensure LoginScreen is imported
import SignupScreen from "../Screens/SignupScreen";

const Stack = createNativeStackNavigator();

const Admin = () => {
  const [role, setRole] = useState(null); // Allow role to be string or null
  const [loading, setLoading] = useState(true); // State to handle loading

  useEffect(() => {
    const fetchUserRole = async () => {
      const storedRoleString = await AsyncStorage.getItem('userRole');
      if (storedRoleString) {
        const storedRole = JSON.parse(storedRoleString); // Parse the string back into an object
        setRole(storedRole); // Access the Role property
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
    <Stack.Navigator
      initialRouteName={role ? "Order" : "SignupScreen"} // Set initial screen based on role
    >
      <Stack.Screen
        name="Order"
        component={Order}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Dashboard"
        component={Dashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Stocks"
        component={Stocks}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="POS"
        component={POS}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Products"
        component={Products}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BillPayments"
        component={BillPayments}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
       <Stack.Screen
        name="SignupScreen"
        component={SignupScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default Admin;
