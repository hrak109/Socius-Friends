import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

interface BibleSettingsModalProps {
    visible: boolean;
    onClose: () => void;
    baseFontSize: number;
    onZoom: (increment: number) => void;
    onOpenBookmarks: () => void;
    selectedVersion: string;
    onSelectVersion: (version: string) => void;
    bibleVersions: { id: string; name: string }[];
    autoHideHeader: boolean;
    onToggleAutoHide: (value: boolean) => void;
}

export function BibleSettingsModal({
    visible,
    onClose,
    baseFontSize,
    onZoom,
    onOpenBookmarks,
    selectedVersion,
    onSelectVersion,
    bibleVersions,
    autoHideHeader,
    onToggleAutoHide
}: BibleSettingsModalProps) {
    const { colors, isDark } = useTheme();
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
                    <Text style={[styles.modalTitleText, { color: colors.text, fontSize: 20 }]}>{t('bible.settings') || 'Settings'}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={[styles.modalCancel, { color: colors.primary }]}>{t('common.close')}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    {/* Text Size Section */}
                    <View style={[styles.settingsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.settingsSectionTitle, { color: colors.textSecondary }]}>{t('bible.text_size') || 'Text Size'}</Text>
                        <View style={styles.zoomRow}>
                            <TouchableOpacity
                                style={[styles.zoomBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                                onPress={() => onZoom(-2)}
                            >
                                <Ionicons name="remove" size={24} color={colors.text} />
                            </TouchableOpacity>

                            <Text style={[styles.zoomValue, { color: colors.text }]}>
                                {Math.round(baseFontSize)}
                            </Text>

                            <TouchableOpacity
                                style={[styles.zoomBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                                onPress={() => onZoom(2)}
                            >
                                <Ionicons name="add" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Auto Hide Header Section */}
                    <View style={[styles.settingsLinkItem, { backgroundColor: colors.card, borderColor: colors.border, paddingVertical: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Ionicons name="expand-outline" size={22} color={colors.text} style={{ marginRight: 12 }} />
                            <Text style={[styles.settingsLinkText, { color: colors.text }]}>{t('bible.auto_hide_nav') || 'Auto-hide Navigation'}</Text>
                        </View>
                        <Switch
                            value={autoHideHeader}
                            onValueChange={onToggleAutoHide}
                            trackColor={{ false: '#767577', true: colors.primary }}
                            thumbColor={Platform.OS === 'android' ? '#f4f3f4' : ''}
                        />
                    </View>

                    {/* Bookmarks Link */}
                    <TouchableOpacity
                        style={[styles.settingsLinkItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => {
                            onClose();
                            setTimeout(onOpenBookmarks, 300);
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="bookmark" size={22} color={colors.primary} style={{ marginRight: 12 }} />
                            <Text style={[styles.settingsLinkText, { color: colors.text }]}>{t('bible.bookmarks')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Versions Section */}
                    <Text style={[styles.settingsHeader, { color: colors.textSecondary, marginTop: 24, marginBottom: 8 }]}>{t('bible.version') || 'Version'}</Text>
                    <View style={[styles.settingsSection, { backgroundColor: colors.card, borderColor: colors.border, paddingVertical: 0 }]}>
                        {bibleVersions.map((v, index) => (
                            <TouchableOpacity
                                key={v.id}
                                style={[
                                    styles.pickerItem,
                                    {
                                        borderBottomColor: colors.border,
                                        backgroundColor: selectedVersion === v.id
                                            ? (isDark ? 'rgba(255,255,255,0.05)' : colors.primary + '08')
                                            : 'transparent',
                                    },
                                    index === bibleVersions.length - 1 && { borderBottomWidth: 0 }
                                ]}
                                onPress={() => {
                                    onSelectVersion(v.id);
                                }}
                            >
                                <View style={styles.pickerItemContent}>
                                    <Text style={[
                                        styles.pickerItemText,
                                        { color: colors.text },
                                        selectedVersion === v.id && { color: colors.primary, fontWeight: '600' }
                                    ]}>
                                        {t(`bible.versions.${v.id}`) || v.name}
                                    </Text>
                                    {selectedVersion === v.id && (
                                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                </ScrollView>
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
    settingsSection: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
        padding: 16,
        overflow: 'hidden',
    },
    settingsSectionTitle: {
        fontSize: 14,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    zoomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    zoomBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    zoomValue: {
        fontSize: 20,
        fontWeight: '600',
    },
    settingsLinkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    settingsLinkText: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingsHeader: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    pickerItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    pickerItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pickerItemText: {
        fontSize: 16,
    },
});
