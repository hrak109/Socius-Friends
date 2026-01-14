import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, FlatList, ActivityIndicator, Alert, TextInput, Keyboard, Animated, NativeSyntheticEvent, NativeScrollEvent, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Importing JSON data
import niv from '../constants/bible/niv.json';
import saebunyeok from '../constants/bible/saebunyeok.json';
import gaeyeok from '../constants/bible/gaeyeok.json';

type Book = {
    name: string;
    chapters: string[][];
};

type BibleData = {
    name: string;
    books: Book[];
};

const BIBLE_VERSIONS: Record<string, BibleData> = {
    'NIV': niv as unknown as BibleData,
    '새번역': saebunyeok as unknown as BibleData,
    '개역개정': gaeyeok as unknown as BibleData,
};

const VERSIONS = [
    { id: 'NIV', name: 'English NIV' },
    { id: '새번역', name: '새번역' },
    { id: '개역개정', name: '개역개정' },
];

export default function BibleScreen() {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const { t, language } = useLanguage();
    const insets = useSafeAreaInsets();

    // State
    const [selectedVersion, setSelectedVersion] = useState('개역개정');
    const [selectedBookIndex, setSelectedBookIndex] = useState<number>(0);
    const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
    const [highlights, setHighlights] = useState<number[]>([]);
    const [isActionModalVisible, setIsActionModalVisible] = useState(false);

    // UI State
    const [isVersionPickerVisible, setIsVersionPickerVisible] = useState(false);
    const [isNavVisible, setIsNavVisible] = useState(false);
    const [navMode, setNavMode] = useState<'book' | 'chapter'>('book');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchText, setSearchText] = useState('');

    // Header auto-hide on scroll
    const scrollY = useRef(new Animated.Value(0)).current;
    const lastScrollY = useRef(0);
    const headerTranslateY = useRef(new Animated.Value(0)).current;
    const HEADER_HEIGHT = 60 + insets.top; // Include safe area inset

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const diff = currentScrollY - lastScrollY.current;

        if (suggestions.length > 0) {
            // Keep header visible when suggestions are shown
            Animated.timing(headerTranslateY, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
            return;
        }

        if (currentScrollY <= 0) {
            // At top - always show header
            Animated.timing(headerTranslateY, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else if (diff > 0 && currentScrollY > HEADER_HEIGHT) {
            // Scrolling down - hide header (fully including safe area)
            Animated.timing(headerTranslateY, {
                toValue: -HEADER_HEIGHT,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else if (diff < -10) {
            // Scrolling up - show header
            Animated.timing(headerTranslateY, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }

        lastScrollY.current = currentScrollY;
    };
    const currentBible = BIBLE_VERSIONS[selectedVersion];

    // Generate suggestions based on search text
    type Suggestion = {
        type: 'book' | 'chapter';
        bookIndex: number;
        bookName: string;
        chapter?: number;
        display: string;
    };

    const suggestions = useMemo((): Suggestion[] => {
        if (!searchText.trim() || !currentBible?.books) return [];

        const query = searchText.trim().toLowerCase();
        const results: Suggestion[] = [];

        // Find matching books
        currentBible.books.forEach((book, bookIndex) => {
            const bookName = book.name.toLowerCase();
            if (bookName.startsWith(query) || bookName.includes(query)) {
                // Add book suggestion
                results.push({
                    type: 'book',
                    bookIndex,
                    bookName: book.name,
                    display: book.name
                });

                // Add first few chapters
                const chaptersToShow = Math.min(3, book.chapters?.length || 0);
                for (let i = 0; i < chaptersToShow; i++) {
                    results.push({
                        type: 'chapter',
                        bookIndex,
                        bookName: book.name,
                        chapter: i,
                        display: language === 'ko'
                            ? `${book.name} ${i + 1}장`
                            : `${book.name} ${i + 1}`
                    });
                }
            }
        });

        // Also try to parse "Book Chapter" format
        const bookChapterMatch = query.match(/^(.+?)\s+(\d+)$/i);
        if (bookChapterMatch) {
            const bookQuery = bookChapterMatch[1];
            const chapterNum = parseInt(bookChapterMatch[2]);

            currentBible.books.forEach((book, bookIndex) => {
                const bookName = book.name.toLowerCase();
                if (bookName.startsWith(bookQuery) || bookName.includes(bookQuery)) {
                    const maxChapter = book.chapters?.length || 0;
                    if (chapterNum >= 1 && chapterNum <= maxChapter) {
                        // Check if not already in results
                        const exists = results.some(r => r.bookIndex === bookIndex && r.chapter === chapterNum - 1);
                        if (!exists) {
                            results.unshift({
                                type: 'chapter',
                                bookIndex,
                                bookName: book.name,
                                chapter: chapterNum - 1,
                                display: language === 'ko'
                                    ? `${book.name} ${chapterNum}장`
                                    : `${book.name} ${chapterNum}`
                            });
                        }
                    }
                }
            });
        }

        return results.slice(0, 6); // Limit to 6 suggestions
    }, [searchText, currentBible, language]);

    const selectSuggestion = (suggestion: Suggestion) => {
        Keyboard.dismiss();
        setSelectedBookIndex(suggestion.bookIndex);
        if (suggestion.chapter !== undefined) {
            setSelectedChapterIndex(suggestion.chapter);
        } else {
            setSelectedChapterIndex(0);
        }
        setSearchText('');
    };

    // Parse search query like "Genesis 1:5" or "창세기 1:5" or "Gen 1" or just "1:5"
    const handleSearch = (query: string) => {
        if (!query.trim() || !currentBible?.books) return;

        // Try to parse patterns like "Book Chapter:Verse" or "Book Chapter"
        // Examples: "Genesis 1:5", "창세기 1", "Gen 3:16", "1:5" (current book)
        const trimmed = query.trim();

        // Pattern: just chapter:verse for current book (e.g., "3:16")
        const chapterVerseMatch = trimmed.match(/^(\d+):(\d+)$/);
        if (chapterVerseMatch) {
            const chapter = parseInt(chapterVerseMatch[1]) - 1;
            const verse = parseInt(chapterVerseMatch[2]) - 1;
            if (currentBook && chapter >= 0 && chapter < currentBook.chapters.length) {
                setSelectedChapterIndex(chapter);
                setSearchText('');
                setIsSearchVisible(false);
                // Optionally scroll to verse - for now just navigate to chapter
                return;
            }
        }

        // Pattern: just chapter for current book (e.g., "3")
        const justChapterMatch = trimmed.match(/^(\d+)$/);
        if (justChapterMatch) {
            const chapter = parseInt(justChapterMatch[1]) - 1;
            if (currentBook && chapter >= 0 && chapter < currentBook.chapters.length) {
                setSelectedChapterIndex(chapter);
                setSearchText('');
                setIsSearchVisible(false);
                return;
            }
        }

        // Pattern: Book name + chapter (+ optional verse)
        // Try to find book by partial match
        const bookMatch = trimmed.match(/^(.+?)\s+(\d+)(?::(\d+))?$/i);
        if (bookMatch) {
            const bookName = bookMatch[1].toLowerCase();
            const chapter = parseInt(bookMatch[2]) - 1;

            // Find book by partial name match
            const bookIndex = currentBible.books.findIndex(b =>
                b.name.toLowerCase().startsWith(bookName) ||
                b.name.toLowerCase().includes(bookName)
            );

            if (bookIndex >= 0) {
                const book = currentBible.books[bookIndex];
                if (chapter >= 0 && chapter < book.chapters.length) {
                    setSelectedBookIndex(bookIndex);
                    setSelectedChapterIndex(chapter);
                    setSearchText('');
                    setIsSearchVisible(false);
                    return;
                }
            }
        }

        // If no match found, try just book name
        const bookOnlyMatch = currentBible.books.findIndex(b =>
            b.name.toLowerCase().startsWith(trimmed.toLowerCase()) ||
            b.name.toLowerCase().includes(trimmed.toLowerCase())
        );
        if (bookOnlyMatch >= 0) {
            setSelectedBookIndex(bookOnlyMatch);
            setSelectedChapterIndex(0);
            setSearchText('');
            setIsSearchVisible(false);
            return;
        }

        // No match - could show alert but for now just clear
        Alert.alert(t('common.error'), t('bible.search_not_found') || 'Book not found');
    };

    // Persistence Logic
    useEffect(() => {
        loadProgress();
    }, []);

    useEffect(() => {
        if (!isLoading) {
            saveProgress();
            loadHighlights();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVersion, selectedBookIndex, selectedChapterIndex]);

    // Clear selection when changing chapters
    useEffect(() => {
        setSelectedVerse(null);
        setIsActionModalVisible(false);
    }, [selectedVersion, selectedBookIndex, selectedChapterIndex]);

    const loadProgress = async () => {
        try {
            setIsLoading(true);
            const savedVersion = await AsyncStorage.getItem('bible_version');
            const savedBook = await AsyncStorage.getItem('bible_book');
            const savedChapter = await AsyncStorage.getItem('bible_chapter');

            if (savedVersion) setSelectedVersion(savedVersion);
            if (savedBook) setSelectedBookIndex(parseInt(savedBook));
            if (savedChapter) setSelectedChapterIndex(parseInt(savedChapter));
        } catch (error) {
            console.error('Failed to load bible progress', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveProgress = async () => {
        try {
            await AsyncStorage.setItem('bible_version', selectedVersion);
            await AsyncStorage.setItem('bible_book', selectedBookIndex.toString());
            await AsyncStorage.setItem('bible_chapter', selectedChapterIndex.toString());
        } catch (error) {
            console.error('Failed to save bible progress', error);
        }
    };

    const loadHighlights = async () => {
        try {
            const key = `highlights_${selectedVersion}_${selectedBookIndex}_${selectedChapterIndex}`;
            const saved = await AsyncStorage.getItem(key);
            if (saved) {
                setHighlights(JSON.parse(saved));
            } else {
                setHighlights([]);
            }
        } catch (error) {
            console.error('Failed to load highlights', error);
        }
    };

    const toggleHighlight = async () => {
        if (selectedVerse === null) return;

        let newHighlights;
        if (highlights.includes(selectedVerse)) {
            newHighlights = highlights.filter(h => h !== selectedVerse);
        } else {
            newHighlights = [...highlights, selectedVerse];
        }

        setHighlights(newHighlights);

        try {
            const key = `highlights_${selectedVersion}_${selectedBookIndex}_${selectedChapterIndex}`;
            await AsyncStorage.setItem(key, JSON.stringify(newHighlights));
        } catch (error) {
            console.error('Failed to save highlights', error);
        }
        setIsActionModalVisible(false);
        setSelectedVerse(null);
    };

    const handleCopy = async () => {
        if (selectedVerse === null || !currentChapter[selectedVerse]) return;
        const text = `${currentBook?.name} ${selectedChapterIndex + 1}:${selectedVerse + 1} - ${currentChapter[selectedVerse]}`;
        await Clipboard.setStringAsync(text);
        setIsActionModalVisible(false);
        setSelectedVerse(null);
        Alert.alert(t('common.success'), t('bible.copy_success') || 'Copied to clipboard');
    };

    // Derived State
    const validBookIndex = selectedBookIndex < (currentBible?.books?.length || 0) ? selectedBookIndex : 0;
    const currentBook = currentBible?.books?.[validBookIndex];
    const validChapterIndex = currentBook && selectedChapterIndex < (currentBook.chapters?.length || 0) ? selectedChapterIndex : 0;
    const currentChapter = currentBook?.chapters?.[validChapterIndex] || [];
    const hasValidData = currentBible && currentBook && Array.isArray(currentBook.chapters);


    // Auto-correct invalid state (e.g. after version change or bad load)
    useEffect(() => {
        if (selectedBookIndex !== validBookIndex) {
            setSelectedBookIndex(validBookIndex);
        }
        if (selectedChapterIndex !== validChapterIndex) {
            setSelectedChapterIndex(validChapterIndex);
        }
    }, [selectedBookIndex, validBookIndex, selectedChapterIndex, validChapterIndex]);

    const handleNextChapter = () => {
        if (!currentBook?.chapters || !currentBible?.books) return;

        if (validChapterIndex < currentBook.chapters.length - 1) {
            setSelectedChapterIndex(validChapterIndex + 1);
        } else if (validBookIndex < currentBible.books.length - 1) {
            setSelectedBookIndex(validBookIndex + 1);
            setSelectedChapterIndex(0);
        }
    };

    const handlePrevChapter = () => {
        if (validChapterIndex > 0) {
            setSelectedChapterIndex(validChapterIndex - 1);
        } else if (validBookIndex > 0) {
            const prevBookIndex = validBookIndex - 1;
            const prevBook = currentBible.books?.[prevBookIndex];
            if (prevBook?.chapters) {
                setSelectedBookIndex(prevBookIndex);
                setSelectedChapterIndex(prevBook.chapters.length - 1);
            }
        }
    };

    const renderNavModal = () => {
        if (!currentBible || !currentBible.books || !Array.isArray(currentBible.books)) {
            return null;
        }

        const bookForModal = currentBook;
        const chaptersData = bookForModal?.chapters;
        const hasValidChapters = chaptersData && Array.isArray(chaptersData) && chaptersData.length > 0;

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={isNavVisible}
                onRequestClose={() => setIsNavVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <TouchableOpacity onPress={() => setNavMode('book')}>
                                <Text style={[styles.modalTab, { color: colors.textSecondary }, navMode === 'book' && { color: colors.primary, fontWeight: 'bold' }]}>{t('bible.books')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setNavMode('chapter')}>
                                <Text style={[styles.modalTab, { color: colors.textSecondary }, navMode === 'chapter' && { color: colors.primary, fontWeight: 'bold' }]}>{t('bible.chapters')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setIsNavVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {navMode === 'book' ? (
                            <FlatList
                                key="books-list"
                                data={currentBible.books}
                                keyExtractor={(item, index) => `book-${index}`}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        style={[styles.navItem, { borderBottomColor: colors.border }]}
                                        onPress={() => {
                                            setSelectedBookIndex(index);
                                            setSelectedChapterIndex(0);
                                            setNavMode('chapter');
                                        }}
                                    >
                                        <Text style={[styles.navItemText, { color: colors.text }, selectedBookIndex === index && { color: colors.primary, fontWeight: 'bold' }]}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        ) : (
                            hasValidChapters ? (
                                <FlatList
                                    key="chapters-list"
                                    data={chaptersData}
                                    numColumns={5}
                                    keyExtractor={(item, index) => `chapter-${index}`}
                                    renderItem={({ index }) => (
                                        <TouchableOpacity
                                            style={[styles.chapterBox, { backgroundColor: colors.inputBackground }]}
                                            onPress={() => {
                                                setSelectedChapterIndex(index);
                                                setIsNavVisible(false);
                                            }}
                                        >
                                            <Text style={[styles.chapterBoxText, { color: colors.text }, selectedChapterIndex === index && { color: colors.primary, fontWeight: 'bold' }]}>
                                                {index + 1}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            ) : (
                                <View style={styles.emptyStateContainer}>
                                    <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
                                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>{t('bible.no_chapters')}</Text>
                                    <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>{t('bible.select_book_first')}</Text>
                                </View>
                            )
                        )}
                    </View>
                </View>
            </Modal>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: t('bible.title'), headerBackTitle: t('common.back') }} />

            {/* Animated Header that hides on scroll */}
            <Animated.View style={[
                styles.animatedHeaderContainer,
                { transform: [{ translateY: headerTranslateY }], backgroundColor: colors.background, paddingTop: insets.top }
            ]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    {/* Left back button balancing version selector */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"} size={28} color={colors.text} />
                    </TouchableOpacity>

                    <View style={[styles.searchBarContainer, {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'
                    }]}>
                        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchBarInput, { color: colors.text }]}
                            placeholder=""
                            placeholderTextColor={colors.textSecondary}
                            value={searchText}
                            onChangeText={setSearchText}
                            onSubmitEditing={() => handleSearch(searchText)}
                            returnKeyType="go"
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchText('')} style={styles.searchClearBtn}>
                                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity style={styles.versionSelector} onPress={() => setIsVersionPickerVisible(!isVersionPickerVisible)}>
                        <Text style={[styles.versionText, { color: colors.primary }]}>{selectedVersion}</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
                <View style={[
                    styles.suggestionsContainer,
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        top: 60 + insets.top,
                    }
                ]}>
                    {suggestions.map((suggestion, index) => (
                        <TouchableOpacity
                            key={`${suggestion.bookIndex}-${suggestion.chapter ?? 'book'}-${index}`}
                            style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                            onPress={() => selectSuggestion(suggestion)}
                        >
                            <Ionicons
                                name={suggestion.type === 'book' ? 'book-outline' : 'document-text-outline'}
                                size={18}
                                color={colors.textSecondary}
                                style={styles.suggestionIcon}
                            />
                            <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion.display}</Text>
                            {suggestion.type === 'chapter' && (
                                <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}


            {isVersionPickerVisible && (
                <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    {VERSIONS.map((v) => (
                        <TouchableOpacity
                            key={v.id}
                            style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                            onPress={() => {
                                setSelectedVersion(v.id);
                                setIsVersionPickerVisible(false);
                            }}
                        >
                            <Text style={[styles.pickerItemText, { color: colors.text }, selectedVersion === v.id && { color: colors.primary, fontWeight: 'bold' }]}>
                                {v.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {hasValidData ? (
                <ScrollView
                    contentContainerStyle={[styles.content, { paddingTop: 60 + insets.top }]}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                >
                    <Text style={[styles.chapterTitle, { color: colors.text }]}>{currentBook?.name} {(validChapterIndex || 0) + 1}</Text>
                    {currentChapter.map((verse, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[
                                styles.verseContainer,
                                highlights.includes(idx) && { backgroundColor: isDark ? 'rgba(255, 255, 0, 0.2)' : 'rgba(255, 255, 0, 0.3)', padding: 5, borderRadius: 5 }
                            ]}
                            onPress={() => {
                                setSelectedVerse(idx);
                                setIsActionModalVisible(true);
                            }}
                        >
                            <Text style={[styles.verseNumber, { color: colors.textSecondary }]}>{idx + 1}</Text>
                            <Text style={[styles.bibleText, { color: colors.text }]}>{verse || ''}</Text>
                        </TouchableOpacity>
                    ))}
                    <View style={{ height: 100 }} />
                </ScrollView>
            ) : (
                <View style={styles.content}>
                    <Text style={{ textAlign: 'center', marginTop: 50, color: colors.textSecondary }}>{t('bible.loading')}</Text>
                </View>
            )}

            {/* Floating Navigation Controls - iOS 26 Glassy Design */}
            {hasValidData && (
                <View style={styles.floatingNavContainer}>
                    <View style={[styles.glassyNavWrapper, { backgroundColor: isDark ? 'rgba(60, 60, 60, 0.3)' : 'rgba(255, 255, 255, 0.3)' }]}>
                        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blurContainerExpanded}>
                            <TouchableOpacity onPress={handlePrevChapter} style={styles.navButton}>
                                <Ionicons name="chevron-back" size={22} color={isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'} />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setIsNavVisible(true)} style={styles.floatingNavCenter}>
                                <Text style={[styles.floatingBookName, { color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)' }]} numberOfLines={1}>
                                    {currentBook?.name}
                                </Text>
                                <Text style={[styles.floatingChapter, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>
                                    {language === 'ko'
                                        ? `${selectedChapterIndex + 1}${t('bible.chapter')}`
                                        : `${t('bible.chapter')} ${selectedChapterIndex + 1}`}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleNextChapter} style={styles.navButton}>
                                <Ionicons name="chevron-forward" size={22} color={isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'} />
                            </TouchableOpacity>
                        </BlurView>
                    </View>
                </View>
            )}

            {renderNavModal()}

            {/* Action Modal */}
            <Modal
                transparent={true}
                visible={isActionModalVisible}
                onRequestClose={() => setIsActionModalVisible(false)}
                animationType="fade"
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsActionModalVisible(false)}
                >
                    <View style={[styles.actionSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TouchableOpacity style={styles.actionItem} onPress={handleCopy}>
                            <Ionicons name="copy-outline" size={24} color={colors.text} />
                            <Text style={[styles.actionText, { color: colors.text }]}>{t('bible.copy')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionItem} onPress={toggleHighlight}>
                            <Ionicons
                                name={selectedVerse !== null && highlights.includes(selectedVerse) ? "color-wand" : "color-wand-outline"}
                                size={24}
                                color={colors.text}
                            />
                            <Text style={[styles.actionText, { color: colors.text }]}>
                                {selectedVerse !== null && highlights.includes(selectedVerse) ? t('bible.unhighlight') : t('bible.highlight')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    actionSheet: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        borderRadius: 15,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    actionItem: {
        alignItems: 'center',
        gap: 5,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        gap: 12,
    },
    animatedHeaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    navSelector: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
        borderWidth: 1,
    },
    navText: {
        fontWeight: '600',
    },
    versionSelector: {
        padding: 5,
        minWidth: 50,
    },
    backButton: {
        padding: 5,
        minWidth: 50,
        justifyContent: 'center',
    },
    versionText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    pickerContainer: {
        borderBottomWidth: 1,
        elevation: 3,
        zIndex: 10,
    },
    pickerItem: {
        padding: 15,
        borderBottomWidth: 1,
    },
    pickerItemText: {
        fontSize: 16,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 10,
    },
    chapterTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    verseContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    verseNumber: {
        fontSize: 12,
        width: 25,
        paddingTop: 4,
        fontWeight: 'bold',
    },
    bibleText: {
        flex: 1,
        fontSize: 18,
        lineHeight: 28,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '70%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        paddingBottom: 10,
    },
    modalTab: {
        fontSize: 18,
        marginRight: 20,
    },
    closeBtn: {
        marginLeft: 'auto',
    },
    navItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    navItemText: {
        fontSize: 16,
    },
    chapterBox: {
        width: '18%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        margin: '1%',
        borderRadius: 8,
    },
    chapterBoxText: {
        fontSize: 16,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        marginTop: 12,
        fontWeight: '500',
    },
    emptyStateSubtext: {
        fontSize: 14,
        marginTop: 4,
    },
    floatingNavContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    blurContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 25,
        overflow: 'hidden',
        minWidth: 140,
        justifyContent: 'space-between',
    },
    navButton: {
        padding: 6,
    },
    chapterIndicator: {
        fontSize: 15,
        fontWeight: '700',
        marginHorizontal: 8,
        letterSpacing: 0.3,
    },
    glassyNavWrapper: {
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    chapterTouchable: {
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        fontSize: 16,
    },
    searchCloseBtn: {
        padding: 8,
        marginLeft: 8,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchBtn: {
        padding: 5,
    },
    searchBarContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 25,
        paddingHorizontal: 16,
        height: 44,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchBarInput: {
        flex: 1,
        paddingVertical: 0,
        fontSize: 16,
    },
    searchClearBtn: {
        padding: 4,
    },
    quickNavBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        gap: 8,
    },
    quickNavText: {
        fontSize: 16,
        fontWeight: '600',
    },
    quickNavChapter: {
        fontSize: 14,
        fontWeight: '500',
    },
    blurContainerExpanded: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 28,
        overflow: 'hidden',
        minWidth: 200,
        justifyContent: 'space-between',
    },
    floatingNavCenter: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 8,
    },
    floatingBookName: {
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
        maxWidth: 150,
    },
    floatingChapter: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    suggestionsContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 90,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
    },
    suggestionIcon: {
        marginRight: 12,
    },
    suggestionText: {
        flex: 1,
        fontSize: 15,
    },
});
