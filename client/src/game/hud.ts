// 담당: E (F-09)

export interface HudState {
  remainingMs: number;
  myScore: number;
  oppName: string;
  oppScore: number;
}

/** 남은 시간, 내 점수, 상대 닉네임·점수 */
export function renderHud(root: HTMLElement, s: HudState): void {
  const hud = document.createElement('dl');
  hud.className = 'hud';
  hud.setAttribute('aria-label', '게임 현황');

  const remainingSeconds = Math.max(0, Math.ceil(s.remainingMs / 1000));
  const items = [
    ['남은 시간', `${remainingSeconds}초`],
    ['내 점수', `${s.myScore}점`],
    [`상대 (${s.oppName})`, `${s.oppScore}점`],
  ];

  for (const [label, value] of items) {
    const item = document.createElement('div');
    item.className = 'hud__item';

    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');
    description.textContent = value;

    item.append(term, description);
    hud.append(item);
  }

  root.replaceChildren(hud);
}
