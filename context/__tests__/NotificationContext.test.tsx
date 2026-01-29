import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { NotificationProvider, useNotifications } from '../NotificationContext';
import { AuthContext } from '../AuthContext';

// Mocks
jest.mock('../../services/api');
jest.mock('expo-notifications', () => ({
    setBadgeCountAsync: jest.fn(),
    addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    getLastNotificationResponseAsync: jest.fn().mockResolvedValue(null),
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getDevicePushTokenAsync: jest.fn().mockResolvedValue({ data: 'token' }),
}));

describe('NotificationContext', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={{ session: 'valid', isLoading: false, user: null, signIn: jest.fn(), signOut: jest.fn() }}>
            <NotificationProvider>
                {children}
            </NotificationProvider>
        </AuthContext.Provider>
    );

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('setTyping should start timer if true', () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });

        act(() => {
            result.current.setTyping('thread-1', true);
        });

        expect(result.current.typingThreads.has('thread-1')).toBe(true);
    });

    it('setTyping should NOT reset timer if already typing (Fix for reload bug)', () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });

        // 1. Start typing
        act(() => {
            result.current.setTyping('thread-1', true);
        });

        // 2. Advance time partially (2 minutes)
        act(() => {
            jest.advanceTimersByTime(2 * 60 * 1000);
        });

        expect(result.current.typingThreads.has('thread-1')).toBe(true);

        // 3. Call setTyping(true) AGAIN (simulating reload)
        act(() => {
            result.current.setTyping('thread-1', true);
        });

        // 4. Advance time to finish the FIRST 5 minutes (3 more minutes)
        // If the timer was resettled, it would need 5 more minutes. 
        // If it was preserved, it needs 3 more.
        act(() => {
            jest.advanceTimersByTime(3 * 60 * 1000 + 100);
        });

        // Should be false now because the ORIGINAL timer fired
        expect(result.current.typingThreads.has('thread-1')).toBe(false);
    });

    it('setTyping(false) should clear immediately', () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });

        act(() => {
            result.current.setTyping('thread-1', true);
        });
        expect(result.current.typingThreads.has('thread-1')).toBe(true);

        act(() => {
            result.current.setTyping('thread-1', false);
        });
        expect(result.current.typingThreads.has('thread-1')).toBe(false);
    });
});
