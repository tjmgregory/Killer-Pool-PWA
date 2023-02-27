import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="px-2 py-4 bg-slate-800 text-white">
      <ul>
        <li>
          <Link href="/">Killer Pool</Link>
        </li>
      </ul>
    </nav>
  );
}
