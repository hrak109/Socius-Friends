import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/AuthContext';
import { SOCIUS_AVATAR_MAP } from '../constants/avatars';
import api from '../services/api';

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
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();
    const { session } = useSession();
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadThreads = useCallback(async () => {
        try {
            // Load real user chats
            const dmResponse = await api.get('/dm/conversations');
            const userThreads: ChatThread[] = (dmResponse.data || []).map((conv: any) => ({
                id: `user-${conv.friend_id}`,
                type: 'user',
                name: conv.friend_display_name || conv.friend_username,
                avatar: conv.friend_avatar,
                lastMessage: conv.last_message,
                lastMessageTime: conv.last_message_time,
                unread: conv.unread_count || 0,
            }));

            // Load Socius AI friends from local storage or API
            // For now, add a default Socius friend
            const sociusThreads: ChatThread[] = [
                {
                    id: 'socius-default',
                    type: 'socius',
                    name: 'Socius',
                    avatar: 'socius-avatar-0',
                    lastMessage: 'How can I help you today?',
                    sociusRole: 'faith_companion',
                },
            ];

            setThreads([...sociusThreads, ...userThreads]);
        } catch (error) {
            console.error('Failed to load threads:', error);
        }
    }, []);

    useEffect(() => {
        if (session) {
            loadThreads();
        }
    }, [session, loadThreads]);

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
                sociusRole: thread.sociusRole || '',
            },
        });
    };

    const renderThread = ({ item }: { item: ChatThread }) => {
        const avatarSource = item.type === 'socius'
            ? SOCIUS_AVATAR_MAP[item.avatar || 'socius-avatar-0']
            : item.avatar
                ? { uri: item.avatar }
                : null;

        return (
            <TouchableOpacity
                style={[styles.threadItem, { borderBottomColor: colors.border }]}
                onPress={() => handleThreadPress(item)}
            >
                <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
                    {avatarSource ? (
                        <Image source={avatarSource} style={styles.avatar} />
                    ) : (
                        <Ionicons
                            name={item.type === 'socius' ? 'sparkles' : 'person'}
                            size={24}
                            color="#fff"
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
                                <Text style={styles.aiTagText}>AI</Text>
                            </View>
                        )}
                    </View>
                    <Text
                        style={[styles.lastMessage, { color: colors.textSecondary }]}
                        numberOfLines={1}
                    >
                        {item.lastMessage || 'Start a conversation'}
                    </Text>
                </View>

                {item.unread && item.unread > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.unreadText}>{item.unread}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            {/* Action Buttons */}
            <View style={[styles.actionRow, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.card }]}
                    onPress={() => router.push('/add-friend')}
                >
                    <Ionicons name="add" size={20} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>Add</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.card }]}
                    onPress={() => router.push('/friends')}
                >
                    <Ionicons name="people" size={20} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>Friends</Text>
                </TouchableOpacity>
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
                            No conversations yet
                        </Text>
                        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                            Add a friend to start chatting!
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    actionRow: {
        flexDirection: 'row',
        padding: 12,
        gap: 12,
        borderBottomWidth: 1,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
    },
    actionText: {
        fontSize: 15,
        fontWeight: '600',
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
