import React, { useState, useCallback, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useSession } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { SOCIUS_AVATAR_MAP, PROFILE_AVATAR_MAP } from '../constants/avatars';
import api from '../services/api';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APPS_ORDER_KEY = 'user_apps_order_v1';

const DEFAULT_APPS = [
    { id: 'socius', label: 'friends.socius_friend', icon: 'sparkles', color: '#007AFF', route: '/socius-friends' },
    { id: 'friends', label: 'friends.title', icon: 'people', color: '#34C759', route: '/friends' },
    { id: 'bible', label: 'bible.title', icon: 'book', color: '#8B4513', route: '/bible' },
    { id: 'calories', label: 'calories.title', icon: 'nutrition', color: '#E0245E', route: '/calories' },
    { id: 'passwords', label: 'passwords.title', icon: 'key', color: '#5856D6', route: '/passwords' },
    { id: 'notes', label: 'notes.title', icon: 'document-text', color: '#FF9500', route: '/notes' },
    { id: 'diary', label: 'diary.title', icon: 'journal', color: '#FF2D55', route: '/diary' },
    { id: 'workout', label: 'workout.title', icon: 'fitness', color: '#FF3B30', route: '/workout' },
];

interface ChatThread {
    id: string;
    type: 'user' | 'socius';
    name: string;
    avatar?: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unread?: number;
    sociusRole?: string;
}

