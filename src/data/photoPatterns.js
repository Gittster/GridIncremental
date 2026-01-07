/**
 * Photo-based pixel art patterns for higher rank contracts
 * These are simplified representations of real objects
 * Each pattern is a 2D array where values are color names or null
 */

// 8x8 patterns (for rank 5-6)
export const PATTERNS_8x8 = [
    {
        name: 'Heart',
        pattern: [
            [null, 'red', 'red', null, null, 'red', 'red', null],
            ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
            ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
            ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
            [null, 'red', 'red', 'red', 'red', 'red', 'red', null],
            [null, null, 'red', 'red', 'red', 'red', null, null],
            [null, null, null, 'red', 'red', null, null, null],
            [null, null, null, null, null, null, null, null]
        ]
    },
    {
        name: 'Star',
        pattern: [
            [null, null, null, 'yellow', 'yellow', null, null, null],
            [null, null, 'yellow', 'yellow', 'yellow', 'yellow', null, null],
            ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow'],
            [null, 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', null],
            [null, null, 'yellow', 'yellow', 'yellow', 'yellow', null, null],
            [null, 'yellow', 'yellow', null, null, 'yellow', 'yellow', null],
            ['yellow', 'yellow', null, null, null, null, 'yellow', 'yellow'],
            [null, null, null, null, null, null, null, null]
        ]
    },
    {
        name: 'House',
        pattern: [
            [null, null, null, 'red', 'red', null, null, null],
            [null, null, 'red', 'red', 'red', 'red', null, null],
            [null, 'red', 'red', 'red', 'red', 'red', 'red', null],
            ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
            ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
            ['white', 'blue', 'white', 'white', 'white', 'blue', 'white', 'white'],
            ['white', 'blue', 'white', 'white', 'white', 'blue', 'white', 'white'],
            ['white', 'white', 'white', 'black', 'black', 'white', 'white', 'white']
        ]
    },
    {
        name: 'Tree',
        pattern: [
            [null, null, null, 'green', 'green', null, null, null],
            [null, null, 'green', 'green', 'green', 'green', null, null],
            [null, 'green', 'green', 'green', 'green', 'green', 'green', null],
            ['green', 'green', 'green', 'green', 'green', 'green', 'green', 'green'],
            [null, 'green', 'green', 'green', 'green', 'green', 'green', null],
            [null, null, null, 'black', 'black', null, null, null],
            [null, null, null, 'black', 'black', null, null, null],
            [null, null, null, 'black', 'black', null, null, null]
        ]
    },
    {
        name: 'Mushroom',
        pattern: [
            [null, null, 'red', 'red', 'red', 'red', null, null],
            [null, 'red', 'white', 'red', 'red', 'white', 'red', null],
            ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
            ['red', 'white', 'red', 'red', 'red', 'red', 'white', 'red'],
            [null, 'red', 'red', 'red', 'red', 'red', 'red', null],
            [null, null, 'white', 'white', 'white', 'white', null, null],
            [null, null, 'white', 'white', 'white', 'white', null, null],
            [null, null, 'white', 'white', 'white', 'white', null, null]
        ]
    },
    {
        name: 'Smiley',
        pattern: [
            [null, null, 'yellow', 'yellow', 'yellow', 'yellow', null, null],
            [null, 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', null],
            ['yellow', 'yellow', 'black', 'yellow', 'yellow', 'black', 'yellow', 'yellow'],
            ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow'],
            ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow'],
            ['yellow', 'black', 'yellow', 'yellow', 'yellow', 'yellow', 'black', 'yellow'],
            [null, 'yellow', 'black', 'black', 'black', 'black', 'yellow', null],
            [null, null, 'yellow', 'yellow', 'yellow', 'yellow', null, null]
        ]
    }
];

// 10x10 patterns (for rank 7)
export const PATTERNS_10x10 = [
    {
        name: 'Spaceship',
        pattern: [
            [null, null, null, null, 'white', 'white', null, null, null, null],
            [null, null, null, 'white', 'white', 'white', 'white', null, null, null],
            [null, null, 'white', 'blue', 'white', 'white', 'blue', 'white', null, null],
            [null, 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', null],
            ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
            ['red', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'red'],
            [null, 'red', 'white', 'white', 'white', 'white', 'white', 'white', 'red', null],
            [null, null, 'red', null, null, null, null, 'red', null, null],
            [null, 'yellow', null, null, null, null, null, null, 'yellow', null],
            ['yellow', 'yellow', null, null, null, null, null, null, 'yellow', 'yellow']
        ]
    },
    {
        name: 'Flower',
        pattern: [
            [null, null, null, 'red', 'red', 'red', 'red', null, null, null],
            [null, null, 'red', 'red', 'red', 'red', 'red', 'red', null, null],
            [null, 'red', 'red', 'red', 'yellow', 'yellow', 'red', 'red', 'red', null],
            ['red', 'red', 'red', 'yellow', 'yellow', 'yellow', 'yellow', 'red', 'red', 'red'],
            ['red', 'red', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'red', 'red'],
            ['red', 'red', 'red', 'yellow', 'yellow', 'yellow', 'yellow', 'red', 'red', 'red'],
            [null, 'red', 'red', 'red', 'yellow', 'yellow', 'red', 'red', 'red', null],
            [null, null, null, null, 'green', 'green', null, null, null, null],
            [null, null, null, null, 'green', 'green', null, null, null, null],
            [null, null, null, null, 'green', 'green', null, null, null, null]
        ]
    },
    {
        name: 'Robot',
        pattern: [
            [null, null, 'white', 'white', 'white', 'white', 'white', 'white', null, null],
            [null, null, 'white', 'blue', 'white', 'white', 'blue', 'white', null, null],
            [null, null, 'white', 'white', 'white', 'white', 'white', 'white', null, null],
            [null, null, 'white', 'red', 'red', 'red', 'red', 'white', null, null],
            [null, null, null, 'white', 'white', 'white', 'white', null, null, null],
            [null, 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', null],
            [null, 'white', null, 'white', 'white', 'white', 'white', null, 'white', null],
            [null, 'white', null, 'white', 'white', 'white', 'white', null, 'white', null],
            [null, null, null, 'white', null, null, 'white', null, null, null],
            [null, null, null, 'white', null, null, 'white', null, null, null]
        ]
    }
];

// 12x12 patterns (for rank 8)
export const PATTERNS_12x12 = [
    {
        name: 'Castle',
        pattern: [
            ['white', null, null, 'white', null, null, null, null, 'white', null, null, 'white'],
            ['white', 'white', 'white', 'white', null, null, null, null, 'white', 'white', 'white', 'white'],
            ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
            ['white', 'blue', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'blue', 'white'],
            ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
            ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
            ['white', 'white', 'white', 'white', 'blue', 'blue', 'blue', 'blue', 'white', 'white', 'white', 'white'],
            ['white', 'white', 'white', 'white', 'blue', 'blue', 'blue', 'blue', 'white', 'white', 'white', 'white'],
            ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
            ['white', 'white', 'white', 'white', 'white', 'black', 'black', 'white', 'white', 'white', 'white', 'white'],
            ['white', 'white', 'white', 'white', 'white', 'black', 'black', 'white', 'white', 'white', 'white', 'white'],
            ['white', 'white', 'white', 'white', 'white', 'black', 'black', 'white', 'white', 'white', 'white', 'white']
        ]
    },
    {
        name: 'Car',
        pattern: [
            [null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, 'red', 'red', 'red', 'red', 'red', null, null, null, null],
            [null, null, 'red', 'red', 'blue', 'blue', 'blue', 'red', 'red', null, null, null],
            [null, 'red', 'red', 'red', 'blue', 'blue', 'blue', 'red', 'red', 'red', null, null],
            ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', null],
            ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
            ['red', 'yellow', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'yellow', 'red'],
            [null, 'black', 'black', 'red', 'red', 'red', 'red', 'red', 'red', 'black', 'black', null],
            [null, 'black', 'black', 'black', null, null, null, null, 'black', 'black', 'black', null],
            [null, null, 'black', null, null, null, null, null, null, 'black', null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null]
        ]
    }
];

/**
 * Get a random pattern appropriate for the grid size and available colors
 * @param {number} gridSize - The grid size
 * @param {string[]} availableColors - Colors the player has unlocked
 * @returns {object|null} - Pattern object or null if none available
 */
export function getRandomPhotoPattern(gridSize, availableColors) {
    let patterns;

    if (gridSize >= 12) {
        patterns = [...PATTERNS_8x8, ...PATTERNS_10x10, ...PATTERNS_12x12];
    } else if (gridSize >= 10) {
        patterns = [...PATTERNS_8x8, ...PATTERNS_10x10];
    } else {
        patterns = PATTERNS_8x8;
    }

    // Filter to patterns that only use available colors
    const validPatterns = patterns.filter(p => {
        const usedColors = new Set();
        for (const row of p.pattern) {
            for (const cell of row) {
                if (cell !== null) usedColors.add(cell);
            }
        }
        return [...usedColors].every(c => availableColors.includes(c));
    });

    if (validPatterns.length === 0) return null;

    return validPatterns[Math.floor(Math.random() * validPatterns.length)];
}

/**
 * Fit a pattern into a larger grid (centered)
 * @param {string[][]} patternData - The pattern array
 * @param {number} targetWidth - Target grid width
 * @param {number} targetHeight - Target grid height
 * @returns {string[][]} - Pattern array sized to target
 */
export function fitPatternToGrid(patternData, targetWidth, targetHeight) {
    const patternHeight = patternData.length;
    const patternWidth = patternData[0].length;

    // Create target-sized grid filled with null
    const result = [];
    for (let y = 0; y < targetHeight; y++) {
        result.push(new Array(targetWidth).fill(null));
    }

    // Calculate offset to center the pattern
    const offsetX = Math.floor((targetWidth - patternWidth) / 2);
    const offsetY = Math.floor((targetHeight - patternHeight) / 2);

    // Copy pattern data
    for (let y = 0; y < patternHeight; y++) {
        for (let x = 0; x < patternWidth; x++) {
            const targetY = y + offsetY;
            const targetX = x + offsetX;
            if (targetY >= 0 && targetY < targetHeight && targetX >= 0 && targetX < targetWidth) {
                result[targetY][targetX] = patternData[y][x];
            }
        }
    }

    return result;
}
