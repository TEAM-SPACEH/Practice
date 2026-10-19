// 담당: D (F-10)
import type { GameEndPayload, RoomState } from '@apple/shared';

export interface ResultCallbacks {
  onGoLobby: () => void;
  onRematch?: () => void;
}

/**
 * F-10 결과 화면: 승/패/무 배너, 점수 비교, 사유, 로비 복귀
 */
export function renderResult(
  root: HTMLElement,
  result: GameEndPayload,
  myId: string | null,
  room: RoomState | null,
  callbacks: ResultCallbacks
): void {
  const isDraw = result.winnerId === null;
  const isWin = !isDraw && result.winnerId === myId;

  // 플레이어 정보 매핑
  const players = room?.players || [];
  const myPlayer = players.find((p) => p.id === myId);
  const oppPlayer = players.find((p) => p.id !== myId);

  const myNickname = myPlayer?.nickname || '나';
  const oppNickname = oppPlayer?.nickname || '상대방';

  const myScore = myId ? (result.scores[myId] ?? 0) : 0;
  // 상대 점수: scores 객체에서 myId가 아닌 첫 번째 키
  const oppId = Object.keys(result.scores).find((id) => id !== myId);
  const oppScore = oppId ? (result.scores[oppId] ?? 0) : 0;

  let outcomeClass = 'outcome-draw';
  let outcomeTitle = '🤝 무승부 (DRAW)';
  let outcomeDesc = '동점으로 팽팽한 승부였습니다!';

  if (!isDraw) {
    if (isWin) {
      outcomeClass = 'outcome-win';
      outcomeTitle = '🎉 승리 (VICTORY)!';
      outcomeDesc = '축하합니다! 상대보다 더 많은 사과를 수확했습니다.';
    } else {
      outcomeClass = 'outcome-lose';
      outcomeTitle = '💥 패배 (DEFEAT)';
      outcomeDesc = '아쉽게 패배했습니다. 다음 판에 설욕해 보세요!';
    }
  }

  const reasonDesc =
    result.reason === 'opponent-left'
      ? '상대방의 연결이 종료되어 경기가 마무리되었습니다.'
      : '120초 제한 시간이 종료되었습니다.';

  root.innerHTML = `
    <div class="result-container">
      <div class="card result-card ${outcomeClass}">
        <div class="outcome-banner">
          <h1 class="outcome-title">${outcomeTitle}</h1>
          <p class="outcome-sub">${outcomeDesc}</p>
          <span class="reason-tag">⏱ ${escapeHtml(reasonDesc)}</span>
        </div>

        <div class="score-board">
          <!-- 내 점수 카드 -->
          <div class="score-player my-score ${isWin ? 'winner' : ''}">
            <div class="score-avatar">🍎</div>
            <div class="score-name">${escapeHtml(myNickname)} <span class="badge badge-me">나</span></div>
            <div class="score-value">${myScore} <span class="score-unit">점</span></div>
          </div>

          <div class="score-vs">VS</div>

          <!-- 상대 점수 카드 -->
          <div class="score-player opp-score ${!isDraw && !isWin ? 'winner' : ''}">
            <div class="score-avatar">🍏</div>
            <div class="score-name">${escapeHtml(oppNickname)}</div>
            <div class="score-value">${oppScore} <span class="score-unit">점</span></div>
          </div>
        </div>

        <div class="result-actions">
          <button type="button" id="btn-go-lobby" class="btn btn-primary btn-lg">
            로비로 이동
          </button>
          ${
            callbacks.onRematch
              ? `<button type="button" id="btn-rematch" class="btn btn-secondary btn-lg">다시하기 (Rematch)</button>`
              : ''
          }
        </div>
      </div>
    </div>
  `;

  const btnGoLobby = root.querySelector<HTMLButtonElement>('#btn-go-lobby')!;
  btnGoLobby.addEventListener('click', () => {
    callbacks.onGoLobby();
  });

  if (callbacks.onRematch) {
    const btnRematch = root.querySelector<HTMLButtonElement>('#btn-rematch');
    btnRematch?.addEventListener('click', () => {
      callbacks.onRematch?.();
    });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
