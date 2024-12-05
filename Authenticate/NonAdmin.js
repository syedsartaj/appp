import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Products from '../Screens/Products';
import Order from "../Screens/Order";

const Stack = createNativeStackNavigator();

const NonAdmin = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Products"
                component={Products}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="POS"
                component={Order}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

export default NonAdmin;