import React, { useState, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Image,
    RefreshControl,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { SOCIUS_AVATAR_MAP } from '../constants/avatars';

interface SociusFriend {
    id: string;
    name: string;
    avatar: string;
    role: string;
    created_at?: string;
    sort_order?: number | null;
}

type SortMode = 'recent' | 'alphabetical' | 'custom';

export default function SociusManagerScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useLanguage();

    const [friends, setFriends] = useState<SociusFriend[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortMode, setSortMode] = useState<SortMode>('recent');

    const loadFriends = useCallback(async () => {
        try {
            const response = await api.get('/friends/socius');
            setFriends(response.data || []);
        } catch (error) {
            console.error('Failed to load socius friends:', error);
            Alert.alert(t('common.error'), 'Failed to load list');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useFocusEffect(
        useCallback(() => {
            loadFriends();
        }, [loadFriends])
    );

    // Sort friends based on current mode
    const sortedFriends = useMemo(() => {
        const list = [...friends];
        switch (sortMode) {
            case 'recent':
                return list.sort((a, b) => {
                    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return dateB - dateA; // Newest first
                });
            case 'alphabetical':
                return list.sort((a, b) => a.name.localeCompare(b.name));
            case 'custom':
                return list.sort((a, b) => {
                    const orderA = a.sort_order ?? 9999;
                    const orderB = b.sort_order ?? 9999;
                    return orderA - orderB;
                });
            default:
                return list;
        }
    }, [friends, sortMode]);

    const onRefresh = () => {
        setRefreshing(true);
        loadFriends();
    };

    const handleCreateNew = () => {
        router.push('/socius-setup');
    };

    const handleChat = (friend: SociusFriend) => {
        router.push({
            pathname: '/chat/[id]',
            params: {
                id: `socius-${friend.id}`,
                type: 'socius',
                name: friend.name,
                avatar: friend.avatar,
                sociusRole: friend.role
            }
        });
    };

    const handleDelete = (friendId: string) => {
        Alert.alert(
            t('friends.unfriend_title'),
            t('friends.unfriend_message'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('friends.remove'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/friends/socius/${friendId}`);
                            setFriends(prev => prev.filter(f => f.id !== friendId));
                        } catch (error: any) {
                            Alert.alert(t('common.error'), error.response?.data?.detail || 'Failed to delete friend');
                        }
                    }
                }
            ]
        );
    };

    const moveItem = async (fromIndex: number, direction: 'up' | 'down') => {
        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
        if (toIndex < 0 || toIndex >= sortedFriends.length) return;

        const newList = [...sortedFriends];
        const [moved] = newList.splice(fromIndex, 1);
        newList.splice(toIndex, 0, moved);

        // Update local state first (optimistic)
        const updatedWithOrder = newList.map((f, idx) => ({ ...f, sort_order: idx }));
        setFriends(updatedWithOrder);

        // Persist to backend
        try {
            await api.patch('/friends/socius/order', {
                orders: updatedWithOrder.map(f => ({ id: parseInt(f.id), sort_order: f.sort_order }))
            });
        } catch (error) {
            console.error('Failed to save order:', error);
            loadFriends(); // Revert on error
        }
    };

    const handleDragEnd = async (data: SociusFriend[]) => {
        // Update local state with new order
        const updatedWithOrder = data.map((f, idx) => ({ ...f, sort_order: idx }));
        setFriends(updatedWithOrder);

        // Persist to backend
        try {
            await api.patch('/friends/socius/order', {
                orders: updatedWithOrder.map(f => ({ id: parseInt(f.id), sort_order: f.sort_order }))
            });
        } catch (error) {
            console.error('Failed to save order:', error);
            loadFriends(); // Revert on error
        }
    };

    const renderRightActions = (friendId: string) => (
        <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => handleDelete(friendId)}
        >
            <Ionicons name="trash-outline" size={24} color="#fff" />
            <Text style={styles.deleteText}>{t('friends.remove')}</Text>
        </TouchableOpacity>
    );

    const renderItem = ({ item, index }: { item: SociusFriend; index: number }) => {
        const roleLabel = t(`setup.roles.${item.role}`);
        const displayRole = roleLabel.startsWith('setup.roles.') ? item.role : roleLabel;
        const avatarSource = SOCIUS_AVATAR_MAP[item.avatar] || SOCIUS_AVATAR_MAP['socius-avatar-0'];

        const content = (
            <TouchableOpacity
                style={[
                    styles.friendItem,
                    { backgroundColor: colors.card, shadowColor: colors.shadow }
                ]}
                onPress={() => handleChat(item)}
                activeOpacity={0.9}
            >
                <View style={styles.avatarContainer}>
                    <Image source={avatarSource} style={styles.avatar} />
                </View>
                <View style={styles.infoContainer}>
                    <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.role, { color: colors.textSecondary }]}>{displayRole}</Text>
                </View>
                {sortMode === 'custom' ? (
                    <View style={styles.reorderButtons}>
                        <TouchableOpacity onPress={() => moveItem(index, 'up')} disabled={index === 0}>
                            <Ionicons name="chevron-up" size={22} color={index === 0 ? colors.border : colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => moveItem(index, 'down')} disabled={index === sortedFriends.length - 1}>
                            <Ionicons name="chevron-down" size={22} color={index === sortedFriends.length - 1 ? colors.border : colors.primary} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
                )}
            </TouchableOpacity>
        );

        // In custom mode, we don't use Swipeable to avoid gesture conflicts
        if (sortMode === 'custom') {
            return content;
        }

        return (
            <Swipeable renderRightActions={() => renderRightActions(item.id)}>
                {content}
            </Swipeable>
        );
    };

    // Cycle through sort modes on button press
    const cycleSortMode = () => {
        const modes: SortMode[] = ['recent', 'alphabetical', 'custom'];
        const currentIndex = modes.indexOf(sortMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        setSortMode(modes[nextIndex]);
    };

    const getSortIcon = () => {
        switch (sortMode) {
            case 'recent': return 'time-outline';
            case 'alphabetical': return 'text-outline';
            case 'custom': return 'reorder-four-outline';
            default: return 'funnel-outline';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: t('friends.my_socius'),
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={cycleSortMode}
                            style={styles.headerSortButton}
                        >
                            <Ionicons name={getSortIcon()} size={22} color={colors.primary} />
                            <Text style={[styles.headerSortText, { color: colors.primary }]}>
                                {t(`friends.sort_${sortMode}`)}
                            </Text>
                        </TouchableOpacity>
                    )
                }}
            />

            <FlatList
                data={sortedFriends}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
                                <Ionicons name="sparkles-outline" size={48} color={colors.primary} />
                            </View>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {t('friends.no_socius')}
                            </Text>
                        </View>
                    ) : null
                }
            />

            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                    onPress={handleCreateNew}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.createButtonText}>{t('friends.create_new')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 4,
    },
    headerSortText: {
        fontSize: 13,
        fontWeight: '600',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
    },
    avatar: {
        width: 50,
        height: 50,
    },
    infoContainer: {
        flex: 1,
        marginLeft: 16,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    role: {
        fontSize: 14,
    },
    reorderButtons: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
    },
    dragHandle: {
        paddingRight: 12,
        paddingVertical: 8,
    },
    draggingItem: {
        opacity: 0.8,
        transform: [{ scale: 1.02 }],
        shadowOpacity: 0.15,
        elevation: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
    footer: {
        padding: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        gap: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteAction: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        marginBottom: 12,
        borderRadius: 16,
        marginLeft: 10,
    },
    deleteText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
        marginTop: 4,
    }
});
