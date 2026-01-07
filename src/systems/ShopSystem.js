import { COLORS, getAllColors } from '../data/colors.js';
import { UPGRADES, getUpgradeCost, getAllUpgrades, getNextGridExpansion, canPurchaseUpgrade, isAutoPainterUpgrade, AUTO_PAINTER_CONFIG } from '../data/upgrades.js';

/**
 * Handles all purchases - colors, upgrades, grid expansions
 */
export class ShopSystem {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // === GRID EXPANSION ===

    getNextExpansion() {
        return getNextGridExpansion(this.gameState.gridLevel);
    }

    canBuyGridExpansion() {
        const next = this.getNextExpansion();
        if (!next) return false;
        return this.gameState.money >= next.cost;
    }

    buyGridExpansion() {
        const next = this.getNextExpansion();
        if (!next) {
            return { success: false, reason: 'Max grid size reached' };
        }
        if (!this.canBuyGridExpansion()) {
            return { success: false, reason: 'Cannot afford' };
        }

        this.gameState.spendMoney(next.cost);
        this.gameState.expandGrid(next.size, next.size);

        return { success: true, level: next.level, size: next.size, cost: next.cost };
    }

    // === COLOR PURCHASES ===

    getColorPrice(colorId) {
        return COLORS[colorId]?.cost || 0;
    }

    canBuyColor(colorId) {
        if (this.gameState.hasColor(colorId)) return false;
        const price = this.getColorPrice(colorId);
        return this.gameState.money >= price;
    }

    buyColor(colorId) {
        if (!this.canBuyColor(colorId)) {
            return { success: false, reason: 'Cannot afford or already owned' };
        }

        const price = this.getColorPrice(colorId);
        this.gameState.spendMoney(price);
        this.gameState.unlockColor(colorId);

        return { success: true, colorId, price };
    }

    getAvailableColors() {
        return getAllColors().filter(c =>
            !this.gameState.hasColor(c.id) && c.cost > 0
        );
    }

    // === UPGRADE PURCHASES ===

    getUpgradePrice(upgradeId) {
        const currentLevel = this.gameState.getUpgradeLevel(upgradeId);
        return getUpgradeCost(upgradeId, currentLevel);
    }

    canBuyUpgrade(upgradeId) {
        // Handle auto painter upgrades
        if (isAutoPainterUpgrade(upgradeId)) {
            const colorId = upgradeId.replace('auto_painter_', '');
            if (!this.gameState.hasColor(colorId)) return false;

            const currentLevel = this.gameState.getUpgradeLevel(upgradeId);
            if (currentLevel >= AUTO_PAINTER_CONFIG.maxLevel) return false;

            const price = this.getUpgradePrice(upgradeId);
            return this.gameState.money >= price;
        }

        const upgrade = UPGRADES[upgradeId];
        if (!upgrade) return false;

        const currentLevel = this.gameState.getUpgradeLevel(upgradeId);
        if (currentLevel >= upgrade.maxLevel) return false;

        // Check requirements
        if (!canPurchaseUpgrade(upgradeId, new Set(Object.keys(this.gameState.upgrades).filter(id => this.gameState.hasUpgrade(id))))) {
            return false;
        }

        const price = this.getUpgradePrice(upgradeId);
        return this.gameState.money >= price;
    }

    buyUpgrade(upgradeId) {
        if (!this.canBuyUpgrade(upgradeId)) {
            return { success: false, reason: 'Cannot afford, max level reached, or requirements not met' };
        }

        const price = this.getUpgradePrice(upgradeId);
        this.gameState.spendMoney(price);
        this.gameState.purchaseUpgrade(upgradeId);

        return { success: true, upgradeId, price };
    }

    getAvailableUpgrades() {
        const ownedUpgrades = new Set(Object.keys(this.gameState.upgrades).filter(id => this.gameState.hasUpgrade(id)));

        return getAllUpgrades().map(u => {
            const currentLevel = this.gameState.getUpgradeLevel(u.id);
            const nextCost = getUpgradeCost(u.id, currentLevel);
            const isMaxed = currentLevel >= u.maxLevel;
            const meetsRequirements = canPurchaseUpgrade(u.id, ownedUpgrades);

            return {
                ...u,
                currentLevel,
                nextCost,
                isMaxed,
                isOwned: currentLevel > 0,
                meetsRequirements
            };
        });
    }

    // === SHOP DATA ===

    getShopData() {
        const gridSize = Math.min(this.gameState.grid.width, this.gameState.grid.height);

        return {
            gridExpansion: this.getNextExpansion(),
            canBuyGridExpansion: this.canBuyGridExpansion(),
            currentGridLevel: this.gameState.gridLevel,
            currentGridSize: gridSize,

            colors: this.getAvailableColors().map(c => ({
                ...c,
                canAfford: this.gameState.money >= c.cost
            })),

            upgrades: this.getAvailableUpgrades().map(u => ({
                ...u,
                canAfford: this.gameState.money >= u.nextCost && u.meetsRequirements
            }))
        };
    }

    // Get count of affordable items in shop
    getAffordableCounts() {
        const shop = this.getShopData();
        return {
            gridExpansion: shop.canBuyGridExpansion ? 1 : 0,
            colors: shop.colors.filter(c => c.canAfford).length,
            upgrades: shop.upgrades.filter(u => u.canAfford && !u.isMaxed).length
        };
    }
}
