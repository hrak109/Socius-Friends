import { fixTimestamp } from '../date';

describe('date utils - fixTimestamp', () => {
    it('returns current date if input is null or undefined', () => {
        const now = new Date();
        const fixed = fixTimestamp(null);
        // Expect close to now (within 1 second)
        expect(Math.abs(fixed.getTime() - now.getTime())).toBeLessThan(1000);
    });

    it('adds Z to ISO strings missing timezone', () => {
        const dateStr = '2023-10-27T10:00:00';
        const fixed = fixTimestamp(dateStr);
        expect(fixed.toISOString()).toBe('2023-10-27T10:00:00.000Z');
    });

    it('does not add Z to already valid ISO strings', () => {
        const dateStr = '2023-10-27T10:00:00Z';
        const fixed = fixTimestamp(dateStr);
        expect(fixed.toISOString()).toBe('2023-10-27T10:00:00.000Z');
    });

    it('does not add Z if timezone offset is present', () => {
        const dateStr = '2023-10-27T10:00:00+09:00';
        const fixed = fixTimestamp(dateStr);
        // +09:00 = UTC+9, so UTC should be 01:00
        expect(fixed.toISOString()).toBe('2023-10-27T01:00:00.000Z');
    });

    it('returns current date if input is invalid', () => {
        const fixed = fixTimestamp('not-a-date');
        const now = new Date();
        expect(Math.abs(fixed.getTime() - now.getTime())).toBeLessThan(1000);
    });
});
