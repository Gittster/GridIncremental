import { getColorHex, COLORS } from '../data/colors.js';
import { RANKS, getRank, canAccessRank, getMissingRequirements } from '../data/ranks.js';
import { UPGRADES, getUpgradesByTab, getAutomationUpgrades, GRID_EXPANSIONS, getAutoPainterUpgrade, isAutoPainterUpgrade, AUTO_PAINTER_CONFIG, AUTO_PAINTERS_TOGGLE, getUpgradeCost } from '../data/upgrades.js';

/**
 * Manages all UI updates and user interactions
 */
export class UIManager {
    constructor(game) {
        this.game = game;
        this.gameState = game.gameState;
        this.shopSystem = game.shopSystem;
        this.contractSystem = game.contractSystem;

        this.elements = {};
        this.currentTab = 'upgrades'; // Default to upgrades tab
        this.hideOwned = false;

        this.cacheElements();
        this.setupEventListeners();
        this.subscribeToState();
        this.render();
    }

    cacheElements() {
        this.elements = {
            // Resources (left panel)
            moneyDisplay: document.getElementById('money-display'),
            gridSizeDisplay: document.getElementById('grid-size-display'),
            contractsDisplay: document.getElementById('contracts-display'),

            // Automations panel
            automationsList: document.getElementById('automations-list'),

            // Color palette (near grid)
            colorPalette: document.getElementById('color-palette'),
            clearGridBtn: document.getElementById('clear-grid-btn'),

            // Contract/Rank
            contractInfo: document.getElementById('contract-info'),
            rankDisplay: document.getElementById('rank-display'),
            rankProgress: document.getElementById('rank-progress'),
            rankSelector: document.getElementById('rank-selector'),
            newContractBtn: document.getElementById('new-contract-btn'),
            abandonContractBtn: document.getElementById('abandon-contract-btn'),

            // Shop tabs
            shopTabs: document.querySelectorAll('.shop-tab'),
            shopContent: document.getElementById('shop-content'),
            hideOwnedCheckbox: document.getElementById('hide-owned-checkbox'),

            // Actions
            saveBtn: document.getElementById('save-btn')
        };
    }

