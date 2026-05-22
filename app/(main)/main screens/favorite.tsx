import { databases } from "@/services/api/init";
import { useStore } from "@/app/(main)/calculation-logic/store";
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Query } from "react-native-appwrite";
import ModalProductInfos from '../modals-others/modalProductInfos';
import ModalOrderQuantity from '../modals-others/modalOrderQuantity';
import { DB_CONFIG } from "../utils/vars";
import { buildProductPhoto, buildStorePhoto, buildSharedPhoto, Product as AppwriteProduct, Store, SharedPhoto } from "../calculation-logic/imagesLogic";
import { Ionicons } from '@expo/vector-icons';
import ModalStoreInfos, { Product } from '../modals-others/modalStoreInfos';
import { useAppTranslation } from '../translations/data/translationCentralization';

const { width } = Dimensions.get('window');

type Product = {
    $id: string;
    productName: string;
    productPrice: number | string;
    productImage?: string;
};
type OrderData = Product & {
    quantity: number;
    totalPrice: string
};

interface StoryDoc extends SharedPhoto {
    $id: string;
    fileId: string;
}
interface ProductDoc extends AppwriteProduct {
    $id: string;
    productName: string;
    descriptionFr: string;
    descriptionKab: string;
    productImage?: string;
    productPrice?: string | number;
}
interface StoreDoc extends Store {
    $id: string; name:
    string; imageId: string | null;
    productImage?: string;
    productName?: string;
}

type FavoriteItem = StoryDoc | ProductDoc | StoreDoc;

