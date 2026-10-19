// 담당: F (F-13 게임 진행)
import { COUNTDOWN_MS, DURATION_MS, END_GRACE_MS, MAX_PLAYERS } from '@apple/shared';
import type { GameEndPayload } from '@apple/shared';
import type { IO, GameSocket } from './types';
import { getRoomOf, toRoomState, type Room } from './store';

/** player:ready / score:update 처리, game:start / opponent:score / game:end 전송 */
export function registerGameHandlers(io: IO, socket: GameSocket): void {
  socket.on('player:ready', () => {
    const room = getRoomOf(socket.id);
    if (!room || room.status !== 'waiting') return;
    const me = room.players.find((p) => p.id === socket.id);
    if (!me) return;

    me.ready = true;
    io.to(room.code).emit('room:state', toRoomState(room));

    if (room.players.length === MAX_PLAYERS && room.players.every((p) => p.ready)) {
      startGame(io, room);
    }
  });

  socket.on('score:update', ({ score, cleared }) => {
    const room = getRoomOf(socket.id);
    if (!room || room.status !== 'playing') return;
    const me = room.players.find((p) => p.id === socket.id);
    if (!me || typeof score !== 'number') return;

    me.score = score; // 점수는 클라이언트를 믿는다 (SPEC 범위 밖: 치트 방지)
    socket.to(room.code).emit('opponent:score', { score, cleared: Array.isArray(cleared) ? cleared : [] });
  });
}

function startGame(io: IO, room: Room): void {
  room.status = 'playing';
  for (const p of room.players) p.score = 0;

  const seed = Math.floor(Math.random() * 2 ** 31);
  const startAt = Date.now() + COUNTDOWN_MS;
  io.to(room.code).emit('game:start', { seed, startAt, durationMs: DURATION_MS });
  console.log(`[game] ${room.code} start seed=${seed}`);

  const delay = startAt - Date.now() + DURATION_MS + END_GRACE_MS;
  room.endTimer = setTimeout(() => endGame(io, room, 'timeup'), delay);
}

/**
 * 게임 종료. timeup 이면 점수 비교, opponent-left 면 남은 사람 승리.
 * 끝나면 대기 상태로 되돌려서 다시 "준비"를 누르면 재대결 가능 (F-15).
 */
export function endGame(io: IO, room: Room, reason: GameEndPayload['reason']): void {
  if (room.status !== 'playing') return;
  if (room.endTimer) clearTimeout(room.endTimer);
  room.endTimer = null;

  const scores: Record<string, number> = {};
  for (const p of room.players) scores[p.id] = p.score;

  let winnerId: string | null = null;
  if (reason === 'opponent-left') {
    winnerId = room.players[0]?.id ?? null;
  } else {
    const [a, b] = room.players;
    if (a && b && a.score !== b.score) winnerId = a.score > b.score ? a.id : b.id;
  }

  io.to(room.code).emit('game:end', { scores, winnerId, reason });
  console.log(`[game] ${room.code} end (${reason}) winner=${winnerId}`);

  room.status = 'waiting';
  for (const p of room.players) p.ready = false;
  io.to(room.code).emit('room:state', toRoomState(room));
}
