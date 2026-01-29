import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useWorkouts } from '../useWorkouts';
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

describe('useWorkouts hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes and loads data from local storage and remote', async () => {
        const mockStats = { weight: 70, height: 175, age: 30, gender: 'male', activityLevel: 'moderate' };
        const mockActivities = [{ id: '1', name: 'Run', duration: 30, calories: 300, date: '2026-01-01', timestamp: 12345, synced: true }];

        (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
            if (key === 'user_physical_stats') return Promise.resolve(JSON.stringify(mockStats));
            if (key === 'workout_activities') return Promise.resolve(JSON.stringify(mockActivities));
            return Promise.resolve(null);
        });

        (api.get as jest.Mock).mockImplementation((url) => {
            if (url === '/workouts/stats') return Promise.resolve({ data: { ...mockStats, activity_level: 'moderate' } });
            if (url === '/workouts/activities') return Promise.resolve({ data: [{ client_id: '1', name: 'Run', duration: 30, calories: 300, date: '2026-01-01', timestamp: 12345 }] });
            return Promise.resolve({ data: [] });
        });

        const { result } = renderHook(() => useWorkouts());

        // Wait for loadData to finish
        await act(async () => {
            await Promise.resolve(); // Allow effects to run
        });

        expect(result.current.stats).toEqual(mockStats);
        expect(result.current.activities).toEqual(mockActivities);
        expect(result.current.loading).toBe(false);
    });

    it('saves physical stats and syncs to backend', async () => {
        const newStats = { weight: 75, height: 180, age: 31, gender: 'male', activityLevel: 'active' };

        // Mock initial load
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        (api.get as jest.Mock).mockResolvedValue({ data: null });

        const { result } = renderHook(() => useWorkouts());

        await act(async () => {
            await result.current.saveStats(newStats as any);
        });

        expect(result.current.stats).toEqual(newStats);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('user_physical_stats', JSON.stringify(newStats));
        expect(api.post).toHaveBeenCalledWith('/workouts/stats', expect.objectContaining({
            weight: 75,
            activity_level: 'active'
        }));
    });

    it('adds a workout activity and syncs to backend', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        (api.get as jest.Mock).mockResolvedValue({ data: [] });

        const { result } = renderHook(() => useWorkouts());

        // Wait for loadData to finish
        await waitFor(() => expect(result.current.loading).toBe(false));

        let newActivity;
        await act(async () => {
            newActivity = await result.current.addActivity('Yoga', 45, 150);
        });

        expect(result.current.activities).toContainEqual(expect.objectContaining({
            name: 'Yoga',
            duration: 45,
            calories: 150,
            synced: true
        }));
        expect(api.post).toHaveBeenCalledWith('/workouts/activities', expect.objectContaining({
            name: 'Yoga',
            calories: 150
        }));
    });

    it('deletes a workout activity', async () => {
        const mockActivities = [{ id: 'delete-me', name: 'Swim', duration: 20, calories: 200, date: '2026-01-01', timestamp: 12345, synced: true }];

        (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
            if (key === 'workout_activities') return Promise.resolve(JSON.stringify(mockActivities));
            return Promise.resolve(null);
        });
        (api.get as jest.Mock).mockResolvedValue({ data: [] });

        const { result } = renderHook(() => useWorkouts());

        await act(async () => {
            await result.current.deleteActivity('delete-me');
        });

        expect(result.current.activities).toEqual([]);
        expect(api.delete).toHaveBeenCalledWith('/workouts/activities/delete-me');
    });
});
