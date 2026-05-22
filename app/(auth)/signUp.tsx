import Selection from "@/components/selection";
import { client } from "@/services/api/init";
import {
	useNavigation,
	NavigationProp,
	ParamListBase,
} from "@react-navigation/native";

import { useState } from "react";
import { Image, Pressable, TextInput, ToastAndroid, View } from "react-native";
import { Account, ID } from "react-native-appwrite";
import Modal from "react-native-modal";
import { Button, Checkbox, Text } from "react-native-paper";
import {
	StyleSheet,
	UnistylesRuntime,
	useUnistyles,
} from "react-native-unistyles";
import { getAppLogo } from '../(main)/calculation-logic/imagesLogic';

import { useI18n } from "@/hooks/language/useI18n";
import { useStore } from "@/app/(main)/calculation-logic/store";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

type Inputs = {
	username: string;
	email: string;
	password: string;
};

export default function SignUpScreen() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const { replace } = useNavigation<NavigationProp<ParamListBase>>();

	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<Inputs>({
		mode: "onChange",
	});

	const { toggleLanguage } = useI18n();

	const [isLoading, setIsLoading] = useState(false);
	const { user, setUser } = useStore();

	const signup = async (data: Inputs) => {
		try {
			setIsLoading(true);
			const account = new Account(client);

			const result = await account.create(
				ID.unique(),
				data.email,
				data.password,
				data.username,
			);

			setUser(result);
			console.log("🚀 ~ file: index.tsx:46 ~ login ~ result:", result);
		} catch (error: any) {
			console.log("error", error);
			ToastAndroid.show(error.code, ToastAndroid.SHORT);
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
						{t("auth.signup.title")}
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
						{t("auth.signup.description")}
					</Text>

					<View
						style={{
							marginHorizontal: "4%",
						}}
					>
						<Controller
							control={control}
							rules={{
								required: t("auth.signup.username.errors.field_required"),
								min: {
									value: 6,
									message: t("auth.signup.username.errors.invalid"),
								},
							}}
							render={({ field: { onChange, onBlur, value } }) => (
								<TextInput
									placeholder={t("auth.signup.username.placeholder")}
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
									keyboardType="default"
									autoCapitalize="none"
								/>
							)}
							name="username"
						/>

						{errors.username && (
							<Text
								style={{
									color: "red",
								}}
							>
								{errors.username.message}
							</Text>
						)}

						<Controller
							control={control}
							rules={{
								required: t("auth.signup.email.errors.field_required"),
								pattern: {
									value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
									message: t("auth.signup.email.errors.invalid"),
								},
							}}
							render={({ field: { onChange, onBlur, value } }) => (
								<TextInput
									placeholder={t("auth.signup.email.placeholder")}
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
								required: t("auth.signup.password.errors.field_required"),
								minLength: {
									value: 6,
									message: t("auth.signup.password.errors.min", { count: 6 }),
								},
							}}
							render={({ field: { onChange, onBlur, value } }) => (
								<TextInput
									placeholder={t("auth.signup.password.placeholder")}
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

					<Button
						loading={isLoading}
						style={{
							marginHorizontal: "4%",
							marginVertical: "8%",
							backgroundColor: theme.colors.primary,
						}}
						mode="contained-tonal"
						onPress={handleSubmit(signup)}
					>
						{t("buttons.signup")}
					</Button>

					<Pressable
						onPress={() => replace("login")}
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
							{"Vous avez déja un compte ? "}
							<Text
								style={{
									color: theme.colors.textOnSurface,
								}}
							>
								{"Se connecter"}
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
