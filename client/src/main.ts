// 담당: D (화면 흐름 및 화면 전환 상태 머신). Round 2에서 C·E 모듈을 여기서 연결한다.
import './style.css';
import type { ClientToServer, GameEndPayload, GameStartPayload, RoomState } from '@apple/shared';
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
 * 게임 화면 렌더링 (Round 2에서 C의 판 렌더링 및 E의 HUD와 연결)
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

  // 1. HUD 연결 (E 모듈 시도)
  try {
    const opp = currentRoom?.players.find((p) => p.id !== myId);
    renderHud(hudRoot, {
      remainingMs: 120_000,
      myScore: 0,
      oppName: opp?.nickname || '상대방',
      oppScore: 0,
    });
  } catch {
    // E 모듈 구현 전 기본 HUD 플레이스홀더
    hudRoot.innerHTML = `
      <div class="card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:16px 24px;">
        <div style="font-weight:700;">내 점수: <span style="color:#2e7d32; font-size:1.3rem;">0</span></div>
        <div style="font-size:1.4rem; font-weight:800; color:#d32f2f;">⏱ 02:00</div>
        <div style="font-weight:700;">상대 점수: <span style="color:#5c6bc0; font-size:1.3rem;">0</span></div>
      </div>
    `;
  }

  // 2. 보드 렌더링 및 드래그 연결 (C 모듈 시도)
  try {
    const dummyBoard = Array.from({ length: 170 }, () => Math.floor(Math.random() * 9) + 1);
    renderBoard(boardRoot, dummyBoard);
    const detach = attachDrag(boardRoot, (rect) => {
      console.log('선택된 영역:', rect);
    });
    cleanupCurrentScreen = detach;
  } catch {
    // C 모듈 구현 전 플레이스홀더
    boardRoot.innerHTML = `
      <div class="card game-placeholder-card">
        <h3 style="margin-top:0;">🎮 게임 진행 화면 (C 모듈 연동 대기 중)</h3>
        <p style="color:#666;">C의 board-view.ts 및 drag.ts가 머지되면 이 영역에 17×10 사과 판과 드래그가 표시됩니다.</p>
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
