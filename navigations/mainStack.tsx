import React from "react";

import HomeScreen from "@/app/(main)";
import OcticonsIcons from "@expo/vector-icons/Octicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";

import { FavoriteSvg } from "@/app/utils/icons";
import { useUnistyles } from "react-native-unistyles";
import { Text } from "react-native-paper";
import ProfileScreen from "@/app/(main)/profile";
import { FavoritesScreen } from "@/app/(main)/favorite";
import CartScreen from "@/app/(main)/cart";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const BottomTabs = () => {
	const { theme } = useUnistyles();

	return (
		<Tab.Navigator>
			<Tab.Screen
				name="Home"
				component={HomeScreen}
				options={{
					headerShown: false,
					tabBarIcon: ({ color, size, focused }) => (
						<OcticonsIcons name={"home"} size={size} color={color} />
					),
				}}
			/>
			<Tab.Screen
				name="Favorite"
				component={FavoritesScreen}
				options={{
					headerShown: false,
					tabBarIcon: ({ color, size, focused }) => (
						<OcticonsIcons name={"heart-fill"} size={size} color={color} />
					),
				}}
			/>
			<Tab.Screen
				name="Shopping"
				component={CartScreen}
				options={{
					headerShown: false,
					tabBarIcon: ({ color, size, focused }) => (
						<OcticonsIcons name={"package"} size={size} color={color} />
					),
				}}
			/>
			<Tab.Screen
				name="Profile"
				component={ProfileScreen}
				options={{
					headerShown: false,
					tabBarIcon: ({ color, size, focused }) => (
						<OcticonsIcons name={"person"} size={size} color={color} />
					),
				}}
			/>
		</Tab.Navigator>
	);
};

const MainStack = () => {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name={"main"} component={BottomTabs} />
		</Stack.Navigator>
	);
};

export default MainStack;
