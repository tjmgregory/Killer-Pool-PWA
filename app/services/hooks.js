import { useEffect, useState } from 'react';
import { fetchGame } from './api';
import { isGameFinished } from './helpers';

const url = process.env.NEXT_PUBLIC_API_URL;
let c = 0;

export function useGameUpdates(gameId) {
  const [game, setGame] = useState(null);
  const [err, setError] = useState(c);

  useEffect(() => {
    if (!gameId) {
      return;
    }

    async function fetch() {
      const game = await fetchGame(gameId);
      setGame(game);
    }

    const src = new EventSource(`${url}/games/updates`);

    src.addEventListener('error', () => setError(++c));

    src.addEventListener('message', async (event) => {
      const data = JSON.parse(event.data);
      if (data === gameId) {
        await fetch();
      }
    });

    fetch();

    return () => src.close();
  }, [gameId, err, isGameFinished(game)]);

  return game;
}
