import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, SafeAreaView, TouchableOpacity, Keyboard, ActivityIndicator } from 'react-native';
import { ProductNameKey } from '../calculation-logic/logiqueNoms';
import { useAppTranslation } from '../translations/data/translationCentralization';

type LogiqueNomsModule = {
  loadTranslationsFromJson: () => Promise<void>;
  getProductSuggestions: (inputText: string, displayLanguage: 'fr' | 'kab', limit: number) => Array<{ productNameKey: ProductNameKey; translatedName: string; }>;
  checkExactClassificationMatch: (inputText: string, displayLanguage: 'fr' | 'kab') => { matchType: 'productName' | 'none'; key: ProductNameKey | null };
  productNameTranslator: (key: ProductNameKey | string, targetLanguage: string) => string;
  estimateInputLanguage: (inputText: string) => 'fr' | 'kab' | 'unknown';
  normalizeText: (text: string) => string;
  getLanguageSpecificSearchVariants: (text: string, lang: 'fr' | 'kab') => Set<string>;
};

let loadedLogiqueNoms: LogiqueNomsModule | null = null;

const ProductSearchBar: React.FC = () => {
  console.log("ProductSearchBar: Composant rendu !");

  const [productSearchText, setProductSearchText] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<Array<{ productNameKey: ProductNameKey; translatedName: string; }>>([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [isLogiqueNomsLoaded, setIsLogiqueNomsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorLoadingData, setErrorLoadingData] = useState(false);
  const [currentDisplayLanguage, setCurrentDisplayLanguage] = useState<'fr' | 'kab'>('fr');

  const { t } = useAppTranslation();
  const productInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const loadLogiqueNomsModule = async () => {
      try {
        const module = await import('../calculation-logic/logiqueNoms');
        loadedLogiqueNoms = {
          loadTranslationsFromJson: module.loadTranslationsFromJson,
          getProductSuggestions: module.getProductSuggestions,
          checkExactClassificationMatch: module.checkExactClassificationMatch as any,
          productNameTranslator: module.productNameTranslator,
          estimateInputLanguage: module.estimateInputLanguage,
          normalizeText: module.normalizeText,
          getLanguageSpecificSearchVariants: module.getLanguageSpecificSearchVariants,
        } as LogiqueNomsModule;
        setIsLogiqueNomsLoaded(true);
      } catch (e) {
        console.error("ERREUR CRITIQUE: Impossible de charger le module logiqueNoms.tsx", e);
        setErrorLoadingData(true);
      }
    };
    loadLogiqueNomsModule();
  }, []);


  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isLogiqueNomsLoaded && !errorLoadingData) {
      const initializeData = async () => {
        setIsLoadingData(true);
        setErrorLoadingData(false);
        try {
          await loadedLogiqueNoms!.loadTranslationsFromJson();
          setIsInitialized(true);
          setIsLoadingData(false);
        } catch (error) {
          console.error("ERREUR lors de l'initialisation des données de logiqueNoms:", error);
          setIsInitialized(false);
          setIsLoadingData(false);
          setErrorLoadingData(true);
        }
      };
      timeoutId = setTimeout(() => {
        initializeData();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isLogiqueNomsLoaded, errorLoadingData]);


  useEffect(() => {
    if (!isLogiqueNomsLoaded || !isInitialized || errorLoadingData) {
      setProductSuggestions([]);
      setShowProductSuggestions(false);
      return;
    }

    const handler = setTimeout(async () => {
      if (!loadedLogiqueNoms) return;

      let langToUse: 'fr' | 'kab';

      if (productSearchText.length > 0) {
        const detectedLang = loadedLogiqueNoms!.estimateInputLanguage(productSearchText);
        langToUse = detectedLang === 'unknown' ? 'fr' : detectedLang;
      } else {
        langToUse = 'fr';
      }

      setCurrentDisplayLanguage(langToUse);

      try {
        let results: Array<{ productNameKey: ProductNameKey; translatedName: string; }>;

        if (productSearchText.length > 0) {
          results = await loadedLogiqueNoms!.getProductSuggestions(productSearchText, langToUse, 50);
        } else {
          results = [];
        }

        setProductSuggestions(results);
        setShowProductSuggestions(results.length > 0);

      } catch (error) {
        console.error("ERREUR lors de la récupération des suggestions de products:", error);
        setProductSuggestions([]);
        setShowProductSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [productSearchText, isLogiqueNomsLoaded, isInitialized, errorLoadingData]);


  const handleSelectProduct = (item: { productNameKey: ProductNameKey; translatedName: string; }) => {
    console.log("handleSelectProduct: L'utilisateur a sélectionné le product:", item.translatedName);
    if (!item || !item.translatedName) {
      console.error("handleSelectProduct: Article invalide ou nom traduit manquant:", item);
      return;
    }

    setProductSearchText(item.translatedName);
    console.log("handleSelectProduct: setProductSearchText appelé avec:", item.translatedName);

    setProductSuggestions([]);
    setShowProductSuggestions(false);
    Keyboard.dismiss();

    console.log("handleProductSearchText: Valeur attendue dans la barre de product:", item.translatedName);
  };

  useEffect(() => {
    console.log("useEffect: productSearchText a changé. Nouvelle valeur:", productSearchText);
  }, [productSearchText]);


  const renderProductSuggestionItem = ({ item }: { item: { productNameKey: ProductNameKey; translatedName: string; } }) => (
    <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectProduct(item)}>
      <Text style={styles.suggestionText}>{item.translatedName}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBarContainerSingle}>
        <TextInput
          ref={productInputRef}
          style={styles.input}
          placeholder={t('lookingForProd')}
          value={productSearchText}
          onChangeText={setProductSearchText}
          clearButtonMode="while-editing"
          placeholderTextColor="#888"
          onFocus={() => setShowProductSuggestions(true)}
          onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
          editable={true}
        />
        {showProductSuggestions && productSuggestions.length > 0 && (
          <FlatList
            data={productSuggestions}
            keyExtractor={(item: { productNameKey: ProductNameKey; translatedName: string; }) => String(item.productNameKey)}
            renderItem={renderProductSuggestionItem}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="always"
          />
        )}
      </View>

      {(isLoadingData || !isLogiqueNomsLoaded) && !errorLoadingData && (
        <ActivityIndicator style={styles.globalLoadingIndicator} size="large" color="#0000ff" />
      )}
      {errorLoadingData && (
        <Text style={styles.errorText}>{t('erreurchargement')}</Text>
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  globalLoadingIndicator: {
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingTop: 50,
  },
  searchBarContainerSingle: {
    marginHorizontal: 10,
    marginBottom: 10,
    zIndex: 1,
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 5,
  },
  suggestionsList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: 10,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default ProductSearchBar;
