// 담당: C (F-06)
import type { Rect } from '@apple/shared';

/**
 * 드래그로 사각형 표시, 놓으면 칸 좌표 사각형을 onSelect 로 전달.
 * 칸의 중심점이 드래그 사각형 안에 있으면 선택 (SPEC 1장).
 * 반환값: 이벤트 해제 함수
 */
export function attachDrag(root: HTMLElement, onSelect: (rect: Rect) => void): () => void {
  throw new Error('TODO(F-06): attachDrag');
}
