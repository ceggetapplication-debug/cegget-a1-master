import React, { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TextInput, Image, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, Modal, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ModalProductInfos from '../../modals-others/modalProductInfos';
import ModalOrderQuantity from '../../modals-others/modalOrderQuantity';
import { SearchLogic, SearchResult, PopularProduct } from '../calculation-logic/searchLogic';
import { ProductNameKey, productNameTranslator, estimateInputLanguage, getProductSuggestions, loadTranslationsFromJson } from '../calculation-logic/logiqueNoms';
import * as ImagesLogic from '../calculation-logic/imagesLogic';
import { Product } from '../../modals-others/modalStoreInfos';
import { containsArabic } from '../../translations/data/blockerArab';
import { useAppTranslation } from '../translations/data/translationCentralization';

interface RecentSearchItem {
    term: string;
    timestamp: number;
}

const RECENT_SEARCH_KEY = 'recentProductSearches';
const MAX_RECENT_SEARCHES = 5;

const storage = {
    getItem: (key: string) => null,
    setItem: (key: string, value: string) => { }
};

class SearchScreenService {
    private _recentSearches: RecentSearchItem[] = [];
    private _popularProducts: PopularProduct[] = [];
    private _currentSearchTerm: string = '';
    private _currentSuggestions: string[] = [];

    public onRecentSearchesChange?: (searches: RecentSearchItem[]) => void;
    public onPopularProductsChange?: (products: PopularProduct[]) => void;
    public onSearchTermChange?: (term: string) => void;
    public onSearchTriggered?: (term: string) => void;
    public onSuggestionsChange?: (suggestions: string[]) => void;
    public onResultsChange?: (results: SearchResult[]) => void;

    constructor() {
        this.loadRecentSearches();
        void this.loadPopularProducts();
    }

    public getRecentSearches(): RecentSearchItem[] { return [...this._recentSearches]; }
    public getPopularProducts(): PopularProduct[] { return [...this._popularProducts]; }
    public getCurrentSearchTerm(): string { return this._currentSearchTerm; }
    public getCurrentSuggestions(): string[] { return [...this._currentSuggestions]; }

    private loadRecentSearches(): void {
        const stored = storage.getItem(RECENT_SEARCH_KEY);
        if (stored) {
            try {
                this._recentSearches = JSON.parse(stored);
            } catch (e) {
                console.error("Erreur lors du parsing des recherches récentes:", e);
                this._recentSearches = [];
            }
        }
        this.onRecentSearchesChange?.(this._recentSearches);
    }
    private saveRecentSearches(): void {
        storage.setItem(RECENT_SEARCH_KEY, JSON.stringify(this._recentSearches));
        this.onRecentSearchesChange?.(this._recentSearches);
    }

    public async setSearchTerm(term: string): Promise<void> {
        this._currentSearchTerm = term;
        this.onSearchTermChange?.(this._currentSearchTerm);
    }


    public async performSearch(term?: string, language?: 'fr' | 'kab'): Promise<void> {
        const finalTerm = (term || this._currentSearchTerm).trim();
        if (!finalTerm) {
            Alert.alert("Recherche", "Veuillez entrer un terme de recherche.");
            return;
        }

        console.log(`Lancement de la recherche pour : "${finalTerm}"`);
        this.addRecentSearch(finalTerm);

        await SearchLogic.updatePopularity(finalTerm);
        const results = await SearchLogic.performSearch(finalTerm, language || 'kab');
        this.onResultsChange?.(results);

        this.onSearchTriggered?.(finalTerm);
        this.setSearchTerm('');
    }

    public addRecentSearch(term: string): void {
        term = term.trim();
        if (!term) return;

        this._recentSearches = this._recentSearches.filter(item => item.term.toLowerCase() !== term.toLowerCase());
        this._recentSearches.unshift({ term: term, timestamp: Date.now() });

        if (this._recentSearches.length > MAX_RECENT_SEARCHES) {
            this._recentSearches = this._recentSearches.slice(0, MAX_RECENT_SEARCHES);
        }
        this.saveRecentSearches();
    }

    public removeRecentSearch(termToRemove: string): void {
        this._recentSearches = this._recentSearches.filter(item => item.term !== termToRemove);
        this.saveRecentSearches();
    }

    public async loadPopularProducts(): Promise<void> {
        try {
            this._popularProducts = await SearchLogic.getPopularProducts();
            this.onPopularProductsChange?.(this._popularProducts);
        } catch (error) {
            console.error("Échec du chargement des products populaires:", error);
            Alert.alert("Erreur", "Impossible de charger les products populaires.");
        }
    }
}
const searchService = new SearchScreenService();

export default function SearchScreen() {
    const [searchTerm, setSearchTerm] = useState('');
    const { t, currentLang, setLanguage } = useAppTranslation();
    const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
    const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loadingPopular, setLoadingPopular] = useState(true);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [selectedProduct, setSelectedProduct] = useState<SearchResult | null>(null);
    const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


    useEffect(() => {
        const detectLangAndSuggest = async () => {
            if (searchTerm.length > 0) {
                await loadTranslationsFromJson();
                const res = estimateInputLanguage(searchTerm);
                const detected = res === 'unknown' ? 'fr' : res;

                if (detected !== currentLang) {
                    setLanguage(detected);
                }
                const suggestedProducts = getProductSuggestions(searchTerm, detected, 8);
                setSuggestions(suggestedProducts.map(s => s.translatedName));
            } else {
                setSuggestions([]);
                setShowResults(false);
            }
        };


        const handler = setTimeout(detectLangAndSuggest, 300);
        return () => clearTimeout(handler);
    }, [searchTerm, currentLang]);

    useEffect(() => {
        AsyncStorage.getItem('userUsername').then((id: string | null) => {
            if (id) setUserId(id);
        });
    }, []);

    useEffect(() => {
        void loadTranslationsFromJson();
        searchService.onRecentSearchesChange = (searches) => setRecentSearches(searches);
        searchService.onResultsChange = (results) => {
            setSearchResults(results);
            setShowResults(true);
        };
        searchService.onPopularProductsChange = (products) => {
            setPopularProducts(products);
            setLoadingPopular(false);
        };

        setRecentSearches(searchService.getRecentSearches());
        void searchService.loadPopularProducts();

        return () => {
            searchService.onRecentSearchesChange = undefined;
            searchService.onPopularProductsChange = undefined;
            searchService.onResultsChange = undefined;
            searchService.onSearchTriggered = undefined;
            if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
            }
        };
    }, []);

    const handleSearchPress = () => {
        void searchService.performSearch(searchTerm, currentLang);
    };

    const handleRecentItemSelect = (term: string) => {
        void searchService.performSearch(term);
    };

    const handlePopularItemSelect = (term: string) => {
        void searchService.performSearch(term);
    };
    const handleSuggestionSelect = (suggestion: string) => {
        void searchService.setSearchTerm(suggestion);
        void searchService.performSearch(suggestion);
        setIsInputFocused(false);
        Keyboard.dismiss();
    };
    const handleInputBlur = () => {
        blurTimeoutRef.current = setTimeout(() => {
            setIsInputFocused(false);
        }, 150);
    };


    return (
        <View style={styles.container}>
            <View style={{ position: 'relative', marginBottom: 0 }}>
                <View style={styles.searchBar}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('lookingForProd')}
                        value={searchTerm}
                        onChangeText={(text: string) => {
                            if (containsArabic(text)) return;
                            setSearchTerm(text);
                        }}
                        clearButtonMode="while-editing"
                        onSubmitEditing={handleSearchPress}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={handleInputBlur}
                        onPressIn={() => { if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current); }}
                    />
                    <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
                        <Ionicons name="search" size={24} color="#ff7d00" />
                    </TouchableOpacity>
                </View>
                {isInputFocused && (
                    <View style={styles.suggestionsDropdown}>
                        <FlatList
                            data={suggestions}
                            keyExtractor={(item: string) => item}
                            renderItem={({ item }: { item: string }) => (
                                <TouchableOpacity onPress={() => handleSuggestionSelect(item)} style={styles.suggestionItem}>
                                    <Text style={styles.suggestionText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                            style={styles.suggestionsList}
                        />
                    </View>
                )}

                {showResults && (
                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={styles.sectionTitle}>{t('tab.research')}</Text>
                            <TouchableOpacity onPress={() => setShowResults(false)}>
                                <Text style={{ color: '#ff7d00', fontWeight: '800' }}>{t('general.cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item: SearchResult) => item.id}
                            renderItem={({ item, index }: { item: SearchResult; index: number }) => (
                                <TouchableOpacity
                                    onPress={() => setSelectedProduct(item)}
                                    style={[styles.productBtn, { flexDirection: index % 2 === 0 ? 'row' : 'row-reverse' }]}
                                >
                                    <View style={styles.productBtnImageWrapper}>
                                        <Image
                                            source={{ uri: item.id ? ImagesLogic.buildProductPhoto(item.id).apercu : "" }}
                                            style={styles.productBtnImage}
                                        />
                                    </View>
                                    <View style={styles.productBtnText}>
                                        <Text style={styles.productBtnNom}>{item.name}</Text>
                                        <Text style={styles.productBtnStore}>{item.store}</Text>
                                        <Text style={styles.productBtnPrice}>{item.prix}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={{ textAlign: 'center', padding: 20 }}>Aucun product trouvé</Text>}
                        />
                    </View>
                )}

                {!showResults && (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('ghesson')}</Text>
                            <FlatList
                                data={recentSearches}
                                keyExtractor={(item: RecentSearchItem) => item.term}
                                renderItem={({ item }: { item: RecentSearchItem }) => (
                                    <View style={styles.itemRow}>
                                        <Ionicons name="time-outline" size={18} color="#78290f" style={styles.itemIcon} />
                                        <TouchableOpacity onPress={() => handleRecentItemSelect(item.term)} style={styles.itemTextContainer}>
                                            <Text style={styles.itemText}>{item.term}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => searchService.removeRecentSearch(item.term)} style={styles.removeButton}>
                                            <Ionicons name="close-circle-outline" size={20} color="#78290f" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                        </View>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('popolar')}</Text>
                            {loadingPopular ? (
                                <ActivityIndicator size="large" color="#0000ff" />
                            ) : (
                                <FlatList
                                    data={popularProducts}
                                    keyExtractor={(item: PopularProduct) => item.name}
                                    renderItem={({ item }: { item: PopularProduct }) => (
                                        <TouchableOpacity onPress={() => handlePopularItemSelect(item.name)} style={styles.itemRow}>
                                            <Text style={styles.itemText}>{item.name}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            )}
                        </View>
                    </>
                )}
            </View>
            <ModalProductInfos
                visible={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct ? {
                    id: selectedProduct.id,
                    $id: selectedProduct.id,
                    name: selectedProduct.name,
                    marque: selectedProduct.marque,
                    prix: parseFloat(selectedProduct.prix) || 0,
                    descriptionFr: selectedProduct.descriptionFr,
                    descriptionKab: selectedProduct.descriptionKab,
                    imageId: selectedProduct.imageId,
                    store: selectedProduct.store,
                    address: selectedProduct.address,
                    valeurQuantite: selectedProduct.valeur,
                    uniteQuantite: selectedProduct.unite,
                    image: {
                        uri: selectedProduct.id ? ImagesLogic.buildProductPhoto(selectedProduct.id).detail : '',
                        width: ImagesLogic.sizes().PRODUCT_DETAIL_W,
                        height: ImagesLogic.sizes().PRODUCT_DETAIL_H
                    },
                    category: { id: '', name: '' }
                } as Product : null}
                onOrderPress={() => setShowOrderModal(true)}
            />
            <ModalOrderQuantity
                visible={showOrderModal}
                onClose={() => setShowOrderModal(false)}
                product={selectedProduct ? {
                    id: selectedProduct.id,
                    $id: selectedProduct.id,
                    name: selectedProduct.name,
                    marque: selectedProduct.marque,
                    prix: parseFloat(selectedProduct.prix) || 0,
                    descriptionFr: selectedProduct.descriptionFr || "",
                    descriptionKab: selectedProduct.descriptionKab || "",
                    imageId: selectedProduct.imageId,
                    valeurQuantite: selectedProduct.valeur,
                    uniteQuantite: selectedProduct.unite,
                    image: {
                        uri: selectedProduct.id ? ImagesLogic.buildProductPhoto(selectedProduct.id).apercu : '',
                        width: ImagesLogic.sizes().PRODUCT_APERCU_W,
                        height: ImagesLogic.sizes().PRODUCT_APERCU_H
                    },
                    category: { id: '', name: '' }
                } as Product : null}
                onConfirm={(orderData: Product & { quantity: number; totalPrice: string }) => {
                    console.log('Commande confirmée:', orderData);
                    setShowOrderModal(false);
                    setSelectedProduct(null);
                }}
                userId={userId}
            />

        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 50,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
        borderWidth: 1,
        borderColor: '#15616d',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#001524',
    },
    searchButton: {
        padding: 8,
        borderRadius: 50,
        backgroundColor: '#ffecd1',
    },
    searchButtonText: {
        fontSize: 24,
        color: '#ff7d00',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#001524',
        borderBottomWidth: 2,
        borderBottomColor: '#ff7d00',
        paddingBottom: 5,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ffecd1',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
    },
    itemTextContainer: {
        flex: 1,
        marginLeft: 10,
    },
    itemText: {
        fontSize: 16,
        color: '#15616d',
    },
    itemIcon: {
        fontSize: 18,
        color: '#78290f',
    },
    removeButton: {
        padding: 5,
        borderRadius: 50,
    },
    removeButtonText: {
        fontSize: 18,
        color: '#78290f',
    },
    suggestionsList: {
        paddingVertical: 2,
    },
    suggestionsDropdown: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#15616d',
        borderRadius: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        maxHeight: 200,
        overflow: 'hidden',
    },
    suggestionItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f8f8',
        flexDirection: 'row',
        alignItems: 'center',
    },
    suggestionText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    productCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#001524',
    },
    productBrand: {
        fontSize: 12,
        color: '#15616d',
        fontWeight: '600',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '900',
        color: '#ff7d00',
        marginLeft: 10,
    },
    productBtn: {
        alignItems: 'center',
        marginTop: 15,
        borderRadius: 12,
        paddingHorizontal: 5,
        paddingVertical: 10,
        overflow: 'hidden',
        backgroundColor: '#ececec',
    },
    productBtnImageWrapper: {
        width: '45%',
        position: 'relative',
    },
    productBtnImage: {
        width: '100%',
        height: 130,
    },
    productBtnText: {
        flex: 1,
        padding: 5,
        justifyContent: 'center',
    },
    productBtnNom: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
        marginBottom: 4,
        marginLeft: 5,
    },
    productBtnStore: {
        fontSize: 12,
        color: '#15616d',
        fontWeight: '600',
        marginTop: 2,
        marginLeft: 5,
        textTransform: 'uppercase',
    },
    productBtnPrice: {
        fontSize: 13,
        fontWeight: '900',
        color: '#ff7d00',
        marginLeft: 25,
        marginTop: 4,
    },

});
