import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from './modalStoreInfos';
import { databases, config, ID } from '../calculation-logic/appwriteConfig';
import { useAppTranslation } from '../translations/data/translationCentralization';

interface ModalOrderQuantityProps {
    visible: boolean;
    onClose: () => void;
    product: Product | null;
    userId: string;
    onConfirm?: (orderData: Product & { quantity: number; totalPrice: string }) => void;
}

const ModalOrderQuantity: React.FC<ModalOrderQuantityProps> = ({
    visible,
    onClose,
    product,
    onConfirm,
    userId
}: ModalOrderQuantityProps) => {
    const { t } = useAppTranslation();
    const isUnit = product?.productType?.name === 'unit' || product?.productType?.id === 'unit';
    const pricePerKg = product?.quantity_unit_dzd_per_kg || 0;
    const unitPrice = product?.prix || 0;
    const unitWeight = product?.valeurQuantite ? `${product.valeurQuantite} ${product.uniteQuantite || ''}` : '';

    const [inputValue, setInputValue] = useState(isUnit ? "1" : "100");
    const numericValue = parseInt(inputValue) || 0;

    const handleIncrement = () => {
        if (isUnit) {
            setInputValue(String(numericValue + 1));
        } else {
            const step = numericValue >= 1000 ? 500 : 50;
            setInputValue(String(numericValue + step));
        }
    };

    const handleDecrement = () => {
        if (isUnit) {
            if (numericValue > 1) setInputValue(String(numericValue - 1));
        } else {
            const step = numericValue > 1000 ? 500 : 50;
            if (numericValue > 50) setInputValue(String(numericValue - step));
        }
    };

    const formatQuantityDisplay = () => {
        if (isUnit) {
            return `${numericValue} unité${numericValue > 1 ? 's' : ''}${unitWeight ? ` — ${unitWeight}` : ''}`;
        } else {
            if (numericValue >= 1000) {
                const kg = numericValue / 1000;
                return `${kg % 1 === 0 ? kg : kg.toFixed(2)} kg`;
            }
            return `${numericValue} g`;
        }
    };

    const calculatePrice = () => {
        if (isUnit) {
            return (numericValue * unitPrice).toFixed(2);
        } else {
            return ((numericValue / 1000) * pricePerKg).toFixed(2);
        }
    };

    const handleOrder = async () => {
        if (!product) return;

        if (numericValue <= 0) {
            Alert.alert(t('general.error'), t('montantCCinvalide'));
            return;
        }

        try {
            await databases.createDocument(
                config.databaseId,
                config.ordersCollectionId,
                ID.unique(),
                {
                    userId: userId,
                    productId: product.id,
                    nom: product.name,
                    prix: parseFloat(calculatePrice()),
                    quantite: numericValue,
                    storeId: "boutique_inconnue"
                }
            );

            Alert.alert(t('general.success'), t('product_added_successfully'));
            if (onConfirm) onConfirm({ ...product, quantity: numericValue, totalPrice: calculatePrice() });
            onClose();

        } catch (error) {
            console.error("Erreur Appwrite:", error);
            Alert.alert(t('general.error'), "Erreur lors de l'ajout au panier");
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.topHeader}>
                        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
                            <Ionicons name="arrow-back" size={24} color="#001524" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.title}>{t('add_to_cart_title')}</Text>
                    <Text style={styles.question}>{t('add_to_cart_message')}</Text>

                    <View style={styles.selectorContainer}>
                        <TouchableOpacity style={styles.sideBtn} onPress={handleDecrement}>
                            <Ionicons name="remove" size={24} color="#fff" />
                        </TouchableOpacity>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={inputValue}
                                onChangeText={setInputValue}
                                keyboardType="numeric"
                                selectTextOnFocus={true}
                            />
                        </View>

                        <TouchableOpacity style={styles.sideBtn} onPress={handleIncrement}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.formattedText}>{formatQuantityDisplay()}</Text>

                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>{t('commandsMgz.unitPriceLabel')}</Text>
                        <Text style={styles.priceValue}>{calculatePrice()} {t('commandList.currency')}</Text>
                    </View>

                    <TouchableOpacity style={styles.commandBtn} onPress={handleOrder}>
                        <Text style={styles.commandText}>{t('add_to_cart_title')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 45,
        padding: 25,
        alignItems: 'center',
    },
    topHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f8f8f8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#15616d',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    question: {
        fontSize: 15,
        color: '#001524',
        textAlign: 'center',
        marginBottom: 25,
        fontWeight: '600',
        lineHeight: 20,
    },
    selectorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    sideBtn: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: '#001524',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputWrapper: {
        marginHorizontal: 15,
        width: 100,
        height: 50,
        backgroundColor: '#f8f8f8',
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: '#eee',
    },
    input: {
        flex: 1,
        fontSize: 18,
        fontWeight: '900',
        color: '#000000',
        textAlign: 'center',
    },
    formattedText: {
        fontSize: 15,
        color: '#000000',
        fontWeight: '700',
        marginBottom: 25,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 35,
    },
    priceLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#001524',
        marginRight: 10,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#ff7d00',
    },
    commandBtn: {
        backgroundColor: '#ff7d00',
        width: '100%',
        height: 50,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#ff7d00',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    commandText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
});

export default ModalOrderQuantity;
