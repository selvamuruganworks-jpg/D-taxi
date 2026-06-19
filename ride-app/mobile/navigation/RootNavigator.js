import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WelcomeScreen from "../screens/WelcomeScreen";
import HomeScreen from "../screens/HomeScreen";
import ChooseRideScreen from "../screens/ChooseRideScreen";
import RouteChangeScreen from "../screens/RouteChangeScreen";
import ChoreRideScreen from "../screens/ChoreRideScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ChooseRideScreen" component={ChooseRideScreen} />
        <Stack.Screen name="RouteChangeScreen" component={RouteChangeScreen} />
        <Stack.Screen name="ChoreRideScreen" component={ChoreRideScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
