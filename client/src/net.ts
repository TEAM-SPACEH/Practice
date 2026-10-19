// 담당: E (F-11)
import type { ClientToServer, ServerToClient } from '@apple/shared';

// 서버 주소: `http://${location.hostname}:${SERVER_PORT}` (SPEC 5장)
export const net = {
  connect(): void {
    throw new Error('TODO(F-11): connect');
  },
  emit<K extends keyof ClientToServer>(event: K, ...args: Parameters<ClientToServer[K]>): void {
    throw new Error('TODO(F-11): emit');
  },
  on<K extends keyof ServerToClient>(event: K, fn: ServerToClient[K]): void {
    throw new Error('TODO(F-11): on');
  },
};
