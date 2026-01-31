import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCalories } from '../useCalories';
import api from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@/services/api', () => ({
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

describe('useCalories hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes and loads data from local storage and remote', async () => {
        const mockEntries = [{ id: '1', food: 'Apple', calories: 95, date: '2026-01-01', timestamp: 12345, synced: true }];

        (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
            if (key === 'calories_entries') return Promise.resolve(JSON.stringify(mockEntries));
            return Promise.resolve(null);
        });

        (api.get as jest.Mock).mockImplementation((url) => {
            if (url === '/calories') return Promise.resolve({ data: [{ client_id: '1', food: 'Apple', calories: 95, date: '2026-01-01', timestamp: 12345 }] });
            return Promise.resolve({ data: [] });
        });

        const { result } = renderHook(() => useCalories());

        await act(async () => {
            await Promise.resolve(); // Allow effects to run
        });

        expect(result.current.entries).toEqual(mockEntries);
        expect(result.current.loading).toBe(false);
    });

    it('adds a calorie entry and syncs to backend', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        (api.get as jest.Mock).mockResolvedValue({ data: [] });

        const { result } = renderHook(() => useCalories());

        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.addEntry('Banana', 105, '2026-01-01');
        });

        expect(result.current.entries).toContainEqual(expect.objectContaining({
            food: 'Banana',
            calories: 105,
            synced: true
        }));
        expect(api.post).toHaveBeenCalledWith('/calories', expect.objectContaining({
            food: 'Banana',
            calories: 105
        }));
    });

    it('deletes a calorie entry', async () => {
        const mockEntries = [{ id: 'delete-me', food: 'Pizza', calories: 500, date: '2026-01-01', timestamp: 12345, synced: true }];

        (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
            if (key === 'calories_entries') return Promise.resolve(JSON.stringify(mockEntries));
            return Promise.resolve(null);
        });
        (api.get as jest.Mock).mockResolvedValue({ data: [] });

        const { result } = renderHook(() => useCalories());

        await act(async () => {
            await result.current.deleteEntry('delete-me');
        });

        expect(result.current.entries).toEqual([]);
        expect(api.delete).toHaveBeenCalledWith('/calories/delete-me');
    });
});