export default function MessagesScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useLanguage();
    const { session } = useSession();
    const { lastNotificationTime } = useNotifications();
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [apps, setApps] = useState(DEFAULT_APPS);

    useEffect(() => {
        loadAppsOrder();
    }, []);

    const loadAppsOrder = async () => {
        try {
            const saved = await AsyncStorage.getItem(APPS_ORDER_KEY);
            if (saved) {
                const savedOrder = JSON.parse(saved);
                // Merge with default to ensure new apps appear
                // Get objects for saved order, filtering out any that no longer exist in DEFAULT_APPS
                const savedAppObjects = savedOrder
                    .map((id: string) => DEFAULT_APPS.find(a => a.id === id))
                    .filter((app: typeof DEFAULT_APPS[0] | undefined): app is typeof DEFAULT_APPS[0] => app !== undefined);

                // Identify and append new apps not present in saved order
                const newAppObjects = DEFAULT_APPS.filter(a => !savedOrder.includes(a.id));

                setApps([...savedAppObjects, ...newAppObjects]);
            }
        } catch (error) {
            console.error('Failed to load apps order', error);
        }
    };

    const handleDragEnd = async ({ data }: { data: typeof DEFAULT_APPS }) => {
        setApps(data);
        try {
            const order = data.map(a => a.id);
            await AsyncStorage.setItem(APPS_ORDER_KEY, JSON.stringify(order));
        } catch (error) {
            console.error('Failed to save apps order', error);
        }
    };

    const renderAppItem = ({ item, drag, isActive }: RenderItemParams<typeof DEFAULT_APPS[0]>) => {
        return (
            <ScaleDecorator>
                <TouchableOpacity
                    style={[styles.appItem, { opacity: isActive ? 0.5 : 1 }]}
                    onPress={() => router.push(item.route as any)}
                    onLongPress={drag}
                    disabled={isActive}
                >
                    <View style={[
                        styles.appIcon,
                        {
                            backgroundColor: item.color,
                            shadowColor: item.color,
                            shadowOpacity: 0.25
                        }
                    ]}>
                        <Ionicons name={item.icon as any} size={24} color="#fff" />
                    </View>
                    <Text style={[styles.appLabel, { color: colors.text }]}>{t(item.label)}</Text>
                </TouchableOpacity>
            </ScaleDecorator>
        );
    };

    const loadThreads = useCallback(async () => {
        try {
            // Load real user chats
            const dmResponse = await api.get('/messages/recent');
            const userThreads: ChatThread[] = (dmResponse.data || []).map((conv: any) => ({
                id: `user-${conv.friend_id}`,
                type: 'user',
                name: conv.friend_display_name || conv.friend_username,
                avatar: conv.friend_avatar,
                lastMessage: conv.last_message,
                lastMessageTime: conv.last_message_time,
                unread: conv.unread_count || 0,
            }));

            // Load Socius AI friends from API
            try {
                const sociusResponse = await api.get('/friends/socius');
                // Filter to only show Socius companions with actual messages
                const sociusThreads: ChatThread[] = (sociusResponse.data || [])
                    .filter((comp: any) => comp.last_message !== null)
                    .map((comp: any) => ({
                        id: `socius-${comp.id}`,
                        type: 'socius',
                        name: comp.name,
                        avatar: comp.avatar,
                        lastMessage: comp.last_message,
                        lastMessageTime: comp.last_message_time,
                        sociusRole: comp.role,
                        unread: comp.unread_count || 0
                    }));

                // Combine and sort by last message time (newest first)
                const allThreads = [...sociusThreads, ...userThreads].sort((a, b) => {
                    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                    return timeB - timeA;
                });

                setThreads(allThreads);
            } catch (error) {
                console.error('Failed to load socius friends:', error);
                // Fallback to just user threads if socius fails
                setThreads([...userThreads]);
            }
        } catch (error) {
            console.error('Failed to load threads:', error);
        }
    }, []);

    // Refresh on screen focus
    useFocusEffect(
        useCallback(() => {
            if (session) {
                loadThreads();
            }
        }, [session, loadThreads])
    );

    // Refresh when new notification arrives via SSE
    useFocusEffect(
        useCallback(() => {
            if (lastNotificationTime) {
                loadThreads();
            }
        }, [lastNotificationTime, loadThreads])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadThreads();
        setRefreshing(false);
    };

    const handleThreadPress = (thread: ChatThread) => {
        router.push({
            pathname: '/chat/[id]',
            params: {
                id: thread.id,
                type: thread.type,
                name: thread.name,
                avatar: thread.avatar || '',
                sociusRole: thread.sociusRole || '',
            },
        });
    };

    const renderThread = ({ item }: { item: ChatThread }) => {
        let avatarSource = null;

        if (item.type === 'socius') {
            // Socius: use SOCIUS_AVATAR_MAP
            avatarSource = SOCIUS_AVATAR_MAP[item.avatar || 'socius-avatar-0'];
        } else if (item.avatar) {
            // User: check if it's a PROFILE_AVATAR_MAP key, otherwise use as URL
            if (PROFILE_AVATAR_MAP[item.avatar]) {
                avatarSource = PROFILE_AVATAR_MAP[item.avatar];
            } else if (item.avatar.startsWith('http')) {
                avatarSource = { uri: item.avatar };
            }
        }

        return (
            <TouchableOpacity
                style={[styles.threadItem, { borderBottomColor: colors.border }]}
                onPress={() => handleThreadPress(item)}
            >
                <View style={[
                    styles.avatarContainer,
                    {
                        backgroundColor: item.type === 'socius' ? '#fff' : colors.primary,
                        borderWidth: item.type === 'socius' ? 1 : 0,
                        borderColor: colors.border
                    }
                ]}>
                    {avatarSource ? (
                        <Image source={avatarSource} style={styles.avatar} />
                    ) : (
                        <Ionicons
                            name={item.type === 'socius' ? 'sparkles' : 'person'}
                            size={24}
                            color={item.type === 'socius' ? colors.primary : "#fff"}
                        />
                    )}
                </View>

                <View style={styles.threadContent}>
                    <View style={styles.threadHeader}>
                        <Text style={[styles.threadName, { color: colors.text }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        {item.type === 'socius' && (
                            <View style={[styles.aiTag, { backgroundColor: colors.primary }]}>
                                <Text style={styles.aiTagText}>
                                    {t('chat.socius')} {item.sociusRole ? `• ${t(`setup.roles.${item.sociusRole}`) !== `setup.roles.${item.sociusRole}` ? t(`setup.roles.${item.sociusRole}`) : (item.sociusRole.charAt(0).toUpperCase() + item.sociusRole.slice(1))}` : ''}
                                </Text>
                            </View>
                        )}
                        {item.type === 'user' && (
                            <View style={[styles.aiTag, { backgroundColor: colors.success }]}>
                                <Text style={styles.aiTagText}>
                                    {t('friends.user_friend') || 'User. Friend.'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text
                        style={[
                            styles.lastMessage,
                            { color: (item.unread || 0) > 0 ? colors.text : colors.textSecondary },
                            (item.unread || 0) > 0 && styles.unreadMessage
                        ]}
                        numberOfLines={1}
                    >
                        {item.lastMessage || 'Start a conversation'}
                    </Text>
                </View>

                {
                    (item.unread || 0) > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: '#FF3B30' }]}>
                            <Text style={styles.unreadText}>{item.unread}</Text>
                        </View>
                    )
                }
            </TouchableOpacity >
        );
    };

    // Replace render logic
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            {/* Apps Row (Draggable) */}
            <View style={styles.appsContainer}>
                <DraggableFlatList
                    data={apps}
                    onDragEnd={handleDragEnd}
                    keyExtractor={(item) => item.id}
                    renderItem={renderAppItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.appsContent}
                />
            </View>

            {/* Threads List */}
            <FlatList
                data={threads}
                keyExtractor={(item) => item.id}
                renderItem={renderThread}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {t('messages.no_messages')}
                        </Text>
                        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                            {t('messages.start_chat')}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    appsContainer: {
        paddingVertical: 10,
        paddingHorizontal: 0,
    },
    appsContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    appItem: {
        alignItems: 'center',
        width: 60,
    },
    appIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    appLabel: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
    threadItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatar: {
        width: 50,
        height: 50,
    },
    threadContent: {
        flex: 1,
        marginLeft: 12,
    },
    threadHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    threadName: {
        fontSize: 16,
        fontWeight: '600',
    },
    aiTag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    aiTagText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    lastMessage: {
        fontSize: 14,
        marginTop: 4,
    },
    unreadMessage: {
        fontWeight: 'bold',
    },
    unreadBadge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
    },
});
