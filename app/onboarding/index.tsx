import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t, setLanguage } = useLanguage();

    const handleSelectLanguage = async (langCode: string) => {
        // Set language in context (also saves to AsyncStorage)
        setLanguage(langCode as 'en' | 'ko');

        // Mark that user has selected a language (but not completed onboarding yet)
        await AsyncStorage.setItem('selected_language', langCode);

        // Navigate to login screen
        router.replace('/');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.content}>
                {/* Logo/Icon */}
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="people" size={60} color={colors.primary} />
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: colors.text }]}>
                    {t('onboarding.welcome')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {t('onboarding.choose_language')}
                </Text>

                {/* Language Options */}
                <View style={styles.languageContainer}>
                    {LANGUAGES.map((lang) => (
                        <TouchableOpacity
                            key={lang.code}
                            style={[styles.languageButton, {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                shadowColor: colors.shadow
                            }]}
                            onPress={() => handleSelectLanguage(lang.code)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.flag}>{lang.flag}</Text>
                            <Text style={[styles.languageName, { color: colors.text }]}>
                                {lang.name}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Footer */}
            <Text style={[styles.footer, { color: colors.textSecondary }]}>
                {t('onboarding.change_later')}
            </Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 40,
        textAlign: 'center',
    },
    languageContainer: {
        width: '100%',
        gap: 16,
    },
    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    flag: {
        fontSize: 32,
        marginRight: 16,
    },
    languageName: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
    },
    footer: {
        fontSize: 14,
        textAlign: 'center',
        paddingBottom: 30,
    },
});
