// 담당: D (F-07)
export interface LobbyCallbacks {
  onCreateRoom: (nickname: string) => void;
  onJoinRoom: (code: string, nickname: string) => void;
}

export interface LobbyState {
  nickname?: string;
  errorMessage?: string;
}

/**
 * F-07 로비 화면: 닉네임 입력, 방 만들기, 코드로 입장
 */
export function renderLobby(
  root: HTMLElement,
  callbacks: LobbyCallbacks,
  state: LobbyState = {}
): void {
  const currentNickname = state.nickname || '';
  const errorMsg = state.errorMessage || '';

  root.innerHTML = `
    <div class="lobby-container">
      <header class="lobby-header">
        <h1 class="game-title"><span class="apple-icon">🍎</span> 사과게임 PvP</h1>
        <p class="game-subtitle">실시간 1:1 두뇌 대결! 합이 10이 되는 사과를 드래그하세요.</p>
      </header>

      ${errorMsg ? `<div class="alert-error" role="alert">${escapeHtml(errorMsg)}</div>` : ''}

      <div class="card lobby-card">
        <div class="form-group">
          <label for="nickname-input" class="form-label">플레이어 닉네임</label>
          <input
            type="text"
            id="nickname-input"
            class="input-text"
            placeholder="닉네임을 입력하세요 (1~10자)"
            maxlength="10"
            value="${escapeHtml(currentNickname)}"
            autocomplete="off"
          />
          <span class="input-hint" id="nickname-hint"></span>
        </div>

        <div class="action-sections">
          <!-- 방 만들기 섹션 -->
          <div class="action-card">
            <h2 class="section-title">새로운 방 만들기</h2>
            <p class="section-desc">새 방을 개설하고 친구에게 코드를 공유하세요.</p>
            <button type="button" id="btn-create-room" class="btn btn-primary btn-block">
              방 만들기
            </button>
          </div>

          <div class="divider">
            <span>또는</span>
          </div>

          <!-- 코드로 입장 섹션 -->
          <div class="action-card">
            <h2 class="section-title">코드로 입장하기</h2>
            <p class="section-desc">공유받은 4자리 방 코드를 입력하세요.</p>
            <div class="join-row">
              <input
                type="text"
                id="room-code-input"
                class="input-text input-code"
                placeholder="방 코드 (예: ABCD)"
                maxlength="6"
                autocomplete="off"
                style="text-transform: uppercase;"
              />
              <button type="button" id="btn-join-room" class="btn btn-secondary">
                참가하기
              </button>
            </div>
            <span class="input-hint" id="code-hint"></span>
          </div>
        </div>
      </div>
    </div>
  `;

  const nicknameInput = root.querySelector<HTMLInputElement>('#nickname-input')!;
  const roomCodeInput = root.querySelector<HTMLInputElement>('#room-code-input')!;
  const btnCreate = root.querySelector<HTMLButtonElement>('#btn-create-room')!;
  const btnJoin = root.querySelector<HTMLButtonElement>('#btn-join-room')!;
  const nicknameHint = root.querySelector<HTMLSpanElement>('#nickname-hint')!;
  const codeHint = root.querySelector<HTMLSpanElement>('#code-hint')!;

  function getValidatedNickname(): string | null {
    const nick = nicknameInput.value.trim();
    if (!nick) {
      nicknameHint.textContent = '닉네임을 1자 이상 입력해 주세요.';
      nicknameHint.className = 'input-hint text-error';
      nicknameInput.focus();
      return null;
    }
    nicknameHint.textContent = '';
    return nick;
  }

  // 방 만들기
  btnCreate.addEventListener('click', () => {
    const nick = getValidatedNickname();
    if (!nick) return;
    callbacks.onCreateRoom(nick);
  });

  // 코드로 입장
  function handleJoin(): void {
    const nick = getValidatedNickname();
    if (!nick) return;

    const code = roomCodeInput.value.trim().toUpperCase();
    if (!code) {
      codeHint.textContent = '방 코드를 입력해 주세요.';
      codeHint.className = 'input-hint text-error';
      roomCodeInput.focus();
      return;
    }
    codeHint.textContent = '';
    callbacks.onJoinRoom(code, nick);
  }

  btnJoin.addEventListener('click', handleJoin);

  // 엔터 키 지원
  roomCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJoin();
    }
  });

  nicknameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (roomCodeInput.value.trim()) {
        handleJoin();
      } else {
        const nick = getValidatedNickname();
        if (nick) callbacks.onCreateRoom(nick);
      }
    }
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
