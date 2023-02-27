import Button from '@/components/button';
import LoadingSpinner from '@/components/loader';
import Navigation from '@/components/nav';
import { advanceGame, fetchGame, leaveGame, startGame } from '@/services/api';
import { useUserId } from '@/services/localstorage';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function GameDetails() {
  const router = useRouter();
  const uid = useUserId();
  const { gameId } = router.query;
  const [game, setGame] = useState(null);

  async function fetch() {
    const game = await fetchGame(gameId);
    setGame(game);
  }

  async function start() {
    await startGame(gameId);
    await fetch();
  }

  async function leave() {
    await leaveGame(gameId);
    router.replace('/');
  }

  async function advance(result) {
    await advanceGame(gameId, result, game.nextPlayer);
    await fetch();
  }

  useEffect(() => {
    if (gameId == null) {
      return;
    }

    fetch();
  }, [gameId]);

  useEffect(() => {
    // if the game is finished. no need to refresh anymore.
    if (game?.finished) {
      return;
    }

    // Poll each 3 seconds for update.
    const id = setInterval(fetch, 3000);
    return () => clearInterval(id);
  }, [gameId, game?.finished]);

  return (
    <>
      <Navigation />
      {game == null ? (
        <LoadingSpinner />
      ) : (
        <main className="p-2">
          <h1>Game {game.name}</h1>
          <h2>Code to join: {game.id}</h2>
          <div>{game.started ? 'started' : 'not started yet'}</div>
          <div>{game.finished ? 'finished' : 'not finished yet'}</div>

          <div>
            <h4>actions</h4>
            <ul>
              {game.hostId == uid && !game.started ? (
                <li>
                  <Button onClick={start}>start</Button>
                </li>
              ) : null}
              {game.hostId != uid && !game.started ? (
                <li>
                  <Button onClick={leave}>leave</Button>
                </li>
              ) : null}
            </ul>
          </div>

          {game.finished ? (
            <div>
              <h2>Winner</h2>
              <p>{game.participants.find((p) => p.playerId == game.winnerId).player.name}</p>
            </div>
          ) : null}

          {game.started && !game.finished ? (
            <div>
              <h2>
                Current Turn: {game.participants.find((p) => p.playerId == game.nextPlayer).player.name} (
                {game.participants.find((p) => p.playerId == game.nextPlayer).lives} lives)
              </h2>
              {game.hostId == uid || game.nextPlayer == uid ? (
                <div>
                  <h5>Result</h5>
                  <ul>
                    <li>
                      <Button onClick={() => advance(-1)}>Foul (-1)</Button>
                    </li>
                    <li>
                      <Button onClick={() => advance(0)}>Stay (0)</Button>
                    </li>
                    <li>
                      <Button onClick={() => advance(+1)}>Black Ball (+1)</Button>
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          <h2>Participants</h2>
          <ul>
            {game.participants
              .sort((a, b) => a.order - b.order)
              .map((participant) => (
                <li key={participant.playerId}>
                  {participant.player.name} {participant.isHost ? '[Host]' : ''} ({participant.lives} lives)
                </li>
              ))}
          </ul>
        </main>
      )}
    </>
  );
}
