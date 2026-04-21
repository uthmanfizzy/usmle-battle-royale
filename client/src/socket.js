import { io } from 'socket.io-client';

const URL = import.meta.env.PROD
  ? 'https://usmle-battle-royale-production.up.railway.app'
  : 'http://localhost:3002';

const socket = io(URL, { autoConnect: false });

export default socket;
