// 담당: B (F-03)

import { CELL_COUNT } from './constants';
import { mulberry32 } from './random';

/** 길이 CELL_COUNT(170), 값 1~9. 인덱스 i = row * COLS + col */
export function createBoard(seed: number): number[] {
  const rand = mulberry32(seed);
  const board: number[] = new Array(CELL_COUNT);
  for (let i = 0; i < CELL_COUNT; i++) {
    // 1~9 균등 분포
    board[i] = 1 + Math.floor(rand() * 9);
  }
  return board;
}
