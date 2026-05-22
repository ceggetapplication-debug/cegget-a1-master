import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Dimensions, Modal, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchStoresByType, fetchProductsByStore, AppwriteStoreDoc, AppwriteProductDoc } from '../../backends/home_backend';
import { getHomeGroupes } from '../calculation-logic/homeDatat';
import Svg, { Path, Defs, ClipPath, Image as SvgImage, G } from 'react-native-svg';
import * as ImagesLogic from '../calculation-logic/imagesLogic';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import ModalProductInfos from '../modals-others/modalProductInfos';
import ModalOrderQuantity from '../modals-others/modalOrderQuantity';
import StoreInfoScreen, { Store, StoreDetailed, Category, Product, Group, StoreType, ProductType } from '../modals-others/modalStoreInfos';
import ModalMapBuyer from '../modals-others/modalMapBuyer';
import { archiveOldDeliveries, cleanupOldStories, cleanupInactiveAccounts } from '../../backends/admin_backend';
import { databases, config, account, Query, ID } from '../calculation-logic/appwriteConfig';
import { useAppTranslation } from '../translations/data/translationCentralization';

type TranslationKeys = string;

const DATABASE_ID = config.databaseId;
const COLLECTION_USER_PROFS = config.usersCollectionId;
const COLLECTION_PANIER_ID = config.ordersCollectionId;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DiscountBadge = ({
  percentage,
  badgeSize = 47,
  badgeColor = "red",
  textStyle,
  containerStyle,
}: {
  percentage: string;
  badgeSize?: number;
  badgeColor?: string;
  textStyle?: object;
  containerStyle?: object;
}) => (
  <View style={containerStyle}>
    <Svg width={badgeSize} height={badgeSize} viewBox="0 0 1024 1024">
      <G transform="translate(0,1024) scale(0.1,-0.1)" fill={badgeColor} stroke="none">
        <Path d="M5065 9867 c-73 -39 -199 -104 -855 -440 -118 -60 -271 -139 -339 -174 l-124 -65 -796 -100 c-438 -55 -799 -103 -802 -106 -4 -4 -158 -308 -344 -677 -186 -368 -343 -677 -349 -686 -9 -12 -850 -774 -1110 -1005 l-57 -52 26 -138 c14 -77 32 -170 40 -209 8 -38 42 -212 75 -385 102 -529 120 -622 136 -696 15 -69 15 -75 -15 -225 -56 -283 -120 -611 -181 -929 -33 -173 -66 -339 -71 -369 -6 -29 -7 -57 -2 -61 4 -4 267 -240 583 -525 l575 -518 347 -686 c190 -377 350 -687 355 -688 7 -2 946 -122 1123 -143 41 -5 164 -20 272 -34 l198 -25 102 -54 c57 -30 216 -112 353 -182 248 -127 393 -201 762 -391 l192 -99 83 42 c46 23 191 98 323 166 132 68 380 194 550 281 171 88 343 177 384 198 l74 39 311 39 c1001 126 1282 162 1287 168 3 4 105 203 226 442 121 239 278 548 347 685 l127 250 201 180 c111 99 370 333 577 519 363 328 376 340 374 373 -2 30 -75 415 -118 628 -8 39 -35 178 -60 310 -26 132 -59 306 -76 386 l-29 146 29 149 c16 82 50 257 75 389 26 132 53 272 61 310 21 102 113 584 120 625 l5 35 -580 520 -579 520 -180 355 c-422 834 -520 1025 -528 1027 -4 2 -364 47 -800 102 l-792 99 -103 55 c-57 30 -215 112 -353 182 -416 212 -653 334 -802 411 -77 41 -147 74 -155 74 -7 0 -49 -20 -93 -43z" />
      </G>
    </Svg>
    <Text style={[{ position: 'absolute', fontWeight: '900' }, textStyle]}>-{percentage}%</Text>
  </View>
);

interface HomeScreenProps {
  navigation: NavigationProp<ParamListBase>;
}

