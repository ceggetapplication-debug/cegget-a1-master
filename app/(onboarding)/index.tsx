import Selection from "@/components/selection";
import { useI18n } from "@/hooks/language/useI18n";
import { useStore } from "@/services/store/store";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, Text, View } from "react-native";
import Modal from "react-native-modal";
import { Button, Checkbox } from "react-native-paper";
import {
	StyleSheet,
	UnistylesRuntime,
	useUnistyles,
} from "react-native-unistyles";
import { getAppLogo } from '../(main)/calculation-logic/imagesLogic';

export default function LanguageScreen() {
	const { theme } = useUnistyles();
	const [showModal, setShowModal] = useState(false);

	const [selectedLanguage, setSelectedLanguage] = useState("");

	const { t } = useTranslation();

	const { setSelectedLanguage: setLanguage, selectedLanguage: sl } = useStore();

	return (
		<View style={[styles.container]}>
			<View
				style={{
					flex: 1,
					alignContent: "center",
					justifyContent: "space-around",
					alignItems: "center",
				}}
			>
				<View
					style={{
						alignItems: "center",
					}}
				>
					<Image
						source={getAppLogo(true).source}
						style={{
							width: getAppLogo(true).width,
							height: getAppLogo(true).height,
						}}
						resizeMode="contain"
					/>
					<Text
						// variant="displaySmall"
						style={[
							{
								textAlign: "center",
								marginVertical: 8,
								color: theme.colors.typography,
							},
						]}
					>
						{"Cegget"}
					</Text>
					<Text
						// variant="bodyMedium"
						style={[
							{
								textAlign: "center",
								marginHorizontal: "5%",
								color: theme.colors.typography,
							},
						]}
					>
						{t("welcomeScreen.description")}
					</Text>
				</View>

				<Button onPress={() => setShowModal(true)} mode="outlined">
					{t("buttons.start")}
				</Button>
			</View>

			<Modal
				onBackdropPress={() => setShowModal(false)}
				isVisible={showModal}
				hideModalContentWhileAnimating={true} // required to remove the flickering on closing
				useNativeDriver={true} // required to remove the flickering on closing
				backdropTransitionOutTiming={700} // required to remove the flickering on closing
				animationIn="slideInUp"
				animationOut="slideOutDown"
				animationInTiming={700}
				animationOutTiming={700}
				style={{
					margin: 0,
					position: "absolute",
					bottom: 0,
					width: "100%",
				}}
			>
				<View
					style={{
						borderTopLeftRadius: 12,
						borderTopRightRadius: 12,

						paddingVertical: 16,

						paddingHorizontal: "5%",
						backgroundColor: theme.colors.surface,
					}}
				>
					<Text
						// variant="bodyLarge"
						style={{
							fontWeight: "bold",
							textAlign: "center",
							color: theme.colors.textOnSurface,
						}}
					>
						{t("modals.changeLanguage.title")}
					</Text>
					<Text
						// variant="bodySmall"
						style={{
							textAlign: "center",
							marginVertical: 8,
							color: theme.colors.textOnSurface,
						}}
					>
						{t("modals.changeLanguage.description")}
					</Text>

					<Selection
						label="Kabyle"
						checked={selectedLanguage === "kabyle"}
						onPress={() => setSelectedLanguage("kabyle")}
					/>

					<Selection
						label="Français"
						checked={selectedLanguage === "french"}
						onPress={() => setSelectedLanguage("french")}
					/>

					<Button
						disabled={!selectedLanguage}
						style={{
							marginVertical: 8,
							backgroundColor: theme.colors.primary,
						}}
						onPress={() => {
							setShowModal(false);
							setLanguage(selectedLanguage);
						}}
						mode="contained-tonal"
					>
						Suivant
					</Button>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
}));
