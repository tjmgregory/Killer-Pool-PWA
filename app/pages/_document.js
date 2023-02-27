import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="application-name" content="Killer Pool" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Killer Pool" />
        <meta name="description" content="Hacky app for playing killer pool" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#004400" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <body className="bg-slate-50 text-slate-800">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
