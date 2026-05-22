import Selection from "@/components/selection";
import { client } from "@/services/api/init";
import {
	NavigationProp,
	NavigationState,
	ParamListBase,
	useNavigation,
} from "@react-navigation/native";
import { useState } from "react";
import { Image, Pressable, TextInput, ToastAndroid, View } from "react-native";
import { Account } from "react-native-appwrite";
import Modal from "react-native-modal";
import { Button, Checkbox, Text } from "react-native-paper";
import {
	StyleSheet,
	UnistylesRuntime,
	useUnistyles,
} from "react-native-unistyles";
import { getAppLogo } from '../(main)/calculation-logic/imagesLogic';

import { useI18n } from "@/hooks/language/useI18n";
import { useStore } from "@/services/store/store";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

type Inputs = {
	email: string;
	password: string;
};

export default function LoginScreen() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const { user, setUser } = useStore();
	const navigation = useNavigation<NavigationProp<ParamListBase>>();

	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<Inputs>({
		mode: "onChange",
	});

	const [isLoading, setIsLoading] = useState(false);

	const login = async (data: Inputs) => {
		try {
			setIsLoading(true);
			const account = new Account(client);

			const result = await account.createEmailPasswordSession(
				data.email,
				data.password,
			);

			setUser(result);
		} catch (error: any) {
			console.log("error", error);
			ToastAndroid.show(error, ToastAndroid.SHORT);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<View style={[styles.container]}>
			<View
				style={{
					flex: 1,
					alignContent: "center",
					// justifyContent: "space-around",
					alignItems: "center",
				}}
			>
				<View
					style={{
						alignItems: "center",
						marginVertical: "5%",
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
						variant="bodyMedium"
						style={[
							{
								textAlign: "center",
								fontWeight: "bold",
								marginVertical: 8,
								color: theme.colors.typography,
							},
						]}
					>
						{"Cegget"}
					</Text>
				</View>

				<View
					style={{
						flex: 1,
						backgroundColor: theme.colors.surface,
						width: "100%",
						borderTopLeftRadius: 24,
						borderTopRightRadius: 24,
					}}
				>
					<Text
						variant="bodyMedium"
						style={[
							{
								textAlign: "center",
								fontWeight: "bold",
								marginVertical: 8,
								color: theme.colors.textOnSurface,
							},
						]}
					>
						{t("auth.login.title")}
					</Text>

					<Text
						variant="bodySmall"
						style={[
							{
								textAlign: "center",
								fontWeight: "bold",
								marginVertical: 8,
								marginHorizontal: "5%",
								color: theme.colors.captionOnSurface,
							},
						]}
					>
						{t("auth.login.description")}
					</Text>

					<View
						style={{
							marginHorizontal: "4%",
						}}
					>
						<Controller
							control={control}
							rules={{
								required: t("auth.login.email.errors.field_required"),
								pattern: {
									value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
									message: t("auth.login.email.errors.invalid"),
								},
							}}
							render={({ field: { onChange, onBlur, value } }) => (
								<TextInput
									placeholder={t("auth.login.email.placeholder")}
									placeholderTextColor={theme.colors.captionOnSurface}
									style={{
										borderWidth: 1,
										borderColor: theme.colors.borderInactive,
										color: theme.colors.textOnSurface,
										paddingVertical: 12,
										paddingHorizontal: 8,
										borderRadius: 6,
										height: 40,
										marginVertical: 6,
									}}
									onBlur={onBlur}
									onChangeText={onChange}
									value={value}
									keyboardType="email-address"
									autoCapitalize="none"
								/>
							)}
							name="email"
						/>

						{errors.email && (
							<Text
								style={{
									color: "red",
								}}
							>
								{errors.email.message}
							</Text>
						)}

						<Controller
							control={control}
							rules={{
								required: t("auth.login.password.errors.field_required"),
								minLength: {
									value: 6,
									message: t("auth.login.password.errors.min", { count: 6 }),
								},
							}}
							render={({ field: { onChange, onBlur, value } }) => (
								<TextInput
									placeholder={t("auth.login.password.placeholder")}
									placeholderTextColor={theme.colors.captionOnSurface}
									style={{
										borderWidth: 1,
										borderColor: theme.colors.borderInactive,
										color: theme.colors.textOnSurface,
										paddingVertical: 12,
										paddingHorizontal: 8,
										height: 40,
										borderRadius: 6,
										marginVertical: 6,
									}}
									onBlur={onBlur}
									onChangeText={onChange}
									value={value}
									secureTextEntry
								/>
							)}
							name="password"
						/>

						{errors.password && (
							<Text
								style={{
									color: "red",
								}}
							>
								{errors.password.message}
							</Text>
						)}
					</View>

					<Pressable
						android_ripple={{
							color: theme.colors.ripple,
						}}
						style={{
							alignSelf: "flex-end",
							alignContent: "center",
							alignItems: "center",
							marginHorizontal: "4%",
						}}
					>
						<Text
							variant="bodySmall"
							style={{
								textAlign: "left",

								color: theme.colors.primary,
							}}
						>
							{"Mot de passe oublié ? "}
						</Text>
					</Pressable>

					<Button
						loading={isLoading}
						style={{
							marginHorizontal: "4%",
							marginVertical: "8%",
							backgroundColor: theme.colors.primary,
						}}
						mode="contained-tonal"
						onPress={handleSubmit(login)}
					>
						{t("buttons.login")}
					</Button>

					<Pressable
						onPress={() => navigation.replace("signup")}
						android_ripple={{
							color: theme.colors.ripple,
						}}
						style={{
							alignSelf: "center",
							alignContent: "center",
							alignItems: "center",
							marginTop: "5%",
							marginHorizontal: "4%",
						}}
					>
						<Text
							variant="bodySmall"
							style={{
								textAlign: "center",
								color: theme.colors.primary,
							}}
						>
							{"Vous n'avez pas de compte ? "}
							<Text
								style={{
									color: theme.colors.textOnSurface,
								}}
							>
								{"S'inscrire"}
							</Text>
						</Text>
					</Pressable>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
}));
