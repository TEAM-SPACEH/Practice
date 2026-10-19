// 담당: E (F-11)
import type { ClientToServer, ServerToClient } from '@apple/shared';
import { SERVER_PORT } from '@apple/shared';
import { io, type Socket } from 'socket.io-client';

const socket: Socket<ServerToClient, ClientToServer> = io(
  `http://${location.hostname}:${SERVER_PORT}`,
  { autoConnect: false },
);

// 서버 주소: `http://${location.hostname}:${SERVER_PORT}` (SPEC 5장)
export const net = {
  connect(): void {
    socket.connect();
  },
  emit<K extends keyof ClientToServer>(event: K, ...args: Parameters<ClientToServer[K]>): void {
    socket.emit(event, ...args);
  },
  on<K extends keyof ServerToClient>(event: K, fn: ServerToClient[K]): void {
    // 계약의 이벤트 타입을 유지하면서 Socket.IO 예약 이벤트의 조건부 타입을 좁힌다.
    const on = socket.on as <E extends keyof ServerToClient>(
      event: E,
      listener: ServerToClient[E],
    ) => typeof socket;
    on.call(socket, event, fn);
  },
};
