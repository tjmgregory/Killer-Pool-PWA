import NextLink from 'next/link';

export function Link({ children, href }) {
  return (
    <NextLink href={href} className="text-slate-800 underline underline-offset-1 hover:text-blue-700">
      {children}
    </NextLink>
  );
}

export function ButtonLink({ children, href }) {
  return (
    <NextLink
      href={href}
      className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      {children}
    </NextLink>
  );
}
