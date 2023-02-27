import Button from '@/components/button';
import FormInput from '@/components/formInput';
import Heading from '@/components/heading';
import { createGame } from '@/services/api';
import { useUsername } from '@/services/localstorage';
import Head from 'next/head';
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
      <Head>
        <title>Killer Pool - Create new game</title>
      </Head>
      <main className="p-2">
        <Heading>Create new game</Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-2">
          <div className="mb-4">
            <FormInput label="Your name" placeholder="The Pool God." value={username} onChange={setUsername} />
          </div>
          <div className="mb-4">
            <FormInput label="Name the game" placeholder="Irish Embassy the forth" value={gamename} onChange={setGamename} />
          </div>
        </div>
        <Button onClick={createNewGame}>create</Button>
      </main>
    </>
  );
}
