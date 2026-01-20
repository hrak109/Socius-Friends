import * as SecureStore from 'expo-secure-store';
import api from './api';

const TOKEN_KEY = 'session_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const saveToken = async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

export const saveRefreshToken = async (token: string) => {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = async () => {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

export const loginWithGoogle = async (idToken: string) => {
    try {
        const response = await api.post('/auth/google', { id_token: idToken });
        const { access_token, refresh_token } = response.data;
        await saveToken(access_token);
        if (refresh_token) {
            await saveRefreshToken(refresh_token);
        }
        return { access_token, refresh_token };
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
};
