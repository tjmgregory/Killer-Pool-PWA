import Navigation from '@/components/nav';
import '@/styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      <Navigation />
      <div className="p-4 max-w-2xl sm:m-auto">
        <Component {...pageProps} />
      </div>
    </>
  );
}
