import { EventEmitter } from './EventEmitter.js';
import { Grid } from './Grid.js';

/**
 * Central game state - single source of truth for all game data
 */
export class GameState extends EventEmitter {
    constructor() {
        super();

        // Core grid - starts small at 4x4
        this.grid = new Grid(4, 4);
        this.gridLevel = 1;

        // Player resources
        this.money = 0;

        // Unlocked colors
        this.unlockedColors = new Set(['black', 'white']);

        // Currently selected
        this.selectedColor = 'black';

        // Upgrades (id -> level, 0 = not purchased)
        this.upgrades = {};

        // Automation enabled states (id -> boolean)
        this.automationEnabled = {};

        // Active contract
        this.activeContract = null;
        this.completedContracts = 0;

        // Game stats
        this.stats = {
            totalCellsFilled: 0,
            totalMoneyEarned: 0,
            totalContractsCompleted: 0,
            playTime: 0
        };

        // Forward grid events
        this.grid.on('cellChanged', (data) => {
            this.stats.totalCellsFilled++;
            this.emit('cellChanged', data);
            this.checkContractCompletion();
        });

        this.grid.on('cellsChanged', (data) => {
            this.stats.totalCellsFilled += data.length;
            this.emit('cellsChanged', data);
            this.checkContractCompletion();
        });

        this.grid.on('gridCleared', () => this.emit('gridCleared'));
        this.grid.on('gridLoaded', () => this.emit('gridLoaded'));
        this.grid.on('gridResized', (data) => this.emit('gridResized', data));
    }

    // Grid expansion
    expandGrid(newWidth, newHeight) {
        const success = this.grid.expand(newWidth, newHeight);
        if (success) {
            this.gridLevel++;
            this.emit('gridExpanded', { width: newWidth, height: newHeight, level: this.gridLevel });
        }
        return success;
    }

    getGridSize() {
        return { width: this.grid.width, height: this.grid.height };
    }

    // Money operations
    addMoney(amount) {
        if (amount <= 0) return false;
        this.money += amount;
        this.stats.totalMoneyEarned += amount;
        this.emit('moneyChanged', { money: this.money, delta: amount });
        return true;
    }

    spendMoney(amount) {
        if (amount <= 0 || this.money < amount) return false;
        this.money -= amount;
        this.emit('moneyChanged', { money: this.money, delta: -amount });
        return true;
    }

    // Color management
    unlockColor(colorId) {
        if (this.unlockedColors.has(colorId)) return false;
        this.unlockedColors.add(colorId);
        this.emit('colorUnlocked', colorId);
        return true;
    }

    hasColor(colorId) {
        return this.unlockedColors.has(colorId);
    }

    selectColor(colorId) {
        if (!this.unlockedColors.has(colorId)) return false;
        this.selectedColor = colorId;
        this.emit('colorSelected', colorId);
        return true;
    }

    // Upgrade management
    getUpgradeLevel(upgradeId) {
        return this.upgrades[upgradeId] || 0;
    }

    hasUpgrade(upgradeId) {
        return this.getUpgradeLevel(upgradeId) > 0;
    }

    purchaseUpgrade(upgradeId) {
        const currentLevel = this.getUpgradeLevel(upgradeId);
        this.upgrades[upgradeId] = currentLevel + 1;
        // Enable automation by default when first purchased
        if (currentLevel === 0) {
            this.automationEnabled[upgradeId] = true;
        }
        this.emit('upgradeChanged', { id: upgradeId, level: currentLevel + 1 });
        return true;
    }

    // Automation enable/disable
    isAutomationEnabled(upgradeId) {
        // Special case for auto_painters master toggle
        if (upgradeId === 'auto_painters') {
            return this.automationEnabled['auto_painters'] !== false;
        }
        // Must own the upgrade and have it enabled
        if (!this.hasUpgrade(upgradeId)) return false;
        return this.automationEnabled[upgradeId] !== false;
    }

    setAutomationEnabled(upgradeId, enabled) {
        // Special case for auto_painters master toggle
        if (upgradeId === 'auto_painters') {
            this.automationEnabled['auto_painters'] = enabled;
            this.emit('automationToggled', { id: upgradeId, enabled });
            return true;
        }
        if (!this.hasUpgrade(upgradeId)) return false;
        this.automationEnabled[upgradeId] = enabled;
        this.emit('automationToggled', { id: upgradeId, enabled });
        return true;
    }

    // Check if player owns any auto painters
    hasAnyAutoPainter() {
        return Object.keys(this.upgrades).some(id => id.startsWith('auto_painter_'));
    }

    // Get all owned auto painter IDs
    getOwnedAutoPainters() {
        return Object.keys(this.upgrades).filter(id => id.startsWith('auto_painter_'));
    }

    // Contract management
    setActiveContract(contract) {
        this.activeContract = contract;
        this.grid.clear();
        this.emit('contractStarted', contract);
    }

    clearContract() {
        const contract = this.activeContract;
        this.activeContract = null;
        this.grid.clear();
        this.emit('contractCleared', contract);
    }

    checkContractCompletion() {
        if (!this.activeContract) return;

        const pattern = this.activeContract.pattern;
        let allMatch = true;
        let anyWrong = false;

        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const expected = pattern[y]?.[x] ?? null;
                const actual = this.grid.getCell(x, y);

                if (expected !== actual) {
                    allMatch = false;
                    if (expected === null && actual !== null) {
                        anyWrong = true; // Cell filled but should be empty
                    }
                }
            }
            if (!allMatch && anyWrong) break;
        }

        if (allMatch) {
            this.completeActiveContract();
        }
    }

    completeActiveContract() {
        if (!this.activeContract) return false;

        const contract = this.activeContract;
        this.addMoney(contract.reward);
        this.activeContract = null;
        this.completedContracts++;
        this.stats.totalContractsCompleted++;
        this.grid.clear();
        this.emit('contractCompleted', contract);
        return true;
    }

    // Serialization
    serialize() {
        return {
            version: 4,
            grid: this.grid.serialize(),
            gridLevel: this.gridLevel,
            money: this.money,
            unlockedColors: Array.from(this.unlockedColors),
            selectedColor: this.selectedColor,
            upgrades: this.upgrades,
            automationEnabled: this.automationEnabled,
            activeContract: this.activeContract,
            completedContracts: this.completedContracts,
            stats: this.stats
        };
    }

    deserialize(data) {
        if (!data || (data.version !== 2 && data.version !== 3 && data.version !== 4)) {
            console.warn('Invalid or old save data version');
            return false;
        }

        // Handle grid size
        const savedWidth = data.grid?.width || 4;
        const savedHeight = data.grid?.height || 4;
        if (savedWidth !== this.grid.width || savedHeight !== this.grid.height) {
            this.grid.expand(savedWidth, savedHeight);
        }
        this.grid.deserialize(data.grid);

        this.gridLevel = data.gridLevel || 1;
        this.money = data.money || 0;
        this.unlockedColors = new Set(data.unlockedColors || ['black', 'white']);
        this.selectedColor = data.selectedColor || 'black';
        this.upgrades = data.upgrades || {};
        this.automationEnabled = data.automationEnabled || {};
        this.activeContract = data.activeContract || null;
        this.completedContracts = data.completedContracts || 0;
        this.stats = data.stats || {
            totalCellsFilled: 0,
            totalMoneyEarned: 0,
            totalContractsCompleted: 0,
            playTime: 0
        };

        this.emit('stateLoaded');
        return true;
    }
}
