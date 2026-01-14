import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useTheme } from '../context/ThemeContext';
import { useSession } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsScreen() {
    const router = useRouter();
    const { colors, isDark, toggleTheme, setAccentColor } = useTheme();
    const { signOut } = useSession();
    const { t, language, setLanguage } = useLanguage();

    const handleSignOut = async () => {
        Alert.alert(
            t('settings.sign_out'),
            t('settings.sign_out_confirm') || 'Are you sure you want to sign out?',
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('settings.sign_out'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await GoogleSignin.signOut();
                            await signOut();
                            router.replace('/');
                        } catch (error) {
                            console.error('Sign out error:', error);
                        }
                    },
                },
            ]
        );
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ko' : 'en');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <ScrollView>
                {/* Appearance */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('settings.appearance')}
                    </Text>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="moon-outline" size={22} color={colors.text} />
                            <Text style={[styles.rowText, { color: colors.text }]}>
                                {t('settings.dark_mode')}
                            </Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            thumbColor={isDark ? colors.primary : '#f4f3f4'}
                            trackColor={{ false: '#767577', true: isDark ? '#3e3e3e' : colors.primary }}
                        />
                    </View>

                    <TouchableOpacity style={styles.row} onPress={toggleLanguage}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="language-outline" size={22} color={colors.text} />
                            <Text style={[styles.rowText, { color: colors.text }]}>
                                {t('settings.language')}
                            </Text>
                        </View>
                        <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
                            {language === 'en' ? 'English' : '한국어'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Accent Color */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('settings.accent_color')}
                    </Text>

                    <View style={styles.colorContainer}>
                        {[
                            '#1a73e8', // Blue
                            '#7b1fa2', // Purple
                            '#34a853', // Green
                            '#f57c00', // Orange
                            '#e91e63', // Pink
                            '#d32f2f', // Red
                            '#00897b', // Teal
                        ].map((color) => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.colorCircle,
                                    { backgroundColor: color },
                                    colors.primary === color && styles.selectedColorCircle
                                ]}
                                onPress={() => setAccentColor(color)}
                            >
                                {colors.primary === color && (
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Account */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('settings.account')}
                    </Text>

                    <TouchableOpacity style={styles.row} onPress={handleSignOut}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="log-out-outline" size={22} color={colors.error} />
                            <Text style={[styles.rowText, { color: colors.error }]}>
                                {t('settings.sign_out')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* About */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('settings.about')}
                    </Text>

                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="information-circle-outline" size={22} color={colors.text} />
                            <Text style={[styles.rowText, { color: colors.text }]}>
                                {t('settings.version')}
                            </Text>
                        </View>
                        <Text style={[styles.rowValue, { color: colors.textSecondary }]}>1.0.0</Text>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="code-slash-outline" size={22} color={colors.text} />
                            <Text style={[styles.rowText, { color: colors.text }]}>
                                {t('settings.developer')}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.rowValue, { color: colors.textSecondary, fontSize: 14 }]}>Hee Bae 배희락</Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>hrak109@gmail.com</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        marginTop: 20,
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rowText: {
        fontSize: 16,
    },
    rowValue: {
        fontSize: 16,
    },
    colorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 16,
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedColorCircle: {
        transform: [{ scale: 1.1 }],
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});
