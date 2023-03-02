# Killer Pool PWA

This is an experiment / hacky app for playing / supporting the play of Killer Pool.
The app is a Progressive Web App (PWA) that can be installed on a mobile device.

A Progressive Web App (PWA) is a type of web application that provides a user experience
similar to that of native mobile apps. PWAs use modern web technologies such as
service workers, web app manifests, and responsive design to deliver app-like
experiences on desktop and mobile devices.

The app is written in Next.JS and deployed on Vercel, while the API is written in
Rust and deployed on Google Cloud (Cloud-Run).

## Motivation

I tried to make a small app for playing Killer Pool with friends as fast as possible.
With a strict "MVP" approach. So, the app is not perfect, but it works. It does look
decent, but it is far from perfect. The API does not use any security features, so
when using API calls directly, you could break the games.

One idea was to use notifications with web workers and server side event streaming
to update clients when something changed. But sadly, on iOS the notifications are not
possible (altough: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).

## Development

To actively develop the api, you'll need to install the Rust toolchain.
After that, you need to start docker and `docker-compose up` to start
the database. Then you can start the api with `cargo run` (or `cargo watch -x run`).

To hack the frontend, you need nodeJS and start the next app (after you installed the
deps with `npm install`) with `npm run dev`. You can configure the api url in
the `.env.local` file.

For localhost development, use `http://localhost:8000` as API url.
