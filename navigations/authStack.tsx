import LoginScreen from "@/app/(auth)";
import SignUpScreen from "@/app/(auth)/signUp";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";

const Stack = createStackNavigator();

export default function AuthStack() {
	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: false,
			}}
		>
			<Stack.Screen
				name="login"
				component={LoginScreen}
				options={{
					animation: "slide_from_right",
				}}
			/>
			<Stack.Screen
				name="signup"
				component={SignUpScreen}
				options={{
					animation: "slide_from_right",
				}}
			/>
			{/* <Stack.Screen name="signup" /> */}
		</Stack.Navigator>
	);
}
