/**
 * Upgrade definitions including grid expansions and automations
 */

// Grid expansion tiers - these are major upgrades
export const GRID_EXPANSIONS = [
    { level: 1, size: 4, cost: 0, name: '4x4 Grid' },
    { level: 2, size: 6, cost: 50, name: '6x6 Grid' },
    { level: 3, size: 8, cost: 150, name: '8x8 Grid' },
    { level: 4, size: 10, cost: 400, name: '10x10 Grid' },
    { level: 5, size: 12, cost: 1000, name: '12x12 Grid' },
    { level: 6, size: 16, cost: 2500, name: '16x16 Grid' },
    { level: 7, size: 20, cost: 5000, name: '20x20 Grid' },
    { level: 8, size: 25, cost: 10000, name: '25x25 Grid' },
    { level: 9, size: 32, cost: 20000, name: '32x32 Grid' },
    { level: 10, size: 50, cost: 50000, name: '50x50 Grid' },
    { level: 11, size: 75, cost: 100000, name: '75x75 Grid' },
    { level: 12, size: 100, cost: 200000, name: '100x100 Grid' },
    { level: 13, size: 150, cost: 500000, name: '150x150 Grid' },
    { level: 14, size: 200, cost: 1000000, name: '200x200 Grid' },
    { level: 15, size: 500, cost: 5000000, name: '500x500 Grid' },
    { level: 16, size: 1000, cost: 20000000, name: '1000x1000 Grid' }
];

export function getNextGridExpansion(currentLevel) {
    return GRID_EXPANSIONS.find(e => e.level === currentLevel + 1) || null;
}

export function getGridExpansionByLevel(level) {
    return GRID_EXPANSIONS.find(e => e.level === level) || GRID_EXPANSIONS[0];
}

// Shop tabs for upgrades
export const SHOP_TABS = {
    upgrades: 'upgrades',    // General upgrades (tools, utilities)
    automation: 'automation', // Automation upgrades
    grid: 'grid',            // Grid expansions
    colors: 'colors'         // Color purchases
};

// Upgrades - ordered by intended purchase order
export const UPGRADES = {
    // === UPGRADES TAB (tools, utilities, multipliers) ===

    // First upgrade - hold to paint (~5 contracts worth at rank 1)
    hold_to_paint: {
        id: 'hold_to_paint',
        name: 'Hold to Paint',
        description: 'Hold mouse button and drag to paint multiple cells',
        baseCost: 25,
        costMultiplier: 1,
        maxLevel: 1,
        type: 'tool',
        shopTab: 'upgrades',
        priority: 1
    },

    // Money boost - always useful
    money_boost: {
        id: 'money_boost',
        name: 'Money Boost',
        description: 'Increases money earned from contracts by 15% per level',
        baseCost: 40,
        costMultiplier: 2.0,
        ratePerLevel: 0.15,
        maxLevel: 20,
        type: 'multiplier',
        shopTab: 'upgrades',
        priority: 2
    },

    // Multi-brush - paint multiple cells at once
    multi_brush: {
        id: 'multi_brush',
        name: 'Multi-Brush',
        description: 'Paint in a + pattern. Each level adds 1 cell radius',
        baseCost: 200,
        costMultiplier: 2.5,
        maxLevel: 5,
        type: 'tool',
        shopTab: 'upgrades',
        priority: 3
    },

    // Undo buffer
    undo_buffer: {
        id: 'undo_buffer',
        name: 'Memory',
        description: 'Increases undo history by 20 steps per level',
        baseCost: 75,
        costMultiplier: 1.5,
        ratePerLevel: 20,
        maxLevel: 5,
        type: 'utility',
        shopTab: 'upgrades',
        priority: 4
    },

    // Contract preview - shows pattern before accepting
    contract_preview: {
        id: 'contract_preview',
        name: 'Contract Preview',
        description: 'See the pattern before accepting a contract',
        baseCost: 150,
        costMultiplier: 1,
        maxLevel: 1,
        type: 'utility',
        shopTab: 'upgrades',
        priority: 5
    },

    // Precision mode - highlights which cells need which colors
    precision_mode: {
        id: 'precision_mode',
        name: 'Precision Mode',
        description: 'Highlights which cells need which colors',
        baseCost: 100,
        costMultiplier: 1,
        maxLevel: 1,
        type: 'utility',
        shopTab: 'upgrades',
        priority: 6
    },

    // === AUTOMATION TAB ===

    // Auto-start next contract
    auto_start_contract: {
        id: 'auto_start_contract',
        name: 'Auto-Start Contract',
        description: 'Automatically starts the next contract at the same rank when one is completed',
        baseCost: 50,
        costMultiplier: 1,
        maxLevel: 1,
        type: 'automation',
        shopTab: 'automation',
        canToggle: true,
        priority: 1
    },

    // Speed boost - faster auto-painters
    speed_boost: {
        id: 'speed_boost',
        name: 'Speed Boost',
        description: 'All auto painters work 25% faster per level',
        baseCost: 500,
        costMultiplier: 2.2,
        ratePerLevel: 0.25,
        maxLevel: 10,
        type: 'multiplier',
        shopTab: 'automation',
        priority: 10
    }
};

