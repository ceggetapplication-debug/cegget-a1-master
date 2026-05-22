import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import "react-native-reanimated";
import * as Linking from 'expo-linking';
import { rewardParrainByUserId } from './backends/invitFriends_backend';
import { useColorScheme } from "@/hooks/useColorScheme";
import { useStore, useStoreEffect } from "@/app/(main)/calculation-logic/store";

SplashScreen.preventAutoHideAsync();

type CurrentStack = "LoggedIn" | "NotLoggedIn" | "Onboarding" | "NotVerified";

export default function RootLayout() {
	const { user, selectedLanguage } = useStore();
	const router = useRouter();
	const [currentStack, setCurrentStack] = useState<CurrentStack>("Onboarding");

	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	useEffect(() => {
		const handleDeepLink = async (url: string | null) => {
			if (!url) return;
			const { path, hostname, queryParams } = Linking.parse(url);

			if (path === 'verify-email' || hostname === 'verify-email') {
				const { userId, secret } = queryParams || {};
				if (userId && secret) {
					router.replace({
						pathname: '/(auth)/emailVerification',
						params: { userId, secret }
					});
					return;
				}
			}

			if (queryParams && queryParams.invitedBy) {
				await rewardParrainByUserId(String(queryParams.invitedBy));
			}
		};

		Linking.getInitialURL().then(handleDeepLink);

		const subscription = Linking.addEventListener('url', (event) => {
			handleDeepLink(event.url);
		});

		return () => subscription.remove();
	}, [router]);

	useStoreEffect(({ user, selectedLanguage }: { user: Models.User<Models.Preferences> | undefined, selectedLanguage: string | null }) => {
		if (user && !user.emailVerification) {
			setCurrentStack("NotVerified");
		}
		else if (user && user.emailVerification) {
			setCurrentStack("LoggedIn");
		}
		else if (selectedLanguage && !user) {
			setCurrentStack("NotLoggedIn");
		}
		else if (!user && !selectedLanguage) {
			setCurrentStack("Onboarding");
		}
	});

	if (!loaded) {
		return null;
	}

	return (
		<ThemeProvider value={useColorScheme() === "dark" ? DarkTheme : DefaultTheme}>
			<Stack screenOptions={{ headerShown: false }}>
				{currentStack === "LoggedIn" && (
					<Stack.Screen name="(main)" options={{ headerShown: false }} />
				)}

				{(currentStack === "NotLoggedIn" || currentStack === "NotVerified") && (
					<Stack.Screen name="(auth)" options={{ headerShown: false }} />
				)}

				{currentStack === "Onboarding" && (
					<Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
				)}

				<Stack.Screen name="+not-found" />
			</Stack>
			<StatusBar style="auto" />
		</ThemeProvider>
	);
}
