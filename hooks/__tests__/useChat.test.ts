import { renderHook, act } from '@testing-library/react-native';
import { useChat } from '../useChat';
import api from '@/services/api';
import * as ChatCache from '@/services/ChatCache';

// Mock dependencies
jest.mock('expo-router', () => ({
    useFocusEffect: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
    useAuth: () => ({ user: { name: 'Test User', photo: 'http://google.com/photo.jpg' } }),
}));

jest.mock('@/context/NotificationContext', () => ({
    useNotifications: () => ({
        refreshNotifications: jest.fn(),
        lastMessage: null,
        lastDM: null,
        lastNotificationTime: 0,
        setTyping: jest.fn(),
        typingThreads: new Set(),
    }),
}));

jest.mock('@/context/UserProfileContext', () => ({
    useUserProfile: jest.fn(() => ({ displayName: 'Test Display Name', displayAvatar: null })),
}));

jest.mock('@/context/LanguageContext', () => ({
    useLanguage: () => ({ t: (key: string) => key, language: 'en' }),
}));

jest.mock('@/services/api', () => ({
    get: jest.fn(),
    post: jest.fn(),
}));

jest.mock('@/services/ChatCache', () => ({
    getCachedMessages: jest.fn(() => Promise.resolve([])),
    cacheMessages: jest.fn(() => Promise.resolve()),
}));

describe('useChat hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with default values', () => {
        const { result } = renderHook(() => useChat({ topic: 'global' }));

        expect(result.current.messages).toEqual([]);
        expect(result.current.text).toBe('');
        expect(result.current.isTyping).toBe(false);
    });

    it('resolves google photo for currentUser', () => {
        const { result } = renderHook(() => useChat({ topic: 'global' }));
        // Falls back to user.photo because displayAvatar is null
        expect(result.current.currentUser.avatar).toEqual({ uri: 'http://google.com/photo.jpg' });
    });

    it('resolves explicit "google" avatar for currentUser', () => {
        const useUserProfile = require('@/context/UserProfileContext').useUserProfile;
        useUserProfile.mockReturnValue({ displayName: 'Test', displayAvatar: 'google' });

        const { result } = renderHook(() => useChat({ topic: 'global' }));
        expect(result.current.currentUser.avatar).toEqual({ uri: 'http://google.com/photo.jpg' });
    });

    it('sets initial message if provided', () => {
        const { result } = renderHook(() => useChat({ topic: 'global', initialMessage: 'Hello' }));
        expect(result.current.text).toBe('Hello');
    });

    it('sends a message via api.post /ask for non-friend chats', async () => {
        const { result } = renderHook(() => useChat({ topic: 'global' }));

        const message = {
            _id: 1,
            text: 'Test question',
            createdAt: new Date(),
            user: { _id: 1 }
        };

        await act(async () => {
            result.current.onSend([message as any]);
        });

        expect(api.post).toHaveBeenCalledWith('/ask', expect.objectContaining({
            q_text: 'Test question',
            topic: 'global'
        }));
    });

    it('sends a DM via api.post /messages for friend chats', async () => {
        const { result } = renderHook(() => useChat({ friendId: 123 }));

        const message = {
            _id: 1,
            text: 'Hello friend',
            createdAt: new Date(),
            user: { _id: 1 }
        };

        await act(async () => {
            result.current.onSend([message as any]);
        });

        expect(api.post).toHaveBeenCalledWith('/messages', expect.objectContaining({
            receiver_id: 123,
            content: 'Hello friend'
        }));
    });
});
