import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { account } from './appwriteConfig';
import ForgotPasswordModal from '../modals-others/modalChangeResetPassword';
import { useRouter } from 'expo-router';
import { Models, AppwriteException } from 'react-native-appwrite';
import { getAppLogo } from '../calculation-logic/imagesLogic';
import { useAppTranslation } from '../translations/data/translationCentralization';

const LoginScreen = () => {
  const { t, currentLang, setLanguage } = useAppTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [userDisabled, setUserDisabled] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);

  const router = useRouter();

  const toggleLang = () => {
    const nextLang = currentLang === 'kab' ? 'fr' : 'kab';
    setLanguage(nextLang);
  };

  const handleLogin = async () => {
    if (email === '' || password === '') return;

    setInvalidEmail(false);
    setWrongPassword(false);
    setAccountNotFound(false);
    setUserDisabled(false);

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      setInvalidEmail(true);
      return;
    }

    try {
      await account.createEmailPasswordSession(email, password);
    } catch (error) {
      if ((error as AppwriteException).code === 401) {
        setWrongPassword(true);
      } else if ((error as AppwriteException).code === 404) {
        setAccountNotFound(true);
      } else if ((error as AppwriteException).code === 403) {
        setUserDisabled(true);
      } else {
        console.log("Erreur inattendue", error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background} />
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Image
            source={getAppLogo(false).source}
            style={{ width: getAppLogo(false).width as number, height: getAppLogo(false).height as number, borderRadius: 12 }}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity onPress={toggleLang} style={styles.langButton}>
          <Text style={styles.langButtonText}>
            {currentLang === 'kab' ? 'Taqvaylit' : 'Français'}
          </Text>
        </TouchableOpacity>

      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{t('welcome')}</Text>
        {!accountNotFound && (
          <>
            <Text style={styles.label}>{t('email')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('emailPlaceholder')}
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {invalidEmail && (
              <Text style={styles.errorText}>{t('auth/invalid-email')}</Text>
            )}
            <Text style={styles.label}>{t('password')}</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder='**********'
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword((prev: boolean) => !prev)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#001524" />
              </TouchableOpacity>
            </View>
            {wrongPassword && (
              <>
                <Text style={styles.errorText}>{t('auth/wrong-password')}</Text>
                <TouchableOpacity
                  style={styles.footerLinkContaineroub}
                  onPress={() => setShowResetModal(true)} // <-- AJOUTER CECI
                >
                  <Text style={styles.footerLink}>{t('forgotPassword')}</Text>
                </TouchableOpacity>
              </>
            )}

            {userDisabled && (
              <Text style={styles.errorText}>{t('auth/user-disabled')}</Text>
            )}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>{t('login')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.registerButton} onPress={() => router.push('/(main)/modals-others/registrationForm')}>
              <Text style={styles.registerButtonText}>{t('registerMySelf')}</Text>
            </TouchableOpacity>
          </>
        )}
        {accountNotFound && (
          <>
            <Text style={styles.notFoundText}>{t('auth/user-not-found')}</Text>
            <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(main)/modals-others/registrationForm')}>
              <Text style={styles.loginButtonText}>{t('registerMySelf')}</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerLinkContainer}
            onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.cegget.store')}
          >
            <Ionicons name={'storefront'} size={22} color="#15616d" />
            <Text style={styles.footerLink}>{t('titleMgz')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerLinkContainer}
            onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.cegget.driver')}
          >
            <Ionicons name={'bicycle'} size={22} color="#15616d" />
            <Text style={styles.footerLink}>{t('titleLvr')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ForgotPasswordModal
        visible={showResetModal}
        onClose={() => setShowResetModal(false)}
      />
    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ff7d00',
    opacity: 0.8,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 0,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#2d6a4f',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  langButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  langButtonText: {
    color: '#001524',
    fontSize: 15,
    fontWeight: '500',
    textDecorationLine: 'underline',
    textDecorationColor: '#15616d',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    alignSelf: 'center',
    color: '#15616d',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fafafa',
    borderWidth: 2,
    borderColor: '#15616d',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 2,
    borderColor: '#15616d',
    borderRadius: 5,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  footerLink: {
    fontSize: 15,
    color: '#001524',
    fontWeight: '600',
  },
  footerLinkContaineroub: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#15616d',
    maxWidth: '28%',
    marginTop: 20,
    marginBottom: 10,
  },
  footerLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#15616d',
  },
  loginButton: {
    backgroundColor: '#15616d',
    borderRadius: 5,
    paddingVertical: 12,
    alignSelf: 'center',
    marginTop: 15,
    width: '40%',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    alignSelf: 'center',
  },
  notFoundText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 600,
    alignSelf: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  footer: {
    marginTop: 45,
    alignItems: 'flex-start',
    gap: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    alignSelf: 'center',
    marginTop: 20,
  },
  registerButton: {
    backgroundColor: '#ffecd1',
    borderRadius: 5,
    paddingVertical: 12,
    alignSelf: 'center',
    marginTop: 10,
    width: '60%',
    borderWidth: 2,
    borderColor: '#15616d',
  },
  registerButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'center',
  },
});

export default LoginScreen;
