export const isGameFinished = (game) =>
  game && game.started && game.players.length >= 2 && game.players.filter((p) => p.lives > 0).length === 1;

export const isGameNotFinished = (game) => !isGameFinished(game);

export const gameWinner = (game) => (isGameFinished(game) ? game.players.find((p) => p.lives > 0) : null);

export const gameHostId = (game) => game.players.find((p) => p.is_host).id;
