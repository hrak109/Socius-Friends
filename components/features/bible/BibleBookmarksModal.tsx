import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

interface Bookmark {
    id: string;
    version: string;
    bookIndex: number;
    chapterIndex: number;
    createdAt: string;
    label?: string;
    synced?: boolean;
}

interface BibleBookmarksModalProps {
    visible: boolean;
    onClose: () => void;
    bookmarks: Bookmark[];
    onGoToBookmark: (bookmark: Bookmark) => void;
    onDeleteBookmark: (id: string) => void;
}

export function BibleBookmarksModal({
    visible,
    onClose,
    bookmarks,
    onGoToBookmark,
    onDeleteBookmark
}: BibleBookmarksModalProps) {
    const { colors } = useTheme();
    const { t } = useLanguage();

    return (
        <Modal
            animationType="slide"
            presentationStyle="pageSheet"
            visible={visible}
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.modalHeaderBar}>
                    <Text style={[styles.modalTitleText, { color: colors.text, fontSize: 20 }]}>{t('bible.bookmarks')}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={[styles.modalCancel, { color: colors.primary }]}>{t('common.close')}</Text>
                    </TouchableOpacity>
                </View>

                {bookmarks.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        <Ionicons name="bookmark-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                        <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>{t('bible.no_bookmarks')}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={bookmarks}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: 20 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.bookmarkItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => onGoToBookmark(item)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.bookmarkLabel, { color: colors.text }]}>{item.label}</Text>
                                    <Text style={[styles.bookmarkMeta, { color: colors.textSecondary }]}>
                                        {item.version} • {new Date(item.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => onDeleteBookmark(item.id)} style={{ padding: 8 }}>
                                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    modalHeaderBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    modalTitleText: {
        fontWeight: 'bold',
    },
    modalCancel: {
        fontSize: 16,
    },
    emptyStateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    bookmarkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    bookmarkLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    bookmarkMeta: {
        fontSize: 12,
    },
});
