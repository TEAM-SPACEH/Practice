// 담당: C (F-05)
import { CELL_COUNT, COLS, ROWS } from '@apple/shared';

/** 17×10 판 그리기. 값 0 인 칸은 빈 칸 */
export function renderBoard(root: HTMLElement, board: number[]): void {
  if (board.length !== CELL_COUNT) {
    throw new Error(`renderBoard: 판 길이는 ${CELL_COUNT} 이어야 함 (받은 길이 ${board.length})`);
  }

  // 다시 호출되면 칸 요소는 그대로 두고 내용만 바꾼다 (F-06 드래그가 같은 root 를 쓰므로)
  const el = root.querySelector<HTMLDivElement>(':scope > .board') ?? createBoardElement(root);
  const cells = el.children;

  for (let i = 0; i < CELL_COUNT; i++) {
    const cell = cells[i] as HTMLDivElement;
    const value = board[i];
    const empty = value === 0;
    cell.classList.toggle('cell--apple', !empty);
    cell.classList.toggle('cell--empty', empty);
    cell.textContent = empty ? '' : String(value);
  }
}

function createBoardElement(root: HTMLElement): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'board';
  el.style.setProperty('--cols', String(COLS));
  el.style.setProperty('--rows', String(ROWS));

  for (let i = 0; i < CELL_COUNT; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = String(i);
    cell.dataset.col = String(i % COLS);
    cell.dataset.row = String(Math.floor(i / COLS));
    el.append(cell);
  }

  root.append(el);
  return el;
}
