import React from "react";
import { Pressable, View } from "react-native";
import { Checkbox, Text } from "react-native-paper";
import { useUnistyles } from "react-native-unistyles";

type SelectionProps = {
	label: string;
	checked: boolean;
	onPress?: () => void;
};

const Selection = ({ label, checked, onPress }: SelectionProps) => {
	const { theme } = useUnistyles();

	return (
		<Pressable
			android_ripple={{
				color: "#eec67640",
				foreground: true,
			}}
			onPress={onPress}
			style={{
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				borderColor: checked
					? theme.colors.primary
					: theme.colors.borderInactive,
				overflow: "hidden",
				borderWidth: 1,
				padding: 4,
				paddingHorizontal: 8,
				marginVertical: 4,
				borderRadius: 8,
			}}
		>
			<Text
				style={{
					color: theme.colors.textOnSurface,
				}}
			>
				{label}
			</Text>
			<Checkbox
				color={theme.colors.primary}
				status={checked ? "checked" : "unchecked"}
			/>
		</Pressable>
	);
};

export default Selection;
