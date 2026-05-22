import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, Share, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { referralManager } from '../calculation-logic/calculLivraison';
import { useAppTranslation } from '../translations/data/translationCentralization';

interface InviteOption {
  id: string;
  iconName: Icon;
  labelKey: string;
  actionType: 'whatsapp_direct' | 'messenger_direct' | 'system_share';
}

interface ModalHeaderConfig {
  titleKey: string;
  backButtonIcon: Icon;
}

const inviteModalHeader: ModalHeaderConfig = {
  titleKey: "inviteFriendsTitle",
  backButtonIcon: "chevron-left",
};

const inviteOptions: InviteOption[] = [
  {
    id: 'whatsapp-invite',
    iconName: 'whatsapp',
    labelKey: 'inviteWhatsAppLabel',
    actionType: 'whatsapp_direct',
  },
  {
    id: 'messenger-invite',
    iconName: 'facebook-messenger',
    labelKey: 'inviteMessengerLabel',
    actionType: 'messenger_direct',
  },
  {
    id: 'other-invite',
    iconName: 'share-alt',
    labelKey: 'inviteOtherAppsLabel',
    actionType: 'system_share',
  },
];

async function generateShareLink(
  userId: string,
  targetPlatform: string
): Promise<string> {
  return `https://votre-app.com/invite?invitedBy=${userId}&source=${targetPlatform}`;
}

function logAppWriteAnalyticsEvent(eventName: string, params: Record<string, any>): void {
  console.log(`[Placeholder] Analytics: ${eventName}`, params);
}


interface InviteFriendsModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentUserId: string;
  successfulReferralsCount: number
}

const InviteFriendsModal = ({
  isVisible,
  onClose,
  currentUserId,
  successfulReferralsCount,
}: InviteFriendsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useAppTranslation();

  const [freeDeliveryStatus, setFreeDeliveryStatus] = useState({
    hasFreeDelivery: false,
    remainingToQualify: referralManager.getFreeDeliveryThreshold()
  });

  useEffect(() => {
    const hasFreeDelivery = referralManager.hasReachedFreeDeliveryThreshold(successfulReferralsCount);
    const remainingToQualify = hasFreeDelivery ? 0 : referralManager.getFreeDeliveryThreshold() - successfulReferralsCount;
    setFreeDeliveryStatus({ hasFreeDelivery, remainingToQualify });
  }, [successfulReferralsCount]);

  const handleInvite = async (actionType: 'whatsapp_direct' | 'messenger_direct' | 'system_share') => {
    setIsLoading(true);
    try {
      const dynamicLink = await generateShareLink(currentUserId, actionType);

      let shareText: string;
      let urlScheme: string | null = null;
      let appNameForAlert: string | null = null;
      if (actionType === 'whatsapp_direct') {
        shareText = `${t('whatsappShareText')} ${dynamicLink}`;
        urlScheme = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
        appNameForAlert = 'WhatsApp';
      } else if (actionType === 'messenger_direct') {
        shareText = `${t('messengerShareText')} ${dynamicLink}`;
        urlScheme = `fb-messenger://share/?link=${encodeURIComponent(dynamicLink)}`;
        appNameForAlert = 'Messenger';
      } else {
        shareText = `${t('genericShareText')} ${dynamicLink}`;
      }

      logAppWriteAnalyticsEvent('invite_initiated', {
        platform: actionType,
        inviter_id: currentUserId,
        dynamic_link: dynamicLink,
      });
      if (urlScheme) {
        const supported = await Linking.canOpenURL(urlScheme);

        if (supported) {
          await Linking.openURL(urlScheme);
          logAppWriteAnalyticsEvent('invite_action_launched', { platform: actionType });
          onClose();
        } else {
          Alert.alert(
            t('cannotOpenAppTitle'),
            `${t('appNotInstalledMessage')} ${appNameForAlert || "l'application"}`,
            [
              { text: t('cancel'), style: "cancel" },
              {
                text: t('copyLink'),
                onPress: () => {
                  Alert.alert(t('linkCopiedTitle'), t('linkCopiedMessage'));
                  logAppWriteAnalyticsEvent('invite_link_copied', { platform: actionType });
                  onClose();
                }
              }
            ]
          );
        }
      } else {
        try {
          const result = await Share.share({
            message: `${t('shareMessageText')}\n\n${dynamicLink}`,
            url: dynamicLink,
            title: t('inviteFriendsTitle'),
          }, {
            dialogTitle: t('chooseAppToShare'),
          });

          if (result.action === Share.sharedAction) {
            logAppWriteAnalyticsEvent('invite_action_launched', { platform: actionType, activity_type: result.activityType || 'unknown' });
            onClose();
          } else if (result.action === Share.dismissedAction) {
            logAppWriteAnalyticsEvent('invite_share_dismissed', { platform: actionType });
          }
        } catch (shareError) {
          Alert.alert(t('general.error'), t('shareErrorMessage'));
          logAppWriteAnalyticsEvent('invite_share_error', {
            platform: actionType,
            error_message: (shareError instanceof Error ? shareError.message : String(shareError)),
            inviter_id: currentUserId,
          });
        }
      }

    } catch (error) {
      Alert.alert(t('general.error'), t('preparationErrorMessage'));
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.backButton} disabled={isLoading}>
              <Icon name="chevron-left" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t(inviteModalHeader.titleKey)}</Text>
            <View style={styles.backButtonPlaceholder} />
          </View>

          <View contentContainerStyle={styles.scrollViewContent}>
            {inviteOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.inviteOptionButton}
                onPress={() => handleInvite(option.actionType)}
                disabled={isLoading}
              >
                <Icon name={option.iconName} size={24} color="#ff7d00" style={styles.icon} />
                <Text style={styles.inviteOptionText}>{t(option.labelKey)}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.rewardStatusContainer}>
              {freeDeliveryStatus.hasFreeDelivery && (
                <Text style={styles.rewardStatusText}>
                  {t('freeDeliveryUnlocked')}
                </Text>
              )}
            </View>
            {isLoading && <Text style={styles.loadingText}>{t('preparingLink')}</Text>}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  rewardStatusContainer: {
    marginTop: 10,
    padding: 10,
    marginBottom: 30,
    backgroundColor: 'transparent',
    width: '100%',
    alignItems: 'center',
  },
  rewardStatusText: {
    fontSize: 15,
    textAlign: 'center',
    color: '#001524',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 0,
  },
  backButton: {
    padding: 5,
    marginTop: -8,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 10,
  },
  backButtonPlaceholder: {
    width: 20,
    height: 20,
  },
  scrollViewContent: {
    width: '100%',
    alignItems: 'center',
  },
  inviteOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e9eb',
    borderColor: '#15616d',
    borderWidth: 2,
    padding: 15,
    borderRadius: 5,
    width: 280,
    marginBottom: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  icon: {
    marginRight: 15,
  },
  inviteOptionText: {
    fontSize: 16,
    color: '#000',
  },
  loadingText: {
    marginTop: -10,
    textAlign: 'center',
    color: '#666',
  }
});

export default InviteFriendsModal;
