import { CartProvider } from "@/contexts/CartContext";
import AuthStack from "@/navigations/authStack";
import MainStack from "@/navigations/mainStack";
import OnBoardingStack from "@/navigations/onBoarding";
import { useStore, useStoreEffect } from "@/app/(main)/calculation-logic/store";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { UnistylesRuntime } from "react-native-unistyles";

SplashScreen.preventAutoHideAsync();

type CurrentStack = "LoggedIn" | "NotLoggedIn" | "NotVerified" | "Onboarding";

const AppNavigator = () => {
	const { user, selectedLanguage } = useStore();

	const [currentStack, setCurrentStack] = useState<CurrentStack>("Onboarding");


	useStoreEffect(({ user, selectedLanguage }) => {
		if (user) setCurrentStack("LoggedIn");
		if (selectedLanguage && !user) setCurrentStack("NotLoggedIn");
		if (!user && !selectedLanguage) setCurrentStack("Onboarding");
	});


	if (currentStack === "Onboarding") return <OnBoardingStack />;
	if (currentStack === "NotLoggedIn") return <AuthStack />;
	if (currentStack === "LoggedIn") return <MainStack />;

	return (
		<>
			<OnBoardingStack />

			<StatusBar style="auto" />
		</>
	);
};

const AppRoot = () => {
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<SafeAreaProvider style={{ flex: 1 }}>


			<NavigationContainer theme={UnistylesRuntime.getTheme()}>
				<GestureHandlerRootView style={{
					flex: 1
				}}>

					<BottomSheetModalProvider>
						<CartProvider>
							<AppNavigator />
						</CartProvider>
					</BottomSheetModalProvider>
				</GestureHandlerRootView>
			</NavigationContainer>
		</SafeAreaProvider>
	);
};

export { AppRoot };
