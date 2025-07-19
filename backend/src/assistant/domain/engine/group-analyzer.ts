import type { Stone } from "../types/assistant.types";

export type GroupData = {
    color: 'black' | 'white';
    stones: { x: number; y: number }[];
    liberties: number;
};

export class GroupAnalyzer {
    analyzeGroups(board: Stone[][]): GroupData[] {
        const visited = new Set<string>();
        const groups: GroupData[] = [];

        for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            const color = board[y][x];
            if (!color || visited.has(`${x},${y}`)) continue;

            const groupStones: { x: number; y: number }[] = [];
            const libertiesSet = new Set<string>();

            const dfs = (x: number, y: number) => {
            const key = `${x},${y}`;
            if (visited.has(key)) return;
            visited.add(key);
            groupStones.push({ x, y });

            const neighbors = [
                [x - 1, y],
                [x + 1, y],
                [x, y - 1],
                [x, y + 1],
            ];

            for (const [nx, ny] of neighbors) {
                if (ny < 0 || ny >= board.length || nx < 0 || nx >= board.length) continue;
                const neighbor = board[ny][nx];

                if (neighbor === null) {
                libertiesSet.add(`${nx},${ny}`);
                } else if (neighbor === color) {
                dfs(nx, ny);
                }
            }
            };

            dfs(x, y);

            groups.push({
            color,
            stones: groupStones,
            liberties: libertiesSet.size,
            });
            }
        }
        return groups;
    }

        getGroupsInAtari(board: Stone[][], threshold: number = 1): GroupData[] {
        const groups = this.analyzeGroups(board);
        return groups.filter(group => group.liberties <= threshold);
    }
}
