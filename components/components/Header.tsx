import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icons from "@expo/vector-icons/MaterialIcons";
import { t } from 'i18next';

export const Header = () => {
    const { colors } = useTheme();

    return (
        <View style={{ paddingHorizontal: 24, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1 }}>
                {/* Content will be set by user */}

                <Text style={{ color: colors.text, opacity: 0.75 }} numberOfLines={1}>
                    {t('general.discoverProds')}
                </Text>
            </View>
            <TouchableOpacity style={{ width: 52, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 52, borderWidth: 1, borderColor: colors.border }}>
                <Icons name="notifications" size={24} color={colors.text} />
            </TouchableOpacity>
        </View>
    );
};
