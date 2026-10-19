// 담당: C (F-06)
import type { Rect } from '@apple/shared';

interface Point {
  x: number;
  y: number;
}

/**
 * 드래그로 사각형 표시, 놓으면 칸 좌표 사각형을 onSelect 로 전달.
 * 칸의 중심점이 드래그 사각형 안에 있으면 선택 (SPEC 1장).
 * 아무 칸도 걸리지 않으면 onSelect 를 부르지 않는다.
 * 반환값: 이벤트 해제 함수
 */
export function attachDrag(root: HTMLElement, onSelect: (rect: Rect) => void): () => void {
  const box = document.createElement('div');
  box.className = 'drag-rect';
  box.hidden = true;
  root.classList.add('drag-root');
  root.append(box);

  let start: Point | null = null;
  let selected: HTMLElement[] = [];

  function onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    const board = root.querySelector<HTMLElement>('.board');
    if (!board) return;
    e.preventDefault(); // 글자 선택 방지
    start = clampToBoard(board, { x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e: MouseEvent): void {
    // 브라우저 밖에서 버튼을 놓아 mouseup 을 놓친 경우
    if (e.buttons === 0) {
      finish(false);
      return;
    }
    update(e);
  }

  function onMouseUp(e: MouseEvent): void {
    update(e);
    finish(true);
  }

  function update(e: MouseEvent): void {
    const board = root.querySelector<HTMLElement>('.board');
    if (!start || !board) return;
    const end = clampToBoard(board, { x: e.clientX, y: e.clientY });
    const left = Math.min(start.x, end.x);
    const right = Math.max(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const bottom = Math.max(start.y, end.y);

    // 드래그 사각형 그리기 (root 기준 좌표)
    const rootBox = root.getBoundingClientRect();
    box.hidden = false;
    box.style.left = `${left - rootBox.left}px`;
    box.style.top = `${top - rootBox.top}px`;
    box.style.width = `${right - left}px`;
    box.style.height = `${bottom - top}px`;

    // 중심점이 사각형 안에 있는 칸 하이라이트
    clearHighlight();
    for (const cell of board.querySelectorAll<HTMLElement>('.cell')) {
      const c = cell.getBoundingClientRect();
      const cx = c.left + c.width / 2;
      const cy = c.top + c.height / 2;
      if (cx >= left && cx <= right && cy >= top && cy <= bottom) {
        cell.classList.add('cell--selected');
        selected.push(cell);
      }
    }
  }

  function finish(commit: boolean): void {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    const rect = commit ? toRect(selected) : null;
    start = null;
    box.hidden = true;
    clearHighlight();
    if (rect) onSelect(rect);
  }

  function clearHighlight(): void {
    for (const cell of selected) cell.classList.remove('cell--selected');
    selected = [];
  }

  root.addEventListener('mousedown', onMouseDown);

  return () => {
    root.removeEventListener('mousedown', onMouseDown);
    finish(false);
    box.remove();
    root.classList.remove('drag-root');
  };
}

/** 판 밖으로 나간 좌표는 판 테두리로 잘라낸다 */
function clampToBoard(board: HTMLElement, p: Point): Point {
  const b = board.getBoundingClientRect();
  return {
    x: Math.min(Math.max(p.x, b.left), b.right),
    y: Math.min(Math.max(p.y, b.top), b.bottom),
  };
}

/** 선택된 칸들의 col/row 최소·최대 → Rect. 선택 없으면 null */
function toRect(cells: HTMLElement[]): Rect | null {
  if (cells.length === 0) return null;
  const cols = cells.map((cell) => Number(cell.dataset.col));
  const rows = cells.map((cell) => Number(cell.dataset.row));
  return {
    col1: Math.min(...cols),
    row1: Math.min(...rows),
    col2: Math.max(...cols),
    row2: Math.max(...rows),
  };
}
