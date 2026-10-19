// 담당: F (F-12 방 관리, F-14 끊김 처리)
import type { IO, GameSocket } from './types';

/** room:create / room:join / room:leave / disconnect 처리 */
export function registerRoomHandlers(io: IO, socket: GameSocket): void {
  // TODO(F-12): 4자리 코드 방 생성, 입장(최대 MAX_PLAYERS), room:state 브로드캐스트
  // TODO(F-14): disconnect 시 방 정리, 게임 중이면 상대 승리
}
