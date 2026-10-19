// 담당: D (F-08)
import type { RoomState } from '@apple/shared';

export interface RoomCallbacks {
  onReady: () => void;
  onLeave: () => void;
}

/**
 * F-08 대기실 화면: 방 코드, 참가자 목록, 준비 버튼, 방 나가기
 */
export function renderRoom(
  root: HTMLElement,
  roomState: RoomState,
  myId: string | null,
  callbacks: RoomCallbacks
): void {
  const players = roomState.players || [];
  const maxPlayers = 2;
  const p1 = players[0] || null;
  const p2 = players[1] || null;

  const myPlayer = players.find((p) => p.id === myId);
  const isMeReady = myPlayer ? myPlayer.ready : false;
  const bothReady = players.length === 2 && players.every((p) => p.ready);

  root.innerHTML = `
    <div class="room-container">
      <header class="room-header">
        <div class="room-badge">1 vs 1 대전 대기실</div>
        <div class="room-code-box">
          <span class="room-code-label">방 코드</span>
          <span class="room-code-value" id="room-code">${escapeHtml(roomState.code)}</span>
          <button type="button" id="btn-copy-code" class="btn btn-outline-sm" title="코드 복사">
            📋 복사
          </button>
        </div>
        <p class="room-notice">
          ${
            players.length < maxPlayers
              ? '상대방에게 방 코드를 공유해 주세요. 참가자를 기다리는 중입니다...'
              : bothReady
                ? '곧 게임이 시작됩니다!'
                : '두 플레이어 모두 "준비 완료"를 누르면 카운트다운이 시작됩니다.'
          }
        </p>
      </header>

      <div class="players-grid">
        <!-- 1번 플레이어 슬롯 -->
        <div class="player-card ${p1 ? (p1.ready ? 'ready' : 'waiting') : 'empty'}">
          <div class="player-avatar">🍎</div>
          <div class="player-info">
            <div class="player-name-row">
              <span class="player-name">${p1 ? escapeHtml(p1.nickname) : '대기 중...'}</span>
              ${p1 && p1.id === myId ? '<span class="badge badge-me">나</span>' : ''}
            </div>
            <div class="player-status">
              ${
                p1
                  ? p1.ready
                    ? '<span class="status-badge status-ready">✔ 준비 완료</span>'
                    : '<span class="status-badge status-waiting">⏳ 대기 중</span>'
                  : '<span class="status-badge status-empty">빈 자리</span>'
              }
            </div>
          </div>
        </div>

        <div class="vs-badge">VS</div>

        <!-- 2번 플레이어 슬롯 -->
        <div class="player-card ${p2 ? (p2.ready ? 'ready' : 'waiting') : 'empty'}">
          <div class="player-avatar">🍏</div>
          <div class="player-info">
            <div class="player-name-row">
              <span class="player-name">${p2 ? escapeHtml(p2.nickname) : '상대방 기다리는 중...'}</span>
              ${p2 && p2.id === myId ? '<span class="badge badge-me">나</span>' : ''}
            </div>
            <div class="player-status">
              ${
                p2
                  ? p2.ready
                    ? '<span class="status-badge status-ready">✔ 준비 완료</span>'
                    : '<span class="status-badge status-waiting">⏳ 대기 중</span>'
                  : '<span class="status-badge status-empty">초대 대기 중</span>'
              }
            </div>
          </div>
        </div>
      </div>

      <div class="room-actions">
        <button
          type="button"
          id="btn-ready"
          class="btn ${isMeReady ? 'btn-success' : 'btn-primary'} btn-lg"
          ${isMeReady ? 'disabled' : ''}
        >
          ${isMeReady ? '✔ 준비 완료됨' : '준비 완료 (Ready)'}
        </button>

        <button type="button" id="btn-leave" class="btn btn-secondary">
          방 나가기
        </button>
      </div>
    </div>
  `;

  // 코드 복사 버튼
  const btnCopy = root.querySelector<HTMLButtonElement>('#btn-copy-code')!;
  btnCopy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(roomState.code);
      btnCopy.textContent = '✔ 복사됨!';
      setTimeout(() => {
        btnCopy.textContent = '📋 복사';
      }, 1500);
    } catch {
      // 클립보드 API 실패 시 fallback
      prompt('방 코드를 복사하세요:', roomState.code);
    }
  });

  // 준비 버튼
  const btnReady = root.querySelector<HTMLButtonElement>('#btn-ready')!;
  btnReady.addEventListener('click', () => {
    callbacks.onReady();
  });

  // 나가기 버튼
  const btnLeave = root.querySelector<HTMLButtonElement>('#btn-leave')!;
  btnLeave.addEventListener('click', () => {
    callbacks.onLeave();
  });
}

/**
 * F-08 카운트다운 화면: 3 -> 2 -> 1 -> 시작!
 * @param root 렌더 대상 요소
 * @param startAt 게임 시작 목표 시각 (서버 타임스탬프 ms)
 * @param onFinish 카운트다운 완료 시 호출할 콜백
 * @returns 리소스 해제(cleanup) 함수
 */
export function renderCountdown(
  root: HTMLElement,
  startAt: number,
  onFinish: () => void
): () => void {
  let isCleanedUp = false;
  let timerId: number | null = null;

  root.innerHTML = `
    <div class="countdown-container">
      <div class="countdown-backdrop"></div>
      <div class="countdown-content">
        <div class="countdown-title">곧 게임이 시작됩니다!</div>
        <div class="countdown-number" id="countdown-num">3</div>
        <p class="countdown-tip">💡 합이 10이 되는 직사각형 영역을 빠르게 찾으세요!</p>
      </div>
    </div>
  `;

  const numEl = root.querySelector<HTMLDivElement>('#countdown-num')!;

  function update() {
    if (isCleanedUp) return;

    const remainingMs = startAt - Date.now();
    const remainingSec = Math.ceil(remainingMs / 1000);

    if (remainingSec <= 0) {
      numEl.textContent = 'START!';
      numEl.classList.add('scale-start');
      timerId = window.setTimeout(() => {
        if (!isCleanedUp) {
          onFinish();
        }
      }, 500);
      return;
    }

    const currentText = String(remainingSec);
    if (numEl.textContent !== currentText) {
      numEl.textContent = currentText;
      numEl.classList.remove('pulse');
      void numEl.offsetWidth; // trigger reflow for css animation restart
      numEl.classList.add('pulse');
    }

    timerId = window.setTimeout(update, 200);
  }

  update();

  return () => {
    isCleanedUp = true;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
