import { renderHook, act } from '@testing-library/react-native';
import { useBible } from '../useBible';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@/context/LanguageContext', () => ({
    useLanguage: () => ({ t: (key: string) => key, language: 'en' }),
}));

jest.mock('@/services/api', () => ({
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ back: jest.fn(), push: mockPush }),
}));

jest.mock('expo-clipboard', () => ({
    setStringAsync: jest.fn(),
}));

jest.mock('expo-blur', () => ({
    BlurView: 'BlurView',
}));

describe('useBible hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        AsyncStorage.clear();
    });

    it('initializes with default autoHideHeader as true', async () => {
        const { result } = renderHook(() => useBible());
        expect(result.current.autoHideHeader).toBe(true);
    });

    it('loads autoHideHeader from AsyncStorage', async () => {
        await AsyncStorage.setItem('bible_auto_hide', 'false');

        const { result } = renderHook(() => useBible());

        // Wait for async initialization
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.autoHideHeader).toBe(false);
    });

    it('toggles and saves autoHideHeader', async () => {
        const { result } = renderHook(() => useBible());

        await act(async () => {
            result.current.setAutoHideHeader(false);
        });

        expect(result.current.autoHideHeader).toBe(false);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('bible_auto_hide', 'false');

        await act(async () => {
            result.current.setAutoHideHeader(true);
        });

        expect(result.current.autoHideHeader).toBe(true);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('bible_auto_hide', 'true');
    });

    it('initializes with default settings', async () => {
        const { result } = renderHook(() => useBible());

        expect(result.current.baseFontSize).toBe(18);
        expect(result.current.selectedVersion).toBe('NIV');
        expect(result.current.selectedBookIndex).toBe(0);
        expect(result.current.selectedChapterIndex).toBe(0);
    });

    it('updates font size and saves to storage', async () => {
        const { result } = renderHook(() => useBible());

        await act(async () => {
            result.current.handleZoom(2);
        });

        expect(result.current.baseFontSize).toBe(20);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('bible_font_size', '20');

        await act(async () => {
            result.current.handleZoom(-4);
        });

        expect(result.current.baseFontSize).toBe(16);
    });
    it('calls handleAskSocius correctly', async () => {
        const setStringAsync = require('expo-clipboard').setStringAsync;
        // Mock api.get for christian friend
        (require('@/services/api').get as jest.Mock).mockResolvedValue({
            data: [{ id: '123', name: 'Jesus', avatar: 'jesus.png', role: 'christian' }]
        });

        const { result } = renderHook(() => useBible());

        // Wait for christian friend load
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Setup state (select verse)
        await act(async () => {
            result.current.setSelectedBookIndex(0);
            result.current.setSelectedChapterIndex(0);
            result.current.setSelectedVerse(0);
            // Mock currentChapter data access implicitly by implementation
        });

        if (result.current.currentChapter) {
            // Need to ensure currentChapter has data. BIBLE_VERSIONS default is mocked/loaded.
            // Assuming default loaded data has "In the beginning..."
        }

        await act(async () => {
            await result.current.handleAskSocius();
        });

        expect(mockPush).toHaveBeenCalledWith({
            pathname: '/chat/[id]',
            params: expect.objectContaining({
                type: 'socius',
                sociusRole: 'christian',
                initialText: expect.stringContaining('In the beginning')
            })
        } as any);
    });
});
