import Button from '@/components/button';
import FormInput from '@/components/formInput';
import Heading from '@/components/heading';
import { ButtonLink, Link } from '@/components/link';
import { getParticipatingGames, joinGame } from '@/services/api';
import { isGameFinished, isGameNotFinished } from '@/services/helpers';
import { useUsername } from '@/services/localstorage';
import Head from 'next/head';
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
      </Head>
      <main>
        <Heading>Welcome to Killer Pool</Heading>
        <p className="mb-8">You can either create a new game as host, or join an existing game with a game code.</p>
        <div className="mb-8 text-center">
          <ButtonLink href="/new">New Game</ButtonLink>
        </div>
        <div className="mb-8">
          <Heading level="2">Join Game</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-2">
            <div className="mb-4">
              <FormInput label="Your Name" placeholder="John Doe" value={username} onChange={setUsername} />
            </div>
            <div className="mb-4">
              <FormInput
                label="Game ID"
                placeholder="foo-bar"
                value={gameToken}
                onChange={(val) => setGameToken(val.toLowerCase())}
              />
            </div>
          </div>
          <Button onClick={join}>Join</Button>
        </div>
        <div className="mb-8">
          <Heading level="3">Ongoing Games</Heading>
          <ul>
            {games.filter(isGameNotFinished).map((g) => (
              <li key={g.id}>
                <Link href={`/${g.id}`}>
                  {g.name} ({g.players.length} players) {g.started ? '' : 'not'} started
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Heading level="3">Finished Games</Heading>
          <ul>
            {games.filter(isGameFinished).map((g) => (
              <li key={g.id}>
                <Link href={`/${g.id}`}>
                  {g.name} ({g.players.length} players)
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
