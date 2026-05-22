import React, { useState, useEffect, memo, useRef } from 'react';

import { View, Text, TouchableOpacity, Platform, SafeAreaView, Vibration } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Models } from 'react-native-appwrite';
import { Product } from '../calculation-logic/cart-types';
import { PremiumUtilisateur } from '../premiums';
import { databases, config, functions } from '../calculation-logic/appwriteConfig';
import { calculateur, Store, LocalisationUser, ResultatCalcul, TypeLivraison, calculerLivraisonPourPanier, calculerTotalCommande, calculerCoutFinalAvecTempsReel, ResultatFinalDeLivraison, Driver, ConfigurationTarifs } from '../calculation-logic/calculLivraison';
import { calculerCCPourCommande, getAvailableCredit, addEarnedCredit, returnUsedCredit } from '../calculation-logic/calcul-CC';
import InviteFriendsModal from '../modals-others/InviteFriendsModal';
import PremiumUtiliOffersModal from '../modals-others/modalPremiums';
import ModalOrderQuantity from '../modals-others/modalOrderQuantity';
import { ShoppingListTab } from '../modals-others/ShoppingListTab';
import { DeliveryStatusTab } from '../modals-others/DeliveryStatusTab';
import { CartProductsTab } from '../modals-others/CartProductsTab';
import { useAppTranslation } from '../translations/data/translationCentralization';

