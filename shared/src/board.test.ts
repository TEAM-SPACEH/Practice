// 담당: B (F-17)
import { describe, it, expect } from 'vitest';
import { createBoard } from './board';
import { CELL_COUNT } from './constants';

describe('createBoard', () => {
  it('길이는 CELL_COUNT(170)', () => {
    expect(createBoard(1).length).toBe(CELL_COUNT);
  });

  it('모든 값은 1~9 정수', () => {
    const board = createBoard(777);
    for (const v of board) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(9);
    }
  });

  it('같은 시드 → 같은 판 (두 사람 판이 똑같아야 함)', () => {
    expect(createBoard(1234)).toEqual(createBoard(1234));
  });

  it('다른 시드 → 다른 판', () => {
    expect(createBoard(1)).not.toEqual(createBoard(2));
  });
});
