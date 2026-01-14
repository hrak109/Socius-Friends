import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

type DiaryEntry = {
    id: string;
    date: string;
    content: string;
    title?: string;
    created_at: string;
};

export default function DiaryScreen() {
    const { colors } = useTheme();
    const { t, language } = useLanguage();
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // New states for modal and new entry
    const [modalVisible, setModalVisible] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    const fetchEntries = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/diary');
            setEntries(res.data);
        } catch (error) {
            console.error('Failed to fetch diary entries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleSaveEntry = async () => {
        if (newContent.trim() === '') return;

        try {
            const today = new Date().toISOString();
            const res = await api.post('/diary', {
                content: newContent,
                title: newTitle.trim() === '' ? undefined : newTitle,
                date: today
            });

            setEntries([res.data, ...entries]);
            setNewTitle('');
            setNewContent('');
            setModalVisible(false);
        } catch (error) {
            console.error('Failed to save diary entry:', error);
        }
    };

    const startEditing = (entry: DiaryEntry) => {
        setEditingId(entry.id);
        setEditContent(entry.content);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditContent('');
    };

    const saveEdit = async (id: string) => {
        if (editContent.trim() === '') return;
        setIsSavingEdit(true);
        try {
            const res = await api.put(`/diary/${id}`, { content: editContent });
            setEntries(entries.map(e => e.id === id ? res.data : e));
            setEditingId(null);
            setEditContent('');
        } catch (error) {
            console.error('Failed to update diary entry:', error);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const renderEntry = ({ item }: { item: DiaryEntry }) => {
        const isEditing = editingId === item.id;
        const isExpanded = expandedIds.has(item.id);

        return (
            <View style={[styles.entryCard, { backgroundColor: colors.card, shadowColor: '#000' }]}>
                {isEditing ? (
                    <View>
                        <TextInput
                            style={[styles.editInput, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                            multiline
                            value={editContent}
                            onChangeText={setEditContent}
                            autoFocus
                        />
                        <View style={styles.editActions}>
                            <TouchableOpacity
                                style={[styles.editBtn, styles.cancelEditBtn, { backgroundColor: colors.inputBackground }]}
                                onPress={cancelEditing}
                                disabled={isSavingEdit}
                            >
                                <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>{t('diary.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.editBtn, styles.saveEditBtn, { backgroundColor: colors.primary }]}
                                onPress={() => saveEdit(item.id)}
                                disabled={isSavingEdit}
                            >
                                {isSavingEdit ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.editBtnText}>{t('diary.save')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity activeOpacity={0.8} onPress={() => toggleExpand(item.id)} style={{ flexDirection: 'row' }}>
                        <View style={[styles.dateBadge, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.dateDay, { color: '#fff' }]}>
                                {new Date(item.date).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { day: 'numeric' })}
                            </Text>
                            <Text style={[styles.dateMonth, { color: 'rgba(255,255,255,0.9)' }]}>
                                {new Date(item.date).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'short' })}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                {item.title ? (
                                    <Text style={[styles.entryTitle, { color: colors.text, flex: 1, marginRight: 8 }]} numberOfLines={1}>{item.title}</Text>
                                ) : (
                                    <View style={{ flex: 1 }} />
                                )}
                                <TouchableOpacity onPress={() => startEditing(item)} style={styles.editIcon}>
                                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.entryPreview, { color: colors.textSecondary }]} numberOfLines={isExpanded ? undefined : 5}>
                                {item.content}
                            </Text>
                            <Text style={[styles.entryTime, { color: colors.textSecondary }]}>
                                {new Date(item.date).toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'en-US', { hour: 'numeric', minute: '2-digit' })}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: t('diary.title'), headerBackTitle: t('common.back') }} />

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <View style={styles.content}>
                    <FlatList
                        data={entries}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderEntry}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="book-outline" size={60} color={colors.textSecondary} />
                                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>{t('diary.no_entries')}</Text>
                            </View>
                        }
                    />
                </View>
            )}

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('diary.new_entry')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.inputTitle, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                            placeholder={t('diary.title_placeholder')}
                            placeholderTextColor={colors.textSecondary}
                            value={newTitle}
                            onChangeText={setNewTitle}
                        />

                        <TextInput
                            style={[styles.inputContent, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                            placeholder={t('diary.content_placeholder')}
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            textAlignVertical="top"
                            value={newContent}
                            onChangeText={setNewContent}
                        />

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.primary }]}
                            onPress={handleSaveEntry}
                        >
                            <Text style={styles.saveButtonText}>{t('diary.save_entry')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    entryCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    dateBadge: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        borderRadius: 8,
        minWidth: 40,
        marginRight: 12,
        height: 45,
    },
    dateDay: {
        fontSize: 16,
        fontWeight: 'bold',
        lineHeight: 18,
    },
    dateMonth: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    entryTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 5,
    },
    entryPreview: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 8,
    },
    entryTime: {
        fontSize: 12,
        marginTop: 5,
    },
    editIcon: {
        padding: 5,
    },
    editInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        minHeight: 100,
        marginBottom: 15,
        textAlignVertical: 'top',
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    editBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveEditBtn: {},
    cancelEditBtn: {},
    editBtnText: {
        fontWeight: '600',
        fontSize: 14,
        color: '#fff',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        opacity: 0.7,
    },
    emptyStateText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        paddingBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    inputTitle: {
        fontSize: 18,
        fontWeight: '600',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
    },
    inputContent: {
        fontSize: 16,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        minHeight: 200,
        marginBottom: 20,
    },
    saveButton: {
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
