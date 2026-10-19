// 담당: F (F-12 방 관리, F-14 끊김 처리)
import { MAX_PLAYERS } from '@apple/shared';
import type { IO, GameSocket } from './types';
import { rooms, roomOf, getRoomOf, toRoomState, newRoomCode, type Player } from './store';
import { endGame } from './game';

/** room:create / room:join / room:leave / disconnect 처리 */
export function registerRoomHandlers(io: IO, socket: GameSocket): void {
  socket.on('room:create', ({ nickname }) => {
    const name = cleanNickname(nickname);
    if (!name) return socket.emit('room:error', { message: '닉네임을 입력하세요' });

    leaveRoom(io, socket); // 이미 다른 방에 있으면 먼저 나감
    const code = newRoomCode();
    rooms.set(code, { code, players: [], status: 'waiting', endTimer: null });
    joinRoom(io, socket, code, name);
    console.log(`[room] ${code} created by ${name}`);
  });

  socket.on('room:join', ({ code, nickname }) => {
    const name = cleanNickname(nickname);
    if (!name) return socket.emit('room:error', { message: '닉네임을 입력하세요' });

    const roomCode = String(code ?? '').trim();
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('room:error', { message: '없는 방 코드입니다' });
    if (room.players.some((p) => p.id === socket.id)) return; // 이미 이 방에 있음
    if (room.players.length >= MAX_PLAYERS) return socket.emit('room:error', { message: '방이 꽉 찼습니다' });
    if (room.status !== 'waiting') return socket.emit('room:error', { message: '이미 게임 중인 방입니다' });

    leaveRoom(io, socket);
    joinRoom(io, socket, roomCode, name);
    console.log(`[room] ${roomCode} joined by ${name}`);
  });

  socket.on('room:leave', () => leaveRoom(io, socket));

  // F-14: 끊기면 방에서 나간 것과 똑같이 처리
  socket.on('disconnect', () => leaveRoom(io, socket));
}

function joinRoom(io: IO, socket: GameSocket, code: string, nickname: string): void {
  const room = rooms.get(code)!;
  const player: Player = { id: socket.id, nickname, ready: false, score: 0 };
  room.players.push(player);
  roomOf.set(socket.id, code);
  socket.join(code);
  io.to(code).emit('room:state', toRoomState(room));
}

/**
 * 방에서 빼기. (F-14)
 * - 게임 중(카운트다운 포함)이면 남은 사람 승리로 game:end
 * - 대기실이면 남은 사람의 준비 해제 후 room:state
 * - 아무도 안 남으면 방 삭제
 */
function leaveRoom(io: IO, socket: GameSocket): void {
  const room = getRoomOf(socket.id);
  if (!room) return;

  room.players = room.players.filter((p) => p.id !== socket.id);
  roomOf.delete(socket.id);
  socket.leave(room.code);
  console.log(`[room] ${room.code} left by ${socket.id}`);

  if (room.players.length === 0) {
    if (room.endTimer) clearTimeout(room.endTimer);
    rooms.delete(room.code);
    console.log(`[room] ${room.code} removed`);
    return;
  }

  if (room.status === 'playing') {
    endGame(io, room, 'opponent-left'); // 안에서 room:state 도 보냄
  } else {
    for (const p of room.players) p.ready = false;
    io.to(room.code).emit('room:state', toRoomState(room));
  }
}

function cleanNickname(nickname: unknown): string {
  return String(nickname ?? '').trim().slice(0, 12);
}
