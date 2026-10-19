// 담당: D (화면 흐름 및 화면 전환 상태 머신). Round 2에서 C·E 모듈을 여기서 연결한다.
import './style.css';
import type { ClientToServer, GameEndPayload, GameStartPayload, RoomState } from '@apple/shared';
import { createBoard, trySelect } from '@apple/shared';
import { net } from './net';
import { renderLobby } from './screens/lobby';
import { renderCountdown, renderRoom } from './screens/room';
import { renderResult } from './screens/result';
import { renderHud } from './game/hud';
import { renderBoard } from './game/board-view';
import { attachDrag } from './game/drag';

export type Screen = 'lobby' | 'room' | 'countdown' | 'game' | 'result';

// 앱 전역 상태
const root = document.querySelector<HTMLDivElement>('#app')!;
let currentScreen: Screen = 'lobby';

let myNickname = localStorage.getItem('apple_pvp_nickname') || '';
let myId: string | null = null;
let currentRoom: RoomState | null = null;
let gameStartData: GameStartPayload | null = null;
let gameEndData: GameEndPayload | null = null;
let lobbyErrorMessage: string | undefined = undefined;

// 게임 진행 중 상태 (F-11: 실시간 점수 교환)
let myScore = 0;
let oppScore = 0;
let liveBoard: number[] | null = null;
// 게임 화면이 떠 있을 때 HUD만 다시 그리는 콜백 (opponent:score 수신 시 사용)
let repaintGameHud: (() => void) | null = null;

// 화면 정리(cleanup) 콜백
let cleanupCurrentScreen: (() => void) | null = null;

// 소켓 래퍼: Round 1 미완성 상태에서도 에러로 중단되지 않도록 보호
function safeEmit<K extends keyof ClientToServer>(
  event: K,
  ...args: Parameters<ClientToServer[K]>
): boolean {
  try {
    net.emit(event, ...args);
    return true;
  } catch (err) {
    console.warn(`[net.emit] '${String(event)}' 전송 실패 (Round 1 Mock 동작):`, err);
    return false;
  }
}

/**
 * 화면 전환 함수
 */
export function setScreen(nextScreen: Screen): void {
  if (cleanupCurrentScreen) {
    cleanupCurrentScreen();
    cleanupCurrentScreen = null;
  }
  currentScreen = nextScreen;
  render();
}

/**
 * 메인 렌더 함수 (화면 전환 상태 머신)
 */
function render(): void {
  root.innerHTML = '';

  switch (currentScreen) {
    case 'lobby': {
      renderLobby(
        root,
        {
          onCreateRoom: (nickname) => {
            myNickname = nickname;
            localStorage.setItem('apple_pvp_nickname', nickname);
            const emitted = safeEmit('room:create', { nickname });
            if (!emitted) {
              // Round 1 Mock Fallback: 소켓 미연결 시 가상 방 생성
              myId = 'player-me';
              currentRoom = {
                code: 'MOCK',
                players: [{ id: myId, nickname, ready: false }],
              };
              setScreen('room');
            }
          },
          onJoinRoom: (code, nickname) => {
            myNickname = nickname;
            localStorage.setItem('apple_pvp_nickname', nickname);
            const emitted = safeEmit('room:join', { code, nickname });
            if (!emitted) {
              // Round 1 Mock Fallback: 소켓 미연결 시 가상 방 입장
              myId = 'player-me';
              currentRoom = {
                code,
                players: [
                  { id: 'player-host', nickname: '호스트', ready: true },
                  { id: myId, nickname, ready: false },
                ],
              };
              setScreen('room');
            }
          },
        },
        {
          nickname: myNickname,
          errorMessage: lobbyErrorMessage,
        }
      );
      break;
    }

    case 'room': {
      if (!currentRoom) {
        setScreen('lobby');
        return;
      }

      renderRoom(root, currentRoom, myId, {
        onReady: () => {
          const emitted = safeEmit('player:ready');
          if (!emitted && currentRoom) {
            // Mock Fallback: 내 준비 상태 토글
            const me = currentRoom.players.find((p) => p.id === myId);
            if (me) me.ready = true;
            render();

            // 두 명 모두 준비 완료 시 가상 카운트다운 시작
            if (currentRoom.players.length === 2 && currentRoom.players.every((p) => p.ready)) {
              setTimeout(() => {
                gameStartData = {
                  seed: 1234,
                  startAt: Date.now() + 3000,
                  durationMs: 120_000,
                };
                setScreen('countdown');
              }, 600);
            }
          }
        },
        onLeave: () => {
          safeEmit('room:leave');
          currentRoom = null;
          setScreen('lobby');
        },
      });
      break;
    }

    case 'countdown': {
      if (!gameStartData) {
        setScreen('room');
        return;
      }

      cleanupCurrentScreen = renderCountdown(root, gameStartData.startAt, () => {
        setScreen('game');
      });
      break;
    }

    case 'game': {
      renderGameScreen();
      break;
    }

    case 'result': {
      const fallbackResult: GameEndPayload = gameEndData || {
        scores: {
          [myId || 'me']: 42,
          'opp-1': 35,
        },
        winnerId: myId || 'me',
        reason: 'timeup',
      };

      renderResult(root, fallbackResult, myId, currentRoom, {
        onGoLobby: () => {
          currentRoom = null;
          gameStartData = null;
          gameEndData = null;
          lobbyErrorMessage = undefined;
          setScreen('lobby');
        },
        onRematch: () => {
          // P1 다시하기 준비용
          if (currentRoom) {
            setScreen('room');
          } else {
            setScreen('lobby');
          }
        },
      });
      break;
    }
  }

  // 개발 및 리뷰 시 화면 간 빠른 이동을 돕는 미리보기 툴바 마운트
  mountDevToolbar();
}

