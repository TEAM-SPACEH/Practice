import type { Server, Socket } from 'socket.io';
import type { ClientToServer, ServerToClient } from '@apple/shared';

export type IO = Server<ClientToServer, ServerToClient>;
export type GameSocket = Socket<ClientToServer, ServerToClient>;
