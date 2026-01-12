import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider, useSession } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { NotificationProvider } from '../context/NotificationContext';
import { UserProfileProvider } from '../context/UserProfileContext';
import ErrorBoundary from '../components/ErrorBoundary';

function RootLayoutNav() {
    const { session, isLoading } = useSession();
    const segments = useSegments();
    const router = useRouter();
    const { colors } = useTheme();

    useEffect(() => {
        if (isLoading) return;

        if (!session) {
            router.replace('/');
        } else if (session && segments[0] !== 'messages' && segments[0] !== 'chat' && segments[0] !== 'friends' && segments[0] !== 'add-friend' && segments[0] !== 'settings') {
            router.replace('/messages');
        }
    }, [session, segments, isLoading]);

    return (
        <>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen
                    name="messages"
                    options={{
                        title: 'Messages',
                        headerBackVisible: false,
                        headerRight: () => (
                            <TouchableOpacity
                                onPress={() => router.push('/settings')}
                                style={{ marginRight: 15 }}
                            >
                                <Ionicons name="settings-outline" size={24} color={colors.text} />
                            </TouchableOpacity>
                        ),
                    }}
                />
                <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
                <Stack.Screen name="friends" options={{ title: 'Friends' }} />
                <Stack.Screen name="add-friend" options={{ title: 'Add Friend', presentation: 'modal' }} />
                <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <AuthProvider>
                    <LanguageProvider>
                        <NotificationProvider>
                            <UserProfileProvider>
                                <RootLayoutNav />
                            </UserProfileProvider>
                        </NotificationProvider>
                    </LanguageProvider>
                </AuthProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}
