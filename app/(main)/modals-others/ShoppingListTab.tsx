import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CoursesListItem } from './cart-types';
import { PremiumUtilisateur } from '../premiums';
import { useAppTranslation } from '../translations/data/translationCentralization';

interface Props {
  premiumStatus: PremiumUtilisateur;
}

export const ShoppingListTab: React.FC<Props> = ({ premiumStatus }: Props) => {
  const { t } = useAppTranslation();
  const [items, setItems] = useState<CoursesListItem[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem('myCoursesList');
      if (stored) setItems(JSON.parse(stored));
    };
    load();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('myCoursesList', JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    if (!text.trim()) return;
    if (premiumStatus === PremiumUtilisateur.Aucun && items.length >= 20) {
      Alert.alert(t('general.attention'), t('limiteAtteinteMessage').replace('{{limit}}', '20'));
      return;
    }
    const newItem: CoursesListItem = { id: Date.now().toString(), text: text.trim(), checked: false };
    setItems((prev: CoursesListItem[]) => prev.concat(newItem));
    setText('');
  };

  const toggleItem = (id: string) => {
    setItems((prev: CoursesListItem[]) => prev.map((it: CoursesListItem) => it.id === id ? { ...it, checked: !it.checked } : it));
  };

  const removeItem = (id: string) => {
    setItems((prev: CoursesListItem[]) => prev.filter((it: CoursesListItem) => it.id !== id));
  };

  return (
    <View style={{ padding: 15 }}>
      <Text style={styles.deliveryLabel}>{t('commandList.productList')}</Text>

      <View style={styles.addCourseInputWrapper}>
        <TextInput
          style={[styles.creditInput, styles.addCourseTextInput]}
          placeholder={t('addProduct')}
          placeholderTextColor="#5e5e5e"
          value={text}
          onChangeText={setText}
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.checkboxTouchArea}
          onPress={addItem}
          disabled={text.trim().length === 0}
        >
          <Ionicons
            name={text.trim().length > 0 ? "checkmark-circle" : "add-circle"}
            size={30}
            style={text.trim().length > 0 ? styles.checkboxCheckedColor : styles.checkboxUncheckedColor}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.listContainer}>
        {items.map((item: CoursesListItem) => (
          <View key={item.id} style={[styles.cartItemContainer, styles.coursesListItemContainer]}>
            <TouchableOpacity onPress={() => toggleItem(item.id)} style={styles.checkboxTouchArea}>
              <Ionicons
                name={item.checked ? "checkmark-circle" : "square-outline"}
                size={24}
                style={item.checked ? styles.checkboxCheckedColor : styles.checkboxUncheckedColor}
              />
            </TouchableOpacity>
            <Text style={[styles.coursesListItemText, item.checked && { textDecorationLine: 'line-through', color: '#dbdbdb' }]}>
              {item.text}
            </Text>
            <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.checkboxTouchArea}>
              <Ionicons name="trash-outline" size={24} color="#001524" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  deliveryLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#001524',
    marginBottom: 12,
  },
  addCourseInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creditInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#001524',
    paddingVertical: 6,
    fontSize: 15,
    color: '#000',
  },
  addCourseTextInput: {
    flex: 1,
    marginRight: 10,
  },
  checkboxTouchArea: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCheckedColor: {
    color: '#ff7d00',
  },
  checkboxUncheckedColor: {
    color: '#888',
  },
  listContainer: {
    maxHeight: '100%',
  },
  cartItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffecd1',
  },
  coursesListItemContainer: {
    paddingHorizontal: 5,
  },
  coursesListItemText: {
    flex: 1,
    marginLeft: 15,
    marginRight: 15,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
});
