export function calculateElo(
  winnerRating: number,
  loserRating: number,
  k = 32
): { winner: number; loser: number } {
  const expectedWinner = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + 10 ** ((winnerRating - loserRating) / 400));

  return {
    winner: Math.round(winnerRating + k * (1 - expectedWinner)),
    loser: Math.round(loserRating + k * (0 - expectedLoser))
  };
}
