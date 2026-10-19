// 소켓 이벤트 계약 (SPEC 6장). 바꾸려면 PR + 팀 공지 필수.

export interface PlayerInfo {
  id: string;
  nickname: string;
  ready: boolean;
}

export interface RoomState {
  code: string;
  players: PlayerInfo[];
}

export interface ScorePayload {
  score: number;
  /** 이번에 제거한 칸 인덱스 (미니맵용) */
  cleared: number[];
}

export interface GameStartPayload {
  seed: number;
  /** 서버 시각(ms) 기준 카운트다운이 끝나는 시점 */
  startAt: number;
  durationMs: number;
}

export interface GameEndPayload {
  /** key = player id */
  scores: Record<string, number>;
  /** null 이면 무승부 */
  winnerId: string | null;
  reason: 'timeup' | 'opponent-left';
}

export interface ClientToServer {
  'room:create': (p: { nickname: string }) => void;
  'room:join': (p: { code: string; nickname: string }) => void;
  'room:leave': () => void;
  'player:ready': () => void;
  'score:update': (p: ScorePayload) => void;
}

export interface ServerToClient {
  'room:state': (p: RoomState) => void;
  'room:error': (p: { message: string }) => void;
  'game:start': (p: GameStartPayload) => void;
  'opponent:score': (p: ScorePayload) => void;
  'game:end': (p: GameEndPayload) => void;
}
