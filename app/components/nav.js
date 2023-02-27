import Image from 'next/image';
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="p-2 bg-slate-700 text-white">
      <div className="max-w-2xl lg:m-auto">
        <ul className="flex items-center">
          <li className="mr-4">
            <Image alt="Killer Pool" src="/icon-192x192.png" width={32} height={32} />
          </li>
          <li className="mr-8">
            <Link href="/" className="font-bold">
              Killer Pool
            </Link>
          </li>
          <li className="mr-4">
            <Link href="/">Start</Link>
          </li>
          <li className="mr-4">
            <Link href="/new">Create</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
