import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, GestureResponderEvent } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { account, databases, ID, config } from '../calculation-logic/appwriteConfig';
import { useAppTranslation } from '../translations/data/translationCentralization';

interface PremiumOffersModalProps {
  isVisible: boolean;
  onClose: () => void;
  onUpgradePress: (offer: SelectedOfferDetails) => void;
}

interface SelectedOfferDetails {
  type: 'advantage' | 'subscription';
  label: string;
  value?: number;
  months?: number;
  price: number;
  confirmationTitle: string;
  confirmationBody: string;
}

const PremiumUtiliOffersModal = ({ isVisible, onClose, onUpgradePress }: PremiumOffersModalProps) => {
  const { t } = useAppTranslation();
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState<boolean>(false);
  const [infoModalContent, setInfoModalContent] = useState<string>('');
  const [currentView, setCurrentView] = useState<'offers' | 'confirmation' | 'thankYou'>('offers');
  const [selectedOffer, setSelectedOffer] = useState<SelectedOfferDetails | null>(null);

  useEffect(() => {
    if (isVisible) {
      setCurrentView('offers');
      setSelectedOffer(null);
      setErrorStatus(null);
      setIsInfoModalVisible(false);
      setInfoModalContent('');
    }
  }, [isVisible]);

  const APPWRITE_FUNCTION_URL = 'YOUR_APPWRITE_FUNCTION_URL';
  const APPWRITE_FUNCTION_API_KEY = 'YOUR_APPWRITE_FUNCTION_API_KEY';

  const sendAdminNotification = async (offer: SelectedOfferDetails) => {
    try {
      const user = await account.get();
      const userId = user.$id;
      const userEmail = user.email;
      const response = await fetch(APPWRITE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Function-Key': APPWRITE_FUNCTION_API_KEY,
        },
        body: JSON.stringify({
          userId: userId,
          userEmail: userEmail,
          offerDetails: offer,
          requestTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send admin notification via Appwrite Function');
      }

      const result = await response.json();
      return { success: result.success, message: result.message };

    } catch (error: any) {
      console.error('Appwrite Error in sendAdminNotification:', error);
      if (error?.code === 401 || error?.type === 'user_unauthorized') {
        return { success: false, error: "Authentication required or unauthorized." };
      }
      return { success: false, error: error.message || 'An unknown Appwrite error occurred.' };
    }
  };

  const handleAdvantagesOptionPress = (optionLabel: string, price: number) => {
    let confTitle = '';
    let confBody = '';

    if (optionLabel === t('ccLabel')) {
      confTitle = t('ccLabelpremium');
      confBody = t('infosCCPremUtili').replace('{{price}}', String(price));
    } else if (optionLabel === 'free_delivery') {
      confTitle = t('free_delivery_title_modal');
      confBody = t('infosLivGratPremUtili').replace('{{price}}', String(price));
    }

    const offerDetails: SelectedOfferDetails = {
      type: 'advantage',
      label: optionLabel,
      price: price,
      confirmationTitle: confTitle,
      confirmationBody: confBody
    };
    setSelectedOffer(offerDetails);
    setCurrentView('confirmation');
  };

  {/*const handleMonthlyOptionPress = (months: number, price: number) => {
    let confTitle = '';
    let confBody = '';

    if (months === 1) {
      confTitle = `1 ${t('month')}`;
      confBody = t('infosmoisPremUtili', { price: price });
    } else if (months === 6) {
      confTitle = `6 ${t('months')}`;
      confBody = t('infosmoisPremUtili', { price: price, months: 6 });
    } else if (months === 12) {
      confTitle = `12 ${t('months')}`;
      confBody = t('infosmoisPremUtili', { price: price, months: 12 });
    }

    const offerDetails: SelectedOfferDetails = {
      type: 'subscription',
      label: `${months}${t('month')}${months > 1 ? 's' : ''}`,
      months: months,
      price: price,
      confirmationTitle: confTitle, 
      confirmationBody: confBody    
    };
    setSelectedOffer(offerDetails);
    setCurrentView('confirmation');
  };*/}

  const handleInfoIconPress = (event: GestureResponderEvent, content: string) => {
    event.stopPropagation();
    setInfoModalContent(content);
    setIsInfoModalVisible(true);
  };

  const handleConfirmCashPayment = async () => {
    if (!selectedOffer) return;

    setErrorStatus(null);
    try {
      const user = await account.get();
      const userId = user.$id;
      const userEmail = user.email;

      const result = await sendAdminNotification(selectedOffer);

      if (result.success) {
        await databases.createDocument(
          config.databaseId,
          config.premiumCollectionId,
          ID.unique(),

          {
            userId: userId,
            userEmail: userEmail,
            offerType: selectedOffer.type,
            offerLabel: selectedOffer.label,
            offerPrice: selectedOffer.price,
            purchaseDate: new Date().toISOString(),
          }
        );

        setCurrentView('thankYou');
        onUpgradePress(selectedOffer);
      } else {
        setErrorStatus(`${t('general.error')} : ${result.error || t('error.unknown_occurred')}`);
      }
    } catch (error: any) {
      console.error('Erreur lors de la confirmation ou de l\'enregistrement DB:', error);
      setErrorStatus(`${t('general.error')} : ${error.message || t('error.unknown_occurred')}`);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.fullScreenOverlay}>
        {currentView === 'offers' && (
          <View style={modalStyles.premiumModalView}>
            <View style={modalStyles.modalHeader}>
              <TouchableOpacity onPress={onClose} style={modalStyles.modalCloseButton}>
                <Icon name="close-circle" size={30} color="#666" />
              </TouchableOpacity>
              <Text style={modalStyles.modalTitle}>{t('premiumOffer')}</Text>
            </View>

            <ScrollView style={modalStyles.scrollViewContent}>
              <Text style={modalStyles.generalInfoText}>
                {t('textePresentationPremium')}
              </Text>
              {errorStatus && <Text style={modalStyles.generalInfoText}>{errorStatus}</Text>}
              <Text style={modalStyles.groupCtaText}>
                {t('avantagePremium')}
              </Text>
              <View style={modalStyles.buttonGroup}>

                <TouchableOpacity
                  style={modalStyles.advantageButton}
                  onPress={() => handleAdvantagesOptionPress(t('ccLabel'), 500)}
                >
                  <TouchableOpacity
                    style={modalStyles.infoIconContainer}
                    onPress={(event: GestureResponderEvent) => handleInfoIconPress(event, t('infosCCPremUtili'))}>
                    <Icon name="information-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                  <View style={modalStyles.buttonContent}>
                    <Icon name="cash" size={40} color="#ffd700" style={modalStyles.buttonImagePlaceholder} />
                    <Text style={modalStyles.largeButtonLabel}>{t('ccLabelpremium')}</Text>
                    <Text style={modalStyles.buttonPrice}>500</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={modalStyles.advantageButton}
                  onPress={() => handleAdvantagesOptionPress(t('free_delivery'), 800)}
                >
                  <TouchableOpacity
                    style={modalStyles.infoIconContainer}
                    onPress={(event: GestureResponderEvent) => handleInfoIconPress(event, t('infosLivGratPremUtili'))}>
                    <Icon name="information-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                  <View style={modalStyles.buttonContent}>
                    <Icon name="motorbike" size={40} color="#a2e6a2" style={modalStyles.buttonImagePlaceholder} />
                    <Text style={modalStyles.largeButtonLabel}>{t('free_delivery_title_modal')}</Text>
                    <Text style={modalStyles.buttonPrice}>800</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/*<Text style={modalStyles.groupCtaText}>
              {t('premiumMoisLabelUtili')}
            </Text>
            <View style={modalStyles.buttonGroup}>
              <TouchableOpacity
                style={modalStyles.dealButton}
                onPress={() => handleMonthlyOptionPress(1, 300)}
              >
                <TouchableOpacity
                style={modalStyles.infoIconContainerSmall} 
                onPress={(event) => handleInfoIconPress(event,
                  t('infosmoisPremUtili')
                )}>
                <Icon name="information-outline" size={16} color="#fff" />
              </TouchableOpacity>
                <View style={modalStyles.buttonContentSmall}>
                  <View style={modalStyles.multiIconContainer}>
                    <Image
                    source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRW5xjdMDNCOC1PR6_eNxqnb8EOVuVgJ7erxg&s' }}
                    style={modalStyles.singleBonusImage}
                  />
                  </View>
                  <Text style={modalStyles.largeButtonLabel}>1{t('month')}</Text>
                  <Text style={modalStyles.buttonPrice}>300</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={modalStyles.dealButton}
                onPress={() => handleMonthlyOptionPress(6, 1300)}
              >
                <TouchableOpacity
                style={modalStyles.infoIconContainerSmall}
                onPress={(event) => handleInfoIconPress(event,
                  t('infosmoisPremUtili')
                )}>
                <Icon name="information-outline" size={16} color="#fff" />
              </TouchableOpacity>
                <View style={modalStyles.buttonContentSmall}>
                  <View style={modalStyles.multiIconContainer}>
                    <Image
                    source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRW5xjdMDNCOC1PR6_eNxqnb8EOVuVgJ7erxg&s' }}
                    style={modalStyles.singleBonusImage}
                  />
                  </View>
                  <Text style={modalStyles.largeButtonLabel}>6{t('months')}</Text>
                  <Text style={modalStyles.buttonPrice}>1300</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={modalStyles.dealButton}
                onPress={() => handleMonthlyOptionPress(12, 3000)}
              >
                <TouchableOpacity
                style={modalStyles.infoIconContainerSmall} 
                onPress={(event) => handleInfoIconPress(event,
                  t('infosmoisPremUtili')
                )}>
                <Icon name="information-outline" size={16} color="#fff" />
                </TouchableOpacity>
                <View style={modalStyles.buttonContentSmall}>
                  <View style={modalStyles.multiIconContainer}>
                    <Image
                    source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRW5xjdMDNCOC1PR6_eNxqnb8EOVuVgJ7erxg&s' }}
                    style={modalStyles.singleBonusImage}
                  />
                  </View>
                  <Text style={modalStyles.largeButtonLabel}>12 {t('months')}</Text>
                  <Text style={modalStyles.buttonPrice}>3000</Text>
                </View>
              </TouchableOpacity>
              </View>*/}
            </ScrollView>
          </View>
        )}

        {currentView === 'confirmation' && selectedOffer && (
          <View style={modalStyles.infoOverlay}>
            <View style={modalStyles.infoModalContainer}>
              <TouchableOpacity onPress={() => setCurrentView('offers')} style={modalStyles.infoModalCloseButton}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
              <ScrollView contentContainerStyle={modalStyles.buttonContent}>
                <Text style={modalStyles.groupCtaText}>{selectedOffer.confirmationTitle}</Text>
                <Text style={modalStyles.generalInfoText}>{selectedOffer.confirmationBody}</Text>

                <TouchableOpacity style={modalStyles.dealButton} onPress={handleConfirmCashPayment}>
                  <Text style={modalStyles.largeButtonLabel}>{t('general.confirm')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modalStyles.advantageButton} onPress={() => setCurrentView('offers')}>
                  <Text style={modalStyles.largeButtonLabel}>{t('general.cancel')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}

        {currentView === 'thankYou' && (
          <View style={modalStyles.infoOverlay}>
            <View style={modalStyles.infoModalContainer}>
              <TouchableOpacity onPress={onClose} style={modalStyles.infoModalCloseButton}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
              <ScrollView contentContainerStyle={modalStyles.buttonContent}>
                <Icon name="check-circle-outline" size={80} color="#28a745" />
                <Text style={modalStyles.modalTitle}>{t('thankYouForChoice')}</Text>
                <Text style={modalStyles.generalInfoText}>
                  {t('weWillContactYouForPayment').replace('{{offer}}', selectedOffer?.label || '')}
                </Text>
                <TouchableOpacity style={modalStyles.dealButton} onPress={onClose}>
                  <Text style={modalStyles.largeButtonLabel}>{t('ok')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}


        {isInfoModalVisible && (
          <View style={modalStyles.infoOverlay} pointerEvents="box-none">
            <View style={modalStyles.infoModalContainer}>
              <TouchableOpacity
                onPress={() => setIsInfoModalVisible(false)}
                style={modalStyles.infoModalCloseButton}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
              <ScrollView>
                <Text style={modalStyles.infoModalText}>
                  {infoModalContent}
                </Text>
              </ScrollView>
            </View>
          </View>
        )}

      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  infoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 5,
  },
  infoModalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingTop: 35,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flex: 1,
  },
  infoModalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
    marginBottom: 30,
    marginLeft: 25,
    marginRight: 25,
  },
  infoModalCloseButton: {
    position: 'absolute',
    top: 5,
    right: 10,
    padding: 0,
  },
  singleBonusImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 0,
    marginTop: 20,
  },
  multiIconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    width: '100%',
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  premiumModalView: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 0,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    left: 0,
    padding: 2,
    marginBottom: 10,
    marginTop: 0,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
    marginTop: 30,
  },
  scrollViewContent: {
    paddingHorizontal: 5,
  },
  generalInfoText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  groupCtaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingHorizontal: 0,
  },
  advantageButton: {
    backgroundColor: '#343a40',
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderRadius: 8,
    marginHorizontal: 2,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 160,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeButtonLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: -10,
    textAlign: 'center',
  },
  buttonPrice: {
    color: '#ddd',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  buttonImagePlaceholder: {
    marginBottom: 5,
  },
  infoIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 3,
  },
  dealButton: {
    backgroundColor: '#007bff',
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderRadius: 8,
    marginHorizontal: 2,
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 180,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoIconContainerSmall: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 0,
  },
  buttonContentSmall: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flex: 1,
  },
});

export default PremiumUtiliOffersModal;
