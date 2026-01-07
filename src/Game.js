import { GameState } from './core/GameState.js';
import { SaveManager } from './core/SaveManager.js';
import { GridRenderer } from './ui/GridRenderer.js';
import { UIManager } from './ui/UIManager.js';
import { ContractSystem } from './systems/ContractSystem.js';
import { ShopSystem } from './systems/ShopSystem.js';
import { AutoPainterSystem } from './systems/AutoPainterSystem.js';

/**
 * Main game class - orchestrates all systems
 */
export class Game {
    constructor() {
        this.gameState = new GameState();
        this.saveManager = new SaveManager(this.gameState);

        // Initialize systems
        this.contractSystem = new ContractSystem(this.gameState);
        this.shopSystem = new ShopSystem(this.gameState);
        this.autoPainterSystem = new AutoPainterSystem(this.gameState);

        // UI components (initialized after DOM ready)
        this.gridRenderer = null;
        this.uiManager = null;

        this.isRunning = false;
    }

    async init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            await new Promise(resolve =>
                document.addEventListener('DOMContentLoaded', resolve)
            );
        }

        // Get canvas element
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }

        // Try to load saved game first (before creating renderer)
        const hasSave = this.saveManager.hasSave();
        if (hasSave) {
            console.log('Loading saved game...');
            this.saveManager.load();
        }

        // Initialize renderer (after potential grid resize from save)
        this.gridRenderer = new GridRenderer(canvas, this.gameState);

        // Initialize UI
        this.uiManager = new UIManager(this);

        // New game setup
        if (!hasSave) {
            // Give starting money for new games
            this.gameState.addMoney(10);
        }

        // Start auto-save
        this.saveManager.startAutoSave(30000);

        // Start auto painter system
        this.autoPainterSystem.start();

        // Handle page visibility for pausing
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });

        // Handle before unload
        window.addEventListener('beforeunload', () => {
            this.saveManager.save();
        });

        this.isRunning = true;
        console.log('Grid Incremental initialized!');
    }

    pause() {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.autoPainterSystem.stop();
    }

    resume() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.autoPainterSystem.start();
    }

    // Debug/cheat methods for testing (access via window.game.debug)
    get debug() {
        return {
            addMoney: (amount) => this.gameState.addMoney(amount),
            unlockAllColors: () => {
                import('./data/colors.js').then(({ COLORS }) => {
                    Object.keys(COLORS).forEach(id => this.gameState.unlockColor(id));
                });
            },
            expandGrid: () => {
                const result = this.shopSystem.buyGridExpansion();
                console.log(result);
            },
            completeContracts: (count = 10) => {
                this.gameState.completedContracts += count;
                console.log(`Completed ${count} contracts. Total: ${this.gameState.completedContracts}`);
            },
            clearSave: () => {
                this.saveManager.deleteSave();
                location.reload();
            },
            getState: () => this.gameState.serialize()
        };
    }
}

// Export for use in main.js
export default Game;
