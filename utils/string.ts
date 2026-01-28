/**
 * Strips triple-backtick JSON blocks from a string.
 * Used for cleaning notifications and thread previews.
 */
export const stripJsonBlocks = (text: string): string => {
    if (!text) return '';
    return text.replace(/```(?:json)?\s*[\s\S]*?\s*```/gi, '').trim();
};
