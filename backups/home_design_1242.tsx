import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Svg, { Path, Rect, G, Text as SvgText, Defs, Pattern } from "react-native-svg";
import { useState } from "react";
import { Text } from "react-native-paper";
import Icons from "@expo/vector-icons/MaterialIcons";
import { useTheme } from "@react-navigation/native";

/**
 * ÉCRAN D'ACCUEIL ORGANIQUE (Design de 12:42)
 * Version sauvegardée pour persistance session.
 */

const HomeScreen = () => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

    const groups = [
        { id: "courses", label: "COURSES", path: "M 60,150 C 60,110 90,80 140,90 C 190,100 200,140 190,180 C 180,220 140,230 100,220 C 70,210 60,190 60,150 Z", tx: 130, ty: 160 },
        { id: "frais", label: "FRAIS", path: "M 260,120 C 260,80 300,50 340,60 C 380,70 390,110 380,150 C 370,190 330,200 290,190 C 260,180 260,150 260,120 Z", tx: 320, ty: 130 },
        { id: "restau", label: "RESTAU", path: "M 220,320 C 220,270 260,250 310,260 C 360,270 370,310 360,360 C 350,410 310,420 270,410 C 230,400 220,360 220,320 Z", tx: 290, ty: 340 },
        { id: "collation", label: "COLLATION", path: "M 40,400 C 40,350 80,330 130,340 C 180,350 190,390 180,440 C 170,490 130,500 90,490 C 50,480 40,440 40,400 Z", tx: 110, ty: 420 },
        { id: "magasins", label: "MAGASINS", path: "M 240,520 C 280,510 330,520 350,560 C 370,600 360,650 330,680 C 300,710 240,700 200,690 C 160,680 150,650 180,620 C 210,590 200,530 240,520 Z", tx: 270, ty: 620 }
    ];

    const handleShapePress = (id: string) => {
        if (activeId === id) {
            setSelectedGroup(id);
            setShowDetails(true);
        } else {
            setActiveId(id);
        }
    };

    const goBack = () => {
        setShowDetails(false);
        setActiveId(null);
    };

    if (showDetails) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                    <TouchableOpacity onPress={goBack}>
                        <Icons name="arrow-back" size={28} color="#001524" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 22, fontWeight: '700', marginLeft: 16, color: '#001524' }}>
                        {selectedGroup?.toUpperCase()}
                    </Text>
                </View>
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <View style={{ flex: 1, alignItems: 'center', marginTop: 100 }}>
                        <Text style={{ color: '#999', fontSize: 18 }}>Contenu à venir pour {selectedGroup}...</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#ff7d00' }}>
            {/* Fond rayé Premium */}
            <View style={StyleSheet.absoluteFill}>
                <Svg width="100%" height="100%">
                    <Defs>
                        <Pattern id="stripes" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <Path d="M0 0L0 10" stroke="rgba(0, 21, 36, 0.15)" strokeWidth="1" />
                        </Pattern>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#stripes)" />
                </Svg>
            </View>

            <SafeAreaView style={{ flex: 1 }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Svg viewBox="0 0 400 800" style={{ width: '90%', height: '80%' }}>
                        {groups.map((group) => {
                            const isActive = activeId === group.id;
                            return (
                                <G key={group.id} onPress={() => handleShapePress(group.id)}>
                                    <Path
                                        d={group.path}
                                        fill={isActive ? '#001524' : '#ffffff'}
                                        stroke="#001524"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {isActive && (
                                        <SvgText
                                            x={group.tx}
                                            y={group.ty}
                                            fill="#ffffff"
                                            fontSize="26"
                                            textAnchor="middle"
                                            alignmentBaseline="middle"
                                            fontFamily="Patrick Hand"
                                        >
                                            {group.label}
                                        </SvgText>
                                    )}
                                </G>
                            );
                        })}
                    </Svg>
                </View>
            </SafeAreaView>
        </View>
    );
};

export default HomeScreen;
