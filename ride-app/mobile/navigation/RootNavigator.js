import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import ChooseRideScreen from "../screens/ChooseRideScreen";
import OnTripScreen from "../screens/OnTripScreen";
import DriverDashboard from "../screens/DriverDashboard";
import AdminDashboard from "../screens/AdminDashboard";
import RouteChangeScreen from "../screens/RouteChangeScreen";
import ChoreRideScreen from "../screens/ChoreRideScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ChooseRideScreen" component={ChooseRideScreen} />
        <Stack.Screen name="OnTripScreen" component={OnTripScreen} />
        <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="RouteChangeScreen" component={RouteChangeScreen} />
        <Stack.Screen name="ChoreRideScreen" component={ChoreRideScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