const CategoryBar = React.memo(({ categories, selectedId, onSelect }: {
  categories: Category[];
  selectedId: string | undefined;
  onSelect: (c: Category) => void;
}) => (
  <View style={styles.categoryChips}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsContent}>
      {categories.filter(Category =>
        (Category.products && Category.products.length > 0) ||
        (Category.productTypes && Category.productTypes.length > 0)
      ).map((Category) => {
        const isActive = selectedId === Category.id;
        return (
          <TouchableOpacity
            key={Category.id}
            onPress={() => onSelect(Category)}
            style={styles.categoryChipItem}
          >
            <View style={styles.categoryChipImageWrapper}>
              <Image
                source={ImagesLogic.getCategoryPhoto(Category.id)}
                style={styles.categoryChipImage}
                fadeDuration={0}
              />
              <View style={[styles.categoryChipBorder, { borderColor: isActive ? '#15616d' : 'transparent' }]} />
            </View>
            <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
              {Category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
));

const BORDER_COLOR = '#001524';
const FIGURE_SIZE = Math.min(220, SCREEN_WIDTH * 0.42);

interface Shape {
  vbW: number;
  vbH: number;
  path: string;
}

const SHAPES: Shape[] = [
  {
    vbW: 400, vbH: 420,
    path: 'M 250,18 C 350,18 400,95 395,200 C 390,295 325,375 220,395 C 130,412 30,365 12,265 C -2,180 30,95 100,52 C 90,30 85,15 145,12 C 178,10 218,18 250,18 Z',
  },
  {
    vbW: 400, vbH: 420,
    path: 'M 160,15 C 270,8 370,80 385,185 C 400,290 340,390 230,408 C 135,424 35,370 12,260 C 5,210 18,155 55,110 C 75,85 80,55 120,32 C 140,20 152,16 160,15 Z',
  },
  {
    vbW: 420, vbH: 400,
    path: 'M 260,15 C 355,15 415,80 410,175 C 405,265 355,340 260,370 C 175,397 75,365 30,280 C -5,210 10,120 65,70 C 90,48 95,20 160,12 C 195,8 228,15 260,15 Z',
  },
  {
    vbW: 410, vbH: 415,
    path: 'M 155,18 C 105,5 55,20 30,70 C 8,115 15,175 45,220 C 20,260 5,310 30,360 C 55,408 125,422 205,410 C 295,396 390,335 405,235 C 418,140 370,50 280,22 C 245,10 200,18 155,18 Z',
  },
  {
    vbW: 415, vbH: 410,
    path: 'M 200,12 C 320,8 415,80 410,185 C 407,260 370,320 300,358 C 265,376 245,370 230,355 C 195,380 140,410 90,398 C 40,385 5,340 8,280 C 10,220 50,175 25,120 C 5,75 20,20 100,10 C 135,5 170,13 200,12 Z',
  },
];

interface Drop {
  w: number; h: number; top: number; left: number; rot: number;
}

const DROPS: Drop[] = [
  { w: 10, h: 18, top: 10, left: 10, rot: 10 },
  { w: 25, h: 40, top: 25, left: 200, rot: 100 },
  { w: 5, h: 12, top: 100, left: 80, rot: 10 },
  { w: 25, h: 40, top: 150, left: 300, rot: 45 },
  { w: 10, h: 18, top: 200, left: 50, rot: 20 },
  { w: 25, h: 40, top: 250, left: 250, rot: 130 },
  { w: 10, h: 18, top: 300, left: 150, rot: 60 },
  { w: 25, h: 40, top: 350, left: 320, rot: 80 },
  { w: 10, h: 18, top: 400, left: 20, rot: 10 },
  { w: 25, h: 40, top: 450, left: 280, rot: 160 },
  { w: 10, h: 18, top: 500, left: 100, rot: 30 },
  { w: 25, h: 40, top: 550, left: 350, rot: 90 },
  { w: 10, h: 18, top: 600, left: 60, rot: 50 },
  { w: 20, h: 35, top: 650, left: 300, rot: 120 },
  { w: 12, h: 22, top: 30, left: 330, rot: 70 },
  { w: 18, h: 30, top: 80, left: 180, rot: 140 },
  { w: 8, h: 15, top: 130, left: 360, rot: 30 },
  { w: 22, h: 38, top: 180, left: 120, rot: 55 },
  { w: 14, h: 24, top: 230, left: 340, rot: 100 },
  { w: 18, h: 32, top: 280, left: 30, rot: 15 },
  { w: 10, h: 18, top: 330, left: 260, rot: 75 },
  { w: 28, h: 45, top: 380, left: 180, rot: 150 },
  { w: 8, h: 14, top: 430, left: 340, rot: 40 },
  { w: 20, h: 35, top: 480, left: 70, rot: 110 },
  { w: 15, h: 26, top: 530, left: 310, rot: 25 },
  { w: 10, h: 18, top: 580, left: 160, rot: 85 },
  { w: 25, h: 42, top: 620, left: 240, rot: 135 },
  { w: 8, h: 14, top: 670, left: 50, rot: 60 },
  { w: 18, h: 30, top: 710, left: 320, rot: 95 },
  { w: 12, h: 20, top: 750, left: 130, rot: 170 },
];

interface FigureProps {
  index: number;
  onPress: () => void;
  label: string;
  imageId?: string | null;
}
const Figure = React.memo(({ index, onPress, label, imageId }: FigureProps): React.JSX.Element => {
  const { vbW, vbH, path } = SHAPES[index];
  const scale = FIGURE_SIZE / Math.max(vbW, vbH);
  const dispW = Math.round(vbW * scale);
  const dispH = Math.round(vbH * scale);
  const clipId = `clip_${index}`;

  return (
    <View style={styles.figureWrapper}>
      <TouchableOpacity onPress={onPress}>
        <Svg width={dispW} height={dispH} viewBox={`0 0 ${vbW} ${vbH}`}>
          <Defs>
            <ClipPath id={clipId}>
              <Path d={path} />
            </ClipPath>
          </Defs>
          <SvgImage
            href={
              imageId
                ? ImagesLogic.getGroupPhoto(imageId)
                : ImagesLogic.getGroupPhoto('group' + (index + 1))
            }
            x={0} y={0}
            width={vbW} height={vbH}
            preserveAspectRatio="xMidYMid meet"
            clipPath={`url(#${clipId})`}
          />
          <Path d={path} fill="#f5f5f5" stroke={BORDER_COLOR} strokeWidth={6} strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>
      <Text style={styles.figureLabel}>{label}</Text>
    </View>
  );
});

function Homescreen({ navigation }: HomeScreenProps): React.JSX.Element {
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);
  const [isProductDetailsVisible, setIsProductDetailsVisible] = useState(false);
  const [isAddToCartModalVisible, setIsAddToCartModalVisible] = useState(false);
  const [selectedGroupe, setSelectedGroupe] = useState<Group | null>(null);
  const [selectedTypeStore, setSelectedTypeStore] = useState<StoreType | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [visibleCategories, setVisibleCategories] = useState<Category[]>([]);
  const [openProductType, setOpenProductType] = useState<string | null>(null);
  const [selectedStoreD, setSelectedStoreD] = useState<StoreDetailed | null>(null);
  const [favoris, setFavoris] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [commandesCount, setCommandesCount] = useState<Record<string, number>>({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isMapBuyerVisible, setIsMapBuyerVisible] = useState(false);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const { t } = useAppTranslation();

  useEffect(() => {
    const getAccount = async () => {
      try {
        const user = await account.get();
        setUserId(user.$id);
        archiveOldDeliveries();
        cleanupOldStories();
        cleanupInactiveAccounts();
      } catch (e) {
        console.log("Utilisateur non connecté");
      }
    };
    getAccount();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoadingData(true);
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_USER_PROFS,
          [Query.equal('userId', userId)]
        );
        if (response.documents.length > 0) {
          const doc = response.documents[0];
          setDocumentId(doc.$id);

          if (doc.favoris) setFavoris(doc.favoris);
          if (doc.commandesCount) setCommandesCount(JSON.parse(doc.commandesCount));

          databases.updateDocument(DATABASE_ID, COLLECTION_USER_PROFS, doc.$id, {
            lastActiveAt: new Date().toISOString()
          });

        }
      } catch (error) {
        console.log('Erreur récupération depuis Appwrite:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    if (userId) fetchUserData();
  }, [userId]);
  const toggleFavori = async (id: string) => {
    let nouveauxFavoris: string[] = [];
    setFavoris((prev: string[]) => {
      const isFav = prev.includes(id);
      nouveauxFavoris = isFav
        ? prev.filter(f => f !== id)
        : [...prev, id];

      Alert.alert(
        t('general.success'),
        isFav ? t('yedradkkesSiLesFav') : t('modals.product.favorite_added_message')
      );
      return nouveauxFavoris;
    });
    try {
      if (documentId) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_USER_PROFS,
          documentId,
          { favoris: nouveauxFavoris }
        );
      } else {
        const newDoc = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_USER_PROFS,
          ID.unique(),
          { userId: userId, favoris: nouveauxFavoris }
        );
        setDocumentId(newDoc.$id);
      }
    } catch (error) {
      console.log('Erreur sauvegarde favoris Appwrite:', error);
    }
  };

  const groupesStore: Group[] = useMemo(() => {
    const tr = (key: TranslationKeys) => t(key);
    return getHomeGroupes(tr);
  }, [t]);
  const handleGroupeSelect = React.useCallback((group: Group) => {
    setSelectedGroupe(group);
  }, []);

  const goBack = () => {
    if (selectedStoreD) {
      setSelectedStoreD(null);
    } else if (selectedStore) {
      setSelectedStore(null);
      setSelectedCategory(null);
    } else if (selectedTypeStore) {
      setSelectedTypeStore(null);
    } else if (selectedGroupe) {
      setSelectedGroupe(null);
    }
  };

  const handleTypeStorePress = async (type: StoreType) => {
    setSelectedTypeStore(type);
    setIsLoadingStores(true);

    const vraisStores = await fetchStoresByType(type.id);

    const templateCategories = (type.stores && type.stores.length > 0) ? (type.stores[0].categories || []) : [];

    const storesCompletes = vraisStores.map((store: AppwriteStoreDoc) => ({
      ...store,
      categories: JSON.parse(JSON.stringify(templateCategories))
    }));

    setSelectedTypeStore((prev: StoreType | null) => prev ? { ...prev, stores: storesCompletes as Store[] } : null);
    setIsLoadingStores(false);
  };

  const handleStorePress = async (store: Store) => {
    setSelectedStore(store);
    setVisibleCategories(store.categories ?? []);
    setIsLoadingProducts(true);

    const actualProducts = await fetchProductsByStore(store.id);

    const updatedCategories = JSON.parse(JSON.stringify(store.categories ?? []));

    actualProducts.forEach((prod: AppwriteProductDoc) => {
      const cat = updatedCategories.find((c: Category) => c.id === (prod.category));
      if (cat) {
        if (prod.productType && cat.productTypes) {
          const subCat = cat.productTypes.find((pt: ProductType) => pt.id === (prod.productType));
          if (subCat) subCat.products.push(prod);
        } else {
          if (!cat.products) cat.products = [];
          cat.products.push(prod);
        }
      }
    });

    setSelectedStore({ ...store, categories: updatedCategories });
    setVisibleCategories(updatedCategories);

    if (updatedCategories.length > 0) {
      setSelectedCategory(updatedCategories[0]);
      if (updatedCategories[0].productTypes && updatedCategories[0].productTypes.length > 0) {
        setOpenProductType(updatedCategories[0].productTypes[0].id);
      }
    }
    setIsLoadingProducts(false);
  };

  const renderCategories = () => {
    const categories = visibleCategories.filter((c: Category) => {
      if (c.productTypes) return c.productTypes.some((pt: ProductType) => pt.products.length > 0);
      if (c.products) return c.products.length > 0;
      return false;
    });
    const isTopVente = selectedCategory?.id.includes('topVentes');
    const allProducts = isTopVente
      ? (selectedStore?.categories ?? [])
        .flatMap((c: Category) => [
          ...(c.products ?? []),
          ...((c.productTypes ?? []).reduce((acc2: Product[], pt: ProductType) => [
            ...acc2,
            ...(pt.products ?? [])
          ], []))
        ])
        .filter((p: Product) => (commandesCount[p.id] ?? 0) > 0)
        .sort((a: Product, b: Product) => (commandesCount[b.id] ?? 0) - (commandesCount[a.id] ?? 0))
        .slice(0, 10)
      : (selectedCategory?.products ?? []);
    const products = allProducts;

    return (
      <View style={styles.hierarchyScreen}>
        <View style={styles.hierarchyHeader}>
          <TouchableOpacity onPress={() => setSelectedStore(null)}>
            <Ionicons name="chevron-back" size={32} color={BORDER_COLOR} />
          </TouchableOpacity>
          <Text style={styles.hierarchyTitle}>{selectedStore?.name}</Text>
        </View>
        <CategoryBar
          categories={categories}
          selectedId={selectedCategory?.id}
          onSelect={(c: Category) => {
            setSelectedCategory(c);
            if (c.productTypes && c.productTypes.length > 0) {
              setOpenProductType(c.productTypes[0].id);
            } else {
              setOpenProductType(null);
            }
          }}
        />
        <ScrollView contentContainerStyle={styles.buttonList} showsVerticalScrollIndicator={false}>
          {selectedCategory?.productTypes ? (
            selectedCategory.productTypes.filter((type: ProductType) => type.products && type.products.length > 0).map((type: ProductType) => (
              <View key={type.id}>
                <TouchableOpacity
                  style={styles.productTypeBtn}
                  onPress={() => setOpenProductType(openProductType === type.id ? null : type.id)}
                >
                  <Text style={styles.productTypeBtnText}>{type.name}</Text>
                  <Ionicons
                    name={openProductType === type.id ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#15616d"
                  />
                </TouchableOpacity>
                {openProductType === type.id && type.products.map((product: Product, index: number) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.productBtn, { flexDirection: index % 2 === 0 ? 'row' : 'row-reverse' }]}
                    onPress={() => handleProductDetailsPress(product)}
                  >
                    <View style={styles.productBtnImageWrapper}>
                      <Image source={{ uri: ImagesLogic.buildProductPhoto(product.id).apercu }} style={styles.productBtnImage} />
                      {selectedCategory?.id.includes('promotion') && product.oldPrice && (
                        <View style={[index % 2 === 0 ? { left: 0 } : { right: 0 }, { top: 0, position: 'absolute' }]}>
                          <DiscountBadge
                            percentage={calculateDiscountPercentage(product.oldPrice, product.prix) ?? '0'}
                            badgeSize={47}
                            badgeColor="red"
                            textStyle={styles.discountBadgeText}
                            containerStyle={index % 2 === 0 ? styles.discountBadgeLeft : styles.discountBadgeRight}
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.productBtnText}>
                      <Text style={styles.productBtnNom}>{product.name}</Text>
                      {product.marque && <Text style={styles.productBtnMarque}>{product.marque}</Text>}
                      {selectedCategory?.id.includes('promotion') ? (
                        <View style={styles.productBtnPrixRow}>
                          {product.oldPrice && <Text style={styles.productBtnOldPrix}>{product.oldPrice} DZD</Text>}
                          <Text style={styles.productBtnPrixProm}>{product.prix} DZD</Text>
                        </View>
                      ) : (
                        <Text style={styles.productBtnPrix}>{product.prix} DZD</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          ) : (
            products.map((product: Product, index: number) => (
              <TouchableOpacity
                key={product.id}
                style={[styles.productBtn, { flexDirection: index % 2 === 0 ? 'row' : 'row-reverse' }]}
                onPress={() => handleProductDetailsPress(product)}
              >
                <View style={styles.productBtnImageWrapper}>
                  <Image
                    source={{
                      uri: product.id
                        ? ImagesLogic.buildProductPhoto(product.id).apercu
                        : product.image.uri
                    }}
                    style={styles.productBtnImage}
                  />
                  {selectedCategory?.id.includes('promotion') && product.oldPrice && (
                    <View style={[index % 2 === 0 ? { left: 0 } : { right: 0 }, { top: 0, position: 'absolute' }]}>
                      <DiscountBadge
                        percentage={calculateDiscountPercentage(product.oldPrice, product.prix) ?? '0'}
                        badgeSize={47}
                        badgeColor="red"
                        textStyle={styles.discountBadgeText}
                        containerStyle={index % 2 === 0 ? styles.discountBadgeLeft : styles.discountBadgeRight}
                      />
                    </View>
                  )}
                </View>
                <View style={styles.productBtnText}>
                  <Text style={styles.productBtnNom}>{product.name}</Text>
                  {product.marque && <Text style={styles.productBtnMarque}>{product.marque}</Text>}
                  {selectedCategory?.id.includes('promotion') ? (
                    <View style={styles.productBtnPrixRow}>
                      {product.oldPrice && <Text style={styles.productBtnOldPrix}>{product.oldPrice} DZD</Text>}
                      <Text style={styles.productBtnPrixProm}>{product.prix} DZD</Text>
                    </View>
                  ) : (
                    <Text style={styles.productBtnPrix}>{product.prix} DZD</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  };
  const renderStores = () => {
    const stores = (selectedTypeStore?.stores ?? selectedTypeStore?.storesD ?? []) as Store[];
    return (
      <View style={styles.hierarchyScreen}>
        <View style={styles.hierarchyHeader}>
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="chevron-back" size={32} color={BORDER_COLOR} />
          </TouchableOpacity>
          <Text style={styles.hierarchyTitle}>{selectedTypeStore?.name}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.storeList}>
          {stores.filter(store => store.categories && store.categories.length > 0).map((store) => (
            <TouchableOpacity
              key={store.id}
              style={styles.storeBtn}
              onPress={() => {
                const isStoreD = !!selectedTypeStore?.storesD;
                if (isStoreD) {
                  setSelectedStoreD(store as StoreDetailed);
                } else {
                  const cats = store.categories ?? [];
                  setSelectedStore(store);
                  setVisibleCategories(cats);
                  if (cats.length > 0) {
                    setSelectedCategory(cats[0]);
                    if (cats[0].productTypes && cats[0].productTypes.length > 0) {
                      setOpenProductType(cats[0].productTypes[0].id);
                    }
                  }
                }
              }}
            >
              <Image source={{ uri: ImagesLogic.buildStorePhoto(store.id).cover }} style={styles.storeBtnImage} />
              <Text style={styles.storeBtnText}>{store.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const TypeStoreBtn = ({ type, onPress, favoris }: { type: StoreType; onPress: () => void; favoris: string[]; key?: string }): React.JSX.Element => {
    const [h, setH] = React.useState(70);
    const w = 160;
    const path = `M ${w / 2},6 C ${w * 0.85},6 ${w - 6},${h * 0.25} ${w - 6},${h / 2} C ${w - 6},${h * 0.82} ${w * 0.72},${h - 6} ${w / 2},${h - 6} C ${w * 0.18},${h - 6} 6,${h * 0.72} 6,${h * 0.45} C 6,${h * 0.18} ${w * 0.18},6 ${w / 2},6 Z`;

    return (
      <TouchableOpacity onPress={onPress} style={[styles.typeStoreBtn, { width: w, height: h }]}>
        <Svg style={StyleSheet.absoluteFill} width={w} height={h}>
          <Path d={path} fill="#15616d" stroke="#ff7d00" strokeWidth={1.5} />
        </Svg>
        <Text
          style={styles.typeStoreBtnText}
          onLayout={(e: { nativeEvent: { layout: { height: number } } }) =>
            setH(Math.max(70, e.nativeEvent.layout.height + 32))
          }
        >
          {type.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTypesStore = () => {
    const types = selectedGroupe?.typesDeStore ?? [];
    return (
      <View style={styles.hierarchyScreen}>
        <View style={styles.hierarchyHeader}>
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="chevron-back" size={32} color={BORDER_COLOR} />
          </TouchableOpacity>
          <Text style={styles.hierarchyTitle}>{selectedGroupe?.name}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.typesContainer}>
          {types.filter((type: StoreType) => (type.stores && type.stores.length > 0) || (type.storesD && type.storesD.length > 0)).map((type: StoreType) => (
            <TypeStoreBtn
              key={type.id}
              type={type}
              onPress={() => handleTypeStorePress(type)}
              favoris={favoris}
            />
          ))}

        </ScrollView>
      </View>
    );
  }

  const renderCurrentLevel = () => {
    if (selectedStore) {
      return renderCategories();
    }

    if (selectedStoreD) {
      return (
        <StoreInfoScreen
          visible={true}
          storeId={selectedStoreD.id}
          onClose={() => setSelectedStoreD(null)}
          groupesStore={groupesStore}
          selectedTypeStore={selectedTypeStore}
          setSelectedStoreD={setSelectedStoreD}
          setSelectedGroupe={setSelectedGroupe}
          setSelectedTypeStore={setSelectedTypeStore}
          setSelectedStore={setSelectedStore}
          setVisibleCategories={setVisibleCategories}
          setSelectedCategory={setSelectedCategory}
          setOpenProductType={setOpenProductType}
        />
      );
    }

    if (selectedTypeStore) return renderStores();
    if (selectedGroupe) return renderTypesStore();

    return null;
  };

  const handleProductDetailsPress = (product: Product) => {
    setSelectedProductForDetails(product);
    setIsProductDetailsVisible(true);
  };

  const calculateDiscountPercentage = (oldPrice: number, currentPrice: number): string | null => {
    if (oldPrice && currentPrice && oldPrice > currentPrice) {
      const discount = ((oldPrice - currentPrice) / oldPrice) * 100;
      return discount.toFixed(0);
    }
    return null;
  };
  if (isLoadingData && !selectedGroupe) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#15616d" />
      </View>
    );
  }

  return (
    <View style={selectedGroupe ? styles.screenGroupe : styles.screen}>
      {!selectedGroupe && <View style={styles.background} pointerEvents="none" />}
      {!selectedGroupe && (
        <TouchableOpacity style={styles.gpsButton} onPress={() => setIsMapBuyerVisible(true)}>
          <Ionicons name="location-sharp" size={24} color="red" />
        </TouchableOpacity>
      )}
      {!selectedGroupe && DROPS.map((d, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[styles.drop, { width: d.w, height: d.h, top: d.top, left: d.left, transform: [{ rotate: `${d.rot}deg` }] }]}
        />
      ))}
      {selectedGroupe ? renderCurrentLevel() : (
        <View>
          <View style={styles.row}>
            <View style={styles.figure0}>
              <Figure index={0} imageId={groupesStore[0]?.imageId} label={t('courses_group')} onPress={() => handleGroupeSelect(groupesStore[0])} />
            </View>
            <View style={styles.figure1}>
              <Figure index={1} imageId={groupesStore[1]?.imageId} label={t('frais_group')} onPress={() => handleGroupeSelect(groupesStore[1])} />
            </View>
          </View>
          <View style={[styles.row, styles.row2]}>
            <View style={styles.figure2}>
              <Figure index={2} imageId={groupesStore[2]?.imageId} label={t('collation_group')} onPress={() => handleGroupeSelect(groupesStore[2])} />
            </View>
            <View style={styles.figure3}>
              <Figure index={3} imageId={groupesStore[3]?.imageId} label={t('restauration_group')} onPress={() => handleGroupeSelect(groupesStore[3])} />
            </View>
          </View>
          <View style={styles.figure4}>
            <Figure index={4} imageId={groupesStore[4]?.imageId} label={t('store_group')} onPress={() => handleGroupeSelect(groupesStore[4])} />
          </View>
        </View>
      )}

      {selectedProductForDetails && (
        <>
          <ModalProductInfos
            visible={isProductDetailsVisible}
            onClose={() => setIsProductDetailsVisible(false)}
            product={{
              ...selectedProductForDetails,
              name: selectedProductForDetails.name,
              brand: selectedProductForDetails.marque,
              price: selectedProductForDetails.prix,
              weight: `${selectedProductForDetails.valeurQuantite || ''} ${selectedProductForDetails.uniteQuantite || ''}`,
              store: selectedStore?.name || "",
              address: "",
              $id: selectedProductForDetails.id
            }}
            initialFavorite={favoris.includes(selectedProductForDetails.id)}
            onFavoriteToggle={() => toggleFavori(selectedProductForDetails.id)}
            onOrderPress={() => {
              setIsProductDetailsVisible(false);
              setIsAddToCartModalVisible(true);
            }}
          />
          <ModalOrderQuantity
            visible={isAddToCartModalVisible}
            onClose={() => setIsAddToCartModalVisible(false)}
            product={selectedProductForDetails}
            onConfirm={async (orderData: Product & { quantity: number; totalPrice: string }) => {
              setIsAddToCartModalVisible(false);
              try {
                // SOLUTION : Vérifier si le product existe déjà
                const existing = await databases.listDocuments(DATABASE_ID, COLLECTION_PANIER_ID, [
                  Query.equal('userId', userId || ""),
                  Query.equal('productId', orderData.id),
                  Query.equal('storeId', selectedStore?.id || "")
                ]);
                if (existing.documents.length > 0) {
                  const doc = existing.documents[0];
                  await databases.updateDocument(DATABASE_ID, COLLECTION_PANIER_ID, doc.$id, {
                    quantite: doc.quantite + orderData.quantity,
                    prix: doc.prix + parseFloat(orderData.totalPrice)
                  });
                } else {
                  await databases.createDocument(
                    DATABASE_ID,
                    COLLECTION_PANIER_ID,
                    ID.unique(),
                    {
                      userId: userId,
                      productId: orderData.id,
                      name: orderData.name,
                      prix: parseFloat(orderData.totalPrice),
                      quantite: orderData.quantity,
                      storeId: selectedStore?.id || "boutique_inconnue"
                    }
                  );
                }
                Alert.alert(t('general.success'), t('product_added_successfully'));
              } catch (error) {
                console.log("Erreur lors de l'ajout au panier:", error);
                Alert.alert(t('general.error'), t('impossibleDeRajouter'));
              }
            }}
          />
        </>
      )}

      <Modal
        visible={isMapBuyerVisible}
        animationType="slide"
        onRequestClose={() => setIsMapBuyerVisible(false)}
      >
        <ModalMapBuyer />
        <TouchableOpacity
          style={{ position: 'absolute', top: 40, right: 20, zIndex: 999 }}
          onPress={() => setIsMapBuyerVisible(false)}
        >
          <Ionicons name="close-circle" size={40} color="#001524" />
        </TouchableOpacity>
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  figure0: {
    marginTop: 40,
  },
  figure1: {
    marginTop: 85,
  },
  figure2: {
    marginTop: -20,
  },
  figure3: {
    marginTop: 15,
  },
  figure4: {
    paddingLeft: SCREEN_WIDTH * 0.05,
    marginTop: -30,
  },
  screen: {
    flex: 1,
    backgroundColor: '#ff7d00',
    paddingVertical: 30,
    paddingHorizontal: 10,
    overflow: 'visible',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ff7d00',
    opacity: 0.5,
  },
  drop: {
    position: 'absolute',
    backgroundColor: '#15616d',
    opacity: 0.5,
    borderRadius: 999,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginBottom: 20,
    overflow: 'visible',
  },
  figureWrapper: {
    alignItems: 'center',
    gap: 10,
  },
  figureLabel: {
    fontSize: 18,
    color: '#001524',
    marginBottom: 10,
    fontStyle: 'italic',
    fontWeight: 'bold',
    marginTop: -8,
  },
  hierarchyScreen: {
    flex: 1,
  },
  buttonList: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  hierarchyButtonSub: {
    fontSize: 13,
    color: '#595959',
    marginTop: 4,
  },
  emptyText: {
    color: BORDER_COLOR,
    fontSize: 15,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 40,
  },
  gpsButton: {
    position: 'absolute',
    top: 35,
    right: 20,
    zIndex: 100,
    backgroundColor: '#ffecd1',
    borderRadius: 50,
    padding: 10,
  },
  screenGroupe: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  hierarchyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
    marginTop: 5,
    gap: 12,
  },
  hierarchyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: BORDER_COLOR,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 0,
    paddingTop: 10,
  },
  storeBtn: {
    width: SCREEN_WIDTH * 0.8,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#e5e5e5',
    marginBottom: 16,
  },
  storeBtnImage: {
    width: '100%',
    height: 130,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  storeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#001524',
    padding: 10,
    textAlign: 'center',
  },
  storeList: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  categoryChips: {
    marginBottom: 20,
  },
  categoryChipsContent: {
    paddingLeft: 12,
    paddingRight: 16,
    gap: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChipItem: {
    alignItems: 'center',
    gap: 6,
  },
  categoryChipImage: {
    width: 52,
    height: 52,
    resizeMode: 'cover',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c8c8c8',
    textAlign: 'center',
    maxWidth: 200,
  },
  categoryChipTextActive: {
    color: '#15616d',
    fontWeight: '800',
  },
  categoryChipImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productTypeBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  productTypeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15616d',
    borderBottomWidth: 1.5,
    borderBottomColor: '#ff7d00',
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
  productBtnMarque: {
    fontSize: 14,
    color: '#001524',
    marginBottom: 6,
    fontStyle: 'italic',
    marginLeft: 25,
  },
  productBtnPrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 5,
  },
  productBtnOldPrix: {
    fontSize: 13,
    color: '#7d7d7d',
    textDecorationLine: 'line-through',
  },
  productBtnPrix: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginLeft: 25,
  },
  productBtnPrixProm: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  categoryChipBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  discountBadgeText: {
    top: 12,
    left: 4,
    fontSize: 12,
    color: '#fff',
  },
  discountBadgeLeft: {
    position: 'absolute',
    top: -10,
    left: -5,
  },
  discountBadgeRight: {
    position: 'absolute',
    top: -10,
    right: -5,
  },
  storeDetailsPhotosScroll: {
    gap: 10,
    paddingHorizontal: 16,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: BORDER_COLOR,
    marginBottom: 4,
    marginTop: 10,
    marginLeft: 0,
  },
  detailText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
    paddingHorizontal: 4,
    marginLeft: -10,
  },
  detailPhotoCover: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    marginBottom: 12,
  },
  detailPhotoShared: {
    width: 280,
    height: 280,
    borderRadius: 12,
    marginTop: 10,
  },
  detailStoreNom: {
    fontSize: 18,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#15616d',
    marginBottom: 12,
  },
  detailTextGris: {
    fontSize: 14,
    color: '#595959',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  typeStoreBtn: {
    margin: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0,
    marginRight: 0,
    gap: 5,
  },
  typeStoreBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    width: 140,
    zIndex: 1,
  },

  detailFavorisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
});

export default Homescreen