export const FavoritesScreen = () => {
    const { t, currentLang } = useAppTranslation();
    const [favorites, setFavorites] = useState<(Product | Store | SharedPhoto)[]>([]);
    const [unfavoritedItems, setUnfavoritedItems] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showStoreModal, setShowStoreModal] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedStory, setSelectedStory] = useState<{ story: StoryDoc; store: StoreDoc } | null>(null);
    const [selectedStoreForModal, setSelectedStoreForModal] = useState<Store | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [showReportMenu, setShowReportMenu] = useState(false);
    const [showReportReasons, setShowReportReasons] = useState(false);
    const [showProductMenu, setShowProductMenu] = useState(false);
    const [showStoreMenu, setShowStoreMenu] = useState(false);
    const { user } = useStore();

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            setRefreshing(true)
            const response = await databases.listDocuments(
                DB_CONFIG.DATABASE_ID,
                DB_CONFIG.FAVORITES_COLLECTION_ID,
                [
                    Query.equal('userId', user.$id),
                    Query.orderDesc('$createdAt')
                ]
            );
            setFavorites(response.documents);
        } catch (error) {
            console.log('Error fetching favorites:', error);
        } finally {
            setLoading(false);
            setRefreshing(false)
        }
    };

    const cleanOldUnfavorited = () => {
        const now = Date.now();
        setUnfavoritedItems((prev: Record<string, number>) => {
            const next = { ...prev };
            Object.keys(next).forEach(id => {
                if (now - next[id] > 86400000) delete next[id];
            });
            return next;
        });
    };

    useEffect(() => {
        const interval = setInterval(cleanOldUnfavorited, 3600000);
        return () => clearInterval(interval);
    }, []);


    const removeFavorite = async (favoriteId: string) => {
        try {
            await databases.deleteDocument(
                DB_CONFIG.DATABASE_ID,
                DB_CONFIG.FAVORITES_COLLECTION_ID,
                favoriteId
            );
            setFavorites(favorites.filter((fav: Product) => fav.$id !== favoriteId));
            Alert.alert(t('general.success'), t('yedradkkesSiLesFav'));
        } catch (error) {
            console.log('Error removing favorite:', error);
            Alert.alert(t('general.error'), t('genericError'));
        }
    };

    const renderFavorite = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => setSelectedProduct(item)}
        >
            <Image
                source={{ uri: item.$id ? buildProductPhoto(item.$id).apercu : '' }}
                style={styles.productImage}
            />
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.productName}</Text>
                <Text style={styles.productPrice}>${item.productPrice}</Text>
            </View>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFavorite(item.$id)}
            >
                <Ionicons name="heart-dislike" size={24} color="#e74c3c" />
            </TouchableOpacity>
        </TouchableOpacity>
    );


    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <Text>Loading favorites...</Text>
            </View>
        );
    }

    const handleCloseModal = () => {
        setShowStoryModal(false);
        setSelectedStory(null);
        setIsLiked(false);
        setShowReportMenu(false);
        setShowReportReasons(false);
    };

    const handleStoryPress = (story: StoryDoc, store: StoreDoc) => {
        setSelectedStory({ story, store });
        setShowStoryModal(true);
        setIsLiked(false);
        setShowReportMenu(false);
        setShowReportReasons(false);
    };

    const handleLikeToggle = () => {
        setIsLiked(!isLiked);
    };

    const handleReportMenuToggle = () => {
        setShowReportMenu((prev: boolean) => !prev);
        setShowReportReasons(false);
    };
    const handleShowReportReasons = () => {
        setShowReportReasons(true);
        setShowReportMenu(false);
    };

    const reportReasonsKeys = [
        'reportReasonScam',
        'reportReasonAdultContent',
    ];

    const handleStorePress = (store: Store) => {
        setSelectedStoreForModal(store);
        setShowStoreModal(true);
    };

    const isProduct = (item: FavoriteItem): item is ProductDoc => 'productName' in item;
    const isStore = (item: FavoriteItem): item is StoreDoc => 'name' in item;
    const isStory = (item: FavoriteItem): item is StoryDoc => 'fileId' in item;
    const favoriteProducts = (favorites as FavoriteItem[]).filter(isProduct).map(p => ({
        ...p,
        id: p.$id,
        name: p.productName,
        imageUrl: p.$id ? buildProductPhoto(p.$id).apercu : ''
    }));
    const allFavoriteStores = (favorites as FavoriteItem[]).filter(isStore).map(s => ({
        ...s,
        id: s.$id,
        profileImageUrl: s.$id ? buildStorePhoto(s.$id).cover : '',
        stories: (favorites as FavoriteItem[]).filter(isStory)
            .filter(st => st.storeId === s.$id)
            .map(st => ({
                id: st.$id,
                imageUrl: buildSharedPhoto(st.$id).vignette,
                story: st
            }))
    }));
    const handleProductPress = (product: ProductDoc) => {
        const productForState = {
            ...product,
            id: product.$id,
            name: product.productName,
            descriptionFr: product.descriptionFr || '',
            descriptionKab: product.descriptionKab || '',
            prix: product.productPrice || 0,
            price: product.productPrice || 0,
            image: product.$id ? buildProductPhoto(product.$id).detail : undefined,
        };
        setSelectedProduct(productForState);
        setShowProductModal(true);
    };

    const handleCloseProductModal = () => setShowProductModal(false);
    const handleCloseStoreModal = () => setShowStoreModal(false);

    return (
        <>
            {!showStoryModal && (
                <ScrollView style={styles.container}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScrollContainer}>
                        {allFavoriteStores.map((store) => (
                            store.stories.length > 0 && (
                                <TouchableOpacity
                                    key={store.id}
                                    style={styles.storyButton}
                                    onPress={() => handleStoryPress(store.stories[0].story, store)}
                                >
                                    <Image source={{ uri: store.stories[0].imageUrl }} style={styles.storyImage} />
                                </TouchableOpacity>
                            )
                        ))}
                    </ScrollView>
                    <Text style={styles.sectionTitle}>{t('prodFav')}</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsScrollContainer}>
                        {favoriteProducts.map((product) => (
                            <TouchableOpacity
                                key={product.id}
                                style={styles.productButton}
                                onPress={() => handleProductPress(product)}
                            >
                                <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.sectionTitle}>{t('magFav')}</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favoriteStoresScrollContainer}>
                        {allFavoriteStores.map((store) => (
                            <View key={store.id} style={styles.favoriteStoreItemWrapper}>
                                <TouchableOpacity
                                    style={styles.favoriteStoreButton}
                                    onPress={() => handleStorePress(store)}
                                >
                                    <Image source={{ uri: store.profileImageUrl }} style={styles.favoriteStoreImage} />
                                </TouchableOpacity>
                                <Text style={styles.favoriteStoreName}>{store.name}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </ScrollView>
            )}

            {showStoryModal && selectedStory && (
                <View style={styles.fullScreenStoryContainer}>
                    <View style={styles.modalHeader}>
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity
                            onPress={handleReportMenuToggle}
                            style={[
                                styles.headerIconContainer,
                                styles.headerThreeDotsButton
                            ]}
                        >
                            <Ionicons
                                name="ellipsis-vertical"
                                size={styles.headerIcon.fontSize}
                                color={styles.headerIcon.color}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleCloseModal} style={styles.headerIconContainer}>
                            <Ionicons
                                name="close"
                                size={styles.headerIcon.fontSize}
                                color={styles.headerIcon.color}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.imageStoryContainer}>
                        <Image source={{ uri: selectedStory.story.imageUrl }} style={styles.modalStoryImage} />
                        <TouchableOpacity onPress={handleLikeToggle} style={styles.modalFloatingLikeButton}>
                            <Ionicons
                                name={isLiked ? 'heart' : 'heart-outline'}
                                size={styles.modalLikeText.fontSize}
                                color={styles.modalLikeText.color}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalBottomBar}>
                        <Text style={styles.storeNameText}>{selectedStory.store.name}</Text>
                    </View>

                    {showReportMenu && (
                        <View style={styles.reportMenu}>
                            <TouchableOpacity onPress={handleShowReportReasons} style={styles.reportMenuItem}>
                                <Ionicons
                                    name="alert-circle"
                                    size={styles.reportMenuIcon.fontSize}
                                    color={styles.reportMenuIcon.color}
                                />
                                <Text style={styles.reportMenuText}>{t('reportPhoto')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {showReportReasons && (
                        <View style={styles.reportReasonsMenu}>
                            {reportReasonsKeys.map((reasonKey, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.reportReasonsMenuItem}
                                    onPress={() => {
                                        Alert.alert(
                                            t('commandList.reportSuccess'),
                                            t('commandList.reportSuccessMessage'),
                                            [
                                                {
                                                    text: 'OK',
                                                    onPress: () => handleCloseModal(),
                                                },
                                            ]
                                        );
                                    }}
                                >
                                    <Text style={styles.reportReasonsMenuText}>{t(reasonKey)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            )}

            <ModalProductInfos
                visible={showProductModal}
                onClose={handleCloseProductModal}
                product={selectedProduct}
                initialFavorite={true}
                onFavoriteToggle={(isFav: boolean, id: string) => {
                    if (!isFav) removeFavorite(id);
                }}
                onOrderPress={() => setShowOrderModal(true)}
            />
            <ModalOrderQuantity
                visible={showOrderModal}
                onClose={() => setShowOrderModal(false)}
                product={selectedProduct}
                userId={user.$id}
                onConfirm={() => setShowOrderModal(false)}
            />

            <ModalStoreInfos
                visible={showStoreModal}
                storeId={selectedStoreForModal?.$id || null}
                onClose={handleCloseStoreModal}
                groupesStore={[]}
                selectedTypeStore={null}
                setSelectedStoreD={() => { }}
                setSelectedGroupe={() => { }}
                setSelectedTypeStore={() => { }}
                setSelectedStore={() => { }}
                setVisibleCategories={() => { }}
                setSelectedCategory={() => { }}
                setOpenProductType={() => { }}
            />

        </>
    );
};

const styles = StyleSheet.create({
    fullScreenStoreContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f8f8f8',
        zIndex: 9998,
        flexDirection: 'column',
    },
    storeModalHeader: {
        height: 70,
        backgroundColor: '#001524',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    storeOptionsMenu: {
        position: 'absolute',
        top: 70,
        right: 15,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 10000,
    },
    storeOptionsMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 5,
    },
    storeOptionsMenuItemText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
    storeDetailContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: 'white',
        alignItems: 'center',
    },
    storeDetailName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    storeDetailPlaceholder: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
        marginTop: 20,
    },
    productOptionsMenu: {
        position: 'absolute',
        top: 70,
        right: 15,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 10000,
    },
    productOptionsMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 5,
    },
    productOptionsMenuItemText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
    fullScreenProductContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f8f8f8',
        zIndex: 9999,
        flexDirection: 'column',
    },
    productModalHeader: {
        height: 70,
        backgroundColor: '#001524',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    productDetailContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
        backgroundColor: 'white',
    },
    productDetailName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#333',
    },
    productDetailImage: {
        width: '100%',
        height: Dimensions.get('window').width * 0.7,
        resizeMode: 'contain',
        marginBottom: 20,
        borderRadius: 8,
        backgroundColor: '#eee',
    },
    headerThreeDotsButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    reportMenu: {
        position: 'absolute',
        top: 70,
        right: 15,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 10000,
    },
    reportMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
    },
    reportMenuIcon: {
        fontSize: 28,
        color: '#001524',
        marginRight: 10,
    },
    reportMenuText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
    reportReasonsMenu: {
        position: 'absolute',
        top: 70,
        right: 15,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 10000,
    },
    reportReasonsMenuItem: {
        paddingVertical: 8,
    },
    reportReasonsMenuText: {
        fontSize: 16,
        color: '#333',
    },
    fullScreenStoryContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'black',
        zIndex: 9999,
        flexDirection: 'column',
    },
    modalHeader: {
        height: 70,
        backgroundColor: 'rgba(0, 0, 255, 0.3)',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    headerIconContainer: {
        padding: 8,
        borderColor: '#755',
        borderWidth: 2,
        marginLeft: 15,
    },
    headerIcon: {
        fontSize: 24,
        color: 'white',
        marginTop: 10,
        fontWeight: 'bold',
    },
    imageStoryContainer: {
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
    },
    modalStoryImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    modalFloatingLikeButton: {
        position: 'absolute',
        bottom: '25%',
        left: 5,
        zIndex: 10,
        padding: 10,
    },
    modalLikeText: {
        fontSize: 28,
        color: 'red',
    },
    modalBottomBar: {
        height: 90,
        backgroundColor: 'rgba(0, 0, 255, 0.3)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    storeNameText: {
        fontSize: 18,
        marginTop: 0,
        marginBottom: 30,
        color: 'white',
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        paddingVertical: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 15,
        marginTop: 20,
        marginBottom: 10,
        color: '#333',
    },
    storiesScrollContainer: {
        paddingHorizontal: 10,
        alignItems: 'center',
        paddingBottom: 10,
        marginTop: 70,
    },
    storyButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        overflow: 'hidden',
        marginHorizontal: 8,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FF5733',
    },
    storyImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    productsScrollContainer: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    productButton: {
        width: width * 0.35,
        height: width * 0.35,
        borderRadius: 10,
        overflow: 'hidden',
        marginHorizontal: 8,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    favoriteStoresScrollContainer: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    favoriteStoreButton: {
        width: width * 0.4,
        height: width * 0.3,
        borderRadius: 10,
        overflow: 'hidden',
        marginHorizontal: 8,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#755',
        borderWidth: 2,
    },
    favoriteStoreImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    favoriteStoreName: {
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
        maxWidth: width * 0.4,
        color: '#555',
    },
    favoriteStoreItemWrapper: {
        alignItems: 'center',
        marginHorizontal: 8,
        width: width * 0.4,
    },
});

export default FavoritesScreen;
