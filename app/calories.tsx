import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert, ActivityIndicator, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import AppSpecificChatHead from '@/components/features/chat/AppSpecificChatHead';
import { useCalories, CalorieEntry } from '../hooks/useCalories';
import dayjs from 'dayjs';

function JSDatePicker({ value, onChange, onClose, colors, isDark }: { value: Date, onChange: (date: Date) => void, onClose: () => void, colors: any, isDark: boolean }) {
    const { t } = useLanguage();
    const d = dayjs(value);

    const update = (unit: 'day' | 'month' | 'year', amount: number) => {
        onChange(d.add(amount, unit).toDate());
    };

    return (
        <View style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            borderRadius: 16,
            padding: 16,
            marginTop: 8,
            marginBottom: 16
        }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => update('year', 1)}><Ionicons name="chevron-up" size={24} color={colors.primary} /></TouchableOpacity>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginVertical: 8 }}>{d.year()}</Text>
                    <TouchableOpacity onPress={() => update('year', -1)}><Ionicons name="chevron-down" size={24} color={colors.primary} /></TouchableOpacity>
                    <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{t('common.year') || 'Year'}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => update('month', 1)}><Ionicons name="chevron-up" size={24} color={colors.primary} /></TouchableOpacity>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginVertical: 8 }}>
                        {t(`common.months.${['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][d.month()]}`)}
                    </Text>
                    <TouchableOpacity onPress={() => update('month', -1)}><Ionicons name="chevron-down" size={24} color={colors.primary} /></TouchableOpacity>
                    <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{t('common.month') || 'Month'}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => update('day', 1)}><Ionicons name="chevron-up" size={24} color={colors.primary} /></TouchableOpacity>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginVertical: 8 }}>{d.date()}</Text>
                    <TouchableOpacity onPress={() => update('day', -1)}><Ionicons name="chevron-down" size={24} color={colors.primary} /></TouchableOpacity>
                    <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{t('common.day') || 'Day'}</Text>
                </View>
            </View>
            <TouchableOpacity
                onPress={onClose}
                style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 10, marginTop: 16, alignItems: 'center' }}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('common.set_date') || 'Set Date'}</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function CaloriesScreen() {
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();

    // Use Shared Hook
    const { entries, loading, addEntry, updateEntry, deleteEntry } = useCalories();

    const [modalVisible, setModalVisible] = useState(false);

    // Form state
    const [editingEntry, setEditingEntry] = useState<CalorieEntry | null>(null);
    const [food, setFood] = useState('');
    const [calories, setCalories] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleAddEntry = async () => {
        if (!food.trim() || !calories.trim()) {
            return;
        }

        const calNum = parseInt(calories, 10);
        if (isNaN(calNum)) {
            Alert.alert(t('common.error'), 'Invalid calories number');
            return;
        }

        try {
            if (editingEntry) {
                // Pass updated date along with food and calories
                const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
                await updateEntry(editingEntry.id, food.trim(), calNum, dateStr);
            } else {
                const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
                await addEntry(food.trim(), calNum, dateStr);
            }
            // Reset and close
            setFood('');
            setCalories('');
            setSelectedDate(new Date());
            setEditingEntry(null);
            setModalVisible(false);
        } catch {
            Alert.alert(t('common.error'), 'Failed to save entry');
        }
    };

    const handleEdit = (entry: CalorieEntry) => {
        setEditingEntry(entry);
        setFood(entry.food);
        setCalories(entry.calories.toString());
        // Parse the entry's date in local time to avoid timezone offset issues
        setSelectedDate(dayjs(entry.date).toDate());
        setModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            t('calories.delete'),
            t('calories.delete_confirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.confirm'),
                    style: 'destructive',
                    onPress: () => deleteEntry(id)
                }
            ]
        );
    };

    // Stats
    const stats = useMemo(() => {
        const todayStr = dayjs().format('YYYY-MM-DD');
        const todayEntries = entries.filter(e => e.date === todayStr);
        const todayTotal = todayEntries.reduce((sum, e) => sum + e.calories, 0);

        // Daily Average
        // Get unique dates
        const dates = new Set(entries.map(e => e.date));
        // Add today if not present
        dates.add(todayStr);

        const totalAll = entries.reduce((sum, e) => sum + e.calories, 0);
        const average = dates.size > 0 ? Math.round(totalAll / dates.size) : 0;

        return { todayTotal, average };
    }, [entries]);

    const renderItem = ({ item, index }: { item: CalorieEntry, index: number }) => {
        const prevItem = entries[index - 1];
        const showDateHeader = !prevItem || prevItem.date !== item.date;
        const isToday = item.date === dayjs().format('YYYY-MM-DD');

        return (
            <View>
                {showDateHeader && (
                    <View style={[styles.dateHeader, { backgroundColor: isToday ? colors.primary + '20' : colors.card }]}>
                        <Text style={[styles.dateHeaderText, { color: isToday ? colors.primary : colors.textSecondary }]}>
                            {isToday ? t('common.today') : item.date}
                        </Text>
                        <Text style={[styles.dateHeaderTotal, { color: colors.primary }]}>
                            {entries.filter(e => e.date === item.date).reduce((sum, e) => sum + e.calories, 0)} kcal
                        </Text>
                    </View>
                )}
                <TouchableOpacity
                    style={[styles.entryItem, { backgroundColor: colors.card }]}
                    onPress={() => handleEdit(item)}
                    onLongPress={() => handleDelete(item.id)}
                >
                    <View style={styles.entryIcon}>
                        <Ionicons name="fast-food-outline" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.entryInfo}>
                        <Text style={[styles.entryFood, { color: colors.text }]}>{item.food}</Text>
                        <Text style={[styles.entryTime, { color: colors.textSecondary }]}>
                            {dayjs(item.timestamp).format('h:mm A')}
                        </Text>
                    </View>
                    <Text style={[styles.entryCalories, { color: colors.primary }]}>
                        {item.calories} kcal
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: t('calories.title'),
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerTitleStyle: { color: colors.text, fontWeight: '600' },
                    headerTintColor: colors.primary,
                    headerRight: () => (
                        <TouchableOpacity onPress={() => setModalVisible(true)} style={{ paddingRight: 8 }}>
                            <Ionicons name="add-circle" size={28} color={colors.primary} />
                        </TouchableOpacity>
                    ),
                }}
            />

            {/* Stats Card */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('calories.today')}</Text>
                    <Text style={[styles.statValue, { color: colors.primary }]}>{stats.todayTotal}</Text>
                    <Text style={[styles.statUnit, { color: colors.textSecondary }]}>kcal</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('calories.average')}</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.average}</Text>
                    <Text style={[styles.statUnit, { color: colors.textSecondary }]}>kcal/day</Text>
                </View>
            </View>

            {/* List */}
            {entries.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="fast-food-outline" size={64} color={colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('calories.no_entries')}</Text>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.primary }]}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.addButtonText}>{t('calories.add_entry')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={entries}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}


            {/* Add Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false);
                    setEditingEntry(null);
                    setFood('');
                    setCalories('');
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                    keyboardVerticalOffset={0}
                >
                    <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                        <View style={styles.modalBackdrop} />
                    </TouchableWithoutFeedback>

                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {editingEntry ? t('calories.edit_entry') : t('calories.add_entry')}
                            </Text>
                            <TouchableOpacity onPress={() => {
                                setModalVisible(false);
                                setEditingEntry(null);
                                setFood('');
                                setCalories('');
                            }}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: colors.text }]}>{t('calories.food_name')}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                            placeholder={t('calories.placeholder_name')}
                            placeholderTextColor={colors.textSecondary}
                            value={food}
                            onChangeText={setFood}
                            autoFocus
                        />

                        <Text style={[styles.inputLabel, { color: colors.text }]}>{t('common.date') || 'Date'}</Text>
                        {Platform.OS === 'ios' ? (
                            <View>
                                <TouchableOpacity
                                    style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, justifyContent: 'center' }]}
                                    onPress={() => setShowDatePicker(!showDatePicker)}
                                >
                                    <Text style={{ color: colors.text, fontSize: 16 }}>
                                        {selectedDate.toLocaleDateString()}
                                    </Text>
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <JSDatePicker
                                        value={selectedDate}
                                        onChange={setSelectedDate}
                                        onClose={() => setShowDatePicker(false)}
                                        colors={colors}
                                        isDark={isDark}
                                    />
                                )}
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, justifyContent: 'center' }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={{ color: colors.text, fontSize: 16 }}>
                                        {selectedDate.toLocaleDateString()}
                                    </Text>
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={selectedDate}
                                        mode="date"
                                        display="default"
                                        onChange={(event, date) => {
                                            setShowDatePicker(false);
                                            if (date) setSelectedDate(date);
                                        }}
                                    />
                                )}
                            </>
                        )}

                        <Text style={[styles.inputLabel, { color: colors.text }]}>{t('calories.calories')}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                            placeholder={t('calories.placeholder_calories')}
                            placeholderTextColor={colors.textSecondary}
                            value={calories}
                            onChangeText={setCalories}
                            keyboardType="number-pad"
                        />

                        <TouchableOpacity
                            style={[styles.modalAddButton, { backgroundColor: colors.primary }]}
                            onPress={handleAddEntry}
                        >
                            <Text style={styles.modalAddButtonText}>
                                {editingEntry ? t('calories.update') : t('common.add')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <AppSpecificChatHead roleType="cal_tracker" appContext="calories" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    statsContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 15,
    },
    statCard: {
        flex: 1,
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statLabel: { fontSize: 14, marginBottom: 5 },
    statValue: { fontSize: 28, fontWeight: 'bold' },
    statUnit: { fontSize: 12 },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    dateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 15,
        marginBottom: 5,
    },
    dateHeaderText: { fontSize: 14, fontWeight: '700' },
    dateHeaderTotal: { fontSize: 14, fontWeight: 'bold' },
    entryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
    },
    entryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    entryInfo: { flex: 1 },
    entryFood: { fontSize: 16, fontWeight: '600' },
    entryTime: { fontSize: 12, marginTop: 2 },
    entryCalories: { fontSize: 16, fontWeight: '700' },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 50,
    },
    emptyText: { marginTop: 15, fontSize: 16 },
    addButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
    },
    addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 25 : 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    inputLabel: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
    input: {
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    modalAddButton: {
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    modalAddButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
