import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform, Alert, ScrollView, TextInput, Image, KeyboardAvoidingView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, MapPressEvent, MarkerDragStartEndEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTranslation } from '@/app/translations/translationCentralization';
import { account, databases, config, ID, Query, Models } from '../calculation-logic/appwriteConfig';
import { uploadToR2, deleteFromR2, setPortePhoto } from '../calculation-logic/imagesLogic';

interface SavedPosition {
  id: string;
  name: string;
  coordinates: LocationCoord;
  domicileType: string;
  domicileNumber: string;
  frontDoorPicId: string;
  otherInfos: string;
}

interface LocationCoord {
  latitude: number;
  longitude: number;
}

interface MapRegion extends LocationCoord {
  latitudeDelta: number;
  longitudeDelta: number;
}

const SAVED_USER_LOCATION_KEY = 'savedUserLocation';
const INITIAL_ZOOM_DELTA_LAT = 0.002;
const INITIAL_ZOOM_DELTA_LON = 0.002;

function modalMapBuyer() {
  const { t } = useAppTranslation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [userSelectedLocation, setUserSelectedLocation] = useState<LocationCoord | null>(null);
  const [tempSelectedLocation, setTempSelectedLocation] = useState<LocationCoord | null>(null);
  const [isPickingLocation, setIsPickingLocation] = useState<boolean>(false);
  const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  const [isEditingField, setIsEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [activePositionId, setActivePositionId] = useState<number | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [currentValues, setCurrentValues] = useState<Record<string, string>>({
    domicileType: '',
    domicileNumber: '',
    frontDoorPic: '',
    otherInfos: '',
  });
  const [savedPositions, setSavedPositions] = useState<SavedPosition[]>([]);
  const [newPositionName, setNewPositionName] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);

  const prevIsPickingLocationRef = useRef(isPickingLocation);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await account.get();
        setUserId(user.$id);
      } catch (err) { console.error("Erreur account.get:", err); }
    };
    fetchUser();
  }, []);

  const loadSavedPositions = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await databases.listDocuments(config.databaseId, "col_adresses", [Query.equal("userId", userId)]);
      const positions: SavedPosition[] = response.documents.map((doc: Models.Document) => ({
        id: doc.$id,
        name: doc.name,
        coordinates: JSON.parse(doc.coordinates),
        domicileType: doc.domicileType,
        domicileNumber: doc.domicileNumber,
        frontDoorPicId: doc.$id,
        otherInfos: doc.otherInfos,
      }));
      setSavedPositions(positions);
    } catch (e) { console.error("Erreur chargement adresses:", e); }
  }, [userId]);
  useEffect(() => {
    if (userId) loadSavedPositions();
  }, [userId, loadSavedPositions]);

  const savePosition = useCallback(async (position: Omit<SavedPosition, 'id'>) => {
    if (!userId) return;
    try {
      const doc = await databases.createDocument(config.databaseId, "col_adresses", ID.unique(), {
        userId: userId,
        name: position.name,
        coordinates: JSON.stringify(position.coordinates),
        domicileType: position.domicileType,
        domicileNumber: position.domicileNumber,
        otherInfos: position.otherInfos,
      });
      if (tempImage && tempImage.startsWith('file')) {
        await setPortePhoto(doc.$id, {
          uri: tempImage,
          name: 'door.jpg',
          type: 'image/jpeg'
        });
      }

      setTempImage(null);
      loadSavedPositions();
    } catch (e) {
      console.error("Erreur sauvegarde adresse:", e);
    }
  }, [userId, tempImage, loadSavedPositions]);

  const deletePosition = useCallback(async (pos: SavedPosition) => {
    try {
      await deleteFromR2(`portes/${pos.id}.jpg`);
      await databases.deleteDocument(config.databaseId, "col_adresses", pos.id);
      loadSavedPositions();
    } catch (e) { console.error("Erreur suppression adresse:", e); }
  }, [loadSavedPositions]);

  const loadSavedUserLocation = useCallback(async () => {
    try {
      const storedLocation = await AsyncStorage.getItem(SAVED_USER_LOCATION_KEY);
      if (storedLocation) {
        const parsedLocation: LocationCoord = JSON.parse(storedLocation);
        if (parsedLocation.latitude !== 0 || parsedLocation.longitude !== 0) {
          setUserSelectedLocation(parsedLocation);
        }
      }
    } catch (e) {
      console.error("Failed to load user selected location from AsyncStorage", e);
    }
  }, []);

  const saveUserSelectedLocation = useCallback(async (location: LocationCoord) => {
    try {
      await AsyncStorage.setItem(SAVED_USER_LOCATION_KEY, JSON.stringify(location));
      setUserSelectedLocation(location);
      setTempSelectedLocation(location);
      setIsPickingLocation(false);
      Alert.alert(t('locationSaved'));

      if (mapRef.current && mapRegion) {
        mapRef.current.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: mapRegion.latitudeDelta,
          longitudeDelta: mapRegion.longitudeDelta,
        }, 500);
      }
    } catch (e) {
      console.warn("Location.getCurrentPositionAsync returned 0,0 coordinates. Cannot set initial map center.");
      Alert.alert(t('errorSavingLocation'));
    }
  }, [mapRegion]);

  useEffect(() => {
    loadSavedUserLocation();
  }, [loadSavedUserLocation]);


  useEffect(() => {
    const getLocationAndSetMap = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg(t('gpsScreen.permissionDenied'));
        return;
      }

      let initialDevicePos: LocationCoord | null = null;
      if (!userSelectedLocation) {
        let currentCoords = await Location.getCurrentPositionAsync({});
        if (currentCoords.coords.latitude !== 0 || currentCoords.coords.longitude !== 0) {
          initialDevicePos = {
            latitude: currentCoords.coords.latitude,
            longitude: currentCoords.coords.longitude,
          };
        } else {
          console.warn(t('gpsScreen.getLocationError'));

        }
      }

      const initialMapCenter = userSelectedLocation || initialDevicePos;

      if (initialMapCenter && !initialRegionSet) {
        setMapRegion({
          latitude: initialMapCenter.latitude,
          longitude: initialMapCenter.longitude,
          latitudeDelta: INITIAL_ZOOM_DELTA_LAT,
          longitudeDelta: INITIAL_ZOOM_DELTA_LON,
        });
        setTempSelectedLocation(initialMapCenter);
        setInitialRegionSet(true);
      }
    };

    getLocationAndSetMap();
  }, [userSelectedLocation, initialRegionSet]);

  useEffect(() => {
    if (prevIsPickingLocationRef.current && !isPickingLocation) {
      if (userSelectedLocation && mapRef.current && mapRegion) {
        mapRef.current.animateToRegion({
          latitude: userSelectedLocation.latitude,
          longitude: userSelectedLocation.longitude,
          latitudeDelta: mapRegion.latitudeDelta,
          longitudeDelta: mapRegion.longitudeDelta,
        }, 500);
      }
    }
    prevIsPickingLocationRef.current = isPickingLocation;
  }, [userSelectedLocation, isPickingLocation, mapRegion]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('general.requiredPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setTempImage(result.assets[0].uri);
    }
  };

  const handleRegionChangeComplete = useCallback((region: Region) => {
    setMapRegion(region);
  }, []);

  const handleMapPress = useCallback((event: MapPressEvent) => {
    if (isPickingLocation) {
      setTempSelectedLocation(event.nativeEvent.coordinate);
    }
  }, [isPickingLocation]);

  const startPickingLocation = useCallback(() => {
    setIsPickingLocation(true);
    const initialPickingPos = userSelectedLocation || tempSelectedLocation;

    if (initialPickingPos && mapRegion) {
      setTempSelectedLocation(initialPickingPos);

      mapRef.current?.animateToRegion({
        latitude: initialPickingPos.latitude,
        longitude: initialPickingPos.longitude,
        latitudeDelta: mapRegion.latitudeDelta,
        longitudeDelta: mapRegion.longitudeDelta,
      }, 500);
    } else {
      Alert.alert(t('noSavedLocationYet'));
      setIsPickingLocation(false);
      return;
    }
  }, [userSelectedLocation, tempSelectedLocation, mapRegion]);

  const confirmPickedLocation = useCallback(() => {
    if (tempSelectedLocation) {
      saveUserSelectedLocation(tempSelectedLocation);
    }
  }, [tempSelectedLocation, saveUserSelectedLocation]);

  if (!mapRegion && !errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('general.loadingLocation')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      {mapRegion && (
        <>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            mapType="satellite"
            region={mapRegion}
            onRegionChangeComplete={handleRegionChangeComplete}
            onPress={handleMapPress}
          >
            {userSelectedLocation && (
              <Marker
                coordinate={{ latitude: userSelectedLocation.latitude, longitude: userSelectedLocation.longitude }}
                title={t('yourSavedPosition')}
                pinColor="red"
              />
            )}
            {isPickingLocation && tempSelectedLocation && (
              <Marker
                coordinate={{ latitude: tempSelectedLocation.latitude, longitude: tempSelectedLocation.longitude }}
                title={t('pickingLocationInstructions')}
                pinColor="orange"
                draggable={true}
                onDragEnd={(e: MarkerDragStartEndEvent) => setTempSelectedLocation(e.nativeEvent.coordinate)}
              />
            )}
          </MapView>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.infoScrollView}>
            <ScrollView ref={scrollRef}>
              <Text style={styles.infoSectionTitle}>{t('yourSavedPosition')}</Text>
              <Text style={styles.infoSectionLabelPoz}>{newPositionName || `Position ${savedPositions.length + 1}`}</Text>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoSectionLabel}>{t('gpsLocationLabel')}</Text>
                </View>
                <Text style={styles.infoSectionText}>{userSelectedLocation ? `${userSelectedLocation.latitude}, ${userSelectedLocation.longitude}` : ''}</Text>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoSectionLabel}>{t('domicileType')}</Text>
                  <TouchableOpacity onPress={() => { setIsEditingField('domicileType'); setEditValue(currentValues.domicileType); }}>
                    <Ionicons name="pencil" size={20} color="#15616d" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.infoSectionText}>{currentValues.domicileType}</Text>
                {isEditingField === 'domicileType' && (
                  <>
                    <TextInput style={styles.editInput} value={editValue} onChangeText={setEditValue} placeholder={t('domicileType')} />
                    <View style={styles.confirmBarButtons}>
                      <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditingField(null)}>
                        <Text style={styles.cancelButtonText}>{t('general.cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton} onPress={() => { setCurrentValues((prev: Record<string, string>) => ({ ...prev, domicileType: editValue })); setIsEditingField(null); }}>
                        <Text style={styles.actionButtonText}>{t('general.confirm')}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoSectionLabel}>{t('domicileNumber')}</Text>
                  <TouchableOpacity onPress={() => { setIsEditingField('domicileNumber'); setEditValue(currentValues.domicileNumber); }}>
                    <Ionicons name="pencil" size={20} color="#15616d" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.infoSectionText}>{currentValues.domicileNumber}</Text>
                {isEditingField === 'domicileNumber' && (
                  <>
                    <TextInput style={styles.editInput} value={editValue} onChangeText={setEditValue} placeholder={t('domicileNumber')} />
                    <View style={styles.confirmBarButtons}>
                      <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditingField(null)}>
                        <Text style={styles.cancelButtonText}>{t('general.cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton} onPress={() => { setCurrentValues((prev: Record<string, string>) => ({ ...prev, domicileNumber: editValue })); setIsEditingField(null); }}>
                        <Text style={styles.actionButtonText}>{t('general.confirm')}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoSectionLabel}>{t('frontDoorPic')}</Text>
                  <TouchableOpacity onPress={handlePickImage}>
                    <Ionicons name="pencil" size={20} color="#15616d" />
                  </TouchableOpacity>
                </View>
                {tempImage ? (
                  <>
                    <Image source={{ uri: tempImage }} style={styles.photoPlaceholder} />
                    <View style={styles.confirmBarButtons}>
                      <TouchableOpacity style={styles.cancelButton} onPress={() => setTempImage(null)}>
                        <Text style={styles.cancelButtonText}>{t('general.cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton} onPress={() => { setCurrentValues((prev: Record<string, string>) => ({ ...prev, frontDoorPic: tempImage as string })); setTempImage(null); }}>
                        <Text style={styles.actionButtonText}>{t('general.confirm')}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : currentValues.frontDoorPic ? (
                  <Image source={{ uri: currentValues.frontDoorPic }} style={styles.photoPlaceholder} />
                ) : (
                  <View style={styles.photoPlaceholder} />
                )}
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoSectionLabel}>{t('otherInfos')}</Text>
                  <TouchableOpacity onPress={() => { setIsEditingField('otherInfos'); setEditValue(currentValues.otherInfos); }}>
                    <Ionicons name="pencil" size={20} color="#15616d" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.infoSectionText}>{currentValues.otherInfos}</Text>
                {isEditingField === 'otherInfos' && (
                  <>
                    <TextInput style={styles.editInput} value={editValue} onChangeText={setEditValue} placeholder={t('otherInfos')} multiline />
                    <View style={styles.confirmBarButtons}>
                      <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditingField(null)}>
                        <Text style={styles.cancelButtonText}>{t('general.cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton} onPress={() => { setCurrentValues((prev: Record<string, string>) => ({ ...prev, otherInfos: editValue })); setIsEditingField(null); }}>
                        <Text style={styles.actionButtonText}>{t('general.confirm')}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              <Text style={styles.infoSectionTitle}>{t('selectAnotherAdress')}</Text>
              {savedPositions.length === 0 && (
                <Text style={styles.infoSectionText}>{t('addNewAdresses')}</Text>
              )}
              {savedPositions.map((pos: SavedPosition) => (
                <TouchableOpacity key={pos.id} style={styles.infoSection} onPress={() => {
                  scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
                  if (activePositionId !== null) {
                    const prevPos = savedPositions.find((p: SavedPosition) => p.id === activePositionId);
                    if (!prevPos) {
                      setSavedPositions((prev: SavedPosition[]) => [...prev, {
                        id: activePositionId,
                        name: newPositionName,
                        coordinates: userSelectedLocation!,
                        domicileType: currentValues.domicileType,
                        domicileNumber: currentValues.domicileNumber,
                        frontDoorPic: currentValues.frontDoorPic,
                        otherInfos: currentValues.otherInfos,
                      }]);
                    }
                  }
                  setActivePositionId(pos.id);
                  setUserSelectedLocation(pos.coordinates);
                  setMapRegion({
                    latitude: pos.coordinates.latitude,
                    longitude: pos.coordinates.longitude,
                    latitudeDelta: INITIAL_ZOOM_DELTA_LAT,
                    longitudeDelta: INITIAL_ZOOM_DELTA_LON,
                  });
                  setCurrentValues({
                    domicileType: pos.domicileType,
                    domicileNumber: pos.domicileNumber,
                    frontDoorPic: buildPortePhoto(pos.id).url,
                    otherInfos: pos.otherInfos,
                  });
                  setNewPositionName(pos.name);
                  setSavedPositions((prev: SavedPosition[]) => prev.filter((p: SavedPosition) => p.id !== pos.id));

                }}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoSectionLabel}>{pos.name}</Text>
                    <TouchableOpacity onPress={() => {
                      Alert.alert(
                        t('myNewsScreen.delete'),
                        t('general.deleteConfirm'),
                        [
                          { text: t('general.cancel'), style: 'cancel' },
                          { text: t('general.confirm'), onPress: () => deletePosition(pos.id) },
                        ]
                      );
                    }}>
                      <Ionicons name="trash" size={20} color="#f06543" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}

              <Text style={styles.infoSectionTitle}>{t('addNewAdresses')}</Text>
              {!isPickingLocation && (
                <>
                  <TouchableOpacity style={styles.addButton} onPress={startPickingLocation}>
                    <Ionicons name="add" size={30} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
              {isPickingLocation && (
                <View style={styles.confirmBar}>
                  <Text style={styles.infoSectionText}>{t('wantAutreAdris')}</Text>
                  <TextInput
                    style={styles.editInput}
                    value={newPositionName}
                    onChangeText={setNewPositionName}
                    placeholder={t('arudIsemNrebbisnLadris')}
                  />
                  <View style={styles.confirmBarButtons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setIsPickingLocation(false)}>
                      <Text style={styles.cancelButtonText}>{t('general.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={async () => {
                        confirmPickedLocation();
                        if (tempSelectedLocation && userId) {
                          try {
                            const newId = ID.unique();
                            if (tempImage && tempImage.startsWith('file')) {
                              await uploadToR2(`portes/${newId}.jpg`, {
                                uri: tempImage,
                                name: `${newId}.jpg`,
                                type: 'image/jpeg'
                              });
                            }

                            const newPos: SavedPosition = {
                              id: newId,
                              name: newPositionName || `Position ${savedPositions.length + 1}`,
                              coordinates: tempSelectedLocation,
                              domicileType: '',
                              domicileNumber: '',
                              frontDoorPicId: newId, // On garde l'ID document par cohérence
                              otherInfos: '',
                            };

                            await savePosition(newPos);
                            setNewPositionName('');
                            setIsPickingLocation(false);
                          } catch (err) { console.error(err); }
                        }

                      }}
                    >
                      <Text style={styles.actionButtonText}>{t('general.confirm')}</Text>
                    </TouchableOpacity>

                  </View>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </>
      )}
    </View>

  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
    color: 'red',
  },
  map: {
    width: Dimensions.get('window').width,
    height: 350,
    position: 'absolute',
    top: 0,
  },
  actionButton: {
    backgroundColor: '#001524',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#ff7d00',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoScrollView: {
    position: 'absolute',
    top: Dimensions.get('window').height * 0.5,
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
  },
  infoSection: {
    marginBottom: 20,
    paddingHorizontal: 15,
    marginLeft: 0,
  },
  infoSectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#001524',
    marginBottom: 5,
    marginLeft: 5,
  },
  infoSectionLabelPoz: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#001524',
    marginBottom: 5,
    marginLeft: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#15616d',
    size: '20%',
  },
  infoSectionText: {
    fontSize: 14,
    color: '#001524',
    marginBottom: 10,
    marginLeft: 5,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: '#ff7d00',
    paddingBottom: 0,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    backgroundColor: '#15616d',
    borderRadius: 50,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 60,
    marginTop: 5,
  },
  confirmBar: {
    position: 'absolute',
    bottom: 250,
    left: 0,
    right: 0,
    padding: 30,
    backgroundColor: '#ffecd1',
  },
  confirmBarButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 20,
  },
  photoPlaceholder: {
    width: 200,
    height: 300,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'center',
  },
  cancelButtonText: {
    color: '#001524',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ff7d00',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#001524',
    flex: 1,
    height: 50,
  },
});

export default modalMapBuyer;
