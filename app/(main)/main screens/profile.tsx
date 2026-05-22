import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, Alert, TextInput, Modal, Pressable, Switch, Linking, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import InviteFriendsModal from '../modals-others/InviteFriendsModal';
import { account, databases, config } from '../calculation-logic/appwriteConfig';
import { Query, ID } from 'react-native-appwrite';
import { router } from 'expo-router';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import { buildProfilePhoto, uploadToR2, sizes } from '../calculation-logic/imagesLogic';
import ForgotPasswordModal from '../modals-others/modalChangeResetPassword';
import { useAppTranslation } from '../translations/data/translationCentralization';
import PremiumUtiliOffersModal from '../modals-others/modalPremiums';

interface UserProfile {
    pseudo: string;
    address: string;
    photoURL?: string;
    email: string;
    phoneNumber: string;
}

const initialUserData: UserProfile = {
    pseudo: "",
    address: "",
    photoURL: undefined,
    email: "",
    phoneNumber: "",
};

interface SelectedOfferDetails {
    type: 'advantage' | 'subscription';
    label: string;
    price: number;
    confirmationTitle: string;
    confirmationBody: string;
    value?: number;
    months?: number;
}


function ProfileScreen() {
    const [currentUserData, setCurrentUserData] = useState<UserProfile>(initialUserData);
    const [currentView, setCurrentView] = useState<'menu' | 'accountDetails' | 'languages' | 'notifications'>('menu');
    const [isEditingPseudo, setIsEditingPseudo] = useState(false);
    const [editedPseudo, setEditedPseudo] = useState(currentUserData.pseudo);
    const [arePushNotificationsEnabled, setArePushNotificationsEnabled] = useState(false);
    const { t, currentLang, setLanguage } = useAppTranslation();
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [phoneModalVisible, setPhoneModalVisible] = useState(false);
    const [contactModalVisible, setContactModalVisible] = useState(false);
    const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [avantagesModalVisible, setAvantagesModalVisible] = useState(false);
    const [currentPasswordInput, setCurrentPasswordInput] = useState('');
    const [newPasswordInput, setNewPasswordInput] = useState('');
    const [newPhoneInput, setNewPhoneInput] = useState('');
    const [verificationCodeInput, setVerificationCodeInput] = useState('');
    const [showPasswordCodeInput, setShowPasswordCodeInput] = useState(false);
    const [showPhoneCodeInput, setShowPhoneCodeInput] = useState(false);
    const [numberOfFreeDeliveries, setNumberOfFreeDeliveries] = useState(0);
    const [creditAmount, setCreditAmount] = useState(0);
    const [isPremium, setIsPremium] = useState(false);
    const [isPremiumOffersVisible, setIsPremiumOffersVisible] = useState(false);
    const [inviteFriendsModalVisible, setInviteFriendsModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [isResetPasswordVisible, setIsResetPasswordVisible] = useState(false);
    const [profileDocId, setProfileDocId] = useState<string>('');
    const [isArrivalNotifEnabled, setIsArrivalNotifEnabled] = useState(true);

    useEffect(() => {
        Notifications.setNotificationChannelAsync('arrival_channel', {
            name: 'Driver proche',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
        });
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                const userAccount = await account.get();
                setCurrentUserId(userAccount.$id);

                const response = await databases.listDocuments(
                    config.databaseId,
                    config.usersCollectionId,
                    [Query.equal('userId', userAccount.$id)]
                );

                if (response.documents.length > 0) {
                    const doc = response.documents[0];
                    setProfileDocId(doc.$id);
                    setCurrentUserData({
                        pseudo: doc.pseudo || "",
                        email: userAccount.email,
                        address: doc.address || "",
                        phoneNumber: doc.phoneNumber || "",
                        photoURL: buildProfilePhoto(userAccount.$id).avatar
                    });
                    setNumberOfFreeDeliveries(doc.livraisonsGratuites || 0);
                    setCreditAmount(doc.creditCC || 0);
                    setIsPremium(doc.isPremium || false);
                    if (doc.language) setLanguage(doc.language as 'fr' | 'kab');
                    setEditedPseudo(doc.pseudo || "");
                }
            } catch (error) {
                console.error("Erreur chargement profil Appwrite:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handlePressMenuItem = (menuKey: string) => {
        if (menuKey === 'account') {
            setCurrentView('accountDetails');
        } else if (menuKey === 'languages') {
            setCurrentView('languages');
        } else if (menuKey === 'notifications') {
            setCurrentView('notifications');
        } else if (menuKey === 'contactUs') {
            setContactModalVisible(true);
        } else if (menuKey === 'logout') {
            handleLogoutAlert();
        } else if (menuKey === 'deleteAccount') {
            setDeleteAccountModalVisible(true);
        } else if (menuKey === 'avantages') {
            setAvantagesModalVisible(true);
        }
    };

    const handleGoBackFromSubMenu = () => {
        setCurrentView('menu');
        setIsEditingPseudo(false);
        setEditedPseudo(currentUserData.pseudo);
    };

    const testNotification = async () => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "TITRE ICI",
                body: "TEXTE ICI",
                sound: 'default',
            },
            trigger: null,
        });
    };


    const renderMenuItem = (iconName: string, menuKey: string, label: string) => {
        let arrowIcon = 'chevron-forward';
        if (['contactUs', 'logout', 'deleteAccount'].includes(menuKey)) {
            arrowIcon = 'chevron-forward';
        } else if (menuKey === 'account' || menuKey === 'languages' || menuKey === 'notifications') {
            arrowIcon = 'chevron-forward';
        }
        let itemIcon = iconName;

        return (
            <View>
                <TouchableOpacity style={styles.menuItem} onPress={() => handlePressMenuItem(menuKey)}>
                    <View style={styles.menuItemLeft}>
                        <Ionicons name={itemIcon as any} size={24} color="#001524" style={{ marginRight: 10 }} />
                        <Text style={styles.menuItemText}>{label}</Text>
                    </View>
                    <Ionicons name={arrowIcon as any} size={20} color="#001524" />
                </TouchableOpacity>
                {currentView === 'notifications' && (
                    <View style={styles.accountDetailsContainer}>
                        <TouchableOpacity onPress={handleGoBackFromSubMenu} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color="#001524" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.accountDetailTitle}>{t('profileScreen.notifications')}</Text>
                            <View style={styles.accountDetailItem}>
                                <View style={styles.notificationOptionRow}>
                                    <Text style={styles.notificationOptionText}>{t('profileScreen.notifications')}</Text>
                                    <Switch
                                        trackColor={{ false: "#767577", true: "#ff7d00" }}
                                        thumbColor={arePushNotificationsEnabled ? "#001524" : "#f4f3f4"}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={handleToggleNotifications}
                                        value={arePushNotificationsEnabled}
                                    />
                                </View>
                            </View>
                            <View style={styles.accountDetailItem}>
                                <View style={styles.notificationOptionRow}>
                                    <Text style={styles.notificationOptionText}>{t('profileScreen.arrivalNotif')}</Text>
                                    <Switch
                                        trackColor={{ false: "#767577", true: "#ff7d00" }}
                                        thumbColor={isArrivalNotifEnabled ? "#001524" : "#f4f3f4"}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={handleToggleArrivalNotif}
                                        value={isArrivalNotifEnabled}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        );
    };


    const handlePressEditPseudo = async () => {
        if (isEditingPseudo) {
            try {
                const response = await databases.listDocuments(
                    config.databaseId,
                    config.usersCollectionId,
                    [Query.equal('userId', currentUserId)]
                );
                if (response.documents.length > 0) {
                    await databases.updateDocument(
                        config.databaseId,
                        config.usersCollectionId,
                        response.documents[0].$id,
                        { pseudo: editedPseudo }
                    );

                    setCurrentUserData({ ...currentUserData, pseudo: editedPseudo });
                    Alert.alert(t('general.success'), t('profileScreen.pseudoUpdatedSuccess') || "Pseudo mis à jour !");
                }
            } catch (error) {
                console.error("Erreur mise à jour pseudo:", error);
                Alert.alert(t('general.error'), t('genericError'));
            }
            setIsEditingPseudo(false);
        } else {
            setEditedPseudo(currentUserData.pseudo);
            setIsEditingPseudo(true);
        }
    };


    const handleChangePassword = () => {
        setIsResetPasswordVisible(true);
    };

    const handleSaveNewPassword = async () => {
        if (!currentPasswordInput || !newPasswordInput) {
            Alert.alert(t('general.error'), t('profileScreen.passwordFieldsRequired'));
            return;
        }
        try {
            setIsLoading(true);
            await account.createEmailToken(ID.unique(), currentUserData.email);
            setShowPasswordCodeInput(true);
        } catch (error) {
            console.error("Erreur envoi code mot de passe:", error);
            Alert.alert(t('general.error'), t('genericError'));
        } finally {
            setIsLoading(false);
        }
    };


    const handleVerifyPasswordCode = () => {
        if (!verificationCodeInput) {
            Alert.alert(t('general.error'), t('profileScreen.enterVerificationCodeError'));
            return;
        }

        Alert.alert(t('general.success'), t('profileScreen.passwordUpdatedSuccess'), [
            { text: "OK", onPress: () => { setPasswordModalVisible(false); setShowPasswordCodeInput(false); } }
        ]);
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setVerificationCodeInput('');

    };

    const handleChangePhoneNumber = () => {
        setNewPhoneInput('');
        setVerificationCodeInput('');
        setShowPhoneCodeInput(false);
        setPhoneModalVisible(true);
    };

    const handleSaveNewPhoneNumber = async () => {
        if (!newPhoneInput) {
            Alert.alert(t('general.error'), t('profileScreen.enterNewPhoneNumberError'));
            return;
        }
        try {
            setIsLoading(true);
            await account.createEmailToken(ID.unique(), currentUserData.email);
            setShowPhoneCodeInput(true);
        } catch (error) {
            console.error("Erreur envoi code téléphone:", error);
            Alert.alert(t('general.error'), t('genericError'));
        } finally {
            setIsLoading(false);
        }
    };



    const handleGoBackFromContactModal = () => {
        setContactModalVisible(false);
    };

    const handleUpgradePress = (offer: SelectedOfferDetails) => {
        console.log("Offre premium sélectionnée :", offer.label);
    };

    const handleGoBackFromDeleteAccountModal = () => {
        setDeleteAccountModalVisible(false);
        setDeleteReason('');
    };

    const handleVerifyPhoneCode = async () => {
        if (!verificationCodeInput) {
            Alert.alert(t('general.error'), t('profileScreen.enterVerificationCodeError'));
            return;
        }

        try {
            setIsLoading(true);
            const response = await databases.listDocuments(
                config.databaseId,
                config.usersCollectionId,
                [Query.equal('userId', currentUserId)]
            );
            if (response.documents.length > 0) {
                await databases.updateDocument(
                    config.databaseId,
                    config.usersCollectionId,
                    response.documents[0].$id,
                    { phoneNumber: newPhoneInput }
                );
            }
            setCurrentUserData({ ...currentUserData, phoneNumber: newPhoneInput });
            Alert.alert(t('general.success'), t('profileScreen.phoneNumberUpdatedSuccess'));
            setPhoneModalVisible(false);
            setShowPhoneCodeInput(false);
            setNewPhoneInput('');
            setVerificationCodeInput('');
        } catch (error) {
            console.error("Erreur vérification téléphone:", error);
            Alert.alert(t('general.error'), t('genericError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleLanguageSelect = async (languageCode: string) => {
        try {
            await databases.updateDocument(
                config.databaseId,
                config.usersCollectionId,
                profileDocId,
                { language: languageCode }
            );
            setLanguage(languageCode as 'fr' | 'kab');

            Alert.alert(
                t('selectedLongwaj'),
                t('yoSelectoddo') + ': ' + (languageCode === 'kab' ? 'Taqvaylit (kab)' : 'Français (fr)')
            );
            handleGoBackFromSubMenu();
        } catch (error) {
            console.error("Erreur enregistrement langue Appwrite:", error);
            Alert.alert(t('general.error'), t('genericError'));
        }
    };

    const handleContactByEmail = () => {
        setContactModalVisible(false);
        const emailAddress = 'support@ceggetges.com';
        const subject = 'Contact via application driver';
        const body = 'Bonjour, je souhaite vous contacter concernant...';
        const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        Linking.openURL(mailtoUrl).catch((err: Error) => {
            Alert.alert(t('general.error'), t('genericError'));
            console.error("Failed to open email app:", err);
        });
    };

    const handleContactByPhone = () => {
        setContactModalVisible(false);
        const phoneNumber = '0XXXXXXXXX';
        Linking.openURL(`tel:${phoneNumber}`).catch((err: Error) => {
            Alert.alert(t('general.error'), t('genericError'));
            console.error("Failed to open phone app:", err);
        });
    };


    const handleLogout = async () => {
        try {
            await account.deleteSession('current');
            router.replace('/(auth)/sign-in');
        } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
            Alert.alert(t('general.error'), t('genericError'));
        }
    };


    const handleLogoutAlert = () => {
        Alert.alert(
            t('profileScreen.logout'),
            t('profileScreen.logoutAlertMessage'),
            [
                {
                    text: t('general.cancel'),
                    style: "cancel"
                },
                {
                    text: t('profileScreen.logout'),
                    onPress: handleLogout,
                    style: "destructive"
                }
            ],
            { cancelable: true }
        );
    };


    const handleDeleteAccount = async () => {
        try {
            setIsLoading(true);
            setDeleteAccountModalVisible(false);
            if (deleteReason.trim()) {
                try {
                    await databases.createDocument(
                        config.databaseId,
                        config.feedbackCollectionId, // <--- On utilise le config ici
                        ID.unique(),
                        {
                            userId: currentUserId,
                            pseudo: currentUserData.pseudo,
                            raison: deleteReason,
                            date: new Date().toISOString()
                        }
                    );
                } catch (err) {
                    console.error("Erreur enregistrement raison:", err);
                }
            }


            const response = await databases.listDocuments(
                config.databaseId,
                config.usersCollectionId,
                [Query.equal('userId', currentUserId)]
            );

            if (response.documents.length > 0) {
                await databases.deleteDocument(
                    config.databaseId,
                    config.usersCollectionId,
                    response.documents[0].$id
                );
            }
            await account.deleteSession('current');
            router.replace('/(auth)/sign-in');

        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
            Alert.alert(t('general.error'), t('genericError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleNotifications = (value: boolean) => {
        setArePushNotificationsEnabled(value);
        OneSignal.User.addTag("wants_general_push", value ? "true" : "false");
    };

    const handleToggleArrivalNotif = (value: boolean) => {
        setIsArrivalNotifEnabled(value);
        OneSignal.User.addTag("wants_arrival_siren", value ? "true" : "false");
    };



    const handlePressEditPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('general.requiredPermission'), t('jjaghANzerLesToffik'));
            Linking.openSettings();
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedAsset = result.assets[0];

            try {
                setIsLoading(true);
                const fileToUpload = {
                    uri: selectedAsset.uri,
                    name: selectedAsset.fileName || 'profile.jpg',
                    type: selectedAsset.mimeType || 'image/jpeg',
                };
                await uploadToR2(`profils/${currentUserId}.jpg`, fileToUpload);
                const updatedPhoto = buildProfilePhoto(currentUserId).avatar;
                setCurrentUserData({ ...currentUserData, photoURL: updatedPhoto });

                Alert.alert(t('general.success'), t('profileScreen.photoUpdatedSuccess') || "Photo mise à jour !");
            } catch (error) {
                console.error("Erreur upload photo:", error);
                Alert.alert(t('general.error'), t('genericError'));
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <View style={styles.container}>
            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#ff7d00" />
                </View>
            ) : (
                <>
                    {currentView === 'menu' && (
                        <>
                            <View style={styles.profileHeader}>
                                <View style={styles.photoContainer}>
                                    <Image
                                        style={styles.profilePhoto}
                                        source={{ uri: currentUserData.photoURL || 'URL_IMAGE_PAR_DEFAUT' }}
                                    />
                                    <TouchableOpacity style={styles.editPhotoIcon} onPress={handlePressEditPhoto}>
                                        <Ionicons name="camera-outline" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.pseudoText}>{currentUserData.pseudo}</Text>
                                    <Text style={styles.zoneText}>{currentUserData.address}</Text>
                                </View>
                            </View>

                            <View style={styles.menuContainer}>
                                {renderMenuItem("person-outline", "account", t('profileScreen.account'))}
                                {renderMenuItem("language-outline", "languages", t('profileScreen.languages'))}
                                {renderMenuItem("notifications-outline", "notifications", t('profileScreen.notifications'))}
                                {renderMenuItem("gift-outline", "avantages", t('profileScreen.avontajeu'))}
                                {renderMenuItem("call-outline", "contactUs", t('profileScreen.contactUs'))}
                                {renderMenuItem("log-out-outline", "logout", t('profileScreen.logout'))}
                                {renderMenuItem("trash-outline", "deleteAccount", t('profileScreen.deleteAccount'))}
                            </View>
                        </>
                    )}

                    {currentView === 'accountDetails' && (
                        <View style={styles.accountDetailsContainer}>
                            <View style={styles.headerElements}>
                                <TouchableOpacity onPress={handleGoBackFromSubMenu} style={styles.backButton}>
                                    <Ionicons name="chevron-back" size={24} color="#001524" />
                                </TouchableOpacity>

                                <Text style={styles.accountDetailTitle}>{t('profileScreen.accountDetailsTitle')}</Text>
                            </View>
                            <View style={styles.accountDetailItem}>
                                <Text style={styles.accountDetailLabel}>{t('profileScreen.pseudo')}</Text>
                                <View style={styles.accountDetailValueRow}>
                                    {isEditingPseudo ? (
                                        <TextInput
                                            style={styles.pseudoInputEdit}
                                            value={editedPseudo}
                                            onChangeText={setEditedPseudo}
                                            autoFocus={true}
                                            onBlur={() => handlePressEditPseudo()}
                                        />
                                    ) : (
                                        <Text style={styles.accountDetailValue}>{currentUserData.pseudo}</Text>
                                    )}
                                    <TouchableOpacity onPress={handlePressEditPseudo}>
                                        <Ionicons
                                            name={isEditingPseudo ? "checkmark-circle-outline" : "create-outline"}
                                            size={20}
                                            color="#15616d"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.accountDetailItem}>
                                <Text style={styles.accountDetailLabel}>{t('profileScreen.email')}</Text>
                                <View style={styles.accountDetailValueRow}>
                                    <Text style={styles.accountDetailValue}>{currentUserData.email}</Text>
                                </View>
                            </View>
                            <View style={styles.accountDetailItem}>
                                <Text style={styles.accountDetailLabel}>{t('profileScreen.password')}</Text>
                                <View style={styles.accountDetailValueRow}>
                                    <Text style={styles.accountDetailValue}>********</Text>
                                    <TouchableOpacity onPress={() => setIsResetPasswordVisible(true)}>
                                        <Ionicons name="create-outline" size={20} color="#15616d" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.accountDetailItem}>
                                <Text style={styles.accountDetailLabel}>{t('profileScreen.phoneNumber')}</Text>
                                <View style={styles.accountDetailValueRow}>
                                    <Text style={styles.accountDetailValue}>{currentUserData.phoneNumber}</Text>
                                    <TouchableOpacity onPress={handleChangePhoneNumber}>
                                        <Ionicons name="create-outline" size={20} color="#15616d" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {currentView === 'languages' && (
                        <View style={styles.languagesContainer}>
                            <View style={styles.headerElements}>
                                <TouchableOpacity onPress={handleGoBackFromSubMenu}>
                                    <Ionicons name="chevron-back" size={24} color="#001524" />
                                </TouchableOpacity>
                                <Text style={styles.accountDetailTitle}>{t('profileScreen.languagesTitle')}</Text>
                            </View>
                            <View>
                                <TouchableOpacity style={styles.languageItem} onPress={() => handleLanguageSelect('kab')}>
                                    <Text style={styles.languageText}>Taqvaylit (kab)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.languageItem} onPress={() => handleLanguageSelect('fr')}>
                                    <Text style={styles.languageText}>Français (fr)</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {currentView === 'notifications' && (
                        <View style={styles.accountDetailsContainer}>
                            <View style={styles.headerElements}>
                                <TouchableOpacity onPress={handleGoBackFromSubMenu} style={styles.backButton}>
                                    <Ionicons name="chevron-back" size={24} color="#001524" />
                                </TouchableOpacity>
                                <Text style={styles.accountDetailTitle}>{t('profileScreen.notifications')}</Text>
                            </View>
                            <TouchableOpacity style={[styles.modalButton, styles.modalButtonSave]} onPress={testNotification}>
                                <Text style={styles.textStyle}>{t('12seize')}</Text>
                            </TouchableOpacity>
                            <View>
                                <View style={styles.accountDetailItem}>
                                    <View style={styles.notificationOptionRow}>
                                        <Text style={styles.notificationOptionText}>{t('profileScreen.notifications')}</Text>
                                        <Switch
                                            trackColor={{ false: "#767577", true: "#ff7d00" }}
                                            thumbColor={arePushNotificationsEnabled ? "#001524" : "#f4f3f4"}
                                            ios_backgroundColor="#3e3e3e"
                                            onValueChange={handleToggleNotifications}
                                            value={arePushNotificationsEnabled}
                                        />
                                    </View>
                                </View>
                                <View style={styles.accountDetailItem}>
                                    <View style={styles.notificationOptionRow}>
                                        <Text style={styles.notificationOptionText}>{t('profileScreen.arrivalNotif')}</Text>
                                        <Switch
                                            trackColor={{ false: "#767577", true: "#ff7d00" }}
                                            thumbColor={isArrivalNotifEnabled ? "#001524" : "#f4f3f4"}
                                            ios_backgroundColor="#3e3e3e"
                                            onValueChange={handleToggleArrivalNotif}
                                            value={isArrivalNotifEnabled}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    <Modal
                        transparent={true}
                        visible={passwordModalVisible}
                        onRequestClose={() => {
                            setPasswordModalVisible(!passwordModalVisible);
                            setShowPasswordCodeInput(false);
                        }}
                    >
                        <View style={styles.centeredView}>
                            <View style={styles.modalView}>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity onPress={() => { setPasswordModalVisible(false); setShowPasswordCodeInput(false); }} style={styles.backButtonModal}>
                                        <Ionicons name="chevron-back" size={24} color="#001524" />
                                    </TouchableOpacity>
                                    <Text style={styles.modalTitle}>{t('profileScreen.changePasswordTitle')}</Text>
                                    <View style={{ width: 24 }} />
                                </View>

                                {!showPasswordCodeInput ? (
                                    <>
                                        <Text style={styles.modalLabel}>{t('profileScreen.currentPassword')}</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            placeholder={t('profileScreen.currentPasswordPlaceholder')}
                                            secureTextEntry={true}
                                            value={currentPasswordInput}
                                            onChangeText={setCurrentPasswordInput}
                                        />
                                        <Text style={styles.modalLabel}>{t('profileScreen.newPassword')}</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            placeholder={t('profileScreen.newPasswordPlaceholder')}
                                            secureTextEntry={true}
                                            value={newPasswordInput}
                                            onChangeText={setNewPasswordInput}
                                        />
                                        <Text style={styles.passwordHintText}>
                                            {t('profileScreen.weakPasswordHint')}
                                        </Text>
                                        <Pressable
                                            style={[styles.modalButton, styles.modalButtonSave]}
                                            onPress={handleSaveNewPassword}
                                        >
                                            <Text style={styles.textStyle}>{t('profileScreen.changePasswordTitle')}</Text>
                                        </Pressable>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.modalMessage}>{t('profileScreen.emailCodeSentMessage')}</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            placeholder={t('profileScreen.enterCodePlaceholder')}
                                            keyboardType="number-pad"
                                            value={verificationCodeInput}
                                            onChangeText={setVerificationCodeInput}
                                        />
                                        <Pressable
                                            style={[styles.modalButton, styles.modalButtonSave]}
                                            onPress={handleVerifyPasswordCode}
                                        >
                                            <Text style={styles.textStyle}>{t('general.verifyCode')}</Text>
                                        </Pressable>
                                    </>
                                )}
                            </View>
                        </View>
                    </Modal>


                    <Modal
                        transparent={true}
                        visible={phoneModalVisible}
                        onRequestClose={() => {
                            setPhoneModalVisible(!phoneModalVisible);
                            setShowPhoneCodeInput(false);
                        }}
                    >
                        <View style={styles.centeredView}>
                            <View style={styles.modalView}>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity onPress={() => { setPhoneModalVisible(false); setShowPhoneCodeInput(false); }} style={styles.backButtonModal}>
                                        <Ionicons name="chevron-back" size={24} color="#001524" />
                                    </TouchableOpacity>
                                    <Text style={styles.modalTitle}>{t('profileScreen.changePhoneNumberTitle')} </Text>
                                    <View style={{ width: 24 }} />
                                </View>

                                {!showPhoneCodeInput ? (
                                    <>
                                        <Text style={styles.modalLabel}>{t('profileScreen.currentPhoneNumber')}</Text>
                                        <Text style={styles.modalValue}>{currentUserData.phoneNumber}</Text>
                                        <Text style={styles.modalLabel}>{t('profileScreen.newPhoneNumber')}</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            placeholder="0XXXXXXXXX"
                                            keyboardType="phone-pad"
                                            value={newPhoneInput}
                                            onChangeText={setNewPhoneInput}
                                        />
                                        <Pressable
                                            style={[styles.modalButton, styles.modalButtonSave]}
                                            onPress={handleSaveNewPhoneNumber}
                                        >
                                            <Text style={styles.textStyle}>{t('general.save')} </Text>
                                        </Pressable>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.modalMessage}>{t('profileScreen.phoneCodeSentMessage')}</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            keyboardType="number-pad"
                                            value={verificationCodeInput}
                                            onChangeText={setVerificationCodeInput}
                                        />
                                        <Pressable
                                            style={[styles.modalButton, styles.modalButtonSave]}
                                            onPress={handleVerifyPhoneCode}
                                        >
                                            <Text style={styles.textStyle}>{t('general.verifyCode')}</Text>
                                        </Pressable>
                                    </>
                                )}
                            </View>
                        </View>
                    </Modal>

                    <Modal
                        transparent={true}
                        visible={contactModalVisible}
                        onRequestClose={() => {
                            setContactModalVisible(!contactModalVisible);
                        }}
                    >
                        <View style={styles.centeredView}>
                            <View style={styles.modalView}>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity onPress={handleGoBackFromContactModal} style={styles.backButtonModal}>
                                        <Ionicons name="chevron-back" size={24} color="#001524" />
                                    </TouchableOpacity>
                                    <Text style={styles.modalTitle}>{t('profileScreen.contactUs')}</Text>
                                    <View style={{ width: 24 }} />
                                </View>

                                <TouchableOpacity style={styles.contactOption} onPress={handleContactByEmail}>
                                    <Ionicons name="mail-outline" size={24} color="#001524" style={{ marginRight: 10 }} />
                                    <Text style={styles.contactOptionText}>{t('profileScreen.contactByEmail')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.contactOption} onPress={handleContactByPhone}>
                                    <Ionicons name="call-outline" size={24} color="#001524" style={{ marginRight: 10 }} />
                                    <Text style={styles.contactOptionText}>{t('profileScreen.contactByPhone')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={avantagesModalVisible}
                        onRequestClose={() => setAvantagesModalVisible(false)}
                    >
                        <View style={styles.centeredView}>
                            <View style={styles.modalView}>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity onPress={() => setAvantagesModalVisible(false)} style={styles.backButtonModal}>
                                        <Ionicons name="chevron-back" size={24} color="#001524" />
                                    </TouchableOpacity>
                                    <Text style={styles.modalTitle}>{t('avantajAMwa')}</Text>
                                    <View style={{ width: 24 }} />
                                </View>

                                <View style={styles.accountDetailItem}>
                                    <Text style={styles.accountDetailLabel}>{t('ccLabel')}</Text>

                                    {isPremium ? (
                                        <>
                                            <Text style={styles.accountDetailValue}>{t('tuAs')}:</Text>
                                            <Text style={styles.modalMessage}>{creditAmount.toFixed(2)} DZD</Text>
                                            <Text style={styles.accountDetailValue}>{t('deCxxeditas')}.</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={[styles.accountDetailValue, { marginBottom: 8 }]}>
                                                {t('permiumForAdresses')}
                                            </Text>
                                            <TouchableOpacity
                                                style={[styles.modalButton, styles.modalButtonSave]}
                                                activeOpacity={0.7}
                                                onPress={() => setIsPremiumOffersVisible(true)}
                                            >
                                                <Text style={styles.textStyle}>Premium</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>

                                <View style={styles.accountDetailItem}>
                                    <Text style={styles.accountDetailLabel}>{t('free_delivery_title_modal')}</Text>
                                    <Text style={styles.accountDetailValue}>
                                        {t('free_delivery_available_count')} <Text style={styles.modalMessage}>{numberOfFreeDeliveries}</Text> {t('livsGratos')}.
                                        <Text style={styles.modalMessage}>{t('want_more_free_deliveries')}</Text>
                                    </Text>
                                    <Pressable style={[styles.modalButton, styles.modalButtonSave]} onPress={() => setInviteFriendsModalVisible(true)}>
                                        <Text style={styles.textStyle}>{t('invite_friends')}</Text>
                                    </Pressable>
                                </View>

                            </View>
                        </View>
                    </Modal>

                    <Modal
                        transparent={true}
                        visible={deleteAccountModalVisible}
                        onRequestClose={() => {
                            setDeleteAccountModalVisible(!deleteAccountModalVisible);
                            setDeleteReason('');
                        }}
                    >
                        <View style={styles.centeredView}>
                            <View style={styles.modalView}>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity onPress={handleGoBackFromDeleteAccountModal} style={styles.backButtonModal}>
                                        <Ionicons name="chevron-back" size={24} color="#001524" />
                                    </TouchableOpacity>
                                    <Text style={styles.modalTitle}>{t('profileScreen.deleteAccount')}</Text>
                                    <View style={{ width: 24 }} />
                                </View>
                                <Text style={[styles.modalMessage, { color: '#15616d', fontWeight: 'bold' }]}>
                                    {t('profileScreen.deleteAccountMessage')}
                                </Text>
                                <Text style={styles.modalLabel}>{t('profileScreen.deleteReasonLabel')}</Text>
                                <TextInput
                                    style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
                                    multiline={true}
                                    maxLength={150}
                                    value={deleteReason}
                                    onChangeText={setDeleteReason}
                                    placeholder={t('profileScreen.deleteReasonPlaceholder')}
                                />
                                <Text style={{ alignSelf: 'flex-end', fontSize: 12, color: '#000' }}>{deleteReason.length}/150</Text>

                                <Pressable
                                    style={[styles.modalButton, styles.modalButtonSave, { backgroundColor: '#001524', marginTop: 20 }]}
                                    onPress={handleDeleteAccount}
                                    disabled={!deleteReason.trim()}
                                >
                                    <Text style={[styles.textStyle, { opacity: deleteReason.trim() ? 1 : 0.5 }]}>{t('myNewsScreen.delete')}</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.modalButton, { backgroundColor: '#ff7d00', borderColor: '#001524' }]}
                                    onPress={handleGoBackFromDeleteAccountModal}
                                >
                                    <Text style={styles.textStyle}>{t('general.cancel')}</Text>
                                </Pressable>
                            </View>
                        </View>
                    </Modal>
                    <PremiumUtiliOffersModal
                        isVisible={isPremiumOffersVisible}
                        onClose={() => setIsPremiumOffersVisible(false)}
                        onUpgradePress={handleUpgradePress}
                    />
                    <InviteFriendsModal
                        isVisible={inviteFriendsModalVisible}
                        onClose={() => setInviteFriendsModalVisible(false)}
                        currentUserId={currentUserId}
                        successfulReferralsCount={numberOfFreeDeliveries}
                    />
                    <ForgotPasswordModal
                        visible={isResetPasswordVisible}
                        onClose={() => setIsResetPasswordVisible(false)}
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#15616d',
        padding: 10,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
        marginTop: 0,
    },
    photoContainer: {
        marginTop: 20,
        position: 'relative',
        marginRight: 10,
    },
    profilePhoto: {
        width: sizes().PROFIL_PIC,
        height: sizes().PROFIL_PIC,
        borderRadius: 8,
        borderColor: '#ff7d00',
        borderWidth: 1.5,
        backgroundColor: '#ccc',
    },
    editPhotoIcon: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userInfo: {
        justifyContent: 'center',
    },
    pseudoText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffecd1'
    },
    zoneText: {
        fontSize: 12,
        color: '#ff7d00',
    },
    menuContainer: {
        backgroundColor: '#fff',
        borderColor: '#ff7d00',
        borderWidth: 1.5,
        borderRadius: 10,
        paddingVertical: 15,
        elevation: 0,
        maxHeight: '55%',
        flex: 1,
        marginTop: 15,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#ffecd1',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    menuItemText: {
        fontSize: 14,
        marginLeft: 10,
        color: '#001524',
    },

    accountDetailsContainer: {
        flex: 0.86,
        backgroundColor: '#fff',
        borderColor: '#ff7d00',
        borderWidth: 1.5,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginTop: 100,
        elevation: 0,
        shadowColor: '#001524',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 3,
    },
    accountDetailTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'left',
        marginLeft: 5,
        color: '#001524',
        marginTop: 0,
    },
    accountDetailItem: {
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ffecd1',
        paddingBottom: 10,
    },
    accountDetailLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#001524',
        marginBottom: 0,
    },
    accountDetailValueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    accountDetailValue: {
        fontSize: 16,
        color: '#000',
    },
    pseudoInputEdit: {
        fontSize: 16,
        color: '#001524',
        borderBottomWidth: 1,
        borderBottomColor: '#15616d',
        paddingVertical: 0,
        flex: 1,
        marginRight: 10,
    },
    backButton: {
        padding: 0,
        marginTop: 0,
        marginBottom: 0,
        flexDirection: 'row',
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    modalView: {
        margin: 5,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 30,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    headerElements: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
        width: '100%',
        marginBottom: 5,
        height: '12%',
        marginTop: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'left',
        flex: 1,
        marginLeft: 20,
        color: '#001524',
    },
    backButtonModal: {
        padding: 0,
        alignSelf: 'flex-start',
    },
    modalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#001524',
        alignSelf: 'flex-start',
        marginTop: 0,
        marginBottom: 5,
    },
    modalValue: {
        fontSize: 16,
        color: '#000',
        alignSelf: 'flex-start',
        marginBottom: 10,
        marginLeft: 0,
    },
    modalInput: {
        borderWidth: 1.5,
        borderColor: '#ff7d00',
        borderRadius: 5,
        width: 300,
        padding: 10,
        marginBottom: 10,
        fontSize: 16,
        color: '#000',
    },
    passwordHintText: {
        fontSize: 11,
        color: '#001524',
        marginBottom: 15,
        textAlign: 'left',
        width: 300,
    },
    modalMessage: {
        fontSize: 15,
        color: '#ff7d00',
        marginBottom: 15,
        textAlign: 'center',
        width: 300,
    },
    modalButton: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        marginTop: 10,
        width: '55%',
    },
    modalButtonSave: {
        backgroundColor: '#15616d',
        alignItems: 'center',
        alignSelf: 'center',
        borderColor: '#ff7d00',
        borderWidth: 2,
    },
    textStyle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
    },
    languagesContainer: {
        flex: 0.85,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginTop: 200,
        elevation: 0,
        shadowColor: '#001524',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 5,
    },
    languageItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ffecd1',
    },
    languageText: {
        fontSize: 15,
        color: '#000',
    },
    notificationOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    notificationOptionText: {
        fontSize: 15,
        color: '#000',
    },
    contactOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ff7d00',
        width: '100%',
        marginBottom: 10,
    },
    contactOptionText: {
        fontSize: 14,
        color: '#000',
    },
});

export default ProfileScreen; 