/**
 * 게임 화면 렌더링 (F-11: 실제 판 + 드래그 판정 + 실시간 점수 송수신)
 * - gameStartData 가 있으면 실제 게임 루프를 돌린다.
 * - 없으면(개발 툴바로 바로 진입) 기존 Mock 플레이스홀더를 보여준다.
 */
function renderGameScreen(): void {
  root.innerHTML = `
    <div class="game-container">
      <div id="game-hud"></div>
      <div id="game-board"></div>
    </div>
  `;

  const hudRoot = root.querySelector<HTMLDivElement>('#game-hud')!;
  const boardRoot = root.querySelector<HTMLDivElement>('#game-board')!;

  if (!gameStartData) {
    renderGameMockPlaceholder(boardRoot);
    return;
  }

  // --- 실제 게임 시작 ---
  const { seed, startAt, durationMs } = gameStartData;
  const endAt = startAt + durationMs;

  myScore = 0;
  oppScore = 0;
  liveBoard = createBoard(seed); // B(F-03): 같은 시드 → 두 사람 같은 판

  const opp = currentRoom?.players.find((p) => p.id !== myId);
  const oppName = opp?.nickname || '상대방';
  let inputLocked = false;

  const paintHud = (): void => {
    renderHud(hudRoot, {
      remainingMs: Math.max(0, endAt - Date.now()),
      myScore,
      oppName,
      oppScore,
    });
  };
  repaintGameHud = paintHud; // opponent:score 수신 시 외부에서 HUD 갱신
  paintHud();

  renderBoard(boardRoot, liveBoard);

  // 드래그 → 합 10 판정(B F-04) → 제거·점수·HUD 갱신 → 서버로 점수 전송
  const detachDrag = attachDrag(boardRoot, (rect) => {
    if (inputLocked || !liveBoard) return;
    const result = trySelect(liveBoard, rect);
    if (!result.ok) return;

    liveBoard = result.board;
    myScore += result.cleared.length; // 제거한 사과 개수만큼 +점
    renderBoard(boardRoot, liveBoard);
    paintHud();
    safeEmit('score:update', { score: myScore, cleared: result.cleared });
  });

  // 타이머: HUD 시간 갱신, 0 이 되면 입력 차단 후 서버의 game:end 를 기다린다 (SPEC 6장)
  const timer = window.setInterval(() => {
    paintHud();
    if (Date.now() >= endAt) {
      inputLocked = true;
      window.clearInterval(timer);
    }
  }, 250);

  cleanupCurrentScreen = () => {
    window.clearInterval(timer);
    detachDrag();
    repaintGameHud = null;
  };
}

