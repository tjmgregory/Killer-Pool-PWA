import Button from '@/components/button';
import Heading from '@/components/heading';
import LoadingSpinner from '@/components/loader';
import { advanceGame, leaveGame, startGame, storeSubscription } from '@/services/api';
import { gameHostId, gameWinner, isGameFinished, isGameNotFinished } from '@/services/helpers';
import { useGameUpdates } from '@/services/hooks';
import { useUserId } from '@/services/localstorage';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function GameDetails() {
  const router = useRouter();
  const uid = useUserId();
  const { gameId } = router.query;
  const game = useGameUpdates(gameId);

  useEffect(() => {
    console.log(`Current notifcation permission: ${window.Notification.permission}`);

    (async function () {
      if (window && window.Notification && window.Notification.permission !== 'denied') {
        console.log('Requesting notification permission');
        const result = await window.Notification.requestPermission();
        console.log(`Result: ${result}`);

        if (result == 'granted') {
          await navigator.serviceWorker.ready;
          const registration = await navigator.serviceWorker.getRegistration();

          const sub = await registration.pushManager.getSubscription();
          if (!sub) {
            console.log('no subscription found, creating.');
            const newSub = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_PUSH_KEY,
            });

            await storeSubscription(newSub);
          } else {
            console.info('subscription found', sub);
          }
        }
      }
    })();
  }, []);

  async function start() {
    await startGame(gameId);
  }

  async function leave() {
    await leaveGame(gameId);
    router.replace('/');
  }

  async function advance(result) {
    await advanceGame(gameId, result, game.next_player);
  }

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
            {gameHostId(game) == uid && !game.started && game.players.length >= 2 ? (
              <li>
                <Button onClick={start}>start</Button>
              </li>
            ) : null}
            {gameHostId(game) != uid && !game.started ? (
              <li>
                <Button onClick={leave}>leave</Button>
              </li>
            ) : null}
          </ul>

          {isGameFinished(game) ? (
            <div className="mb-8">
              <Heading level="2">Winner</Heading>
              <p className="text-xl">&gt; {gameWinner(game).name} &lt;</p>
            </div>
          ) : null}

          {game.started && isGameNotFinished(game) ? (
            <div>
              <Heading level="4">
                <span className="text-slate-500">Current Turn:</span>{' '}
              </Heading>
              <Heading level="2">
                {game.players.find((p) => p.id == game.next_player).name} (
                {game.players.find((p) => p.id == game.next_player).lives} lives)
              </Heading>
              {gameHostId(game) == uid || game.next_player == uid ? (
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
            {game.players
              .sort((a, b) => a.order - b.order)
              .map((participant) => (
                <li key={participant.id}>
                  {participant.name} {participant.is_host ? '[Host]' : ''} ({participant.lives} lives)
                </li>
              ))}
          </ul>
        </main>
      )}
    </>
  );
}
