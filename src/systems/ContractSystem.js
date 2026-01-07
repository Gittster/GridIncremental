import { getRank, getMaxRank, canAccessRank, getMissingRequirements, getComplexityRange, getBaseReward } from '../data/ranks.js';
import { getRandomPhotoPattern, fitPatternToGrid } from '../data/photoPatterns.js';

/**
 * Generates contracts based on rank progression
 * Patterns are procedurally generated based on rank complexity
 */
export class ContractSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.contractIdCounter = 0;
        this.selectedRankLevel = null; // Player's currently selected rank for contracts
    }

    // Get the player's current highest accessible rank
    getHighestAccessibleRank() {
        const gridSize = Math.min(this.gameState.grid.width, this.gameState.grid.height);
        let highest = 1;

        for (let level = 1; level <= getMaxRank(); level++) {
            const rank = getRank(level);
            if (canAccessRank(rank, this.gameState.completedContracts, gridSize, this.gameState.unlockedColors)) {
                highest = level;
            } else {
                break; // Stop at first inaccessible rank
            }
        }

        return highest;
    }

    // Get all ranks the player can currently do contracts for
    getAvailableRanks() {
        const gridSize = Math.min(this.gameState.grid.width, this.gameState.grid.height);
        const available = [];

        for (let level = 1; level <= getMaxRank(); level++) {
            const rank = getRank(level);
            if (canAccessRank(rank, this.gameState.completedContracts, gridSize, this.gameState.unlockedColors)) {
                available.push(rank);
            }
        }

        return available;
    }

    // Get next rank requirements
    getNextRankRequirements() {
        const currentHighest = this.getHighestAccessibleRank();
        const nextRank = getRank(currentHighest + 1);

        if (!nextRank) return null;

        const gridSize = Math.min(this.gameState.grid.width, this.gameState.grid.height);
        return {
            rank: nextRank,
            missing: getMissingRequirements(nextRank, this.gameState.completedContracts, gridSize, this.gameState.unlockedColors)
        };
    }

    // Generate a contract for a specific rank
    generateContract(rankLevel = null) {
        // Default to highest accessible rank
        if (rankLevel === null) {
            rankLevel = this.getHighestAccessibleRank();
        }

        const rank = getRank(rankLevel);
        if (!rank) return null;

        // Check if player can access this rank
        const gridSize = Math.min(this.gameState.grid.width, this.gameState.grid.height);
        if (!canAccessRank(rank, this.gameState.completedContracts, gridSize, this.gameState.unlockedColors)) {
            return null;
        }

        // Generate pattern
        const pattern = this.generatePattern(rank, gridSize);
        const cellCount = this.countPatternCells(pattern);

        // Calculate reward
        const baseReward = getBaseReward(rank.patternComplexity);
        const moneyBoost = this.getMoneyBoostMultiplier();
        const reward = Math.floor(baseReward * rank.rewardMultiplier * moneyBoost * (cellCount / 4));

        const contract = {
            id: `contract_${++this.contractIdCounter}`,
            rankLevel: rank.level,
            rankName: rank.name,
            pattern: pattern,
            reward: Math.max(reward, 1),
            cellCount: cellCount,
            createdAt: Date.now()
        };

        return contract;
    }

    // Generate a procedural pattern based on rank
    generatePattern(rank, gridSize) {
        const width = this.gameState.grid.width;
        const height = this.gameState.grid.height;

        // Get colors for this rank
        const colors = rank.requiredColors.filter(c => this.gameState.hasColor(c));
        if (colors.length === 0) colors.push('black');

        // Try photo pattern for ranks that support it (with some randomness)
        if (rank.usePhotoPatterns && Math.random() < 0.4) {
            const photoPattern = getRandomPhotoPattern(gridSize, colors);
            if (photoPattern) {
                return fitPatternToGrid(photoPattern.pattern, width, height);
            }
        }

        // Create empty grid pattern
        const pattern = [];
        for (let y = 0; y < height; y++) {
            pattern.push(new Array(width).fill(null));
        }

        const complexity = getComplexityRange(rank.patternComplexity);
        const targetCells = complexity.min + Math.floor(Math.random() * (complexity.max - complexity.min + 1));

        // Choose pattern type randomly
        const patternTypes = this.getPatternTypesForComplexity(rank.patternComplexity);
        const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];

        // Generate the pattern - use mixed colors if rank supports it
        if (rank.mixColors && colors.length > 1) {
            this.generatePatternType(pattern, patternType, colors, targetCells);
        } else {
            // Single color mode - pick one color
            const singleColor = [colors[Math.floor(Math.random() * colors.length)]];
            this.generatePatternType(pattern, patternType, singleColor, targetCells);
        }

        return pattern;
    }

    getPatternTypesForComplexity(complexity) {
        switch (complexity) {
            case 'simple':
                return ['line', 'dot_cluster', 'corner'];
            case 'basic':
                return ['line', 'square', 'L_shape', 'diagonal'];
            case 'medium':
                return ['square', 'L_shape', 'T_shape', 'cross', 'diagonal'];
            case 'complex':
                return ['hollow_square', 'cross', 'zigzag', 'scattered', 'frame_partial'];
            case 'advanced':
                return ['hollow_square', 'multi_shape', 'checkerboard_partial', 'spiral_partial'];
            case 'expert':
                return ['complex_shape', 'multi_color_pattern', 'large_hollow', 'maze_section'];
            case 'master':
                return ['massive_pattern', 'intricate_design', 'full_artwork'];
            default:
                return ['line', 'square'];
        }
    }

    generatePatternType(pattern, type, colors, targetCells) {
        const h = pattern.length;
        const w = pattern[0].length;

        switch (type) {
            case 'line':
                this.generateLine(pattern, colors, targetCells);
                break;
            case 'dot_cluster':
                this.generateDotCluster(pattern, colors, targetCells);
                break;
            case 'corner':
                this.generateCorner(pattern, colors, targetCells);
                break;
            case 'square':
                this.generateSquare(pattern, colors, targetCells);
                break;
            case 'L_shape':
                this.generateLShape(pattern, colors, targetCells);
                break;
            case 'T_shape':
                this.generateTShape(pattern, colors, targetCells);
                break;
            case 'cross':
                this.generateCross(pattern, colors, targetCells);
                break;
            case 'diagonal':
                this.generateDiagonal(pattern, colors, targetCells);
                break;
            case 'hollow_square':
                this.generateHollowSquare(pattern, colors, targetCells);
                break;
            case 'zigzag':
                this.generateZigzag(pattern, colors, targetCells);
                break;
            case 'scattered':
                this.generateScattered(pattern, colors, targetCells);
                break;
            case 'frame_partial':
                this.generateFramePartial(pattern, colors, targetCells);
                break;
            case 'checkerboard_partial':
                this.generateCheckerboardPartial(pattern, colors, targetCells);
                break;
            default:
                this.generateScattered(pattern, colors, targetCells);
        }
    }

    // Pattern generators
    generateLine(pattern, colors, targetCells) {
        const h = pattern.length;
        const w = pattern[0].length;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const horizontal = Math.random() > 0.5;
        const length = Math.min(targetCells, horizontal ? w : h);

        if (horizontal) {
            const y = Math.floor(Math.random() * h);
            const startX = Math.floor(Math.random() * (w - length + 1));
            for (let i = 0; i < length; i++) {
                pattern[y][startX + i] = color;
            }
        } else {
            const x = Math.floor(Math.random() * w);
            const startY = Math.floor(Math.random() * (h - length + 1));
            for (let i = 0; i < length; i++) {
                pattern[startY + i][x] = color;
            }
        }
    }

    generateDotCluster(pattern, colors, targetCells) {
        const h = pattern.length;
        const w = pattern[0].length;
        const centerX = Math.floor(Math.random() * w);
        const centerY = Math.floor(Math.random() * h);
        let placed = 0;

        for (let radius = 0; radius <= 2 && placed < targetCells; radius++) {
            for (let dy = -radius; dy <= radius && placed < targetCells; dy++) {
                for (let dx = -radius; dx <= radius && placed < targetCells; dx++) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    if (x >= 0 && x < w && y >= 0 && y < h && pattern[y][x] === null) {
                        pattern[y][x] = colors[Math.floor(Math.random() * colors.length)];
                        placed++;
                    }
                }
            }
        }
    }

    generateCorner(pattern, colors, targetCells) {
        const h = pattern.length;
        const w = pattern[0].length;
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Pick a corner
        const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
        const [cx, cy] = corners[Math.floor(Math.random() * corners.length)];
        const dx = cx === 0 ? 1 : -1;
        const dy = cy === 0 ? 1 : -1;

        let placed = 0;
        for (let i = 0; i < 3 && placed < targetCells; i++) {
            const x = cx + dx * i;
            const y = cy;
            if (x >= 0 && x < w) {
                pattern[y][x] = color;
                placed++;
            }
        }
        for (let i = 1; i < 3 && placed < targetCells; i++) {
            const x = cx;
            const y = cy + dy * i;
            if (y >= 0 && y < h) {
                pattern[y][x] = color;
                placed++;
            }
        }
    }

    generateSquare(pattern, colors, targetCells) {
        const h = pattern.length;
        const w = pattern[0].length;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.ceil(Math.sqrt(targetCells));
        const actualSize = Math.min(size, h, w);

        const startX = Math.floor(Math.random() * (w - actualSize + 1));
        const startY = Math.floor(Math.random() * (h - actualSize + 1));

        let placed = 0;
        for (let dy = 0; dy < actualSize && placed < targetCells; dy++) {
            for (let dx = 0; dx < actualSize && placed < targetCells; dx++) {
                pattern[startY + dy][startX + dx] = color;
                placed++;
            }
        }
    }

    generateLShape(pattern, colors, targetCells) {
        const h = pattern.length;
        const w = pattern[0].length;
        const color = colors[Math.floor(Math.random() * colors.length)];

        const armLength = Math.ceil(targetCells / 2);
        const startX = Math.floor(Math.random() * (w - armLength));
        const startY = Math.floor(Math.random() * (h - armLength));

        let placed = 0;
        // Vertical arm
        for (let i = 0; i < armLength && placed < targetCells; i++) {
            pattern[startY + i][startX] = color;
            placed++;
        }
        // Horizontal arm
        for (let i = 1; i < armLength && placed < targetCells; i++) {
            pattern[startY + armLength - 1][startX + i] = color;
            placed++;
        }
    }

    generateTShape(pattern, colors, targetCells) {
        const h = pattern.length;
        const w = pattern[0].length;
        const color = colors[Math.floor(Math.random() * colors.length)];

        const armLength = Math.ceil(targetCells / 4) + 1;
        const centerX = Math.floor(w / 2);
        const centerY = Math.floor(h / 2);

        let placed = 0;
        // Horizontal top
        for (let i = -armLength; i <= armLength && placed < targetCells; i++) {
            const x = centerX + i;
            if (x >= 0 && x < w) {
                pattern[centerY][x] = color;
                placed++;
            }
        }
        // Vertical stem
        for (let i = 1; i <= armLength && placed < targetCells; i++) {
            const y = centerY + i;
            if (y < h) {
                pattern[y][centerX] = color;
                placed++;
            }
        }
    }

    generateCross(pattern, colors, targetCells) {
        const h = pattern.length;
        const w = pattern[0].length;
        const color = colors[Math.floor(Math.random() * colors.length)];

        const centerX = Math.floor(w / 2);
        const centerY = Math.floor(h / 2);
        const armLength = Math.ceil(targetCells / 4);

        let placed = 0;
        // Center
        pattern[centerY][centerX] = color;
        placed++;

        // Arms
        for (let i = 1; i <= armLength && placed < targetCells; i++) {
            if (centerY - i >= 0) { pattern[centerY - i][centerX] = color; placed++; }
            if (placed >= targetCells) break;
            if (centerY + i < h) { pattern[centerY + i][centerX] = color; placed++; }
            if (placed >= targetCells) break;
            if (centerX - i >= 0) { pattern[centerY][centerX - i] = color; placed++; }
            if (placed >= targetCells) break;
            if (centerX + i < w) { pattern[centerY][centerX + i] = color; placed++; }
        }
    }

    generateDiagonal(pattern, colors, targetCells) {
        const h = pattern.length;
        const w = pattern[0].length;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const direction = Math.random() > 0.5 ? 1 : -1;

        const startX = direction > 0 ? 0 : w - 1;
        const startY = Math.floor(Math.random() * (h - targetCells));

        for (let i = 0; i < targetCells; i++) {
            const x = startX + direction * i;
            const y = startY + i;
            if (x >= 0 && x < w && y >= 0 && y < h) {
                pattern[y][x] = color;
            }
        }
    }

    generateHollowSquare(pattern, colors, targetCells) {
        const h = pattern.length;
        const w = pattern[0].length;
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Size based on perimeter = targetCells, so side = (targetCells + 4) / 4
        const side = Math.max(3, Math.ceil((targetCells + 4) / 4));
        const actualSide = Math.min(side, h, w);

        const startX = Math.floor(Math.random() * (w - actualSide + 1));
        const startY = Math.floor(Math.random() * (h - actualSide + 1));

        let placed = 0;
        for (let i = 0; i < actualSide && placed < targetCells; i++) {
            pattern[startY][startX + i] = color; placed++;
            if (placed >= targetCells) break;
            pattern[startY + actualSide - 1][startX + i] = color; placed++;
        }
        for (let i = 1; i < actualSide - 1 && placed < targetCells; i++) {
            pattern[startY + i][startX] = color; placed++;
            if (placed >= targetCells) break;
            pattern[startY + i][startX + actualSide - 1] = color; placed++;
        }
    }

    generateZigzag(pattern, colors, targetCells) {
        const h = pattern.length;
        const w = pattern[0].length;
        const color = colors[Math.floor(Math.random() * colors.length)];

        let x = Math.floor(Math.random() * (w - 2));
        let y = 0;
        let direction = 1;
        let placed = 0;

        while (placed < targetCells && y < h) {
            pattern[y][x] = color;
            placed++;
            y++;
            x += direction;
            if (x >= w - 1 || x <= 0) direction *= -1;
        }
    }

    generateScattered(pattern, colors, targetCells) {
        const h = pattern.length;
        const w = pattern[0].length;
        let placed = 0;

        while (placed < targetCells) {
            const x = Math.floor(Math.random() * w);
            const y = Math.floor(Math.random() * h);
            if (pattern[y][x] === null) {
                pattern[y][x] = colors[Math.floor(Math.random() * colors.length)];
                placed++;
            }
        }
    }

    generateFramePartial(pattern, colors, targetCells) {
        const h = pattern.length;
        const w = pattern[0].length;
        const color = colors[Math.floor(Math.random() * colors.length)];
        let placed = 0;

        // Top and bottom partial
        for (let x = 0; x < w && placed < targetCells / 2; x += 2) {
            pattern[0][x] = color; placed++;
            if (h > 1) { pattern[h - 1][x] = color; placed++; }
        }
        // Left and right partial
        for (let y = 1; y < h - 1 && placed < targetCells; y += 2) {
            pattern[y][0] = color; placed++;
            if (w > 1) { pattern[y][w - 1] = color; placed++; }
        }
    }

    generateCheckerboardPartial(pattern, colors, targetCells) {
        const h = pattern.length;
        const w = pattern[0].length;
        const color1 = colors[0];
        const color2 = colors.length > 1 ? colors[1] : colors[0];

        let placed = 0;
        const centerX = Math.floor(w / 2);
        const centerY = Math.floor(h / 2);
        const radius = Math.ceil(Math.sqrt(targetCells / 2));

        for (let dy = -radius; dy <= radius && placed < targetCells; dy++) {
            for (let dx = -radius; dx <= radius && placed < targetCells; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (x >= 0 && x < w && y >= 0 && y < h) {
                    pattern[y][x] = (x + y) % 2 === 0 ? color1 : color2;
                    placed++;
                }
            }
        }
    }

    countPatternCells(pattern) {
        let count = 0;
        for (const row of pattern) {
            for (const cell of row) {
                if (cell !== null) count++;
            }
        }
        return count;
    }

    getMoneyBoostMultiplier() {
        const level = this.gameState.upgrades['money_boost'] || 0;
        return 1 + (level * 0.15);
    }

    // Accept a new contract
    acceptContract(rankLevel = null) {
        if (this.gameState.activeContract) {
            return { success: false, reason: 'Already have an active contract' };
        }

        // Use selected rank if no specific rank provided
        const targetRank = rankLevel ?? this.selectedRankLevel ?? this.getHighestAccessibleRank();
        const contract = this.generateContract(targetRank);
        if (!contract) {
            return { success: false, reason: 'Cannot access this rank' };
        }

        this.gameState.setActiveContract(contract);
        return { success: true, contract };
    }

    // Abandon current contract
    abandonContract() {
        if (!this.gameState.activeContract) {
            return { success: false, reason: 'No active contract' };
        }

        this.gameState.clearContract();
        return { success: true };
    }

    // Get progress on current contract
    getProgress() {
        const contract = this.gameState.activeContract;
        if (!contract) return null;

        let correct = 0;
        let wrong = 0;

        for (let y = 0; y < this.gameState.grid.height; y++) {
            for (let x = 0; x < this.gameState.grid.width; x++) {
                const expected = contract.pattern[y]?.[x];
                const actual = this.gameState.grid.getCell(x, y);

                if (expected !== null) {
                    if (expected === actual) {
                        correct++;
                    }
                } else if (actual !== null) {
                    wrong++; // Cell filled but should be empty
                }
            }
        }

        return {
            correct,
            wrong,
            total: contract.cellCount,
            percent: contract.cellCount > 0 ? Math.round((correct / contract.cellCount) * 100) : 0
        };
    }

    canAcceptContract() {
        return !this.gameState.activeContract;
    }
}
