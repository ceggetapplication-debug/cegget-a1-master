import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buildProductPhoto } from '../calculation-logic/imagesLogic';
import { useAppTranslation } from '../translations/data/translationCentralization';

const ModalProductInfos = ({
    visible,
    onClose,
    product,
    onOrderPress,
    initialFavorite = false,
    onFavoriteToggle
}: {
    visible: boolean;
    onClose: () => void;
    product: {
        $id: string;
        imageId?: string;
        image?: string;
        name: string;
        brand: string;
        descriptionFr: string;
        descriptionKab: string;
        unit: string;
        price: number | string;
        store: string;
        address: string;
    };
    onOrderPress: () => void;
    initialFavorite?: boolean;
    onFavoriteToggle?: (isFavorite: boolean, productId: string) => void;
}) => {

    const { t, currentLang } = useAppTranslation();
    const [isFavorite, setIsFavorite] = useState(initialFavorite);

    if (!product) return null;

    const productImageUrl = product.imageId
        ? buildProductPhoto(product.$id || product.$id).detail
        : product.image;

    const toggleFavorite = () => {
        const newValue = !isFavorite;
        setIsFavorite(newValue);

        if (newValue) {
            Alert.alert(t('tab.favorite'), t('modals.product.favorite_added_message'));
        }

        if (onFavoriteToggle) {
            onFavoriteToggle(newValue, product.$id);
        }
    };

    const getLabelType = (unit: string) => {
        const volumeUnits = ['l', 'cl', 'ml'];
        const weightUnits = ['Kg', 'g'];
        const bulkUnits = ['DZD/Kg'];

        const lowerUnit = unit?.toLowerCase().trim();

        if (volumeUnits.includes(lowerUnit)) return t('general.volume') + ":";
        if (weightUnits.includes(lowerUnit)) return t('general.weight') + ":";
        if (bulkUnits.includes(lowerUnit)) return t('aLaMesure') + ":";

        return t('unit_label') + ":";
    };


    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="chevron-down" size={32} color="#001524" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.favoriteBtn} onPress={toggleFavorite}>
                        <Ionicons
                            name={isFavorite ? "heart" : "heart-outline"}
                            size={32}
                            color={isFavorite ? "#ff7d00" : "#001524"}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
                        <Text style={styles.mainTitle}>{t('surLeProd')}</Text>

                        <Image
                            source={{ uri: productImageUrl }}
                            style={styles.productImage}
                        />

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>{t('product_name')}:</Text>
                            <Text style={styles.value}>{product.name}</Text>
                        </View>

                        {product.brand && product.brand.trim() !== "" && (
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>{t('product_brand')}:</Text>
                                <Text style={styles.value}>{product.brand}</Text>
                            </View>
                        )}

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>{getLabelType(product.unit)}</Text>
                            <Text style={styles.value}>{product.unit}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>{t('commandsMgz.unitPrice')}: </Text>
                            <Text style={styles.priceValue}>{product.price} DZD</Text>
                        </View>

                        {((currentLang === 'kab' ? product.descriptionKab : product.descriptionFr) || '').trim() !== "" && (
                            <View style={styles.detailsContainer}>
                                <Text style={styles.label}>{t('productDetails')}:</Text>
                                <Text style={styles.description}>
                                    {currentLang === 'kab' ? product.descriptionKab : product.descriptionFr}
                                </Text>
                            </View>
                        )}

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>{t('ordersByStore.store')}:</Text>
                            <Text style={styles.storeValue}>{product.store}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>{t('commandList.address')}: </Text>
                            <Text style={styles.value}>{product.address}</Text>
                        </View>
                    </ScrollView>

                    <TouchableOpacity style={styles.commanderBtn} onPress={onOrderPress}>
                        <Text style={styles.commanderText}>{t('place_order_label')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        paddingBottom: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    closeBtn: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    favoriteBtn: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    content: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 45,
        borderTopRightRadius: 45,
        paddingTop: 35,
        paddingHorizontal: 30,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    scrollContainer: {
        paddingBottom: 30,
    },
    mainTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#15616d',
        marginBottom: 25,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    infoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
        alignItems: 'center',
    },
    label: {
        fontSize: 15,
        fontWeight: '800',
        color: '#001524',
        marginRight: 8,
    },
    value: {
        fontSize: 15,
        fontWeight: '500',
        color: '#000000',
    },
    priceValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#ff7d00',
    },
    storeValue: {
        fontSize: 15,
        fontWeight: '800',
        color: '#000000',
    },
    detailsContainer: {
        marginBottom: 20,
    },
    description: {
        fontSize: 15,
        color: '#000000',
        lineHeight: 22,
        marginTop: 5,
    },
    commanderBtn: {
        backgroundColor: '#ff7d00',
        height: 50,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#ff7d00',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    commanderText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    productImage: {
        width: '100%',
        height: 200,
        borderRadius: 20,
        marginBottom: 25,
        resizeMode: 'cover',
    },
});

export default ModalProductInfos;
