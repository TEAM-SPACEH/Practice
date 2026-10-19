// 담당: B (F-03)

/** 시드 랜덤. 같은 seed 면 같은 수열, 반환 함수는 0 이상 1 미만 */
export function mulberry32(seed: number): () => number {
  // 32비트 정수 상태로 고정 (seed 가 실수/음수여도 동작하도록 >>> 0)
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
