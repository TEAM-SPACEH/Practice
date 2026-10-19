// 담당: F — 방 상태 저장소 (rooms.ts, game.ts 가 같이 씀)
import type { RoomState } from '@apple/shared';

export interface Player {
  id: string; // socket.id
  nickname: string;
  ready: boolean;
  score: number;
}

export type RoomStatus = 'waiting' | 'playing';

export interface Room {
  code: string;
  players: Player[];
  status: RoomStatus;
  /** 게임 중일 때 game:end 예약 타이머 */
  endTimer: NodeJS.Timeout | null;
}

/** code → Room */
export const rooms = new Map<string, Room>();
/** socket.id → code (한 소켓은 한 방에만) */
export const roomOf = new Map<string, string>();

export function getRoomOf(socketId: string): Room | undefined {
  const code = roomOf.get(socketId);
  return code ? rooms.get(code) : undefined;
}

export function toRoomState(room: Room): RoomState {
  return {
    code: room.code,
    players: room.players.map(({ id, nickname, ready }) => ({ id, nickname, ready })),
  };
}

/** 겹치지 않는 4자리 숫자 코드 (1000~9999) */
export function newRoomCode(): string {
  let code: string;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (rooms.has(code));
  return code;
}