// Auto painter base config (per-color painters are generated dynamically)
export const AUTO_PAINTER_CONFIG = {
    baseCost: 75,
    costMultiplier: 1.5,
    maxLevel: 5,
    baseInterval: 5000, // 5 seconds base interval
    intervalReductionPerLevel: 0.15 // 15% faster per level
};

// Generate auto painter upgrade for a specific color
export function getAutoPainterUpgrade(colorId, colorName) {
    return {
        id: `auto_painter_${colorId}`,
        name: `Auto: ${colorName}`,
        description: `Automatically paints ${colorName.toLowerCase()} cells. Faster per level.`,
        baseCost: AUTO_PAINTER_CONFIG.baseCost,
        costMultiplier: AUTO_PAINTER_CONFIG.costMultiplier,
        maxLevel: AUTO_PAINTER_CONFIG.maxLevel,
        type: 'auto_painter',
        shopTab: 'automation',
        colorId: colorId,
        canToggle: false, // Individual painters don't toggle - master toggle controls all
        priority: 2
    };
}

// Check if an upgrade ID is an auto painter
export function isAutoPainterUpgrade(upgradeId) {
    return upgradeId.startsWith('auto_painter_');
}

// Get color ID from auto painter upgrade ID
export function getAutoPainterColor(upgradeId) {
    if (!isAutoPainterUpgrade(upgradeId)) return null;
    return upgradeId.replace('auto_painter_', '');
}

// Calculate cost for a specific level
export function getUpgradeCost(upgradeId, currentLevel) {
    // Handle auto painter upgrades
    if (isAutoPainterUpgrade(upgradeId)) {
        return Math.floor(AUTO_PAINTER_CONFIG.baseCost * Math.pow(AUTO_PAINTER_CONFIG.costMultiplier, currentLevel));
    }

    const upgrade = UPGRADES[upgradeId];
    if (!upgrade) return Infinity;

    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}

// Get all upgrades sorted by priority
export function getAllUpgrades() {
    return Object.values(UPGRADES).sort((a, b) => a.priority - b.priority);
}

// Get upgrades for a specific shop tab
export function getUpgradesByTab(tab) {
    return Object.values(UPGRADES)
        .filter(u => u.shopTab === tab)
        .sort((a, b) => a.priority - b.priority);
}

// Get all automation upgrades (ones that can be toggled)
// Returns regular toggleable upgrades plus a special 'auto_painters' entry if any are owned
export function getAutomationUpgrades() {
    const regular = Object.values(UPGRADES)
        .filter(u => u.canToggle)
        .sort((a, b) => a.priority - b.priority);

    return regular;
}

// Special automation entry for the auto painters master toggle
export const AUTO_PAINTERS_TOGGLE = {
    id: 'auto_painters',
    name: 'Auto Painters',
    description: 'Toggle all auto painters on/off',
    canToggle: true,
    priority: 2
};

// Check if upgrade requirements are met
export function canPurchaseUpgrade(upgradeId, ownedUpgrades) {
    const upgrade = UPGRADES[upgradeId];
    if (!upgrade) return false;

    if (upgrade.requires && !ownedUpgrades.has(upgrade.requires)) {
        return false;
    }

    return true;
}