/** 실제 게임 데이터 없이 게임 화면을 열었을 때(개발 툴바)용 Mock 화면 */
function renderGameMockPlaceholder(boardRoot: HTMLDivElement): void {
  boardRoot.innerHTML = `
    <div class="card game-placeholder-card">
      <h3 style="margin-top:0;">🎮 게임 진행 화면 (게임 시작 데이터 없음)</h3>
      <p style="color:#666;">정상 플레이는 대기실에서 양쪽 "준비" → 카운트다운을 거쳐 진입합니다.</p>
      <button type="button" id="btn-mock-end" class="btn btn-primary" style="margin-top:16px;">
        결과 화면 테스트로 이동 (Mock End)
      </button>
    </div>
  `;
  const btnMockEnd = boardRoot.querySelector<HTMLButtonElement>('#btn-mock-end');
  btnMockEnd?.addEventListener('click', () => {
    gameEndData = {
      scores: { [myId || 'me']: 45, opponent: 38 },
      winnerId: myId || 'me',
      reason: 'timeup',
    };
    setScreen('result');
  });
}

/**
 * 개발 및 테스트용 화면 미리보기 툴바
 */
function mountDevToolbar(): void {
  const existing = document.querySelector('#dev-preview-bar');
  if (existing) existing.remove();

  const bar = document.createElement('div');
  bar.id = 'dev-preview-bar';
  bar.className = 'dev-preview-bar';
  bar.innerHTML = `
    <span>🛠️ 화면 테스트:</span>
    <button type="button" data-screen="lobby" class="${currentScreen === 'lobby' ? 'active' : ''}">로비</button>
    <button type="button" data-screen="room" class="${currentScreen === 'room' ? 'active' : ''}">대기실</button>
    <button type="button" data-screen="countdown" class="${currentScreen === 'countdown' ? 'active' : ''}">카운트다운</button>
    <button type="button" data-screen="game" class="${currentScreen === 'game' ? 'active' : ''}">게임</button>
    <button type="button" data-screen="result" class="${currentScreen === 'result' ? 'active' : ''}">결과</button>
  `;

  bar.querySelectorAll<HTMLButtonElement>('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.screen as Screen;
      // 가상 데이터 보강
      if (target === 'room' && !currentRoom) {
        myId = myId || 'mock-me';
        currentRoom = {
          code: 'TEST',
          players: [
            { id: myId, nickname: myNickname || '홍길동', ready: true },
            { id: 'mock-opp', nickname: '상대선수', ready: false },
          ],
        };
      } else if (target === 'countdown') {
        gameStartData = {
          seed: 1234,
          startAt: Date.now() + 3000,
          durationMs: 120_000,
        };
      } else if (target === 'result' && !gameEndData) {
        gameEndData = {
          scores: { [myId || 'me']: 48, opponent: 40 },
          winnerId: myId || 'me',
          reason: 'timeup',
        };
      }
      setScreen(target);
    });
  });

  document.body.appendChild(bar);
}

// -------------------------------------------------------------
// 소켓 이벤트 리스너 등록 (E의 net 모듈 준비 시 자동 연동)
// -------------------------------------------------------------
function setupNetworkListeners(): void {
  try {
    net.connect();
  } catch (err) {
    console.info('[net.connect] 연결 대기 (E 모듈 준비 중):', err);
  }

  try {
    net.on('room:state', (room: RoomState) => {
      currentRoom = room;
      lobbyErrorMessage = undefined;

      // 내 ID 감지 (닉네임 기반 매칭)
      if (!myId && myNickname) {
        const found = room.players.find((p) => p.nickname === myNickname);
        if (found) myId = found.id;
      }

      if (currentScreen === 'lobby') {
        setScreen('room');
      } else if (currentScreen === 'room') {
        render();
      }
    });

    net.on('room:error', ({ message }: { message: string }) => {
      lobbyErrorMessage = message;
      if (currentScreen !== 'lobby') {
        setScreen('lobby');
      } else {
        render();
      }
    });

    net.on('game:start', (payload: GameStartPayload) => {
      gameStartData = payload;
      setScreen('countdown');
    });

    net.on('opponent:score', ({ score }) => {
      // 상대 점수 실시간 반영 (SPEC 2장). 게임 화면이면 HUD 갱신
      oppScore = score;
      if (currentScreen === 'game' && repaintGameHud) repaintGameHud();
    });

    net.on('game:end', (payload: GameEndPayload) => {
      gameEndData = payload;
      setScreen('result');
    });
  } catch (err) {
    console.info('[net.on] 리스너 등록 대기 (E 모듈 준비 중):', err);
  }
}

// 초기화
setupNetworkListeners();
render();
