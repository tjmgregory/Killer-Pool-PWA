import { getUserId, getUsername } from './localstorage';

const url = process.env.NEXT_PUBLIC_API_URL;

export const getParticipatingGames = async () => {
  const userId = getUserId();
  const response = await fetch(`${url}/games?userId=${userId}`);
  const json = await response.json();
  return json;
};

export const createGame = async (gameName) => {
  const response = await fetch(`${url}/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: gameName,
      hostId: getUserId(),
      hostName: getUsername(),
    }),
  });
  const gameId = await response.text();
  console.log(`game created with id: ${gameId}`);

  return gameId;
};

export const fetchGame = async (gameId) => {
  const response = await fetch(`${url}/games/${gameId}`);
  const game = await response.json();
  return game;
};

export const joinGame = async (gameId) => {
  await fetch(`${url}/games/${gameId}/participants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: getUserId(),
      name: getUsername(),
    }),
  });
};

export const leaveGame = async (gameId) => {
  await fetch(`${url}/games/${gameId}/participants/${getUserId()}`, {
    method: 'delete',
  });
};

export const startGame = async (gameId) => {
  await fetch(`${url}/games/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      hostId: getUserId(),
      gameId,
    }),
  });
};

export const advanceGame = async (gameId, result, userId) => {
  console.log(`advance game. gameId: ${gameId}, userId: ${userId}`);
  await fetch(`${url}/games/${gameId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerId: userId ?? getUserId(),
      result,
    }),
  });
};
