import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should return initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('should debounce value updates', () => {
        const { result, rerender } = renderHook<string, { value: string; delay: number }>(
            ({ value, delay }) => useDebounce(value, delay),
            {
                initialProps: { value: 'initial', delay: 500 },
            }
        );

        // Update value
        rerender({ value: 'updated', delay: 500 });

        // Should still be initial immediately
        expect(result.current).toBe('initial');

        // Fast forward less than delay
        act(() => {
            jest.advanceTimersByTime(200);
        });
        expect(result.current).toBe('initial');

        // Fast forward passed delay
        act(() => {
            jest.advanceTimersByTime(300); // Total 500
        });
        expect(result.current).toBe('updated');
    });

    it('should reset timer if value changes again quickly', () => {
        const { result, rerender } = renderHook<string, { value: string; delay: number }>(
            ({ value, delay }) => useDebounce(value, delay),
            {
                initialProps: { value: 'initial', delay: 500 },
            }
        );

        // First update
        rerender({ value: 'update1', delay: 500 });

        act(() => {
            jest.advanceTimersByTime(200);
        });

        // Second update before timer fires
        rerender({ value: 'update2', delay: 500 });

        act(() => {
            jest.advanceTimersByTime(200);
        });
        // Total 400ms since first update, but only 200ms since second. Should still be initial.
        expect(result.current).toBe('initial');

        act(() => {
            jest.advanceTimersByTime(300); // 500ms from second update
        });
        expect(result.current).toBe('update2');
    });
});
