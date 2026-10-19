// 담당: E (F-09)

export interface HudState {
  remainingMs: number;
  myScore: number;
  oppName: string;
  oppScore: number;
}

/** 남은 시간, 내 점수, 상대 닉네임·점수 */
export function renderHud(root: HTMLElement, s: HudState): void {
  throw new Error('TODO(F-09): renderHud');
}
