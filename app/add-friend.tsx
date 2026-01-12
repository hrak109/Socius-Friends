import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const SOCIUS_ROLES = [
    { id: 'faith_companion', name: 'Faith Companion', icon: 'heart', description: 'A supportive Christian companion' },
    { id: 'friend', name: 'Friendly Buddy', icon: 'happy', description: 'A casual and friendly chat partner' },
    { id: 'mentor', name: 'Life Mentor', icon: 'school', description: 'A wise mentor for guidance' },
    { id: 'assistant', name: 'Helpful Assistant', icon: 'briefcase', description: 'A professional helper' },
];

export default function AddFriendScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useLanguage();

    const [mode, setMode] = useState<'user' | 'socius'>('user');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [sociusName, setSociusName] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearchUsers = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await api.get(`/users?q=${encodeURIComponent(searchQuery)}`);
            setSearchResults(response.data || []);
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddUser = async (userId: number) => {
        try {
            await api.post('/friends/request', { friend_id: userId });
            Alert.alert('Success', 'Friend request sent!');
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to send request');
        }
    };

    const handleCreateSocius = () => {
        if (!selectedRole || !sociusName.trim()) {
            Alert.alert('Error', 'Please select a role and enter a name');
            return;
        }
        // Save to local storage or API
        // For now, navigate back
        Alert.alert('Success', `${sociusName} has been added as your AI friend!`);
        router.back();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            {/* Mode Tabs */}
            <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.tab, mode === 'user' && { borderBottomColor: colors.primary }]}
                    onPress={() => setMode('user')}
                >
                    <Ionicons
                        name="person-add"
                        size={20}
                        color={mode === 'user' ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[
                        styles.tabText,
                        { color: mode === 'user' ? colors.primary : colors.textSecondary }
                    ]}>
                        Add User
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, mode === 'socius' && { borderBottomColor: colors.primary }]}
                    onPress={() => setMode('socius')}
                >
                    <Ionicons
                        name="sparkles"
                        size={20}
                        color={mode === 'socius' ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[
                        styles.tabText,
                        { color: mode === 'socius' ? colors.primary : colors.textSecondary }
                    ]}>
                        Add AI Friend
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {mode === 'user' ? (
                    /* Search Users */
                    <View>
                        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                            <Ionicons name="search" size={20} color={colors.textSecondary} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.text }]}
                                placeholder="Search by username..."
                                placeholderTextColor={colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearchUsers}
                            />
                        </View>

                        {searchResults.map((user) => (
                            <TouchableOpacity
                                key={user.id}
                                style={[styles.userItem, { borderBottomColor: colors.border }]}
                                onPress={() => handleAddUser(user.id)}
                            >
                                <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.userInitial}>
                                        {user.display_name?.[0] || user.username?.[0] || '?'}
                                    </Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={[styles.userName, { color: colors.text }]}>
                                        {user.display_name || user.username}
                                    </Text>
                                    <Text style={[styles.userUsername, { color: colors.textSecondary }]}>
                                        @{user.username}
                                    </Text>
                                </View>
                                <Ionicons name="add-circle" size={28} color={colors.primary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    /* Create Socius AI Friend */
                    <View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Name your AI friend
                        </Text>
                        <TextInput
                            style={[styles.nameInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                            placeholder="Enter name..."
                            placeholderTextColor={colors.textSecondary}
                            value={sociusName}
                            onChangeText={setSociusName}
                        />

                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
                            Choose personality
                        </Text>

                        {SOCIUS_ROLES.map((role) => (
                            <TouchableOpacity
                                key={role.id}
                                style={[
                                    styles.roleItem,
                                    { backgroundColor: colors.card, borderColor: colors.border },
                                    selectedRole === role.id && { borderColor: colors.primary, borderWidth: 2 }
                                ]}
                                onPress={() => setSelectedRole(role.id)}
                            >
                                <View style={[styles.roleIcon, { backgroundColor: colors.primary }]}>
                                    <Ionicons name={role.icon as any} size={24} color="#fff" />
                                </View>
                                <View style={styles.roleInfo}>
                                    <Text style={[styles.roleName, { color: colors.text }]}>{role.name}</Text>
                                    <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>
                                        {role.description}
                                    </Text>
                                </View>
                                {selectedRole === role.id && (
                                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={[styles.createButton, { backgroundColor: colors.primary }]}
                            onPress={handleCreateSocius}
                        >
                            <Text style={styles.createButtonText}>Create AI Friend</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    userAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInitial: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
    },
    userUsername: {
        fontSize: 14,
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    nameInput: {
        fontSize: 16,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    roleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    roleIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleInfo: {
        flex: 1,
        marginLeft: 12,
    },
    roleName: {
        fontSize: 16,
        fontWeight: '600',
    },
    roleDesc: {
        fontSize: 13,
        marginTop: 4,
    },
    createButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
