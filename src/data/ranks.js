/**
 * Rank definitions for game progression
 * Each rank requires certain prerequisites and contract completions to advance
 */

export const RANKS = [
    {
        level: 1,
        name: 'Novice',
        contractsRequired: 0, // Starting rank
        minGridSize: 4,
        requiredColors: ['black', 'white'],
        patternComplexity: 'simple', // 2-4 cells
        rewardMultiplier: 1.0,
        description: 'Simple patterns on a 4x4 grid'
    },
    {
        level: 2,
        name: 'Apprentice',
        contractsRequired: 5, // Complete 5 rank 1 contracts
        minGridSize: 4,
        requiredColors: ['black', 'white'],
        patternComplexity: 'basic', // 4-8 cells
        rewardMultiplier: 1.2,
        description: 'Slightly larger patterns'
    },
    {
        level: 3,
        name: 'Journeyman',
        contractsRequired: 10,
        minGridSize: 6,
        requiredColors: ['black', 'white'],
        patternComplexity: 'medium', // 6-12 cells
        rewardMultiplier: 1.5,
        description: 'Requires 6x6 grid'
    },
    {
        level: 4,
        name: 'Artisan',
        contractsRequired: 18,
        minGridSize: 6,
        requiredColors: ['black', 'white', 'red'],
        patternComplexity: 'medium',
        rewardMultiplier: 1.8,
        description: 'Requires red color'
    },
    {
        level: 5,
        name: 'Expert',
        contractsRequired: 28,
        minGridSize: 8,
        requiredColors: ['black', 'white', 'red', 'blue'],
        patternComplexity: 'complex', // 10-20 cells
        rewardMultiplier: 2.2,
        description: 'Requires 8x8 grid and blue color'
    },
    {
        level: 6,
        name: 'Master',
        contractsRequired: 40,
        minGridSize: 8,
        requiredColors: ['black', 'white', 'red', 'blue', 'green'],
        patternComplexity: 'complex',
        rewardMultiplier: 2.8,
        description: 'Requires green color'
    },
    {
        level: 7,
        name: 'Grandmaster',
        contractsRequired: 55,
        minGridSize: 10,
        requiredColors: ['black', 'white', 'red', 'blue', 'green', 'yellow'],
        patternComplexity: 'advanced', // 15-30 cells
        rewardMultiplier: 3.5,
        description: 'Requires 10x10 grid and yellow'
    },
    {
        level: 8,
        name: 'Virtuoso',
        contractsRequired: 75,
        minGridSize: 12,
        requiredColors: ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple'],
        patternComplexity: 'advanced',
        rewardMultiplier: 4.5,
        description: 'Requires 12x12 grid and purple'
    },
    {
        level: 9,
        name: 'Legend',
        contractsRequired: 100,
        minGridSize: 16,
        requiredColors: ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'orange'],
        patternComplexity: 'expert', // 25-50 cells
        rewardMultiplier: 6.0,
        description: 'Requires 16x16 grid and orange'
    },
    {
        level: 10,
        name: 'Mythic',
        contractsRequired: 150,
        minGridSize: 20,
        requiredColors: ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan', 'pink'],
        patternComplexity: 'master', // 40-80 cells
        rewardMultiplier: 8.0,
        description: 'Requires 20x20 grid and all basic colors'
    }
];

// Get rank by level
export function getRank(level) {
    return RANKS.find(r => r.level === level) || RANKS[0];
}

// Get max rank level
export function getMaxRank() {
    return RANKS[RANKS.length - 1].level;
}

// Check if player meets requirements for a rank
export function canAccessRank(rank, completedContracts, gridSize, unlockedColors) {
    if (completedContracts < rank.contractsRequired) return false;
    if (gridSize < rank.minGridSize) return false;

    for (const color of rank.requiredColors) {
        if (!unlockedColors.has(color)) return false;
    }

    return true;
}

// Get what's missing to access a rank
export function getMissingRequirements(rank, completedContracts, gridSize, unlockedColors) {
    const missing = {
        contracts: Math.max(0, rank.contractsRequired - completedContracts),
        gridSize: gridSize < rank.minGridSize ? rank.minGridSize : null,
        colors: rank.requiredColors.filter(c => !unlockedColors.has(c))
    };

    return missing;
}

// Get pattern cell count range for complexity
export function getComplexityRange(complexity) {
    switch (complexity) {
        case 'simple': return { min: 2, max: 4 };
        case 'basic': return { min: 4, max: 8 };
        case 'medium': return { min: 6, max: 12 };
        case 'complex': return { min: 10, max: 20 };
        case 'advanced': return { min: 15, max: 30 };
        case 'expert': return { min: 25, max: 50 };
        case 'master': return { min: 40, max: 80 };
        default: return { min: 2, max: 4 };
    }
}

// Get base reward for complexity
export function getBaseReward(complexity) {
    switch (complexity) {
        case 'simple': return 5;
        case 'basic': return 8;
        case 'medium': return 12;
        case 'complex': return 18;
        case 'advanced': return 25;
        case 'expert': return 35;
        case 'master': return 50;
        default: return 5;
    }
}
