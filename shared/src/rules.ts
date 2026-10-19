// 담당: B (F-04)

import { COLS, ROWS, TARGET_SUM } from './constants';

/** 칸 좌표 사각형, 양 끝 포함. col1 > col2 처럼 뒤집혀 들어와도 처리할 것 */
export interface Rect {
  col1: number;
  row1: number;
  col2: number;
  row2: number;
}

export type SelectResult = { ok: true; board: number[]; cleared: number[] } | { ok: false };

/** rect 안에서 남아 있는(값 ≠ 0) 칸의 인덱스 */
export function getSelectedCells(board: number[], rect: Rect): number[] {
  // 뒤집혀 들어와도 되도록 정렬 + 판 밖 좌표는 잘라낸다
  const colStart = Math.max(0, Math.min(rect.col1, rect.col2));
  const colEnd = Math.min(COLS - 1, Math.max(rect.col1, rect.col2));
  const rowStart = Math.max(0, Math.min(rect.row1, rect.row2));
  const rowEnd = Math.min(ROWS - 1, Math.max(rect.row1, rect.row2));

  const cells: number[] = [];
  for (let row = rowStart; row <= rowEnd; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      const i = row * COLS + col;
      if (board[i] !== 0) cells.push(i);
    }
  }
  return cells;
}

/** 선택 칸의 합이 TARGET_SUM 이면 제거된 새 판을 반환 (원본 board 는 바꾸지 않음) */
export function trySelect(board: number[], rect: Rect): SelectResult {
  const cleared = getSelectedCells(board, rect);
  if (cleared.length === 0) return { ok: false };

  let sum = 0;
  for (const i of cleared) sum += board[i];
  if (sum !== TARGET_SUM) return { ok: false };

  const next = board.slice();
  for (const i of cleared) next[i] = 0;
  return { ok: true, board: next, cleared };
}
