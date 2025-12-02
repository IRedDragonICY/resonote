
/**
 * Normalizes a keyboard event into a string representation (e.g., "Ctrl+S", "Shift+?").
 * Handles platform differences (Meta on Mac maps to Ctrl for app consistency if desired, 
 * but here we keep them normalized to standard naming).
 */
export const normalizeKeyEvent = (e: KeyboardEvent): string => {
    const parts = [];
    
    // Modifiers
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.metaKey) parts.push('Meta'); // Command on Mac
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    
    // Key
    let key = e.key;
    
    // Handle Special Keys
    if (key === ' ') key = 'Space';
    if (key === 'Control') return ''; // Ignore modifier-only presses
    if (key === 'Shift') return '';
    if (key === 'Alt') return '';
    if (key === 'Meta') return '';
    
    // If Shift is pressed and character is uppercase or symbol, 
    // we want the underlying key + Shift, or just the symbol?
    // Strategy: "Shift+?" vs "?"
    // If user presses Shift+/, key is "?". 
    // We prefer the representation "Shift+?" to be explicit, OR just "?"
    // Let's use the resulting character 'key' usually, but add Shift if it's explicitly pressed.
    
    // Fix: If key is a symbol produced by shift (like ?), e.key is ?.
    // If we have Shift in parts, we might get "Shift+?".
    
    // Normalize case
    if (key.length === 1) {
        key = key.toUpperCase();
    }
    
    parts.push(key);
    
    return parts.join('+');
};

/**
 * Checks if a normalized event string matches a stored shortcut string.
 * Supports cross-platform alias: "Ctrl" in shortcut can match "Meta" (Cmd) on Mac.
 */
export const matchesShortcut = (eventStr: string, shortcutSetting: string): boolean => {
    if (!eventStr || !shortcutSetting) return false;
    
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    
    // If on Mac, and shortcut asks for 'Ctrl', allow 'Meta' (Cmd) to trigger it
    if (isMac && shortcutSetting.includes('Ctrl') && eventStr.includes('Meta')) {
        const adjustedEvent = eventStr.replace('Meta', 'Ctrl');
        return adjustedEvent === shortcutSetting;
    }

    return eventStr === shortcutSetting;
};

export const formatShortcutForDisplay = (shortcut: string): string => {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    if (isMac) {
        return shortcut
            .replace('Ctrl', '⌘')
            .replace('Meta', '⌘')
            .replace('Shift', '⇧')
            .replace('Alt', '⌥')
            .replace('Enter', '⏎')
            .replace('+', '');
    }
    return shortcut;
};
