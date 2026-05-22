import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icons from "@expo/vector-icons/MaterialIcons";
import { Searchbar } from 'react-native-paper';

export const SearchBar = ({ onFilterPress }: { onFilterPress: () => void }) => {
    const { colors } = useTheme();
    const [searchQuery, setSearchQuery] = React.useState('');

    return (
        <Searchbar
            placeholder="chercher quelque chose"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={{
                width: "90%",
                alignSelf: "center"
            }}
        />
    );
    return (
        <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 12 }}>
            <TouchableOpacity style={{ flex: 1, height: 52, borderRadius: 52, borderWidth: 1, borderColor: colors.border, alignItems: "center", paddingHorizontal: 24, flexDirection: "row", gap: 12 }}>
                <Icons name="search" size={24} color={colors.text} style={{ opacity: 0.5 }} />
                <Text style={{ flex: 1, fontSize: 16, color: colors.text, opacity: 0.5 }}>
                    Search
                </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onFilterPress} style={{ width: 52, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 52, backgroundColor: colors.primary }}>
                <Icons name="tune" size={24} color={colors.background} />
            </TouchableOpacity>
        </View>
    );
};
