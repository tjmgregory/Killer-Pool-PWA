// self.addEventListener('')

self.addEventListener('push', function (event) {
  if (event.data) {
    console.log('Received Push Event that has data: ', event.data.text());
    const data = event.data.text().split('|');

    if (data[0] === 'start') {
      event.waitUntil(
        self.registration.showNotification('Game Started', {
          body: `${data[3]} started the game "${data[2]}"`,
          data: {
            id: data[1],
          },
        })
      );
    }
    // else if (data[0] === 'next') {
    //   event.waitUntil(
    //     self.registration.showNotification("You're up", {
    //       body: `It is your turn in the game.`,
    //     })
    //   );
    // }
  } else {
    console.log('Received Push Event that has no data.');
  }
});

self.addEventListener('notificationclick', (event) => {
  const clickedNotification = event.notification;
  clickedNotification.close();

  //   if (clickedNotification.data.id) {
  //   }

  // Do something as the result of the notification click
  //   const promiseChain = doSomething();
  //   event.waitUntil(promiseChain);
});
