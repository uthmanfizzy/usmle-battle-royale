import { io } from 'socket.io-client';
import { getToken } from './auth';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

// auth is a function so every (re)connect sends the CURRENT token: the server
// identifies the player from it, never from an id the client claims.
const socket = io(SERVER_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: getToken() || undefined }),
});

export default socket;
