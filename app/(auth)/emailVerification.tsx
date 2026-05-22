import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { account } from '../(main)/calculation-logic/appwriteConfig';
import { useAppTranslation } from '../(main)/translations/data/translationCentralization';

const EmailVerification = () => {
	const { userId, secret } = useLocalSearchParams();
	const [loading, setLoading] = useState(true);
	const [verified, setVerified] = useState(false);
	const { t } = useAppTranslation();
	const router = useRouter();

	useEffect(() => {
		if (userId && secret) {
			confirmVerification();
		} else {
			setLoading(false);
		}
	}, [userId, secret]);

	const confirmVerification = async () => {
		try {
			await account.updateVerification(userId as string, secret as string);
			setVerified(true);

			setTimeout(() => {
				router.replace('/(main)');
			}, 2000);
		} catch (error: any) {
			Alert.alert(t('general.error'), t('invalid_or_expired_link'));
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			{loading ? (
				<ActivityIndicator size="large" color="#ff7d00" />
			) : verified ? (
				<View style={styles.successContainer}>
					<Text style={styles.successText}>✅ {t('connection_confirmed')}</Text>
				</View>
			) : (
				<Text style={styles.errorText}>{t('invalid_verification_link')}</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#15616d',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20
	},
	successContainer: {
		padding: 25,
		backgroundColor: '#28a745',
		borderRadius: 15,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	successText: {
		color: '#fff',
		fontSize: 22,
		fontWeight: 'bold',
		textAlign: 'center'
	},
	errorText: {
		color: '#ffecd1',
		fontSize: 16,
		textAlign: 'center'
	}
});

export default EmailVerification;
