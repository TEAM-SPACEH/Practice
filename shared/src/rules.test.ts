// 담당: B (F-17)
import { describe, it, expect } from 'vitest';
import { getSelectedCells, trySelect, type Rect } from './rules';
import { COLS } from './constants';

// 테스트용 작은 헬퍼: row*COLS+col 인덱스
const idx = (row: number, col: number) => row * COLS + col;

// 170칸 전부 0으로 채운 빈 판에 원하는 칸만 값을 심는다
function makeBoard(seed: Record<number, number>): number[] {
  const board = new Array(COLS * 10).fill(0);
  for (const [i, v] of Object.entries(seed)) board[Number(i)] = v;
  return board;
}

describe('getSelectedCells', () => {
  it('rect 안의 남아 있는 칸만 모은다 (0은 제외)', () => {
    const board = makeBoard({ [idx(0, 0)]: 3, [idx(0, 1)]: 0, [idx(1, 0)]: 5 });
    const rect: Rect = { col1: 0, row1: 0, col2: 1, row2: 1 };
    expect(getSelectedCells(board, rect).sort((a, b) => a - b)).toEqual([idx(0, 0), idx(1, 0)]);
  });

  it('뒤집힌 좌표(col1>col2, row1>row2)도 같은 결과', () => {
    const board = makeBoard({ [idx(0, 0)]: 1, [idx(1, 1)]: 2 });
    const normal: Rect = { col1: 0, row1: 0, col2: 1, row2: 1 };
    const flipped: Rect = { col1: 1, row1: 1, col2: 0, row2: 0 };
    expect(getSelectedCells(board, flipped)).toEqual(getSelectedCells(board, normal));
  });

  it('판 밖으로 나간 좌표는 잘라낸다', () => {
    const board = makeBoard({ [idx(0, 0)]: 4 });
    const rect: Rect = { col1: -5, row1: -5, col2: 100, row2: 100 };
    // 범위를 벗어나도 에러 없이 판 안의 칸만 반환
    expect(getSelectedCells(board, rect)).toEqual([idx(0, 0)]);
  });
});

describe('trySelect', () => {
  it('합이 10이면 해당 칸을 지운 새 판을 반환한다', () => {
    const board = makeBoard({ [idx(0, 0)]: 4, [idx(0, 1)]: 6 });
    const result = trySelect(board, { col1: 0, row1: 0, col2: 1, row2: 0 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cleared.sort((a, b) => a - b)).toEqual([idx(0, 0), idx(0, 1)]);
      expect(result.board[idx(0, 0)]).toBe(0);
      expect(result.board[idx(0, 1)]).toBe(0);
    }
  });

  it('원본 board 는 바꾸지 않는다 (불변)', () => {
    const board = makeBoard({ [idx(0, 0)]: 4, [idx(0, 1)]: 6 });
    const snapshot = board.slice();
    trySelect(board, { col1: 0, row1: 0, col2: 1, row2: 0 });
    expect(board).toEqual(snapshot);
  });

  it('합이 10이 아니면 ok:false', () => {
    const board = makeBoard({ [idx(0, 0)]: 4, [idx(0, 1)]: 4 });
    expect(trySelect(board, { col1: 0, row1: 0, col2: 1, row2: 0 })).toEqual({ ok: false });
  });

  it('빈 선택(남은 칸 0개)은 ok:false', () => {
    const board = makeBoard({});
    expect(trySelect(board, { col1: 0, row1: 0, col2: 2, row2: 2 })).toEqual({ ok: false });
  });

  it('이미 지워진(0) 칸은 합계에 포함하지 않는다', () => {
    // 10 + 0 들이 아니라, 실제 값 합만 센다: 7+3=10
    const board = makeBoard({ [idx(0, 0)]: 7, [idx(0, 1)]: 0, [idx(0, 2)]: 3 });
    const result = trySelect(board, { col1: 0, row1: 0, col2: 2, row2: 0 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.cleared.sort((a, b) => a - b)).toEqual([idx(0, 0), idx(0, 2)]);
  });
});
