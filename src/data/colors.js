/**
 * Color definitions for the game
 * Each color has an id, display name, hex value, and unlock cost
 */
export const COLORS = {
    // Starter colors (free)
    black: {
        id: 'black',
        name: 'Black',
        hex: '#000000',
        cost: 0,
        unlocked: true
    },
    white: {
        id: 'white',
        name: 'White',
        hex: '#ffffff',
        cost: 0,
        unlocked: true
    },

    // Basic colors - cheap
    red: {
        id: 'red',
        name: 'Red',
        hex: '#e74c3c',
        cost: 50
    },
    blue: {
        id: 'blue',
        name: 'Blue',
        hex: '#3498db',
        cost: 50
    },
    green: {
        id: 'green',
        name: 'Green',
        hex: '#2ecc71',
        cost: 50
    },
    yellow: {
        id: 'yellow',
        name: 'Yellow',
        hex: '#f1c40f',
        cost: 75
    },

    // Secondary colors - medium cost
    orange: {
        id: 'orange',
        name: 'Orange',
        hex: '#e67e22',
        cost: 100
    },
    purple: {
        id: 'purple',
        name: 'Purple',
        hex: '#9b59b6',
        cost: 100
    },
    pink: {
        id: 'pink',
        name: 'Pink',
        hex: '#e91e63',
        cost: 125
    },
    cyan: {
        id: 'cyan',
        name: 'Cyan',
        hex: '#00bcd4',
        cost: 125
    },

    // Advanced colors - expensive
    gold: {
        id: 'gold',
        name: 'Gold',
        hex: '#ffd700',
        cost: 250
    },
    silver: {
        id: 'silver',
        name: 'Silver',
        hex: '#c0c0c0',
        cost: 200
    },
    brown: {
        id: 'brown',
        name: 'Brown',
        hex: '#8b4513',
        cost: 150
    },
    navy: {
        id: 'navy',
        name: 'Navy',
        hex: '#001f3f',
        cost: 175
    },

    // Premium colors - very expensive
    rainbow: {
        id: 'rainbow',
        name: 'Rainbow',
        hex: 'linear-gradient(90deg, red, orange, yellow, green, blue, purple)',
        cost: 1000,
        special: true,
        animated: true
    },
    neon: {
        id: 'neon',
        name: 'Neon Green',
        hex: '#39ff14',
        cost: 500,
        special: true,
        glow: true
    }
};

// Get color hex value by id
export function getColorHex(colorId) {
    return COLORS[colorId]?.hex || '#000000';
}

// Get all colors as array, sorted by cost
export function getAllColors() {
    return Object.values(COLORS).sort((a, b) => a.cost - b.cost);
}

// Get colors available for purchase (not yet unlocked)
export function getPurchasableColors(unlockedSet) {
    return getAllColors().filter(c => !unlockedSet.has(c.id) && c.cost > 0);
}
