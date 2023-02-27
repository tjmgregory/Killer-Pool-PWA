import Button from '@/components/button';
import Navigation from '@/components/nav';
import { createGame } from '@/services/api';
import { useUsername } from '@/services/localstorage';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function New() {
  const [username, setUsername] = useUsername();
  const [gamename, setGamename] = useState('');
  const router = useRouter();

  async function createNewGame() {
    if (!gamename) {
      return;
    }

    const gameId = await createGame(gamename);
    router.push(`/${gameId}`);
  }

  return (
    <>
      <Navigation />
      <main className="p-2">
        <h1>create new game</h1>
        <div>
          <label>username</label>
          <input className="border" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label>gamename</label>
          <input className="border" value={gamename} onChange={(e) => setGamename(e.target.value)} />
        </div>
        <Button onClick={createNewGame}>create</Button>
      </main>
    </>
  );
}
