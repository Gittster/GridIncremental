import { EventEmitter } from './EventEmitter.js';

/**
 * Grid data structure - uses sparse Map storage for scalability to large sizes
 * Only stores non-empty cells, making 1000x1000 grids efficient
 */
export class Grid extends EventEmitter {
    constructor(width = 4, height = 4) {
        super();
        this.width = width;
        this.height = height;
        // Sparse storage: only store filled cells
        this.cells = new Map(); // key: "x,y" -> value: color
        this.history = [];
        this.maxHistory = 50;
    }

    // Key generation for Map
    _key(x, y) {
        return `${x},${y}`;
    }

    // Expand the grid
    expand(newWidth, newHeight) {
        if (newWidth < this.width || newHeight < this.height) {
            console.warn('Cannot shrink grid');
            return false;
        }

        this.width = newWidth;
        this.height = newHeight;
        this.history = [];

        this.emit('gridResized', { width: newWidth, height: newHeight });
        return true;
    }

    // Check if coords are valid
    isValid(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    // Get cell color at position (null if empty)
    getCell(x, y) {
        if (!this.isValid(x, y)) return null;
        return this.cells.get(this._key(x, y)) || null;
    }

    // Set cell color at position
    setCell(x, y, color, recordHistory = true) {
        if (!this.isValid(x, y)) return false;

        const key = this._key(x, y);
        const oldColor = this.cells.get(key) || null;

        if (oldColor === color) return false;

        if (recordHistory) {
            this.history.push({ x, y, oldColor, newColor: color });
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
        }

        if (color === null) {
            this.cells.delete(key);
        } else {
            this.cells.set(key, color);
        }

        this.emit('cellChanged', { x, y, color, oldColor });
        return true;
    }

    // Set multiple cells at once
    setCells(changes, recordHistory = true) {
        const actualChanges = [];

        for (const { x, y, color } of changes) {
            if (!this.isValid(x, y)) continue;

            const key = this._key(x, y);
            const oldColor = this.cells.get(key) || null;

            if (oldColor === color) continue;

            if (recordHistory) {
                this.history.push({ x, y, oldColor, newColor: color });
            }

            if (color === null) {
                this.cells.delete(key);
            } else {
                this.cells.set(key, color);
            }

            actualChanges.push({ x, y, color, oldColor });
        }

        if (this.history.length > this.maxHistory) {
            this.history.splice(0, this.history.length - this.maxHistory);
        }

        if (actualChanges.length > 0) {
            this.emit('cellsChanged', actualChanges);
        }

        return actualChanges.length;
    }

    // Undo last change
    undo() {
        if (this.history.length === 0) return false;

        const { x, y, oldColor } = this.history.pop();
        const key = this._key(x, y);

        if (oldColor === null) {
            this.cells.delete(key);
        } else {
            this.cells.set(key, oldColor);
        }

        this.emit('cellChanged', { x, y, color: oldColor });
        return true;
    }

    // Clear entire grid
    clear() {
        if (this.cells.size === 0) return;

        this.cells.clear();
        this.history = [];
        this.emit('gridCleared');
    }

    // Get all filled cells in a region (for viewport rendering)
    getCellsInRegion(startX, startY, endX, endY) {
        const result = [];

        // Clamp to grid bounds
        startX = Math.max(0, Math.floor(startX));
        startY = Math.max(0, Math.floor(startY));
        endX = Math.min(this.width, Math.ceil(endX));
        endY = Math.min(this.height, Math.ceil(endY));

        // For small regions or sparse grids, iterate stored cells
        if (this.cells.size < (endX - startX) * (endY - startY) / 2) {
            for (const [key, color] of this.cells) {
                const [x, y] = key.split(',').map(Number);
                if (x >= startX && x < endX && y >= startY && y < endY) {
                    result.push({ x, y, color });
                }
            }
        } else {
            // For dense regions, check each cell
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const color = this.cells.get(this._key(x, y));
                    if (color) {
                        result.push({ x, y, color });
                    }
                }
            }
        }

        return result;
    }

    // Count cells of a specific color
    countColor(color) {
        let count = 0;
        for (const c of this.cells.values()) {
            if (c === color) count++;
        }
        return count;
    }

    // Get total filled cells
    getFilledCount() {
        return this.cells.size;
    }

    // Get all non-empty cells
    getFilledCells() {
        const filled = [];
        for (const [key, color] of this.cells) {
            const [x, y] = key.split(',').map(Number);
            filled.push({ x, y, color });
        }
        return filled;
    }

    // Serialize grid state (sparse format for large grids)
    serialize() {
        // Convert Map to array for JSON
        const cellArray = [];
        for (const [key, color] of this.cells) {
            const [x, y] = key.split(',').map(Number);
            cellArray.push([x, y, color]);
        }

        return {
            width: this.width,
            height: this.height,
            cells: cellArray
        };
    }

    // Deserialize grid state
    deserialize(data) {
        this.width = data.width || 4;
        this.height = data.height || 4;
        this.cells.clear();
        this.history = [];

        // Load cells from array format
        if (Array.isArray(data.cells)) {
            if (data.cells.length > 0 && Array.isArray(data.cells[0])) {
                // New sparse format: [[x, y, color], ...]
                for (const [x, y, color] of data.cells) {
                    if (color !== null) {
                        this.cells.set(this._key(x, y), color);
                    }
                }
            } else {
                // Old flat array format
                for (let i = 0; i < data.cells.length; i++) {
                    if (data.cells[i] !== null) {
                        const x = i % this.width;
                        const y = Math.floor(i / this.width);
                        this.cells.set(this._key(x, y), data.cells[i]);
                    }
                }
            }
        }

        this.emit('gridLoaded');
    }
}
