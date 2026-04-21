import { io } from 'socket.io-client';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

const socket = io(SERVER_URL, { autoConnect: false });

export default socket;
