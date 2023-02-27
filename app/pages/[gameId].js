import Button from '@/components/button';
import Heading from '@/components/heading';
import LoadingSpinner from '@/components/loader';
import { advanceGame, fetchGame, leaveGame, startGame } from '@/services/api';
import { useUserId } from '@/services/localstorage';
import Head from 'next/head';
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
      <Head>
        <title>Game</title>
      </Head>
      {game == null ? (
        <div className="text-center mx-auto mt-8">
          <LoadingSpinner />
        </div>
      ) : (
        <main>
          <Heading>Game &quot;{game.name}&quot;</Heading>

          {!game.started ? (
            <div className="mb-8">
              <Heading level="3">Code To Join</Heading>
              <code className="text-2xl font-mono text-orange-600">{game.id}</code>
            </div>
          ) : null}

          <ul className="mb-8">
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

          {game.finished ? (
            <div className="mb-8">
              <Heading level="2">Winner</Heading>
              <p className="text-xl">&gt; {game.participants.find((p) => p.playerId == game.winnerId).player.name} &lt;</p>
            </div>
          ) : null}

          {game.started && !game.finished ? (
            <div>
              <Heading level="4">
                <span className="text-slate-500">Current Turn:</span>{' '}
              </Heading>
              <Heading level="2">
                {game.participants.find((p) => p.playerId == game.nextPlayer).player.name} (
                {game.participants.find((p) => p.playerId == game.nextPlayer).lives} lives)
              </Heading>
              {game.hostId == uid || game.nextPlayer == uid ? (
                <ul className="flex space-x-4 mb-8">
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
              ) : null}
            </div>
          ) : null}

          <Heading level="2">Participants</Heading>
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
