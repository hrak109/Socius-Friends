import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { UserProfileProvider, useUserProfile } from '../UserProfileContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../AuthContext';
import api from '../../services/api';

// Mocks
jest.mock('../../services/api');
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

describe('UserProfileContext', () => {
    // Mock Auth Wrapper
    const wrapper = ({ children }: { children: React.ReactNode }, sessionVal: string | null = 'valid-token') => (
        <AuthContext.Provider value={{ session: sessionVal, isLoading: false, user: null, signIn: jest.fn(), signOut: jest.fn() }}>
            <UserProfileProvider>
                {children}
            </UserProfileProvider>
        </AuthContext.Provider>
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should clear state on logout (session null)', async () => {
        // Wrapper with null session
        const { result } = renderHook(() => useUserProfile(), {
            wrapper: (props) => wrapper(props, null)
        });

        await waitFor(() => {
            expect(result.current.username).toBeNull();
            expect(result.current.displayName).toBeNull();
        });
    });

    it('should remove ghost username if api returns null', async () => {
        // Setup: API returns user with NO username
        (api.get as jest.Mock).mockResolvedValue({
            data: {
                username: null,
                display_name: 'Test Name',
                custom_avatar_url: 'avatar-1'
            }
        });

        const { result } = renderHook(() => useUserProfile(), {
            wrapper: (props) => wrapper(props, 'token')
        });

        await waitFor(() => {
            expect(result.current.displayName).toBe('Test Name');
            // Username should remain null
            expect(result.current.username).toBeNull();
        });

        // CRITICAL: Verify removeItem was called
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user_username');
    });

    it('should save username if api returns value', async () => {
        // Setup: API returns valid username
        (api.get as jest.Mock).mockResolvedValue({
            data: {
                username: 'valid_user',
                display_name: 'Test Name',
                custom_avatar_url: 'avatar-1'
            }
        });

        const { result } = renderHook(() => useUserProfile(), {
            wrapper: (props) => wrapper(props, 'token')
        });

        await waitFor(() => {
            expect(result.current.username).toBe('valid_user');
        });

        // CRITICAL: Verify setItem was called
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('user_username', 'valid_user');
    });
});
