// Cyber AI Snake Pathfinding & Threat Avoidance Controller

class CyberAiController {
    constructor() {
        this.directions = [
            { x: 0, y: -1 }, // Up
            { x: 1, y: 0 },  // Right
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }  // Left
        ];
    }

    /**
     * Decides the next move for an AI snake.
     */
    think(snake, allSnakes, foods, obstacles, gridWidth, gridHeight) {
        if (!snake.isAlive) return;

        const headX = snake.gridX;
        const headY = snake.gridY;
        const currentDir = snake.dir;

        // 1. Build an occupancy grid for fast lookup
        const blocked = new Set();

        // Mark obstacles as blocked
        for (const obs of obstacles) {
            blocked.add(`${obs.x},${obs.y}`);
        }

        // Mark all snake bodies as blocked (except when phase shifting)
        const isPhasing = snake.phaseShiftTimer > 0;
        if (!isPhasing) {
            for (const s of allSnakes) {
                if (!s.isAlive) continue;
                for (let i = 0; i < s.body.length; i++) {
                    const seg = s.body[i];
                    // Skip own tail end if it's going to move unless growing
                    if (s === snake && i === s.body.length - 1 && !s.growPending) continue;
                    blocked.add(`${seg.x},${seg.y}`);
                }
            }
        }

        // 2. Identify candidate directions that don't collide immediately
        const safeMoves = [];

        for (const dir of this.directions) {
            // Cannot reverse immediately
            if (dir.x === -currentDir.x && dir.y === -currentDir.y) continue;

            const nextX = headX + dir.x;
            const nextY = headY + dir.y;

            // Check arena wall bounds
            if (nextX < 0 || nextX >= gridWidth || nextY < 0 || nextY >= gridHeight) {
                if (!isPhasing) continue; // lethal wall
            }

            // Check if grid cell is blocked
            if (blocked.has(`${nextX},${nextY}`)) {
                continue;
            }

            // Measure accessible flood-fill area to avoid dead ends
            const openSpace = this.floodFillCount(nextX, nextY, blocked, gridWidth, gridHeight, 25);
            safeMoves.push({ dir, nextX, nextY, openSpace });
        }

        // If no safe moves, keep current direction or take whatever is available
        if (safeMoves.length === 0) {
            return;
        }

        // Filter out moves that trap the snake into small pockets (< snake length)
        const minSpaceNeeded = Math.min(snake.body.length, 12);
        const viableMoves = safeMoves.filter(m => m.openSpace >= minSpaceNeeded);
        const candidates = viableMoves.length > 0 ? viableMoves : safeMoves;

        // 3. Find the best target (closest food / high value powerup)
        let target = null;
        let minTargetDist = Infinity;

        for (const food of foods) {
            const dist = Math.abs(food.x - headX) + Math.abs(food.y - headY);
            // Prioritize rare powerups slightly
            const priorityWeight = food.type === 'normal' ? 1.0 : 0.7;
            const weightedDist = dist * priorityWeight;
            if (weightedDist < minTargetDist) {
                minTargetDist = weightedDist;
                target = food;
            }
        }

        // 4. Score candidates based on distance to target and available open space
        let bestMove = candidates[0];
        let bestScore = -Infinity;

        for (const candidate of candidates) {
            let score = candidate.openSpace * 2.0;

            if (target) {
                const distToTarget = Math.abs(candidate.nextX - target.x) + Math.abs(candidate.nextY - target.y);
                score += (100 - distToTarget) * 4.0;
            }

            // Prefer continuing in same direction slightly to reduce jittery turning
            if (candidate.dir.x === currentDir.x && candidate.dir.y === currentDir.y) {
                score += 1.5;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMove = candidate;
            }
        }

        // Apply chosen direction
        snake.setDirection(bestMove.dir.x, bestMove.dir.y);

        // Boost decision: Boost if close to high-value food or high energy
        if (target && snake.boostEnergy > 40 && minTargetDist < 6 && Math.random() < 0.3) {
            snake.setBoosting(true);
        } else if (snake.boostEnergy < 20 || minTargetDist > 8) {
            snake.setBoosting(false);
        }
    }

    /**
     * Quick breadth-first search to count connected open cells.
     */
    floodFillCount(startX, startY, blocked, gridWidth, gridHeight, limit = 30) {
        const visited = new Set();
        const queue = [{ x: startX, y: startY }];
        visited.add(`${startX},${startY}`);
        let count = 0;

        while (queue.length > 0 && count < limit) {
            const curr = queue.shift();
            count++;

            for (const d of this.directions) {
                const nx = curr.x + d.x;
                const ny = curr.y + d.y;
                const key = `${nx},${ny}`;

                if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                    if (!blocked.has(key) && !visited.has(key)) {
                        visited.add(key);
                        queue.push({ x: nx, y: ny });
                    }
                }
            }
        }

        return count;
    }
}

window.cyberAi = new CyberAiController();
