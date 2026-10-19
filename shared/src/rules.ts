// 담당: B (F-04)

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
  throw new Error('TODO(F-04): getSelectedCells');
}

/** 선택 칸의 합이 TARGET_SUM 이면 제거된 새 판을 반환 (원본 board 는 바꾸지 않음) */
export function trySelect(board: number[], rect: Rect): SelectResult {
  throw new Error('TODO(F-04): trySelect');
}
