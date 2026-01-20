import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

export type CalorieEntry = {
    id: string; // client_id from backend perspective, but we treat as id here
    food: string;
    calories: number;
    date: string; // YYYY-MM-DD
    timestamp: number;
};

export function useCalories() {
    const [entries, setEntries] = useState<CalorieEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const loadEntries = useCallback(async () => {
        try {
            const res = await api.get('/calories');
            // Check if res.data is array
            if (Array.isArray(res.data)) {
                // Map backend response if needed, but names match mostly.
                // Backend returns: id(db), client_id, food, calories, date, timestamp
                const mapped: CalorieEntry[] = res.data.map((item: any) => ({
                    id: item.client_id, // Map client_id to id for frontend consistency
                    food: item.food,
                    calories: item.calories,
                    date: item.date,
                    timestamp: item.timestamp
                }));
                setEntries(mapped);
            }
        } catch (error) {
            console.error('Failed to load calories from API', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load on mount
    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const addEntry = useCallback(async (food: string | string[], calories: number) => {
        try {
            // Guard against undefined/null food, and handle arrays
            let safeFoodName: string;
            if (Array.isArray(food)) {
                safeFoodName = food.join(', ').trim() || 'Unknown Food';
            } else if (typeof food === 'string') {
                safeFoodName = food.trim() || 'Unknown Food';
            } else {
                safeFoodName = 'Unknown Food';
            }

            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timestamp = now.getTime();
            // Generate a robust client ID
            const clientId = `${timestamp}-${Math.floor(Math.random() * 10000)}`;

            const newEntry: CalorieEntry = {
                id: clientId,
                food: safeFoodName,
                calories,
                date: dateStr,
                timestamp: timestamp,
            };

            // Optimistic update
            setEntries(prev => [newEntry, ...prev]);

            // Sync to API
            await api.post('/calories', {
                client_id: clientId,
                food: safeFoodName,
                calories,
                date: dateStr,
                timestamp
            });

            return newEntry;
        } catch (error) {
            console.error('Failed to add calorie entry', error);
            // Revert on error? For now, we just log. 
            // Ideally we should reload from server to stay consistent or remove the optimistic entry.
            // loadEntries(); 
            throw error;
        }
    }, []);

    const deleteEntry = useCallback(async (id: string) => {
        // Optimistic delete
        setEntries(prev => prev.filter(e => e.id !== id));

        try {
            await api.delete(`/calories/${id}`);
        } catch (error) {
            console.error('Failed to delete calorie entry', error);
            // loadEntries(); // Revert/Reload
            throw error;
        }
    }, []);

    const updateEntry = useCallback(async (id: string, food: string, calories: number) => {
        // Find existing to get metadata
        const existing = entries.find(e => e.id === id);
        if (!existing) return;

        const updatedEntry = { ...existing, food, calories };

        // Optimistic
        setEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));

        try {
            await api.post('/calories', {
                client_id: id,
                food: updatedEntry.food,
                calories: updatedEntry.calories,
                date: updatedEntry.date,
                timestamp: updatedEntry.timestamp
            });
        } catch (error) {
            console.error('Failed to update calorie entry', error);
            // loadEntries();
            throw error;
        }
    }, [entries]);

    return {
        entries,
        loading,
        addEntry,
        updateEntry,
        deleteEntry,
        refresh: loadEntries
    };
}
