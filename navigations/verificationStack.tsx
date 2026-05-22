import React from "react";

import EmailVerification from "@/app/(auth)/emailVerification";
import LanguageScreen from "@/app/(onboarding)";
import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();

const VerificationStack = () => {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name={"emailVerify"} component={EmailVerification} />
		</Stack.Navigator>
	);
};

export default VerificationStack;
