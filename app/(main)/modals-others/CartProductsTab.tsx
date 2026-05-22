import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Product, CartProductsTabProps } from './cart-types';
import { useAppTranslation } from '../translations/data/translationCentralization';
import { TypeLivraison } from '../calculation-logic/calculLivraison';

type Props = CartProductsTabProps & {
  renderProductItem: (p: Product) => React.ReactNode;
};

export const CartProductsTab: React.FC<Props> = (props: Props) => {
  const { t } = useAppTranslation();
  const { products, totalCommand, MC, CC, fraisAppli, finalTotal, selectedDeliveryType, onDeliveryTypeSelect, onConfirmOrder, renderProductItem } = props;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('votre_panier')}</Text>
        {products.map((product: Product) => renderProductItem(product))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('choisir_livraison')}</Text>
        <View style={styles.deliveryContainer}>
          {[TypeLivraison.Normal, TypeLivraison.Rapid, TypeLivraison.Pickup].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeButton, selectedDeliveryType === type && styles.typeButtonSelected]}
              onPress={() => onDeliveryTypeSelect(type)}
            >
              <Text style={selectedDeliveryType === type ? styles.textSelected : styles.textDefault}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text>{t('total_articles')}</Text>
          <Text>{totalCommand} DZD</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>{t('frais_livraison')}</Text>
          <Text>{MC} DZD</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>{t('frais_service')}</Text>
          <Text>{fraisAppli} DZD</Text>
        </View>
        {CC > 0 && (
          <View style={styles.summaryRow}>
            <Text>{t('credit_applique')}</Text>
            <Text>-{CC} DZD</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{finalTotal} DZD</Text>
        </View>

        <TouchableOpacity style={styles.orderButton} onPress={onConfirmOrder}>
          <Text style={styles.orderButtonText}>{t('confirmer_commande')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15
  },
  section: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#001524'
  },
  deliveryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4
  },
  typeButtonSelected: {
    backgroundColor: '#ff7d00',
    borderColor: '#ff7d00'
  },
  textDefault: {
    color: '#666'
  },
  textSelected: {
    color: '#fff',
    fontWeight: 'bold'
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    marginBottom: 30
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    marginTop: 5
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff7d00'
  },
  orderButton: {
    backgroundColor: '#001524',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
