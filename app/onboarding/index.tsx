import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import * as Haptics from 'expo-haptics';


const ITEM_HEIGHT = 70; // Height of each language item
// Visible window height for the picker (e.g., 3 items visible, middle one selected)
const PICKER_HEIGHT = ITEM_HEIGHT * 5;

const LANGUAGES = [
    { code: 'en', name: 'English', greeting: 'Hello' },
    { code: 'ko', name: '한국어', greeting: '안녕하세요' },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t, language, setLanguage } = useLanguage();
    const flatListRef = useRef<FlatList>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Initial scroll to current language or default
    useEffect(() => {
        const initialIndex = LANGUAGES.findIndex(l => l.code === language);
        if (initialIndex !== -1) {
            setActiveIndex(initialIndex);
            // Slight delay to ensure layout is ready
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
            }, 100);
        }
    }, [language]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        // Calculate centered index
        const index = Math.round(offsetY / ITEM_HEIGHT);

        if (index >= 0 && index < LANGUAGES.length && index !== activeIndex) {
            setActiveIndex(index);
            const newLang = LANGUAGES[index].code;
            setLanguage(newLang as 'en' | 'ko');
            Haptics.selectionAsync(); // Nice haptic feedback on change
        }
    };

    const handleContinue = async () => {
        const selectedLang = LANGUAGES[activeIndex].code;
        await AsyncStorage.setItem('selected_language', selectedLang);
        router.replace('/');
    };

    const renderItem = ({ item, index }: { item: typeof LANGUAGES[0], index: number }) => {
        const isActive = index === activeIndex;
        return (
            <View style={[styles.itemContainer, { height: ITEM_HEIGHT }]}>
                <Text style={[
                    styles.languageText,
                    {
                        color: isActive ? colors.text : colors.textSecondary,
                        fontWeight: isActive ? '700' : '400',
                        opacity: isActive ? 1 : 0.4,
                        fontSize: isActive ? 24 : 20
                    }
                ]}>
                    {item.name}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.topSection}>
                {/* App Icon */}
                <Image
                    source={require('../../assets/images/icon.png')}
                    style={styles.appIcon}
                />

                {/* Dynamic Greeting Title */}
                <Text style={[styles.title, { color: colors.text }]}>
                    {LANGUAGES[activeIndex].greeting}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {t('onboarding.choose_language')}
                </Text>
            </View>

            {/* Wheel Picker */}
            <View style={styles.pickerContainer}>
                {/* Selection Indicator Lines */}
                <View style={[styles.selectionOverlay, { borderColor: colors.border }]} pointerEvents="none" />

                <FlatList
                    ref={flatListRef}
                    data={LANGUAGES}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.code}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    getItemLayout={(_, index) => (
                        { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
                    )}
                    // Padding to center the first and last items
                    contentContainerStyle={{
                        paddingVertical: (PICKER_HEIGHT - ITEM_HEIGHT) / 2
                    }}
                    style={{ height: PICKER_HEIGHT, width: '100%' }}
                />
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
                <TouchableOpacity
                    style={[styles.continueButton, { backgroundColor: colors.primary }]}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                >
                    <Text style={styles.continueText}>
                        {language === 'ko' ? '계속하기' : 'Continue'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    topSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    appIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    pickerContainer: {
        height: ITEM_HEIGHT * 5, // Match PICKER_HEIGHT
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    selectionOverlay: {
        position: 'absolute',
        top: (ITEM_HEIGHT * 5 - ITEM_HEIGHT) / 2, // Centered vertically
        height: ITEM_HEIGHT,
        width: '100%',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        opacity: 0.1,
    },
    itemContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    languageText: {
        textAlign: 'center',
    },
    bottomSection: {
        width: '100%',
        paddingHorizontal: 30,
        paddingBottom: 50,
    },
    continueButton: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    continueText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
