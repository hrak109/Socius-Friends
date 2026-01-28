import { stripJsonBlocks } from '../string';

describe('stripJsonBlocks', () => {
    it('should strip json blocks with tag', () => {
        const input = 'Hello! ```json {"kcal": 500} ``` Goodbye.';
        const output = 'Hello!  Goodbye.';
        expect(stripJsonBlocks(input)).toBe(output);
    });

    it('should strip blocks without language tag', () => {
        const input = 'Check this: ``` data ```';
        const output = 'Check this:';
        expect(stripJsonBlocks(input)).toBe(output);
    });

    it('should handle multiline content within blocks', () => {
        const input = 'Result:\n```\nline 1\nline 2\n```\nEnd.';
        const output = 'Result:\n\nEnd.';
        expect(stripJsonBlocks(input)).toBe(output);
    });

    it('should strip multiple blocks', () => {
        const input = '```A``` mid ```B```';
        const output = 'mid';
        expect(stripJsonBlocks(input)).toBe(output);
    });

    it('should return empty string if only json exists', () => {
        const input = '```json {} ```';
        expect(stripJsonBlocks(input)).toBe('');
    });

    it('should handle empty input', () => {
        expect(stripJsonBlocks('')).toBe('');
    });
});