const CartItem = memo(({ product, isChecked, onToggleCheck, onPressItem }: { product: Product, isChecked: boolean, onToggleCheck: (productId: string, newValue: boolean) => void, onPressItem: (product: Product) => void }) => {
  return (
    <TouchableOpacity
      style={[styles.cartItem, !isChecked && styles.disabledItem]}
      activeOpacity={0.7}
      onPress={() => onPressItem(product)}
    >
      <View style={styles.cartItemRow}>
        <Text style={styles.itemQty}>
          {product.uniteQuantite === 'g' || product.uniteQuantite === 'kg'
            ? `${product.valeurQuantite} ${product.uniteQuantite}`
            : product.valeurQuantite}
        </Text>
        <Text style={styles.itemName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.itemPrice}>{(product.valeurQuantite ?? 0) * product.prix} DZD</Text>
        <TouchableOpacity onPress={() => onToggleCheck(product.id, !isChecked)} style={styles.cartItemCheckbox}>
          <Ionicons
            name={isChecked ? "bag-check" : "bag-outline"}
            size={24}
            color={isChecked ? styles.checkboxCheckedColor.color : styles.checkboxUncheckedColor.color}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const ShoppingCartScreen: React.FC = () => {
  const { t, currentLang } = useAppTranslation();
  const [activeSection, setActiveSection] = useState<string>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<LocalisationUser | null>(null);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<TypeLivraison | null>(null);
  const [deliveryCost, setDeliveryCost] = useState<number>(0);
  const [calculationResult, setCalculationResult] = useState<ResultatCalcul | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number>(0);
  const [useFreeDelivery, setUseFreeDelivery] = useState<boolean>(false);
  const [userPremiumStatus, setUserPremiumStatus] = useState<PremiumUtilisateur>(PremiumUtilisateur.Aucun);
  const [userCreditBalance, setUserCreditBalance] = useState<number>(0);
  const [appliedCreditAmount, setAppliedCreditAmount] = useState<number>(0);
  const [creditEarned, setCreditEarned] = useState<number>(0);
  const [numberOfFreeDeliveries, setNumberOfFreeDeliveries] = useState<number>(2);
  const [orderReference, setOrderReference] = useState<string>('');
  const [isOrderConfirmed, setIsOrderConfirmed] = useState<boolean>(false);
  const [isOrderCancelled, setIsOrderCancelled] = useState<boolean>(false);
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [isDriverAcceptedOrder, setIsDriverAcceptedOrder] = useState<boolean>(false);
  const [externalDriverDistance, setExternalDriverDistance] = useState<number | null>(null);
  const [hasDeliveryArrived, setHasDeliveryArrived] = useState<boolean>(false);
  const [deliveryStatusMessage, setDeliveryStatusMessage] = useState<string>('');
  const [userOrderCount, setUserOrderCount] = useState<number>(1);
  const [currentMonthDeliveries, setCurrentMonthDeliveries] = useState<number>(0);
  const [confirmedTotalCommand, setConfirmedTotalCommand] = useState<number>(0);
  const [confirmedAppliedCreditAmount, setConfirmedAppliedCreditAmount] = useState<number>(0);
  const [finalDeliveryCalculationResult, setFinalDeliveryCalculationResult] = useState<ResultatFinalDeLivraison | null>(null);
  const [confirmedTReel, setConfirmedTReel] = useState<number>(0);
  const [isQuantityModalVisible, setIsQuantityModalVisible] = useState<boolean>(false);
  const [selectedProductForQuantity, setSelectedProductForQuantity] = useState<Product | null>(null);
  const [isPremiumOffersVisible, setIsPremiumOffersVisible] = useState<boolean>(false);
  const [inviteFriendsModalVisible, setInviteFriendsModalVisible] = useState<boolean>(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);

  const deliverySubscriptionRef = useRef<(() => void) | null>(null);
  const sirenePushedRef = useRef<boolean>(false);
  const totalCommand = calculerTotalCommande(products, selectedProductIds);

  useEffect(() => {
    setUserCreditBalance(getAvailableCredit(userPremiumStatus));
    const earned = calculerCCPourCommande(totalCommand, userPremiumStatus, currentMonthDeliveries);
    setCreditEarned(earned);
  }, [totalCommand, userPremiumStatus, currentMonthDeliveries]);

  useEffect(() => {
    return () => {
      if (deliverySubscriptionRef.current) {
        deliverySubscriptionRef.current();
      }
    };
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('userUsername');
        if (!storedUsername) return;

        const userLocationData = await databases.getDocument<LocalisationUser & Models.Document>(
          config.databaseId, config.usersCollectionId, storedUsername
        );
        setUserLocation(userLocationData);

        const storesData = await databases.listDocuments<Store & Models.Document>(
          config.databaseId, config.storesCollectionId
        );
        setStores(storesData.documents.map((s: Store & Models.Document) => ({ ...s, id: s.$id })));

        const productsData = await databases.listDocuments<Product & Models.Document>(
          config.databaseId, config.productsCollectionId
        );
        const mappedProducts = productsData.documents.map((p: Product & Models.Document) => ({ ...p, id: p.$id }));
        setProducts(mappedProducts);
        setSelectedProductIds(mappedProducts.map((p: Product) => p.id));

      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };
    loadAllData();
  }, []);

  useEffect(() => {
    if (!selectedDeliveryType || selectedDeliveryType === TypeLivraison.Pickup || !userLocation) {
      setDeliveryCost(0);
      setCalculationResult(null);
      return;
    }

    const selectedProductsData = products.filter((p: Product) => selectedProductIds.includes(p.id));
    const relevantStoreIds = Array.from(new Set(selectedProductsData.map((p: Product) => p.storeId)));
    const storesForCalc = stores.filter((s: Store) => relevantStoreIds.includes(s.id));

    if (storesForCalc.length > 0) {
      const d = calculateur.comparerDistances(storesForCalc, userLocation);
      setCalculatedDistance(d);
      const result = calculerLivraisonPourPanier(storesForCalc, userLocation, selectedDeliveryType, userPremiumStatus, userOrderCount, totalCommand);
      setDeliveryCost(useFreeDelivery && selectedDeliveryType === TypeLivraison.Normal ? 0 : result.MC);
      setCalculationResult(result);
    }
  }, [selectedDeliveryType, selectedProductIds, useFreeDelivery, userOrderCount, totalCommand, userPremiumStatus, userLocation, stores]);

  const handleOrderConfirmation = async () => {
    if (creditEarned > 0) {
      addEarnedCredit(creditEarned);
      setUserCreditBalance(getAvailableCredit(userPremiumStatus));
    }

    const newOrderRef = `CMD-${Date.now()}`;
    const currentTotal = totalCommand;
    const currentAppliedCredit = appliedCreditAmount;
    const currentDeliveryType = selectedDeliveryType;

    setOrderReference(newOrderRef);
    setConfirmedTotalCommand(currentTotal);
    setConfirmedAppliedCreditAmount(currentAppliedCredit);
    setSelectedProductIds([]);
    setUserOrderCount((prev: number) => prev + 1);
    setCurrentMonthDeliveries((prev: number) => prev + 1);
    setIsOrderConfirmed(true);
    setActiveSection('deliveryStatus');

    if (currentDeliveryType !== TypeLivraison.Pickup) {
      try {
        await databases.createDocument(config.databaseId, config.deliveriesCollectionId, newOrderRef, {
          userId: userLocation?.username,
          userLocation: userLocation?.localisation_gps,
          orderRef: newOrderRef,
          deliveryType: currentDeliveryType,
          status: 'PENDING',
          totalPaid: currentTotal,
          createdAt: new Date().toISOString()
        });

        const unsubscribe = databases.subscribe(
          [`databases.${config.databaseId}.collections.${config.deliveriesCollectionId}.documents.${newOrderRef}`],
          (response: { payload: Models.Document & { driver?: any, driverLocation?: any } }) => {
            const data = response.payload;
            if (data.driver) {
              setCurrentDriver(data.driver);
              setIsDriverAcceptedOrder(true);
              setDeliveryStatusMessage(t('delivery_order_en_route_message'));
            }

            if (data.driverLocation && data.driver) {
              const loc = typeof data.driverLocation === 'string'
                ? JSON.parse(data.driverLocation)
                : data.driverLocation;

              const driverObj = {
                id: data.driver.$id || data.driver.id,
                name: data.driver.name || data.driver.nom,
                location_liv: loc
              };

              const distance = calculateur.dis(userLocation!, driverObj);
              setExternalDriverDistance(distance);
              if (distance <= 0.5 && !sirenePushedRef.current) {
                sirenePushedRef.current = true;
                try {
                  functions.createExecution('ID_DE_TA_FONCTION', JSON.stringify({
                    action: 'sirene',
                    clientGPS: userLocation!.localisation_gps,
                    driverGPS: loc,
                    userIdDuClient: userLocation!.username,
                  }));
                } catch (execError) {
                  console.error("Erreur exécution sirene :", execError);
                }
              }

              if (distance <= ConfigurationTarifs.SEUIL_PROXIMITE_KM) {
                setHasDeliveryArrived(true);
                const tReel = calculateur.verifierProximiteEtArreterCompteur(userLocation!, driverObj);
                setConfirmedTReel(tReel ?? 0);
                const finalResult = calculerCoutFinalAvecTempsReel(
                  tReel ?? 0,
                  calculatedDistance,
                  currentDeliveryType as TypeLivraison,
                  userPremiumStatus,
                  currentMonthDeliveries,
                  currentTotal
                );
                setFinalDeliveryCalculationResult(finalResult);
                setDeliveryStatusMessage(t('delivery_arrived_message'));
              }
            }
          }
        );
        deliverySubscriptionRef.current = unsubscribe;

      } catch (err) {
        console.error('Erreur commande:', err);
      }
    } else {
      setHasDeliveryArrived(true);
      setIsDriverAcceptedOrder(true);
    }
  };

  const handleCancelOrder = () => {
    if (deliverySubscriptionRef.current) {
      deliverySubscriptionRef.current();
      deliverySubscriptionRef.current = null;
    }

    setIsOrderCancelled(true);
    if (confirmedAppliedCreditAmount > 0) {
      returnUsedCredit(confirmedAppliedCreditAmount);
      setUserCreditBalance(getAvailableCredit(userPremiumStatus));
      setConfirmedAppliedCreditAmount(0);
    }
  };

  const calculateFinalDeliveryCostForDisplay = (
    initialDeliveryEstimate: number,
    isDeliveryConfirmed: boolean,
    hasDeliveryActuallyArrived: boolean,
    confirmedTypeOfDelivery: TypeLivraison | null,
    confirmedUseFreeDelivery: boolean,
    finalDeliveryCalcResult: ResultatFinalDeLivraison | null
  ): {
    reductionTotalProducts: number;
    MC: number;
    totalFinal: number | null;
    fraisAppli: number;
    CC: number;
  } => {
    let displayProductPremiumReduction: number = 0;
    let finalBilledDeliveryCost: number = 0;
    let finalOrderTotal: number | null = null;

    const fraisAppli = finalDeliveryCalcResult?.fraisAppli ?? (calculationResult?.fraisAppli ?? 0);
    const CC = confirmedAppliedCreditAmount;

    if (!isDeliveryConfirmed || confirmedTypeOfDelivery === TypeLivraison.Pickup) {
      finalBilledDeliveryCost = confirmedTypeOfDelivery === TypeLivraison.Pickup ? 0 : initialDeliveryEstimate;
      displayProductPremiumReduction = calculationResult?.reductionTotalProducts ?? 0;
    } else {
      if (hasDeliveryActuallyArrived && finalDeliveryCalcResult) {
        displayProductPremiumReduction = finalDeliveryCalcResult.reductionTotalProducts ?? 0;
        finalBilledDeliveryCost = (confirmedUseFreeDelivery && confirmedTypeOfDelivery === TypeLivraison.Normal) ? 0 : (finalDeliveryCalcResult.MC ?? 0);
      } else {
        displayProductPremiumReduction = calculationResult?.reductionTotalProducts ?? 0;
        finalBilledDeliveryCost = initialDeliveryEstimate;
      }
    }

    finalOrderTotal = totalCommand + finalBilledDeliveryCost - CC;
    if (finalOrderTotal <= 0 && !isDeliveryConfirmed) {
      finalOrderTotal = (confirmedTotalCommand - CC) > 0 ? (confirmedTotalCommand - CC) : 0;
    }

    return {
      reductionTotalProducts: displayProductPremiumReduction,
      MC: finalBilledDeliveryCost,
      totalFinal: finalOrderTotal,
      fraisAppli,
      CC,
    };
  };

  const renderProductItem = (product: Product) => {
    const store = stores.find((s: Store) => s.id === product.storeId);
    if (!store) return null;
    return (
      <CartItem
        key={product.id}
        product={product}
        isChecked={selectedProductIds.includes(product.id)}
        onToggleCheck={handleToggleProductSelection}
        onPressItem={handleOpenQuantityModal}
      />
    );
  };

  const handleToggleProductSelection = (productId: string, isChecked: boolean) => {
    setSelectedProductIds((prev: string[]) => isChecked ? [...prev, productId] : prev.filter((id: string) => id !== productId));
  };

  const handleOpenQuantityModal = (product: Product) => {
    setSelectedProductForQuantity(product);
    setIsQuantityModalVisible(true);
  };

  const handleDeliveryTypeSelect = (type: TypeLivraison) => {
    setSelectedDeliveryType(type);
    setUseFreeDelivery(false);
    setAppliedCreditAmount(0);
  };

  const {
    reductionTotalProducts,
    MC,
    totalFinal,
    fraisAppli,
    CC,
  } = calculateFinalDeliveryCostForDisplay(
    deliveryCost,
    isOrderConfirmed,
    hasDeliveryArrived,
    selectedDeliveryType,
    useFreeDelivery,
    finalDeliveryCalculationResult,
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNavBar}>
        {['products', 'deliveryStatus', 'courses'].map((section) => (
          <TouchableOpacity
            key={section}
            style={[styles.topNavButton, activeSection === section && styles.topNavButtonActive]}
            onPress={() => setActiveSection(section)}
          >
            <Text style={[styles.topNavButtonText, activeSection === section && styles.topNavButtonTextActive]}>
              {section === 'products' ? t('prodsPann') : section === 'deliveryStatus' ? t('etatDeLiv') : t('listeCourses')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {activeSection === 'products' && (
          <CartProductsTab
            products={products}
            stores={stores}
            userLocation={userLocation}
            deliveryCost={deliveryCost}
            totalCommand={totalCommand}
            calculationResult={calculationResult}
            selectedDeliveryType={selectedDeliveryType}
            onDeliveryTypeSelect={handleDeliveryTypeSelect}
            onConfirmOrder={handleOrderConfirmation}
            renderProductItem={renderProductItem}
            t={t}
            useFreeDelivery={useFreeDelivery}
            userPremiumStatus={userPremiumStatus}
            userOrderCount={userOrderCount}
            onToggleProduct={handleToggleProductSelection}
            onOpenQuantityModal={handleOpenQuantityModal}
            MC={MC}
            CC={CC}
            fraisAppli={fraisAppli}
            finalTotal={totalFinal}
          />
        )}

        {activeSection === 'deliveryStatus' && (
          <DeliveryStatusTab
            isOrderConfirmed={isOrderConfirmed}
            isOrderCancelled={isOrderCancelled}
            deliveryStatusMessage={deliveryStatusMessage}
            confirmedDeliveryType={selectedDeliveryType}
            currentDriver={currentDriver}
            externalDriverDistance={externalDriverDistance}
            hasDeliveryArrived={hasDeliveryArrived}
            isDriverAcceptedOrder={isDriverAcceptedOrder}
            selectedRating={selectedRating}
            onCancelOrder={handleCancelOrder}
            onOpenQR={() => { }}
            onRatingSelect={setSelectedRating}
            t={t}
            finalDeliveryCalculationResult={finalDeliveryCalculationResult}
            confirmedTReel={confirmedTReel}
            confirmedTotalCommand={confirmedTotalCommand}
            confirmedAppliedCreditAmount={confirmedAppliedCreditAmount}
          />
        )}

        {activeSection === 'courses' && (
          <ShoppingListTab premiumStatus={userPremiumStatus} t={t} />
        )}
      </View>

      {selectedProductForQuantity && (
        <ModalOrderQuantity
          visible={isQuantityModalVisible}
          onClose={() => setIsQuantityModalVisible(false)}
          product={selectedProductForQuantity}
          userId={userLocation?.username || ''}
          onConfirm={(res: { quantity: number }) => {
            setProducts((prev: Product[]) => prev.map((p: Product) => p.id === selectedProductForQuantity.id ? { ...p, valeurQuantite: res.quantity } : p));
          }}
        />
      )}

      <PremiumUtiliOffersModal
        isVisible={isPremiumOffersVisible}
        onClose={() => setIsPremiumOffersVisible(false)}
        onUpgradePress={() => { }}
      />

      <InviteFriendsModal
        isVisible={inviteFriendsModalVisible}
        onClose={() => setInviteFriendsModalVisible(false)}
        currentUserId={userLocation?.username}
        successfulReferralsCount={numberOfFreeDeliveries}
      />
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  topNavBar: {
    flexDirection: 'row',
    backgroundColor: '#ececec',
    borderBottomWidth: 2,
    borderBottomColor: '#001524',
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  topNavButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  topNavButtonActive: {
    borderBottomWidth: 4,
    borderBottomColor: '#15616d',
  },
  topNavButtonText: {
    fontSize: 14,
    color: '#888',
  },
  topNavButtonTextActive: {
    color: '#15616d',
    fontWeight: 'bold',
  },
  cartItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemQty: {
    fontWeight: 'bold',
    color: '#15616d',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    marginHorizontal: 10,
  },
  itemPrice: {
    fontWeight: 'bold',
    color: '#ff7d00',
  },
  disabledItem: {
    opacity: 0.5,
  },
  cartItemCheckbox: {
    padding: 5,
  },
  checkboxCheckedColor: {
    color: '#ff7d00',
  },
  checkboxUncheckedColor: {
    color: '#888',
  },
  checkboxTouchArea: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export default ShoppingCartScreen;
