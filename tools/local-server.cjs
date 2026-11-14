/**
 * Runs the game server locally on port 3001, for testing against a client
 * started with `vite --mode localserver` (see .claude/launch.json and
 * client/.env.localserver.local).
 *
 * With no SUPABASE_* variables in the environment the server has no
 * database: it serves the bundled fallback questions, guests can play every
 * multiplayer mode, and nothing is written anywhere. That is the point —
 * a local match can never touch real players or real data.
 *
 *     node tools/local-server.cjs
 */
process.env.PORT = process.env.PORT || '3001';
require('../server/index.js');
