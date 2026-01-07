/**
 * Handles game save/load with localStorage
 */
export class SaveManager {
    constructor(gameState, saveKey = 'gridIncrementalSave') {
        this.gameState = gameState;
        this.saveKey = saveKey;
        this.autoSaveInterval = null;
    }

    save() {
        try {
            const data = this.gameState.serialize();
            data.savedAt = Date.now();
            localStorage.setItem(this.saveKey, JSON.stringify(data));
            console.log('Game saved');
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(this.saveKey);
            if (!raw) return false;

            const data = JSON.parse(raw);
            return this.gameState.deserialize(data);
        } catch (e) {
            console.error('Failed to load game:', e);
            return false;
        }
    }

    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    deleteSave() {
        localStorage.removeItem(this.saveKey);
        console.log('Save deleted');
    }

    exportSave() {
        const data = this.gameState.serialize();
        data.savedAt = Date.now();
        return btoa(JSON.stringify(data));
    }

    importSave(encodedData) {
        try {
            const data = JSON.parse(atob(encodedData));
            return this.gameState.deserialize(data);
        } catch (e) {
            console.error('Failed to import save:', e);
            return false;
        }
    }

    startAutoSave(intervalMs = 30000) {
        this.stopAutoSave();
        this.autoSaveInterval = setInterval(() => this.save(), intervalMs);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
}
