import { AUTO_PAINTER_CONFIG, getAutoPainterColor } from '../data/upgrades.js';

/**
 * Handles automatic painting of cells when auto painters are enabled
 * Paints cells left-to-right, top-to-bottom toward contract completion
 */
export class AutoPainterSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.lastPaintTime = {};  // Track last paint time per color
        this.intervalId = null;
    }

    start() {
        if (this.intervalId) return;

        // Check every 100ms for paint opportunities
        this.intervalId = setInterval(() => this.tick(), 100);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    tick() {
        // Only paint if there's an active contract and auto painters are enabled
        if (!this.gameState.activeContract) return;
        if (!this.gameState.isAutomationEnabled('auto_painters')) return;

        const now = Date.now();
        const ownedPainters = this.gameState.getOwnedAutoPainters();

        for (const painterId of ownedPainters) {
            const colorId = getAutoPainterColor(painterId);
            if (!colorId) continue;

            const interval = this.getInterval(painterId);
            const lastPaint = this.lastPaintTime[colorId] || 0;

            if (now - lastPaint >= interval) {
                const painted = this.paintNextCell(colorId);
                if (painted) {
                    this.lastPaintTime[colorId] = now;
                }
            }
        }
    }

    /**
     * Get the paint interval for a specific auto painter
     * Base is 5000ms, reduced by level and speed boost
     */
    getInterval(painterId) {
        const level = this.gameState.getUpgradeLevel(painterId);
        const speedBoostLevel = this.gameState.getUpgradeLevel('speed_boost');

        // Base interval is 5000ms
        let interval = AUTO_PAINTER_CONFIG.baseInterval;

        // Each level reduces interval by 15%
        const levelReduction = 1 - (level * AUTO_PAINTER_CONFIG.intervalReductionPerLevel);
        interval *= Math.max(0.2, levelReduction); // Cap at 80% reduction from levels

        // Speed boost reduces by 25% per level
        const speedReduction = 1 - (speedBoostLevel * 0.25);
        interval *= Math.max(0.1, speedReduction); // Cap at 90% reduction from speed

        // Minimum interval of 200ms
        return Math.max(200, interval);
    }

    /**
     * Find and paint the next cell that needs the specified color
     * Scans left-to-right, top-to-bottom
     */
    paintNextCell(colorId) {
        const contract = this.gameState.activeContract;
        if (!contract) return false;

        const pattern = contract.pattern;
        const grid = this.gameState.grid;

        // Scan left-to-right, top-to-bottom
        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                const expected = pattern[y]?.[x];
                const actual = grid.getCell(x, y);

                // If this cell needs this color and doesn't have it yet
                if (expected === colorId && actual !== colorId) {
                    grid.setCell(x, y, colorId);
                    return true;
                }
            }
        }

        return false; // No cells needed this color
    }

    /**
     * Get info about auto painter status for UI
     */
    getStatus() {
        const ownedPainters = this.gameState.getOwnedAutoPainters();
        const enabled = this.gameState.isAutomationEnabled('auto_painters');

        return {
            enabled,
            painters: ownedPainters.map(id => ({
                id,
                colorId: getAutoPainterColor(id),
                level: this.gameState.getUpgradeLevel(id),
                interval: this.getInterval(id)
            }))
        };
    }
}
