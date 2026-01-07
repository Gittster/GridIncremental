import { getColorHex } from '../data/colors.js';

/**
 * Canvas-based grid renderer with viewport for large grid support
 * Supports pan/zoom for grids up to 1000x1000+
 */
export class GridRenderer {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameState = gameState;
        this.grid = gameState.grid;

        // Viewport settings
        this.viewportX = 0; // Top-left corner of viewport in grid coords
        this.viewportY = 0;
        this.cellSize = 40; // Base cell size
        this.minCellSize = 4;
        this.maxCellSize = 80;

        // Canvas size
        this.canvasWidth = 600;
        this.canvasHeight = 600;

        // Colors
        this.gridLineColor = '#444';
        this.emptyColor = '#2a2a2a';
        this.hoverColor = 'rgba(255, 255, 255, 0.15)';

        // Interaction state
        this.isDrawing = false;
        this.isErasing = false;
        this.isPanning = false;
        this.hoveredCell = null;
        this.lastDrawnCell = null;
        this.lastPanPoint = null;

        // Animation
        this.animationFrame = null;
        this.needsRedraw = true;

        this.setupCanvas();
        this.setupEvents();
        this.subscribeToState();
        this.startRenderLoop();
    }

    setupCanvas() {
        // Set canvas size
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        this.canvas.style.width = `${this.canvasWidth}px`;
        this.canvas.style.height = `${this.canvasHeight}px`;

        this.ctx.imageSmoothingEnabled = false;
        this.fitGridToView();
    }

    // Fit the entire grid in view, centered
    fitGridToView() {
        const gridW = this.grid.width;
        const gridH = this.grid.height;

        // Calculate cell size to fit grid with some padding
        const padding = 20; // pixels of padding
        const availableW = this.canvasWidth - padding * 2;
        const availableH = this.canvasHeight - padding * 2;

        const cellSizeW = availableW / gridW;
        const cellSizeH = availableH / gridH;
        this.cellSize = Math.max(this.minCellSize, Math.min(this.maxCellSize, Math.floor(Math.min(cellSizeW, cellSizeH))));

        // Center the grid in the canvas
        const gridPixelW = gridW * this.cellSize;
        const gridPixelH = gridH * this.cellSize;
        const offsetX = (this.canvasWidth - gridPixelW) / 2;
        const offsetY = (this.canvasHeight - gridPixelH) / 2;

        // Convert pixel offset to grid coordinate offset (negative = grid starts inside canvas)
        this.viewportX = -offsetX / this.cellSize;
        this.viewportY = -offsetY / this.cellSize;

        this.needsRedraw = true;
    }

    setupEvents() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

        // Touch support
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    }

    subscribeToState() {
        this.grid.on('cellChanged', () => this.needsRedraw = true);
        this.grid.on('cellsChanged', () => this.needsRedraw = true);
        this.grid.on('gridCleared', () => this.needsRedraw = true);
        this.grid.on('gridLoaded', () => {
            this.fitGridToView();
            this.needsRedraw = true;
        });
        this.grid.on('gridResized', () => {
            this.fitGridToView();
            this.needsRedraw = true;
        });
        this.gameState.on('contractStarted', () => this.needsRedraw = true);
        this.gameState.on('contractCleared', () => this.needsRedraw = true);
        this.gameState.on('contractCompleted', () => this.needsRedraw = true);
    }

    // Convert screen coords to grid coords
    screenToGrid(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (screenX - rect.left) * (this.canvas.width / rect.width);
        const canvasY = (screenY - rect.top) * (this.canvas.height / rect.height);

        const gridX = Math.floor(canvasX / this.cellSize + this.viewportX);
        const gridY = Math.floor(canvasY / this.cellSize + this.viewportY);

        return { x: gridX, y: gridY };
    }

    // Convert grid coords to canvas coords
    gridToCanvas(gridX, gridY) {
        return {
            x: (gridX - this.viewportX) * this.cellSize,
            y: (gridY - this.viewportY) * this.cellSize
        };
    }

    // Check if hold-to-paint is enabled
    canDragPaint() {
        return this.gameState.hasUpgrade('hold_to_paint');
    }

    handleMouseDown(event) {
        const { x, y } = this.screenToGrid(event.clientX, event.clientY);

        if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
            // Middle click or shift+click = pan
            this.isPanning = true;
            this.lastPanPoint = { x: event.clientX, y: event.clientY };
            this.canvas.style.cursor = 'grabbing';
        } else if (event.button === 2) {
            // Right click = erase
            this.isErasing = true;
            if (this.grid.isValid(x, y)) {
                this.grid.setCell(x, y, null);
            }
        } else if (event.button === 0) {
            // Left click = draw
            this.isDrawing = true;
            if (this.grid.isValid(x, y)) {
                this.grid.setCell(x, y, this.gameState.selectedColor);
            }
        }

        this.lastDrawnCell = { x, y };
    }

    handleMouseMove(event) {
        const { x, y } = this.screenToGrid(event.clientX, event.clientY);

        if (this.isPanning && this.lastPanPoint) {
            const dx = (event.clientX - this.lastPanPoint.x) / this.cellSize;
            const dy = (event.clientY - this.lastPanPoint.y) / this.cellSize;

            this.viewportX -= dx;
            this.viewportY -= dy;
            this.clampViewport();

            this.lastPanPoint = { x: event.clientX, y: event.clientY };
            this.needsRedraw = true;
            return;
        }

        // Update hover
        if (!this.hoveredCell || this.hoveredCell.x !== x || this.hoveredCell.y !== y) {
            this.hoveredCell = { x, y };
            this.needsRedraw = true;
        }

        // Drag painting (only if upgrade purchased)
        if (this.canDragPaint() && this.grid.isValid(x, y)) {
            if (this.isDrawing || this.isErasing) {
                if (!this.lastDrawnCell || this.lastDrawnCell.x !== x || this.lastDrawnCell.y !== y) {
                    if (this.isErasing) {
                        this.grid.setCell(x, y, null);
                    } else {
                        this.grid.setCell(x, y, this.gameState.selectedColor);
                    }
                    this.lastDrawnCell = { x, y };
                }
            }
        }
    }

    handleMouseUp() {
        this.isDrawing = false;
        this.isErasing = false;
        this.isPanning = false;
        this.lastDrawnCell = null;
        this.lastPanPoint = null;
        this.canvas.style.cursor = 'crosshair';
    }

    handleMouseLeave() {
        this.hoveredCell = null;
        this.isDrawing = false;
        this.isErasing = false;
        this.isPanning = false;
        this.needsRedraw = true;
    }

    handleWheel(event) {
        event.preventDefault();

        const { x: mouseGridX, y: mouseGridY } = this.screenToGrid(event.clientX, event.clientY);

        // Zoom
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        const newCellSize = Math.max(this.minCellSize, Math.min(this.maxCellSize, this.cellSize * zoomFactor));

        if (newCellSize !== this.cellSize) {
            // Adjust viewport to zoom toward mouse position
            const scaleFactor = newCellSize / this.cellSize;
            this.viewportX = mouseGridX - (mouseGridX - this.viewportX) / scaleFactor;
            this.viewportY = mouseGridY - (mouseGridY - this.viewportY) / scaleFactor;

            this.cellSize = newCellSize;
            this.clampViewport();

            this.needsRedraw = true;
        }
    }

    // Clamp viewport to keep grid reasonably in view
    clampViewport() {
        const viewportCellsW = this.canvasWidth / this.cellSize;
        const viewportCellsH = this.canvasHeight / this.cellSize;

        // Allow some margin but keep at least part of grid visible
        const margin = 1; // cells of margin allowed outside grid
        const minX = -viewportCellsW + margin;
        const minY = -viewportCellsH + margin;
        const maxX = this.grid.width - margin;
        const maxY = this.grid.height - margin;

        this.viewportX = Math.max(minX, Math.min(maxX, this.viewportX));
        this.viewportY = Math.max(minY, Math.min(maxY, this.viewportY));
    }

    // Touch handlers
    handleTouchStart(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0 });
        } else if (event.touches.length === 2) {
            // Two finger = pan
            this.isPanning = true;
            const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
            const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
            this.lastPanPoint = { x: midX, y: midY };
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
        if (event.touches.length === 1 && !this.isPanning) {
            const touch = event.touches[0];
            this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        } else if (event.touches.length === 2 || this.isPanning) {
            const midX = (event.touches[0].clientX + (event.touches[1]?.clientX || event.touches[0].clientX)) / 2;
            const midY = (event.touches[0].clientY + (event.touches[1]?.clientY || event.touches[0].clientY)) / 2;
            this.handleMouseMove({ clientX: midX, clientY: midY, shiftKey: true });
        }
    }

    handleTouchEnd(event) {
        event.preventDefault();
        this.handleMouseUp();
    }

    // Render loop
    startRenderLoop() {
        const render = () => {
            if (this.needsRedraw) {
                this.render();
                this.needsRedraw = false;
            }
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
    }

    stopRenderLoop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    render() {
        const ctx = this.ctx;
        const cellSize = this.cellSize;

        // Clear canvas with darker background (outside grid area)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Get grid bounds in canvas coords
        const gridStart = this.gridToCanvas(0, 0);
        const gridEnd = this.gridToCanvas(this.grid.width, this.grid.height);

        // Clamp to canvas bounds
        const gridLeft = Math.max(0, gridStart.x);
        const gridTop = Math.max(0, gridStart.y);
        const gridRight = Math.min(this.canvasWidth, gridEnd.x);
        const gridBottom = Math.min(this.canvasHeight, gridEnd.y);

        // Fill grid area with empty cell color
        ctx.fillStyle = this.emptyColor;
        ctx.fillRect(gridLeft, gridTop, gridRight - gridLeft, gridBottom - gridTop);

        // Calculate visible grid range (clamped to grid bounds)
        const startX = Math.max(0, Math.floor(this.viewportX));
        const startY = Math.max(0, Math.floor(this.viewportY));
        const endX = Math.min(this.grid.width, Math.ceil(this.viewportX + this.canvasWidth / cellSize));
        const endY = Math.min(this.grid.height, Math.ceil(this.viewportY + this.canvasHeight / cellSize));

        // Draw contract overlay first
        if (this.gameState.activeContract) {
            this.renderContractOverlay(startX, startY, endX, endY);
        }

        // Draw filled cells
        const visibleCells = this.grid.getCellsInRegion(startX, startY, endX, endY);
        for (const { x, y, color } of visibleCells) {
            const pos = this.gridToCanvas(x, y);
            ctx.fillStyle = getColorHex(color);
            ctx.fillRect(
                pos.x + 1,
                pos.y + 1,
                cellSize - 2,
                cellSize - 2
            );
        }

        // Draw grid lines (only within grid bounds, only if cells are big enough)
        if (cellSize >= 8) {
            ctx.strokeStyle = this.gridLineColor;
            ctx.lineWidth = 1;

            // Vertical lines - only within grid area
            for (let gx = startX; gx <= endX; gx++) {
                const pos = this.gridToCanvas(gx, 0);
                if (pos.x >= gridLeft && pos.x <= gridRight) {
                    ctx.beginPath();
                    ctx.moveTo(pos.x, gridTop);
                    ctx.lineTo(pos.x, gridBottom);
                    ctx.stroke();
                }
            }

            // Horizontal lines - only within grid area
            for (let gy = startY; gy <= endY; gy++) {
                const pos = this.gridToCanvas(0, gy);
                if (pos.y >= gridTop && pos.y <= gridBottom) {
                    ctx.beginPath();
                    ctx.moveTo(gridLeft, pos.y);
                    ctx.lineTo(gridRight, pos.y);
                    ctx.stroke();
                }
            }
        }

        // Draw hover (only if within grid)
        if (this.hoveredCell && this.grid.isValid(this.hoveredCell.x, this.hoveredCell.y)) {
            const pos = this.gridToCanvas(this.hoveredCell.x, this.hoveredCell.y);
            ctx.fillStyle = this.hoverColor;
            ctx.fillRect(pos.x, pos.y, cellSize, cellSize);

            // Preview selected color
            ctx.strokeStyle = getColorHex(this.gameState.selectedColor);
            ctx.lineWidth = 2;
            ctx.strokeRect(pos.x + 3, pos.y + 3, cellSize - 6, cellSize - 6);
        }

        // Draw grid boundary with prominent border
        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth = 3;
        ctx.strokeRect(gridStart.x, gridStart.y, gridEnd.x - gridStart.x, gridEnd.y - gridStart.y);
    }

    renderContractOverlay(startX, startY, endX, endY) {
        const ctx = this.ctx;
        const contract = this.gameState.activeContract;
        const pattern = contract.pattern;
        const cellSize = this.cellSize;

        for (let y = startY; y < Math.min(endY, this.grid.height); y++) {
            for (let x = startX; x < Math.min(endX, this.grid.width); x++) {
                const expected = pattern[y]?.[x];
                const actual = this.grid.getCell(x, y);
                const pos = this.gridToCanvas(x, y);

                if (expected !== null && expected !== undefined) {
                    const isCorrect = expected === actual;

                    if (!isCorrect) {
                        // Show faded preview
                        ctx.fillStyle = getColorHex(expected);
                        ctx.globalAlpha = 0.25;
                        ctx.fillRect(pos.x + 1, pos.y + 1, cellSize - 2, cellSize - 2);
                        ctx.globalAlpha = 1;

                        // Dashed outline
                        if (cellSize >= 12) {
                            ctx.strokeStyle = getColorHex(expected);
                            ctx.lineWidth = 2;
                            ctx.setLineDash([3, 3]);
                            ctx.strokeRect(pos.x + 3, pos.y + 3, cellSize - 6, cellSize - 6);
                            ctx.setLineDash([]);
                        }
                    } else {
                        // Correct - green border
                        ctx.strokeStyle = '#4ecdc4';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(pos.x + 2, pos.y + 2, cellSize - 4, cellSize - 4);
                    }
                } else {
                    // Cell should be empty
                    if (actual !== null) {
                        // Wrong - red X
                        ctx.strokeStyle = '#e94560';
                        ctx.lineWidth = 2;
                        const margin = Math.max(4, cellSize / 4);
                        ctx.beginPath();
                        ctx.moveTo(pos.x + margin, pos.y + margin);
                        ctx.lineTo(pos.x + cellSize - margin, pos.y + cellSize - margin);
                        ctx.moveTo(pos.x + cellSize - margin, pos.y + margin);
                        ctx.lineTo(pos.x + margin, pos.y + cellSize - margin);
                        ctx.stroke();
                    }
                }
            }
        }
    }

    forceRedraw() {
        this.needsRedraw = true;
    }

    destroy() {
        this.stopRenderLoop();
    }
}