    setupEventListeners() {
        // Shop tabs
        this.elements.shopTabs?.forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                this.elements.shopTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderShop();
            });
        });

        // Hide owned checkbox
        this.elements.hideOwnedCheckbox?.addEventListener('change', (e) => {
            this.hideOwned = e.target.checked;
            this.renderShop();
        });

        // New contract button
        this.elements.newContractBtn?.addEventListener('click', () => {
            const result = this.contractSystem.acceptContract();
            if (!result.success) {
                this.showToast(result.reason, 'error');
            } else {
                this.showToast('New contract started!', 'success');
            }
        });

        // Abandon contract button
        this.elements.abandonContractBtn?.addEventListener('click', () => {
            if (confirm('Abandon current contract? You will lose progress.')) {
                this.contractSystem.abandonContract();
                this.showToast('Contract abandoned', 'info');
            }
        });

        // Clear grid button
        this.elements.clearGridBtn?.addEventListener('click', () => {
            this.gameState.grid.clear();
        });

        // Save button
        this.elements.saveBtn?.addEventListener('click', () => {
            this.game.saveManager.save();
            this.showToast('Game saved!', 'success');
        });
    }

    subscribeToState() {
        // Money updates
        this.gameState.on('moneyChanged', () => {
            this.updateMoney();
            this.renderShop();
        });

        // Color updates
        this.gameState.on('colorUnlocked', () => {
            this.renderColorPalette();
            this.renderShop();
            this.renderRankSelector();
        });
        this.gameState.on('colorSelected', () => this.renderColorPalette());

        // Contract updates
        this.gameState.on('contractStarted', () => this.renderContract());
        this.gameState.on('contractCleared', () => this.renderContract());
        this.gameState.on('contractCompleted', (contract) => {
            this.renderContract();
            this.renderRankDisplay();
            this.renderRankSelector();
            this.updateContractsCount();
            this.showToast(`Contract completed! +$${contract.reward}`, 'success');

            // Auto-start next contract if upgrade owned and enabled
            if (this.gameState.isAutomationEnabled('auto_start_contract')) {
                setTimeout(() => {
                    if (!this.gameState.activeContract) {
                        const result = this.contractSystem.acceptContract();
                        if (result.success) {
                            this.showToast('Auto-started next contract', 'info');
                        }
                    }
                }, 500);
            }
        });

        // Cell changes update contract progress
        this.gameState.on('cellChanged', () => this.updateContractProgress());
        this.gameState.on('cellsChanged', () => this.updateContractProgress());

        // Grid expansion
        this.gameState.on('gridExpanded', () => {
            this.updateGridSize();
            this.renderShop();
            this.renderRankSelector();
        });

        // Upgrade changes
        this.gameState.on('upgradeChanged', () => {
            this.renderShop();
            this.renderAutomationsPanel();
        });

        // Automation toggle
        this.gameState.on('automationToggled', () => {
            this.renderAutomationsPanel();
        });

        // State loaded
        this.gameState.on('stateLoaded', () => this.renderAll());
    }

    renderAll() {
        this.updateMoney();
        this.updateGridSize();
        this.updateContractsCount();
        this.renderColorPalette();
        this.renderAutomationsPanel();
        this.renderRankDisplay();
        this.renderRankSelector();
        this.renderContract();
        this.renderShop();
    }

    render() {
        this.renderAll();
    }

    updateMoney() {
        if (this.elements.moneyDisplay) {
            this.elements.moneyDisplay.textContent = `$${this.formatNumber(this.gameState.money)}`;
        }
    }

    updateGridSize() {
        if (this.elements.gridSizeDisplay) {
            const size = this.gameState.grid.width;
            this.elements.gridSizeDisplay.textContent = `${size}x${size}`;
        }
    }

    updateContractsCount() {
        if (this.elements.contractsDisplay) {
            this.elements.contractsDisplay.textContent = this.gameState.completedContracts;
        }
    }

    renderAutomationsPanel() {
        if (!this.elements.automationsList) return;

        const automations = getAutomationUpgrades();
        const ownedAutomations = automations.filter(a => this.gameState.hasUpgrade(a.id));
        const hasAutoPainters = this.gameState.hasAnyAutoPainter();

        if (ownedAutomations.length === 0 && !hasAutoPainters) {
            this.elements.automationsList.innerHTML = '<p class="empty-state">No automations owned</p>';
            return;
        }

        let html = '';

        // Regular automations (like auto_start_contract)
        html += ownedAutomations.map(auto => {
            const enabled = this.gameState.isAutomationEnabled(auto.id);
            return `
                <div class="automation-item ${enabled ? '' : 'disabled'}">
                    <div class="automation-toggle ${enabled ? 'active' : ''}" data-id="${auto.id}"></div>
                    <span class="automation-name" title="${auto.description}">${auto.name}</span>
                </div>
            `;
        }).join('');

        // Auto painters master toggle (if any owned)
        if (hasAutoPainters) {
            const enabled = this.gameState.isAutomationEnabled('auto_painters');
            const ownedPainters = this.gameState.getOwnedAutoPainters();
            const painterNames = ownedPainters.map(id => {
                const colorId = id.replace('auto_painter_', '');
                return COLORS[colorId]?.name || colorId;
            }).join(', ');

            html += `
                <div class="automation-item ${enabled ? '' : 'disabled'}">
                    <div class="automation-toggle ${enabled ? 'active' : ''}" data-id="auto_painters"></div>
                    <span class="automation-name" title="Controls: ${painterNames}">Auto Painters</span>
                </div>
            `;
        }

        this.elements.automationsList.innerHTML = html;

        // Attach toggle handlers
        this.elements.automationsList.querySelectorAll('.automation-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const id = toggle.dataset.id;
                const currentEnabled = this.gameState.isAutomationEnabled(id);
                this.gameState.setAutomationEnabled(id, !currentEnabled);
            });
        });
    }

    renderColorPalette() {
        if (!this.elements.colorPalette) return;

        const colors = Array.from(this.gameState.unlockedColors);
        this.elements.colorPalette.innerHTML = '';

        for (const colorId of colors) {
            const color = COLORS[colorId];
            if (!color) continue;

            const btn = document.createElement('button');
            btn.className = 'color-btn';
            if (colorId === this.gameState.selectedColor) {
                btn.classList.add('selected');
            }

            btn.style.backgroundColor = color.hex;
            btn.title = color.name;

            // Add border for white color visibility
            if (colorId === 'white') {
                btn.style.border = '2px solid #666';
            }

            btn.addEventListener('click', () => {
                this.gameState.selectColor(colorId);
            });

            this.elements.colorPalette.appendChild(btn);
        }
    }

    renderRankDisplay() {
        if (!this.elements.rankDisplay) return;

        const highestRank = this.contractSystem.getHighestAccessibleRank();
        const selectedRank = this.contractSystem.selectedRankLevel;
        const rank = getRank(selectedRank || highestRank);

        this.elements.rankDisplay.textContent = rank.name;

        // Show progress to next rank
        if (this.elements.rankProgress) {
            const nextRankLevel = highestRank + 1;
            const nextRank = getRank(nextRankLevel);

            if (nextRank && nextRank.level <= RANKS.length) {
                const missing = getMissingRequirements(
                    nextRank,
                    this.gameState.completedContracts,
                    this.gameState.grid.width,
                    this.gameState.unlockedColors
                );

                const parts = [];
                if (missing.contracts > 0) {
                    parts.push(`${missing.contracts} contracts`);
                }
                if (missing.gridSize) {
                    parts.push(`${missing.gridSize}x${missing.gridSize} grid`);
                }
                if (missing.colors.length > 0) {
                    parts.push(missing.colors.join(', '));
                }

                if (parts.length > 0) {
                    this.elements.rankProgress.textContent = `Next: ${nextRank.name} (need ${parts.join(', ')})`;
                } else {
                    this.elements.rankProgress.textContent = `${nextRank.name} unlocked!`;
                }
            } else {
                this.elements.rankProgress.textContent = 'Max rank achieved!';
            }
        }
    }

    renderRankSelector() {
        if (!this.elements.rankSelector) return;

        const selectedRank = this.contractSystem.selectedRankLevel || this.contractSystem.getHighestAccessibleRank();
        const gridSize = this.gameState.grid.width;

        this.elements.rankSelector.innerHTML = '';

        for (const rank of RANKS) {
            const btn = document.createElement('button');
            btn.className = 'rank-btn';
            btn.textContent = `${rank.level}`;
            btn.title = `${rank.name} - ${rank.description}`;

            const canAccess = canAccessRank(
                rank,
                this.gameState.completedContracts,
                gridSize,
                this.gameState.unlockedColors
            );

            if (!canAccess) {
                btn.classList.add('locked');
                btn.disabled = true;
            } else if (rank.level === selectedRank) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                if (canAccess) {
                    this.contractSystem.selectedRankLevel = rank.level;
                    this.renderRankDisplay();
                    this.renderRankSelector();
                }
            });

            this.elements.rankSelector.appendChild(btn);
        }
    }

    renderContract() {
        if (!this.elements.contractInfo) return;

        const contract = this.gameState.activeContract;

        if (!contract) {
            this.elements.contractInfo.innerHTML = `
                <p class="empty-state">No active contract</p>
                <p class="hint">Select a rank and start a contract to earn money!</p>
            `;
            if (this.elements.newContractBtn) {
                this.elements.newContractBtn.style.display = 'block';
                this.elements.newContractBtn.disabled = !this.contractSystem.canAcceptContract();
            }
            if (this.elements.abandonContractBtn) {
                this.elements.abandonContractBtn.style.display = 'none';
            }
            return;
        }

        const progress = this.contractSystem.getProgress();
        const rank = getRank(contract.rankLevel);

        this.elements.contractInfo.innerHTML = `
            <div class="contract-active">
                <div class="contract-header">
                    <span class="contract-name">${rank.name} Contract</span>
                    <span class="contract-reward">$${contract.reward}</span>
                </div>
                <div class="contract-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.percent}%"></div>
                    </div>
                    <span class="progress-text">${progress.correct}/${progress.total}</span>
                </div>
                <p class="contract-hint">Fill in the outlined cells with the correct colors</p>
            </div>
        `;

        if (this.elements.newContractBtn) {
            this.elements.newContractBtn.style.display = 'none';
        }
        if (this.elements.abandonContractBtn) {
            this.elements.abandonContractBtn.style.display = 'block';
        }
    }

    updateContractProgress() {
        if (!this.gameState.activeContract) return;

        const progress = this.contractSystem.getProgress();
        const progressFill = this.elements.contractInfo?.querySelector('.progress-fill');
        const progressText = this.elements.contractInfo?.querySelector('.progress-text');

        if (progressFill) {
            progressFill.style.width = `${progress.percent}%`;
        }
        if (progressText) {
            progressText.textContent = `${progress.correct}/${progress.total}`;
        }
    }

    renderShop() {
        if (!this.elements.shopContent) return;

        const shop = this.shopSystem.getShopData();
        let html = '';

        switch (this.currentTab) {
            case 'colors':
                html = this.renderColorShop(shop.colors);
                break;
            case 'upgrades':
                html = this.renderUpgradeShop('upgrades');
                break;
            case 'automation':
                html = this.renderUpgradeShop('automation');
                break;
            case 'grid':
                html = this.renderGridShop();
                break;
        }

        this.elements.shopContent.innerHTML = html;

        // Attach buy handlers
        this.elements.shopContent.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const id = btn.dataset.id;
                this.handlePurchase(type, id);
            });
        });
    }

    renderColorShop(colors) {
        let filtered = colors;
        if (this.hideOwned) {
            filtered = colors.filter(c => !this.gameState.hasColor(c.id));
        }

        if (filtered.length === 0) {
            return '<p class="empty-state">All colors unlocked!</p>';
        }

        return filtered.map(color => `
            <div class="shop-item ${color.canAfford ? '' : 'cant-afford'}">
                <div class="item-info">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="background-color: ${color.hex}; ${color.id === 'white' ? 'border: 2px solid #666;' : ''} width: 24px; height: 24px; border-radius: 4px;"></div>
                        <span class="item-name">${color.name}</span>
                    </div>
                </div>
                <div class="item-price">$${this.formatNumber(color.cost)}</div>
                <button class="buy-btn" data-type="color" data-id="${color.id}"
                    ${color.canAfford ? '' : 'disabled'}>Buy</button>
            </div>
        `).join('');
    }

    renderUpgradeShop(tab) {
        const tabUpgrades = getUpgradesByTab(tab);
        const shop = this.shopSystem.getShopData();

        let upgrades = tabUpgrades.map(u => {
            const shopUpgrade = shop.upgrades.find(su => su.id === u.id);
            return shopUpgrade || {
                ...u,
                currentLevel: this.gameState.getUpgradeLevel(u.id),
                nextCost: this.shopSystem.getUpgradePrice(u.id),
                isMaxed: this.gameState.getUpgradeLevel(u.id) >= u.maxLevel,
                isOwned: this.gameState.hasUpgrade(u.id),
                meetsRequirements: true,
                canAfford: this.gameState.money >= this.shopSystem.getUpgradePrice(u.id)
            };
        });

        // For automation tab, add per-color auto painters
        if (tab === 'automation') {
            const ownedColors = Array.from(this.gameState.unlockedColors);
            for (const colorId of ownedColors) {
                const color = COLORS[colorId];
                if (!color) continue;

                const autoPainterId = `auto_painter_${colorId}`;
                const currentLevel = this.gameState.getUpgradeLevel(autoPainterId);
                const nextCost = getUpgradeCost(autoPainterId, currentLevel);
                const isMaxed = currentLevel >= AUTO_PAINTER_CONFIG.maxLevel;

                upgrades.push({
                    ...getAutoPainterUpgrade(colorId, color.name),
                    currentLevel,
                    nextCost,
                    isMaxed,
                    isOwned: currentLevel > 0,
                    meetsRequirements: true,
                    canAfford: this.gameState.money >= nextCost,
                    colorHex: color.hex
                });
            }

            // Sort: regular upgrades first, then auto painters by color name
            upgrades.sort((a, b) => {
                const aIsAuto = isAutoPainterUpgrade(a.id);
                const bIsAuto = isAutoPainterUpgrade(b.id);
                if (aIsAuto && !bIsAuto) return 1;
                if (!aIsAuto && bIsAuto) return -1;
                return a.priority - b.priority;
            });
        }

        if (this.hideOwned) {
            upgrades = upgrades.filter(u => !u.isMaxed);
        }

        if (upgrades.length === 0) {
            return '<p class="empty-state">All upgrades purchased!</p>';
        }

        return upgrades.map(upgrade => {
            const levelText = upgrade.isOwned
                ? `Level ${upgrade.currentLevel}/${upgrade.maxLevel}`
                : 'Not owned';
            const btnText = upgrade.isMaxed ? 'Maxed' : (upgrade.isOwned ? 'Upgrade' : 'Buy');
            const requiresText = upgrade.requires && !upgrade.meetsRequirements
                ? `<span class="missing-colors">Requires: ${upgrade.requires}</span>`
                : '';

            // Color swatch for auto painters
            const colorSwatch = upgrade.colorHex
                ? `<div style="background-color: ${upgrade.colorHex}; width: 16px; height: 16px; border-radius: 3px; margin-right: 6px; display: inline-block; vertical-align: middle;"></div>`
                : '';

            return `
                <div class="shop-item ${upgrade.canAfford && !upgrade.isMaxed ? '' : 'cant-afford'}">
                    <div class="item-info">
                        <span class="item-name">${colorSwatch}${upgrade.name}</span>
                        <span class="item-desc">${upgrade.description}</span>
                        <span class="item-level">${levelText}</span>
                        ${requiresText}
                    </div>
                    <div class="item-price">${upgrade.isMaxed ? '-' : '$' + this.formatNumber(upgrade.nextCost)}</div>
                    <button class="buy-btn" data-type="upgrade" data-id="${upgrade.id}"
                        ${upgrade.canAfford && !upgrade.isMaxed ? '' : 'disabled'}>${btnText}</button>
                </div>
            `;
        }).join('');
    }

    renderGridShop() {
        const currentLevel = this.gameState.gridLevel;
        let expansions = GRID_EXPANSIONS.filter(e => e.level > currentLevel);

        if (this.hideOwned) {
            // Grid expansions are sequential, so just show next few
            expansions = expansions.slice(0, 3);
        }

        if (expansions.length === 0) {
            return '<p class="empty-state">Maximum grid size reached!</p>';
        }

        const nextExpansion = expansions[0];
        const canAffordNext = this.gameState.money >= nextExpansion.cost;

        return expansions.map((expansion, index) => {
            const isNext = index === 0;
            const canAfford = isNext && canAffordNext;

            return `
                <div class="shop-item grid-expansion ${canAfford ? '' : 'cant-afford'}">
                    <div class="item-info">
                        <span class="item-name">${expansion.name}</span>
                        <span class="item-desc">Expand your grid to ${expansion.size}x${expansion.size}</span>
                        ${!isNext ? '<span class="item-level">Requires previous expansion</span>' : ''}
                    </div>
                    <div class="item-price">$${this.formatNumber(expansion.cost)}</div>
                    <button class="buy-btn" data-type="grid" data-id="${expansion.level}"
                        ${canAfford ? '' : 'disabled'}>${isNext ? 'Expand' : 'Locked'}</button>
                </div>
            `;
        }).join('');
    }

    handlePurchase(type, id) {
        let result;

        switch (type) {
            case 'color':
                result = this.shopSystem.buyColor(id);
                break;
            case 'upgrade':
                result = this.shopSystem.buyUpgrade(id);
                break;
            case 'grid':
                result = this.shopSystem.buyGridExpansion();
                if (result.success) {
                    this.showToast(`Grid expanded to ${result.size}x${result.size}!`, 'success');
                    this.renderAll();
                    return;
                }
                break;
        }

        if (result?.success) {
            this.showToast(`Purchased for $${this.formatNumber(result.price)}!`, 'success');
            this.renderShop();
        } else {
            this.showToast(result?.reason || 'Purchase failed', 'error');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}
