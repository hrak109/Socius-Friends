import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

GoogleSignin.configure({
    webClientId: '801464542210-b08v4fc2tsk7ma3bfu30jc1frueps1on.apps.googleusercontent.com',
});

export default function LoginScreen() {
    const router = useRouter();
    const { signIn, session } = useSession();
    const { colors } = useTheme();
    const { t, language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const selectedLanguage = await AsyncStorage.getItem('selected_language');
                if (!selectedLanguage) {
                    // User hasn't selected language yet, go to onboarding
                    router.replace('/onboarding');
                    return;
                }

                // If already logged in, go to messages
                if (session) {
                    router.replace('/messages');
                }
            } finally {
                setIsCheckingOnboarding(false);
            }
        };
        checkOnboarding();
    }, [session, router]);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await GoogleSignin.hasPlayServices();
            const signInResult = await GoogleSignin.signIn();
            const idToken = signInResult?.data?.idToken;

            if (!idToken) {
                throw new Error('No ID token received');
            }

            const response = await api.post('/auth/google', { id_token: idToken });
            const { access_token } = response.data;

            await signIn(access_token);

            // Save language preference to backend after login
            try {
                await api.put('/users/me', { language });
            } catch (langError) {
                console.log('Failed to save language to backend:', langError);
            }

            // Mark onboarding as complete
            await AsyncStorage.setItem('onboarding_complete', 'true');

            router.replace('/messages');
        } catch (err: any) {
            if (err.code === statusCodes.SIGN_IN_CANCELLED) {
                setError(t('common.cancelled'));
            } else {
                setError(err.message || t('common.error'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while checking onboarding
    if (isCheckingOnboarding) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Ionicons name="people" size={80} color={colors.primary} />
                <Text style={[styles.title, { color: colors.text }]}>Socius Friends</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {t('login.subtitle') !== 'login.subtitle' ? t('login.subtitle') : 'Chat with friends and AI companions'}
                </Text>

                {error && (
                    <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
                )}

                <TouchableOpacity
                    style={[styles.googleButton, { backgroundColor: '#fff', borderColor: colors.border }]}
                    onPress={handleGoogleSignIn}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#4285F4" />
                    ) : (
                        <>
                            <Image
                                source={{ uri: 'https://www.google.com/favicon.ico' }}
                                style={styles.googleIcon}
                            />
                            <Text style={styles.googleButtonText}>
                                {t('login.google_signin') !== 'login.google_signin' ? t('login.google_signin') : 'Sign in with Google'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 10,
        marginBottom: 40,
        textAlign: 'center',
    },
    error: {
        marginBottom: 20,
        textAlign: 'center',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
});

