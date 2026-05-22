import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Switch, Text } from "react-native-paper";
import { useUnistyles } from "react-native-unistyles";

export const SettingItem = ({ icon, title, isSwitch, value, onPress }) => {
	const { theme } = useUnistyles();

	const handleOnPress = () => {
		onPress?.();
	};

	return (
		<Pressable
			onPress={handleOnPress}
			style={{
				flexDirection: "row",

				alignContent: "center",
				justifyContent: "center",
				alignItems: "center",
				padding: 4,
				borderRadius: 12,
			}}
			android_ripple={{
				color: theme.colors.ripple,
			}}
		>
			<View
				style={{
					borderRadius: 99,
					alignContent: "center",
					justifyContent: "center",
					alignItems: "center",
					padding: 8,
					backgroundColor: theme.colors.backgroundOpacity,
				}}
			>
				<Octicons name={icon} size={18} color={theme.colors.primary} />
			</View>

			<Text
				style={{
					flex: 1,
					marginHorizontal: 12,
					color: theme.colors.typography,
				}}
				variant="labelMedium"
			>
				{title}
			</Text>

			{isSwitch ? (
				<Switch
					color={theme.colors.primary}
					value={value}
					onChange={handleOnPress}
				/>
			) : null}
		</Pressable>
	);
};
