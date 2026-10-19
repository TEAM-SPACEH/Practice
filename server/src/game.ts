// 담당: F (F-13 게임 진행)
import type { IO, GameSocket } from './types';

/** player:ready / score:update 처리, game:start / opponent:score / game:end 전송 */
export function registerGameHandlers(io: IO, socket: GameSocket): void {
  // TODO(F-13): 둘 다 ready → seed + startAt 으로 game:start
  // TODO(F-13): score:update → 상대에게 opponent:score
  // TODO(F-13): startAt + durationMs + END_GRACE_MS 에 game:end
}
