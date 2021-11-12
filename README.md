# [fource](http://fource.herokuapp.com)
![Preview of Fource Game Screen](/public/images/preview.png?raw=true)

Fource is a free, abstract strategy game based around realtime gameplay.

It is written primarily in Javascript using [Node.js](https://nodejs.org) and [Express](https://expressjs.com) to run the backend. [Socket.IO](https://socket.io/) is used to handle web sockets between users for gameplay and chat.

## How to Play
[Click here to read about how to play](https://fource.herokuapp.com/how-to-play).

# Development ⚙️

## Prerequisites

1. [Node.js](https://nodejs.dev/learn/how-to-install-nodejs), v14.17.0 (recommended) or higher
2. [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), v7.21.1 (recommended) or higher

## Install

Download the current codebase or create a fork. Navigate to the root of the project directory in your terminal window and call `npm install`. This will install the required node module dependencies into your project folder.

## Run

Next, call `node run devstart`. This will start the backend server in development mode ([Express](https://expressjs.com/) with [nodemon](https://www.npmjs.com/package/nodemon)).

Open a browser window and navigate to `localhost:5000`. This is the project running locally on your machine. Changes to the project files will be reflected in the browser (thanks to nodemon)!
