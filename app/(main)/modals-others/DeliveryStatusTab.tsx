import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Driver, TypeLivraison, ResultatFinalDeLivraison } from '../calculation-logic/calculLivraison';
import { useAppTranslation } from '../translations/data/translationCentralization';

interface Props {
  isOrderConfirmed: boolean;
  isOrderCancelled: boolean;
  deliveryStatusMessage: string;
  confirmedDeliveryType: TypeLivraison | null;
  currentDriver: Driver | null;
  externalDriverDistance: number | null;
  hasDeliveryArrived: boolean;
  isDriverAcceptedOrder: boolean;
  selectedRating: number;
  onCancelOrder: () => void;
  onOpenQR: () => void;
  onRatingSelect: (rating: number) => void;
  finalDeliveryCalculationResult: ResultatFinalDeLivraison | null;
  confirmedTReel: number;
  confirmedTotalCommand: number;
  confirmedAppliedCreditAmount: number;
}

export const DeliveryStatusTab: React.FC<Props> = (props: Props) => {
  const { selectedRating, onRatingSelect, hasDeliveryArrived, isOrderConfirmed, isOrderCancelled, currentDriver, externalDriverDistance, confirmedDeliveryType, onCancelOrder, deliveryStatusMessage, finalDeliveryCalculationResult, confirmedTReel, confirmedTotalCommand, confirmedAppliedCreditAmount } = props;
  const { t } = useAppTranslation();

  const renderHeartRating = (value: number) => (
    <TouchableOpacity key={value} onPress={() => onRatingSelect(value)}>
      <Ionicons
        name={selectedRating >= value ? "heart" : "heart-outline"}
        size={36}
        color={selectedRating >= value ? '#ff7d00' : '#ccc'}
        style={{ marginHorizontal: 5 }}
      />
    </TouchableOpacity>
  );

  const MC = finalDeliveryCalculationResult?.MC ?? 0;
  const fraisAppli = finalDeliveryCalculationResult?.fraisAppli ?? 0;
  const totalFinal = confirmedTotalCommand + MC + fraisAppli - confirmedAppliedCreditAmount;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.deliveryStatusMessage}>{deliveryStatusMessage}</Text>

      <View style={styles.deliveryInfoLabels}>
        <Text style={styles.deliveryInfoText}>
          {t('libreurID')}:{' '}
          <Text style={styles.deliveryInfoValue}>
            {(confirmedDeliveryType === TypeLivraison.Rapid || confirmedDeliveryType === TypeLivraison.Normal) && currentDriver
              ? currentDriver.id
              : "/"}
          </Text>
        </Text>
        <Text style={styles.deliveryInfoText}>
          {t('livrourNameu')}:{' '}
          <Text style={styles.deliveryInfoValue}>
            {(confirmedDeliveryType === TypeLivraison.Rapid || confirmedDeliveryType === TypeLivraison.Normal) && currentDriver
              ? currentDriver.name
              : "/"}
          </Text>
        </Text>
        <Text style={styles.deliveryInfoText}>
          {t('distuLivDepChezTwa')}:{' '}
          <Text style={styles.deliveryInfoValue}>
            {(confirmedDeliveryType === TypeLivraison.Rapid || confirmedDeliveryType === TypeLivraison.Normal) && externalDriverDistance !== null
              ? `${externalDriverDistance.toFixed(3)} km`
              : "/"}
          </Text>
        </Text>
        <Text style={styles.deliveryInfoText}>
          {t('tempusKaMisLeLIVLIV')}:{' '}
          <Text style={styles.deliveryInfoValue}>
            {(confirmedDeliveryType === TypeLivraison.Rapid || confirmedDeliveryType === TypeLivraison.Normal) && hasDeliveryArrived && confirmedTReel > 0
              ? `${confirmedTReel} ${t('minutis')}`
              : "/"}
          </Text>
        </Text>

        {hasDeliveryArrived && finalDeliveryCalculationResult && (
          <>
            {confirmedDeliveryType !== TypeLivraison.Pickup && (
              <Text style={styles.deliveryInfoText}>
                {t('payerLIVfinal')}:{' '}
                <Text style={styles.deliveryInfoValue}>{MC} DZD</Text>
              </Text>
            )}
            {fraisAppli > 0 && (
              <Text style={styles.deliveryInfoText}>
                {t('app_fees_label')}:{' '}
                <Text style={styles.deliveryInfoValue}>{fraisAppli} DZD</Text>
              </Text>
            )}
            {confirmedAppliedCreditAmount > 0 && (
              <Text style={styles.deliveryInfoText}>
                {t('credit_applied_label')}:{' '}
                <Text style={styles.deliveryInfoValue}>-{confirmedAppliedCreditAmount} DZD</Text>
              </Text>
            )}
            <View style={styles.finalTotalContainer}>
              <Text style={styles.totalText}>
                {t('totalFINAL')}: <Text style={styles.finalTotalValue}>{totalFinal} DZD</Text>
              </Text>
            </View>

            {(confirmedDeliveryType === TypeLivraison.Rapid || confirmedDeliveryType === TypeLivraison.Normal) && (
              <>
                <Text style={styles.deliveryLabel}>{t('noter_le_driver')}</Text>
                <View style={styles.heartRatingContainer}>
                  {[1, 2, 3, 4, 5].map((value) => renderHeartRating(value))}
                </View>
              </>
            )}
          </>
        )}
      </View>

      {isOrderConfirmed && !isOrderCancelled && !hasDeliveryArrived && (
        <TouchableOpacity onPress={onCancelOrder} style={styles.cancelOrderButton}>
          <Text style={styles.cancelOrderButtonText}>{t('annuler_ma_commande')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  deliveryStatusMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#001524',
    textAlign: 'center',
    marginBottom: 20,
  },
  deliveryInfoLabels: {
    backgroundColor: '#fbfbfb',
    borderRadius: 5,
    padding: 16,
    elevation: 3,
    marginBottom: 20,
  },
  deliveryInfoText: {
    fontSize: 15,
    color: '#001524',
    marginBottom: 8,
  },
  deliveryInfoValue: {
    fontWeight: 'bold',
    color: '#ff7d00',
  },
  deliveryLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#001524',
    marginTop: 16,
    marginBottom: 8,
  },
  heartRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  finalTotalContainer: {
    borderTopWidth: 1,
    borderTopColor: '#ffecd1',
    paddingTop: 12,
    marginTop: 12,
  },
  totalText: {
    fontSize: 16,
    color: '#001524',
  },
  finalTotalValue: {
    fontWeight: 'bold',
    color: '#ff7d00',
    fontSize: 18,
  },
  cancelOrderButton: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 10,
  },
  cancelOrderButtonText: {
    color: '#001524',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});
