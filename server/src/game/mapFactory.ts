import type { GameMap, PlayerPublic } from "@mathquiztador/shared";

const coordinates = [
  [10, 20],
  [30, 10],
  [50, 20],
  [70, 10],
  [90, 20],
  [20, 50],
  [40, 45],
  [60, 50],
  [80, 45],
  [30, 80],
  [50, 75],
  [70, 80]
];

const edges: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [1, 6],
  [2, 6],
  [2, 7],
  [3, 8],
  [4, 8],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [6, 9],
  [6, 10],
  [7, 10],
  [7, 11],
  [8, 11],
  [9, 10],
  [10, 11]
];

export function createGameMap(players: PlayerPublic[]): GameMap {
  const territories = coordinates.map(([x, y], i) => ({
    id: `T${i + 1}`,
    name: `Teritoriu ${i + 1}`,
    ownerUserId: players[i % players.length]!.userId,
    neighbors: [] as string[],
    x,
    y,
    value: 100
  }));

  for (const [a, b] of edges) {
    territories[a]!.neighbors.push(territories[b]!.id);
    territories[b]!.neighbors.push(territories[a]!.id);
  }

  return {
    id: "classic-12",
    name: "Harta Carpatica",
    territories
  };
}
