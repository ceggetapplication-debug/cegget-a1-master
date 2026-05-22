import React from "react";

import LanguageScreen from "@/app/(onboarding)";
import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();

const OnBoardingStack = () => {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name={"languageSelector"} component={LanguageScreen} />
		</Stack.Navigator>
	);
};

export default OnBoardingStack;
