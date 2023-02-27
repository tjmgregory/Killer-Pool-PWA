import Button from '@/components/button';
import Navigation from '@/components/nav';
import { getParticipatingGames, joinGame } from '@/services/api';
import { useUsername } from '@/services/localstorage';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Home() {
  const [games, setGames] = useState([]);
  const [username, setUsername] = useUsername();
  const [gameToken, setGameToken] = useState('');
  const router = useRouter();

  useEffect(() => {
    (async function fetchGames() {
      const games = await getParticipatingGames();
      setGames(games);
    })();
  }, []);

  async function join() {
    if (!username || !gameToken) {
      return;
    }

    await joinGame(gameToken);
    router.push(`/${gameToken}`);
  }

  return (
    <>
      <Head>
        <title>Killer Pool</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navigation />
      <main className="p-2">
        <h1>Welcome to Killer Pool.</h1>
        <p className="mb-8">You can either create a new game as host, or join an existing game with a game code.</p>
        <div className="mb-8">
          <Link href="/new" className="px-4 py-2 text-white bg-slate-800 rounded-md hover:bg-slate-600">
            New Game
          </Link>
        </div>
        <div className="mb-8">
          <h2>Join Game</h2>
          <div className="mb-4">
            <label>Your Name</label>
            <input className="border" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="mb-4">
            <label>Game ID</label>
            <input className="border" value={gameToken} onChange={(e) => setGameToken(e.target.value)} />
          </div>
          <Button onClick={join}>Join</Button>
        </div>
        <div className="mb-8">
          <h2>Ongoing Games</h2>
          <ul>
            {games
              .filter((g) => !g.finished)
              .map((g) => (
                <li key={g.id}>
                  <Link href={`/${g.id}`} className="underline">
                    {g.name} ({g.participants.length} players) {g.started ? '' : 'not'} started
                  </Link>
                </li>
              ))}
          </ul>
        </div>
        <div>
          <h2>Finished Games</h2>
          <ul>
            {games
              .filter((g) => g.finished)
              .map((g) => (
                <li key={g.id}>
                  <Link href={`/${g.id}`} className="underline">
                    {g.name} ({g.participants.length} players)
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </main>
    </>
  );
}
