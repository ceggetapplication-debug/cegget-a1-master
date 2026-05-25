import React, { useState, useEffect, useCallback } from 'react';
import { useColorScheme, ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, Region } from 'react-native-maps';
import { account, databases, config, ID, r2Config, functions } from '@/app/(main)/calculation-logic/appwriteConfig';
import { useAppTranslation } from '@/app/(main)/translations/data/translationCentralization';
import { uploadToR2, R2File } from '@/app/(main)/calculation-logic/imagesLogic';
import { Colors } from '../appSellerColors';
import { COMMERCE_PERCENTAGES } from '../logic/gainSellerLogic';

interface Time {
  hour: string;
  minute: string;
}

interface RegistrationFormState {
  name: string;
  dob: string;
  phoneNumber: string;
  photo: string;
  imageId?: string | null;
  email: string;
  password: string;
  storeName: string;
  storeType: string | undefined;
  commercialRegistrationNumber: string;
  commune: string;
  village: string;
  location: { latitude: number; longitude: number } | null;
  workDays: string[];
  weekdayOpening: Time;
  weekdayClosing: Time;
  weekendOpening: Time;
  weekendClosing: Time;
}

const RegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<RegistrationFormState>({
    name: '',
    dob: '',
    phoneNumber: '',
    photo: '',
    imageId: '',
    email: '',
    password: '',
    storeName: '',
    storeType: undefined,
    commercialRegistrationNumber: '',
    commune: '',
    village: '',
    location: null,
    workDays: [],
    weekdayOpening: { hour: '', minute: '' },
    weekdayClosing: { hour: '', minute: '' },
    weekendOpening: { hour: '', minute: '' },
    weekendClosing: { hour: '', minute: '' },
  });

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme as 'light' | 'dark'];
  const styles = createStyles(theme);

  const { t } = useAppTranslation();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [dobError, setDobError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [weekdayTimeError, setWeekdayTimeError] = useState('');
  const [weekendTimeError, setWeekendTimeError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [tempSelectedLocation, setTempSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'commission'>('form');

  const storeTypes: string[] = ['fast', 'rest', 'sup', 'alim', 'frleg', 'pzpat', 'blnj', 'gatrad', 'prodcos', 'brtbc', 'bcvr', 'bcvb', 'pss', 'epss', 'cremerie'];
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const commerceKey = storeTypes[formData.storeType || ''] as keyof typeof COMMERCE_PERCENTAGES;
const commissionPercentage = commerceKey ? COMMERCE_PERCENTAGES[commerceKey] : 0;
const viewRate = commissionPercentage / 10;

  const handleInputChange = <K extends keyof RegistrationFormState>(field: K, value: RegistrationFormState[K]) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const daysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const validateDate = (dateString: string): string => {
    if (!dateString) return '';
    const parts = dateString.split('/').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return t('dobError');

    const day = parts[0];
    const month = parts[1];
    const year = parts[2];

    if (month < 1 || month > 12) {
      return t('errorBirthDateMonth');
    }

    if (day < 1 || day > daysInMonth(month, year)) {
      return t('errorBirthDateDay');
    }

    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 19) {
      return t('errorBirthDateAgeTooYoung', { age: age });
    }
    if (age > 100) {
      return t('errorBirthDateAgeTooOld', { age: age });
    }

    return '';
  };

  const handleDateChange = (text: string) => {
    let formattedText = text.replace(/[^0-9]/g, '');
    if (formattedText.length >= 2 && formattedText.charAt(2) !== '/') {
      formattedText = formattedText.slice(0, 2) + '/' + formattedText.slice(2);
    }
    if (formattedText.length >= 5 && formattedText.charAt(5) !== '/') {
      formattedText = formattedText.slice(0, 5) + '/' + formattedText.slice(5);
    }
    if (formattedText.length > 10) {
      formattedText = formattedText.slice(0, 10);
    }
    setFormData({ ...formData, dob: formattedText });
    if (formattedText.length === 10 || formattedText.length === 0) {
      setDobError(validateDate(formattedText));
    } else {
      setDobError('');
    }
  };


  const validatePhoneNumber = (phoneStr: string): string => {
    if (!phoneStr) return '';
    const cleaned = phoneStr.replace(/\s/g, '');
    if (cleaned.length !== 10) return t('errorPhoneIncomplete');
    if (!/^(05|06|07)\d{8}$/.test(cleaned)) return t('errorPhoneStart');
    return '';
  };

  const handlePhoneChange = (text: string) => {
    let formattedText = text.replace(/\D/g, '');
    if (formattedText.length > 10) formattedText = formattedText.slice(0, 10);

    let displayValue = '';
    if (formattedText.length > 0) displayValue += formattedText.slice(0, 2);
    if (formattedText.length > 2) displayValue += ' ' + formattedText.slice(2, 4);
    if (formattedText.length > 4) displayValue += ' ' + formattedText.slice(4, 6);
    if (formattedText.length > 6) displayValue += ' ' + formattedText.slice(6, 8);
    if (formattedText.length > 8) displayValue += ' ' + formattedText.slice(8, 10);

    setFormData({ ...formData, phoneNumber: displayValue });

    const cleaned = displayValue.replace(/\s/g, '');
    if (cleaned.length === 10 || cleaned.length === 0) {
      setPhoneError(validatePhoneNumber(cleaned));
    } else {
      setPhoneError('');
    }
  };
  const validateTime = useCallback((time: Time): string => {
    if (!time.hour && !time.minute) return '';
    const hour = parseInt(time.hour, 10);
    const minute = parseInt(time.minute, 10);

    if (time.hour.length !== 2 || time.minute.length !== 2 || isNaN(hour) || isNaN(minute)) {
      return t('timeFormatError');
    }


    if (hour < 0 || hour > 23) {
      return t('hoursError');
    }
    if (minute < 0 || minute > 59) {
      return t('minutesError');
    }

    return '';
  }, [t]);

  const validateTimePair = useCallback((open: Time, close: Time): string => {
    const openError = validateTime(open);
    if (openError) return openError;
    const closeError = validateTime(close);
    if (closeError) return closeError;

    if ((!open.hour || !open.minute) && (!close.hour || !close.minute)) return '';
    if ((!open.hour || !open.minute) || (!close.hour || !close.minute)) {
      return t('timeFormatError');
    }


    const openMinutes = parseInt(open.hour, 10) * 60 + parseInt(open.minute, 10);
    const closeMinutes = parseInt(close.hour, 10) * 60 + parseInt(close.minute, 10);

    if (closeMinutes < openMinutes) {
      return t('timeOrderError');
    }
    return '';
  }, [validateTime, t]);


  useEffect(() => {
    setWeekdayTimeError(validateTimePair(formData.weekdayOpening, formData.weekdayClosing));
  }, [formData.weekdayOpening, formData.weekdayClosing, validateTimePair]);

  useEffect(() => {
    setWeekendTimeError(validateTimePair(formData.weekendOpening, formData.weekendClosing));
  }, [formData.weekendOpening, formData.weekendClosing, validateTimePair]);


  const handleTimeChange = (timeField: 'weekdayOpening' | 'weekdayClosing' | 'weekendOpening' | 'weekendClosing', part: 'hour' | 'minute', value: string) => {
    const cleanedValue = value.replace(/\D/g, '');
    let formattedValue = cleanedValue;

    if (part === 'hour') {
      if (formattedValue.length > 2) formattedValue = formattedValue.slice(0, 2);
      const hour = parseInt(formattedValue, 10);
      if (formattedValue.length > 0 && (isNaN(hour) || hour < 0 || hour > 23)) {
        if (timeField.startsWith('weekday')) setWeekdayTimeError(t('hoursError'));
        if (timeField.startsWith('weekend')) setWeekendTimeError(t('hoursError'));
      } else {
        if (timeField.startsWith('weekday')) setWeekdayTimeError('');
        if (timeField.startsWith('weekend')) setWeekendTimeError('');
      }
    }
    if (part === 'minute') {
      if (formattedValue.length > 2) formattedValue = formattedValue.slice(0, 2);
      const minute = parseInt(formattedValue, 10);
      if (formattedValue.length > 0 && (isNaN(minute) || minute < 0 || minute > 59)) {
        if (timeField.startsWith('weekday')) setWeekdayTimeError(t('minutesError'));
        if (timeField.startsWith('weekend')) setWeekendTimeError(t('minutesError'));
      } else {
        if (timeField.startsWith('weekday')) setWeekdayTimeError('');
        if (timeField.startsWith('weekend')) setWeekendTimeError('');
      }
    }

    setFormData((prev: RegistrationFormState) => ({
      ...prev,
      [timeField]: {
        ...prev[timeField],
        [part]: formattedValue,
      }
    }));
  };

  const handleConfirmLocation = () => {
    if (tempSelectedLocation) {
      setFormData({ ...formData, location: tempSelectedLocation });
      Alert.alert(t('confirmLocationBtn'), t('locationSelectedText', { lat: tempSelectedLocation.latitude, lng: tempSelectedLocation.longitude }));
    } else {
      Alert.alert(t('general.error'), t('noLocationSelected'));
    }
  };

  const handleImportPhoto = async () => {
    try {
      let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('photoError'), t('photoPermissionDenied'));
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData({ ...formData, idPhotoUri: result.assets[0].uri });
      } else if (result.canceled) {
      }

    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(t('photoError'), t('importFailed'));
    }
  };

  const toggleWorkDay = (day: string) => {
    setFormData((prev: RegistrationFormState) => {
      const isSelected = prev.workDays.includes(day);
      if (isSelected) {
        return {
          ...prev,
          workDays: prev.workDays.filter((d: string) => d !== day),
        };
      } else {
        return {
          ...prev,
          workDays: [...prev.workDays, day],
        };
      }
    });
  };

  const uploadImage = async (uri: string, uid: string): Promise<string | null> => {
    if (!uri) return null;
    setIsLoading(true);
    try {
      const fileKey = `${r2Config.folders.IDS}${uid}.jpg`;

      const file: R2File = {
        uri: uri,
        name: `${uid}.jpg`,
        type: 'image/jpeg',
      };

      await uploadToR2(fileKey, file);

      const downloadURL = `${r2Config.publicUrl}/${fileKey}`;
      setIsLoading(false);
      return downloadURL;
    } catch (error) {
      const err = error as Error;
      console.error("Error uploading image:", err);
      Alert.alert(t('uploadPhotoFailed'), err.message || t('genericError'));
      setIsLoading(false);
      return null;
    }
  };

  const isFormValid = (): boolean => {
    const requiredFieldsFilled =
      formData.name.trim() !== '' &&
      formData.dob.trim() !== '' &&
      formData.phoneNumber.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.password.trim() !== '' &&
      formData.commercialRegistrationNumber.trim() !== '' &&
      formData.location !== null &&
      formData.idPhotoUri !== null &&
      formData.workDays.length > 0 &&
      formData.weekdayOpening.hour.trim() !== '' && formData.weekdayOpening.minute.trim() !== '' &&
      formData.weekdayClosing.hour.trim() !== '' && formData.weekdayClosing.minute.trim() !== '' &&
      formData.weekendOpening.hour.trim() !== '' && formData.weekendOpening.minute.trim() !== '' &&
      formData.weekendClosing.hour.trim() !== '' && formData.weekendClosing.minute.trim() !== '';

    const noErrors =
      dobError === '' &&
      phoneError === '' &&
      weekdayTimeError === '' &&
      weekendTimeError === '';

    const storeTypeSelected = formData.storeType !== undefined;

    return requiredFieldsFilled && noErrors && storeTypeSelected;
  }

  const isNextButtonEnabled = isFormValid() && !isLoading;
    const handleNext = () => {
    if (isFormValid()) {
      setCurrentStep('commission');
    } else {
      const missingFields = [];
      if (formData.name.trim() === '') missingFields.push(t('nameLabel'));
      if (formData.dob.trim() === '' || dobError !== '') missingFields.push(t('dobLabel') + (dobError ? ` (${dobError})` : ''));
      if (formData.phoneNumber.trim() === '' || phoneError !== '') missingFields.push(t('phoneLabel') + (phoneError ? ` (${phoneError})` : ''));
      if (formData.email.trim() === '') missingFields.push(t('emailLabel'));
      if (formData.password.trim() === '') missingFields.push(t('passwordLabel'));
      if (formData.commercialRegistrationNumber.trim() === '') missingFields.push(t('commercialRegLabel'));
      if (formData.location === null) missingFields.push(t('tab.gps'));
      if (formData.idPhotoUri === null) missingFields.push(t('idPhotoLabel'));
      if (formData.workDays.length === 0) missingFields.push(t('workDaysLabel'));
      if (formData.weekdayOpening.hour.trim() === '' || formData.weekdayOpening.minute.trim() === '' || weekdayTimeError !== '') missingFields.push(t('workHoursLabel') + ` (${t('weekdaysText')})` + (weekdayTimeError ? ` (${weekdayTimeError})` : ''));
      if (formData.weekendOpening.hour.trim() === '' || formData.weekendOpening.minute.trim() === '' || weekendTimeError !== '') missingFields.push(t('workHoursLabel') + ` (${t('weekendText')})` + (weekendTimeError ? ` (${weekendTimeError})` : ''));
      if (formData.storeType === undefined) missingFields.push(t('storeTypes'));
      let errorMessage = t('missingFieldsPrompt') + '\n\n' + missingFields.join('\n');
      Alert.alert(t('formIncompleteTitle'), errorMessage);
    }
  };

  const handleRegister = async () => {
    if (isFormValid()) {
      setIsLoading(true);
      try {
        const userAccount = await account.create(
          ID.unique(),
          formData.email,
          formData.password,
          formData.name
        );
        const uid = userAccount.$id;
        const idPhotoUrl = await uploadImage(formData.idPhotoUri as string, uid);
        if (!idPhotoUrl) {
          throw new Error('Failed to upload ID photo');
        }
        const storeData = {
          userId: uid,
          name: formData.name,
          dob: formData.dob,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          storeName: formData.storeName,
          storeType: formData.storeType,
          commercialRegistrationNumber: formData.commercialRegistrationNumber,
          commune: formData.commune,
          village: formData.village,
          latitude: formData.location?.latitude,
          longitude: formData.location?.longitude,
          workDays: formData.workDays,
          weekdayOpeningHour: formData.weekdayOpening.hour,
          weekdayOpeningMinute: formData.weekdayOpening.minute,
          weekdayClosingHour: formData.weekdayClosing.hour,
          weekdayClosingMinute: formData.weekdayClosing.minute,
          weekendOpeningHour: formData.weekendOpening.hour,
          weekendOpeningMinute: formData.weekendOpening.minute,
          weekendClosingHour: formData.weekendClosing.hour,
          weekendClosingMinute: formData.weekendClosing.minute,
          idPhotoUrl: idPhotoUrl,
          registrationDate: new Date().toISOString(),
          status: 'pending_approval'
        };
        await databases.createDocument(
          config.databaseId,
          config.storesCollectionId,
          uid,
          storeData
        );
        console.log('Inscription réussie, données enregistrées:', storeData);
        Alert.alert(t('general.success'), t('registrationSuccess'));
      } catch (error) {
        const err = error as Error & { code?: number };
        console.error('Appwrite registration error:', error);
        let errorMessage = t('registrationFailed');
        if (err.code === 409) {
          errorMessage = t('emailAlreadyInUse');
        } else if (err.message === 'Failed to upload ID photo') {
          errorMessage = t('uploadPhotoFailed');
        } else {
          errorMessage = `${t('registrationFailed')}: ${err.message}`;
        }
        Alert.alert(t('general.error'), errorMessage);
      } finally {
        setIsLoading(false);
      }
    } else {
      const missingFields = [];
      if (formData.name.trim() === '') missingFields.push(t('nameLabel'));
      if (formData.dob.trim() === '' || dobError !== '') missingFields.push(t('dobLabel') + (dobError ? ` (${dobError})` : ''));
      if (formData.phoneNumber.trim() === '' || phoneError !== '') missingFields.push(t('phoneLabel') + (phoneError ? ` (${phoneError})` : ''));
      if (formData.email.trim() === '') missingFields.push(t('emailLabel'));
      if (formData.password.trim() === '') missingFields.push(t('passwordLabel'));
      if (formData.commercialRegistrationNumber.trim() === '') missingFields.push(t('commercialRegLabel'));
      if (formData.location === null) missingFields.push(t('tab.gps'));
      if (formData.idPhotoUri === null) missingFields.push(t('idPhotoLabel'));
      if (formData.workDays.length === 0) missingFields.push(t('workDaysLabel'));
      if (formData.weekdayOpening.hour.trim() === '' || formData.weekdayOpening.minute.trim() === '' || weekdayTimeError !== '') missingFields.push(t('workHoursLabel') + ` (${t('weekdaysText')})` + (weekdayTimeError ? ` (${weekdayTimeError})` : ''));
      if (formData.weekendOpening.hour.trim() === '' || formData.weekendOpening.minute.trim() === '' || weekendTimeError !== '') missingFields.push(t('workHoursLabel') + ` (${t('weekendText')})` + (weekendTimeError ? ` (${weekendTimeError})` : ''));
      if (formData.storeType === undefined) missingFields.push(t('storeTypes'));

      let errorMessage = t('missingFieldsPrompt') + '\n\n' + missingFields.join('\n');
      Alert.alert(t('formIncompleteTitle'), errorMessage);
    }
  };

  const handleMapPress = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    setTempSelectedLocation(event.nativeEvent.coordinate);
  };

  if (currentStep === 'commission') {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{t('commissionTitle')}</Text>
        <Text style={styles.sidetitle}>{t('storeTypes')} :</Text>
        <Text style={styles.label}>{t(formData.storeType || '')}</Text>
        <Text style={styles.sidetitle}>{t('commissionOrders')}</Text>
        <Text style={styles.label}>{commissionPercentage}%</Text>
        <Text style={styles.infoText}>{t('commissionOrdersDesc')}</Text>
        <Text style={styles.sidetitle}>{t('commissionViews')}</Text>
        <Text style={styles.label}>{viewRate.toFixed(3)} DA / {t('perView')}</Text>
        <Text style={styles.infoText}>{t('commissionViewsDesc')}</Text>
        <Text style={styles.infoText}>({commissionPercentage}% / 10) × {t('totalViews')} — {t('pickupMultiplier')}</Text>
        <TouchableOpacity
          onPress={() => setTermsAccepted(!termsAccepted)}
          disabled={isLoading}
          style={styles.passwordInputContainer}
        >
          <Ionicons
            name={termsAccepted ? 'checkbox' : 'square-outline'}
            size={24}
            color={termsAccepted ? theme.green : theme.greyDes}
          />
          <Text style={styles.passwordInput}>{t('termsAcceptance')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.customButton, styles.nextButton, (!termsAccepted || isLoading) && styles.nextButtonDisabled]}
          onPress={handleRegister}
          disabled={!termsAccepted || isLoading}
        >
          <Text style={styles.customButtonText}>
            {isLoading ? <ActivityIndicator color={theme.accent} /> : t('acceptAndRegister')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.infoText}>{t('commissionNote')}</Text>
        <View style={{ height: 50 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('titleMgz')}</Text>
      <Text style={styles.sidetitle}>{t('aboutYou')}</Text>
      <Text style={styles.label}>{t('nameLabel')} :</Text>
      <TextInput
        style={styles.input}
        value={formData.name}
        onChangeText={(text: string) => handleInputChange('name', text)}
        placeholder={t('placeholderFullName')}
        keyboardType="default"
        autoCapitalize="words"
        editable={!isLoading}
      />
      <Text style={styles.label}>{t('dobLabel')} :</Text>
      <TextInput
        style={styles.input}
        value={formData.dob}
        onChangeText={handleDateChange}
        placeholder={t('dobPlaceholder')}
        keyboardType="number-pad"
        maxLength={10}
        editable={!isLoading}
      />

      {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}
      <Text style={styles.label}>{t('phoneLabel')} :</Text>
      <TextInput
        style={styles.input}
        value={formData.phoneNumber}
        onChangeText={handlePhoneChange}
        placeholder={'0XXXXXXXXX'}
        keyboardType="phone-pad"
        maxLength={14}
        editable={!isLoading}
      />

      <Text style={styles.sidetitle}>{t('connectionInfo')}</Text>
      <Text style={styles.label}>{t('emailLabel')} :</Text>
      <TextInput
        style={styles.input}
        value={formData.email}
        onChangeText={(text: string) => handleInputChange('email', text)}
        placeholder={t('profileScreen.newEmailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />
      <Text style={styles.label}>{t('passwordLabel')} :</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          value={formData.password}
          onChangeText={(text: string) => handleInputChange('password', text)}
          placeholder={'********'}
          secureTextEntry={!passwordVisible}
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => setPasswordVisible(!passwordVisible)}
          disabled={isLoading}
        >
          <Ionicons
            name={passwordVisible ? 'eye-off' : 'eye'}
            size={24}
            color={theme.textNormal}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.sidetitle}>{t('activityInfo')}</Text>
      <Text style={styles.label}>{t('storeNameLabel')} :</Text>        <TextInput
        style={styles.input}
        value={formData.storeName}
        onChangeText={(text: string) => handleInputChange('storeName', text)}
        placeholder={t('storeNamePlaceholder')}
        keyboardType="default"
        autoCapitalize="words"
        editable={!isLoading}
      />
      {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
      <Text style={styles.label}>{t('storePhotoLabel')} :</Text>
      <TouchableOpacity
        style={styles.customButton}
        onPress={handleImportPhoto}
        disabled={isLoading}
      >
        <Text style={styles.customButtonText}>{isLoading ? <ActivityIndicator color={theme.accent} size="small" /> : t('importPhotoBtn')}</Text>
      </TouchableOpacity>

      {formData.idPhotoUri && (
        <Image
          source={{ uri: formData.idPhotoUri }}
          style={styles.idPhotoPreview}
          resizeMode="cover"
        />
      )}
      <Text style={styles.label}>{t('storeTypes')} :</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.storeType}
          onValueChange={(itemValue: string | undefined) =>
            handleInputChange('storeType', itemValue)
          }
          style={styles.picker}
          enabled={!isLoading}
        >
          <Picker.Item label={t('storeTypePlaceholder')} value={undefined} enabled={false} />
          {storeTypes.map((type, index) => (
            <Picker.Item key={index} label={t(type)} value={type} />
          ))}
        </Picker>
      </View>
      <Text style={styles.label}>{t('commercialRegLabel')} :</Text>
      <TextInput
        style={styles.input}
        value={formData.commercialRegistrationNumber}
        onChangeText={(text: string) => handleInputChange('commercialRegistrationNumber', text)}
        placeholder={t('commercialRegPlaceholder')}
        keyboardType="number-pad"
        editable={!isLoading}
      />
      <Text style={styles.label}>{t('storeAddressLabel')} :</Text>
      <Text style={styles.label}>{t('communeLabel')} :</Text>
      <TextInput
        style={styles.input}
        value={formData.commune}
        onChangeText={(text: string) => handleInputChange('commune', text)}
        placeholder={t('communePlaceholder')}
        keyboardType="default"
        autoCapitalize="words"
        editable={!isLoading}
      />
      <Text style={styles.label}>{t('villageLabel')} :</Text>
      <TextInput
        style={styles.input}
        value={formData.village}
        onChangeText={(text: string) => handleInputChange('village', text)}
        placeholder={t('villagePlaceholder')}
        keyboardType="default"
        autoCapitalize="words"
        editable={!isLoading}
      />
      <Text style={styles.label}>{t('tab.gps')} :</Text>
      <Text style={styles.mapInstructionText}>{t('simulateMapText')}</Text>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={mapRegion || undefined}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onRegionChangeComplete={setMapRegion}
          onPress={handleMapPress}
          zoomEnabled={!isLoading}
          scrollEnabled={!isLoading}
          pitchEnabled={!isLoading}
          rotateEnabled={!isLoading}
        >
          {tempSelectedLocation && (
            <Marker
              coordinate={tempSelectedLocation}
              title={t('selectLocationOnMap')}
              pinColor={theme.errorText}
            />
          )}
        </MapView>
      </View>

      {tempSelectedLocation && (
        <TouchableOpacity
          onPress={handleConfirmLocation}
          style={[styles.customButton, styles.confirmLocationButton]}
          disabled={isLoading}
        >
          <Text style={styles.customButtonText}>{isLoading ? t('loading') : t('confirmLocationBtn')}</Text>
        </TouchableOpacity>
      )}

      {formData.location && (
        <Text style={styles.locationSelectedText}>
          {t('locationSelectedText', { lat: formData.location.latitude, lng: formData.location.longitude })}
        </Text>
      )}
      <Text style={styles.sidetitle}>{t('workDaysLabel')} :</Text>
      <View style={styles.workDaysContainer}>
        {weekDays.map(day => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              formData.workDays.includes(day) && styles.selectedDayButton,
            ]}
            onPress={() => toggleWorkDay(day)}
            disabled={isLoading}
          >
            <Text style={[
              styles.dayButtonText,
              formData.workDays.includes(day) && styles.selectedDayButtonText,
            ]}>{t(day)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.sidetitle}>{t('workHoursLabel')} :</Text>
      <Text style={styles.label}>{t('weekdaysText')} :</Text>
      <View style={styles.timeInputContainer}>
        <TextInput
          style={styles.timeInput}
          value={formData.weekdayOpening.hour}
          onChangeText={(text: string) => handleTimeChange('weekdayOpening', 'hour', text)}
          placeholder="HH"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput
          style={styles.timeInput}
          value={formData.weekdayOpening.minute}
          onChangeText={(text: string) => handleTimeChange('weekdayOpening', 'minute', text)}
          placeholder="MM"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
        <Text style={styles.timeRangeText}> - </Text>
        <TextInput
          style={styles.timeInput}
          value={formData.weekdayClosing.hour}
          onChangeText={(text: string) => handleTimeChange('weekdayClosing', 'hour', text)}
          placeholder="HH"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput
          style={styles.timeInput}
          value={formData.weekdayClosing.minute}
          onChangeText={(text: string) => handleTimeChange('weekdayClosing', 'minute', text)}
          placeholder="MM"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
      </View>
      {weekdayTimeError ? <Text style={styles.errorText}>{weekdayTimeError}</Text> : null}

      <Text style={styles.label}>{t('weekendText')} :</Text>
      <View style={styles.timeInputContainer}>
        <TextInput
          style={styles.timeInput}
          value={formData.weekendOpening.hour}
          onChangeText={(text: string) => handleTimeChange('weekendOpening', 'hour', text)}
          placeholder="HH"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput
          style={styles.timeInput}
          value={formData.weekendOpening.minute}
          onChangeText={(text: string) => handleTimeChange('weekendOpening', 'minute', text)}
          placeholder="MM"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
        <Text style={styles.timeRangeText}> - </Text>
        <TextInput
          style={styles.timeInput}
          value={formData.weekendClosing.hour}
          onChangeText={(text: string) => handleTimeChange('weekendClosing', 'hour', text)}
          placeholder="HH"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput
          style={styles.timeInput}
          value={formData.weekendClosing.minute}
          onChangeText={(text: string) => handleTimeChange('weekendClosing', 'minute', text)}
          placeholder="MM"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
      </View>
      {weekendTimeError ? <Text style={styles.errorText}>{weekendTimeError}</Text> : null}

      <TouchableOpacity
        style={[styles.customButton, styles.nextButton, !isNextButtonEnabled && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!isNextButtonEnabled}
      >
        <Text style={styles.customButtonText}>
          {isLoading ? <ActivityIndicator color={theme.accent} /> : t('nextButton')}
        </Text>
      </TouchableOpacity>
      <Text style={styles.infoText}>{t('noteVerification')}</Text>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

const createStyles = (theme: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: theme.text,
  },
  sidetitle: {
    fontSize: 18,
    color: theme.tint,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
    alignSelf: 'auto',
    textDecorationLine: 'underline'
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 10,
    color: theme.text,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1.5,
    borderColor: theme.textNormal,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: theme.surface,
  },
  errorText: {
    color: theme.errorText,
    fontSize: 12,
    marginTop: 0,
    marginBottom: 15,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.green,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: theme.surface,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 12,
  },
  infoText: {
    fontSize: 12,
    color: theme.greyDes,
    marginTop: 0,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  customButton: {
    backgroundColor: theme.green,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    width: '30%',
    selfAlign: 'center',
  },
  customButtonText: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  idPhotoPreview: {
    width: 150,
    height: 100,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
    alignSelf: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.text,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: theme.surface,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  mapInstructionText: {
    fontSize: 14,
    color: theme.textNormal,
    marginBottom: 10,
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1.5,
    borderColor: theme.tint,
  },
  map: {
    flex: 1,
  },
  confirmLocationButton: {
    backgroundColor: theme.tint,
  },
  locationSelectedText: {
    fontSize: 14,
    color: theme.textNormal,
    textAlign: 'center',
    marginBottom: 15,
  },
  workDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: theme.tint,
    borderRadius: 20,
    margin: 4,
  },
  selectedDayButton: {
    backgroundColor: theme.green,
  },
  dayButtonText: {
    color: theme.tint,
    fontSize: 14,
  },
  selectedDayButtonText: {
    color: theme.accent,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  timeInput: {
    width: 50,
    borderWidth: 1.5,
    borderColor: theme.textNormal,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: theme.surface,
  },
  timeSeparator: {
    fontSize: 18,
    marginHorizontal: 5,
    color: theme.textNormal,
  },
  timeRangeText: {
    fontSize: 16,
    marginHorizontal: 10,
    color: theme.textNormal,
  },
  nextButton: {
    backgroundColor: theme.green,
    marginTop: 20,
    width: '30%',
    selfAlign: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: theme.greyDes,
    width: '30%',
    opacity: 0.5,
    selfAlign: 'center',
  },
});

export default RegistrationForm;
