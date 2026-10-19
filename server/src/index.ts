import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { SERVER_PORT } from '@apple/shared';
import type { IO } from './types';
import { registerRoomHandlers } from './rooms';
import { registerGameHandlers } from './game';

const httpServer = createServer();
// 오늘은 로컬 전용이라 모든 origin 허용
const io: IO = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);
  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
  socket.on('disconnect', () => console.log(`[disconnect] ${socket.id}`));
});

httpServer.listen(SERVER_PORT, '0.0.0.0', () => {
  console.log(`server listening on :${SERVER_PORT}`);
});
