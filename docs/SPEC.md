# 사과게임 PvP — 기능명세서 (SPEC)

> 작성일: 2026-10-19 · 상태: 초안(팀 리뷰 전)
> 원작 참고: https://www.gamesaien.com/game/fruit_box_a/

## 0. 이 프로젝트의 목적

- **진짜 목표는 Git 협업 연습**이다. 6명이 각자 브랜치를 따고 → PR → 리뷰 → 머지하는 흐름을 하루 안에 여러 번 경험한다.
- 결과물은 **오늘 안에 두 사람이 실시간으로 점수 대결할 수 있는 사과게임**이다.
- 게임 완성도보다 "모두가 PR을 올리고 머지해 봤는가"가 더 중요하다. 기능이 덜 돼도 협업 흐름이 돌았으면 성공.

### 하지 않는 것 (Non-goals)

- 회원가입/로그인, DB, 랭킹 저장
- 치트 방지(점수는 클라이언트를 믿는다)
- 배포(로컬 + 같은 와이파이에서만 플레이)
- 3인 이상 대전, 관전 모드, 사운드, 모바일 터치 최적화

### 실패로 보는 것 (Anti-goals)

- 한두 명이 코드를 다 짜고 나머지는 구경만 한 경우
- `main`에 직접 push 해서 PR 흐름을 건너뛴 경우
- `main`이 깨진 상태(실행 안 됨)로 오래 방치된 경우

---

## 1. 게임 규칙 (원작 그대로)

| 항목 | 값 |
|---|---|
| 판 크기 | 가로 17 × 세로 10 = 170칸 |
| 사과 숫자 | 1~9 랜덤 |
| 조작 | 마우스 드래그로 직사각형 영역 선택 |
| 성공 조건 | 선택 영역 안 **남아 있는 사과** 숫자 합이 정확히 **10** |
| 성공 시 | 선택된 사과 모두 제거, **제거한 사과 개수만큼 점수 +** |
| 제한 시간 | 120초 |

- **선택 판정(우리 결정)**: 칸의 **중심점**이 드래그 사각형 안에 있으면 선택된 것으로 본다.
- 이미 제거된 칸은 합계·개수에 포함하지 않는다.
- 합이 10이 아니면 아무 일도 일어나지 않는다(감점 없음).

## 2. PvP 규칙

- **1 대 1**, 각자 **자기 판**에서 플레이한다(서로 사과를 뺏지 않음).
- **두 사람의 판은 똑같다**: 서버가 시드(seed) 하나를 정해 두 사람에게 보내고, 각 클라이언트가 같은 시드로 같은 판을 생성한다.
- 플레이 중 **상대 점수가 실시간으로** 내 화면에 표시된다.
- 120초가 끝나면 점수가 높은 쪽이 승리, 같으면 무승부.
- 게임 중(카운트다운 포함) 상대가 나가면 남은 사람이 **승리** 처리된다.

---

## 3. 화면 흐름

```
[로비] ──방 만들기──▶ [대기실: 방 코드 표시, 상대 기다림]
   │                          │ 상대 입장
   └──코드로 입장──────────────┤
                              ▼
                     [대기실: 둘 다 "준비" 누름]
                              ▼
                     [카운트다운 3-2-1]
                              ▼
                     [게임 120초]  ← 상대 점수 실시간
                              ▼
                     [결과: 승/패/무, 양쪽 점수] ──다시하기(P1)──▶ 대기실
```

---

## 4. 기능 목록

우선순위: **P0** = 오늘 꼭, **P1** = 시간 남으면, **P2** = 안 해도 됨

| ID | 기능 | 설명 | 우선순위 | 영역 |
|---|---|---|---|---|
| F-01 | 프로젝트 뼈대 | npm workspaces(client/server/shared), tsconfig, 실행 스크립트 | P0 | 공통 |
| F-02 | 공용 타입·상수 | 소켓 이벤트 타입, 판 크기/시간/목표합 상수 | P0 | shared |
| F-03 | 시드 랜덤 + 판 생성 | 같은 시드 → 같은 170칸 숫자 | P0 | shared |
| F-04 | 선택·판정 로직 | 사각형 → 선택 칸 계산, 합 10 판정, 제거·점수 | P0 | shared |
| F-05 | 판 렌더링 | 17×10 사과 그리기, 제거된 칸 비우기 | P0 | client |
| F-06 | 드래그 선택 UI | 마우스 드래그로 사각형 표시, 선택 칸 하이라이트, 놓으면 판정 | P0 | client |
| F-07 | 로비 화면 | 닉네임 입력, 방 만들기 / 코드로 입장 | P0 | client |
| F-08 | 대기실·카운트다운 | 방 코드·참가자 표시, 준비 버튼, 3-2-1 | P0 | client |
| F-09 | HUD | 남은 시간, 내 점수, 상대 닉네임·점수 | P0 | client |
| F-10 | 결과 화면 | 승/패/무, 양쪽 점수 | P0 | client |
| F-11 | 소켓 클라이언트 | 서버 연결, 이벤트 송수신을 화면 상태와 연결 | P0 | client |
| F-12 | 방 관리 서버 | 방 생성(4자리 코드)/입장/퇴장, 최대 2명 | P0 | server |
| F-13 | 게임 진행 서버 | 둘 다 준비 → 시드+시작시각 전송, 점수 중계, 120초 후 결과 전송 | P0 | server |
| F-14 | 연결 끊김 처리 | 게임 중 나가면 상대 승리, 대기실이면 방 정리 | P0 | server |
| F-15 | 다시하기 | 결과 화면에서 같은 상대와 재대결 | P1 | client+server |
| F-16 | 상대 미니맵 | 상대 판의 제거된 칸을 작은 판으로 표시 | P1 | client |
| F-17 | 로직 단위 테스트 | F-03, F-04 vitest 테스트 | P1 | shared |
| F-18 | 빠른 매칭 | 코드 없이 대기열로 자동 매칭 | P2 | server |

---

## 5. 기술 구성

| 영역 | 선택 | 이유 |
|---|---|---|
| 언어 | TypeScript | 클라·서버가 같은 타입을 공유 → 이벤트 이름/필드 오타를 컴파일 단계에서 잡음 |
| 클라이언트 | Vite + 순수 TS + DOM(또는 Canvas) | 프레임워크 학습 비용 없음, 하루 일정에 맞음 |
| 서버 | Node 20+ + Socket.IO 4 + tsx | 방(room) 기능 내장, 재연결 처리 쉬움 |
| 테스트 | vitest (P1) | Vite와 설정 공유 |
| 패키지 | npm workspaces | 별도 도구 설치 없음 |

### 폴더 구조

```
Practice/
├─ docs/            SPEC.md, PLAN.md
├─ shared/src/
│  ├─ constants.ts  COLS=17, ROWS=10, TARGET_SUM=10, DURATION_MS=120000, COUNTDOWN_MS=3000
│  ├─ events.ts     소켓 이벤트 타입 (아래 6장)
│  ├─ random.ts     시드 랜덤 (mulberry32)
│  ├─ board.ts      createBoard(seed) → number[] (길이 170, 1~9)
│  └─ rules.ts      getSelectedCells / trySelect (합 10 판정)
├─ client/src/
│  ├─ main.ts       화면 전환(state machine)
│  ├─ net.ts        socket.io-client 래퍼
│  ├─ screens/      lobby.ts, room.ts, result.ts
│  ├─ game/         board-view.ts(렌더), drag.ts(드래그 선택), hud.ts
│  └─ style.css
└─ server/src/
   ├─ index.ts      서버 시작 (포트 3001, 0.0.0.0)
   ├─ rooms.ts      방 생성/입장/퇴장
   └─ game.ts       준비/시작/점수 중계/종료
```

### 판 데이터 형식

- 판은 길이 170의 `number[]`. 인덱스 `i = row * 17 + col`.
- 값 `1~9` = 사과, `0` = 제거됨.

### 핵심 함수 시그니처 (shared, 순수 함수)

```ts
// random.ts
export function mulberry32(seed: number): () => number; // 0 이상 1 미만

// board.ts
export function createBoard(seed: number): number[]; // 길이 170, 값 1~9

// rules.ts
export interface Rect { col1: number; row1: number; col2: number; row2: number } // 칸 좌표, 양 끝 포함
export function getSelectedCells(board: number[], rect: Rect): number[]; // 남아 있는(≠0) 칸 인덱스
export function trySelect(board: number[], rect: Rect):
  { ok: true; board: number[]; cleared: number[] } | { ok: false };   // 합 10이면 새 판 반환(원본 불변)
```

- 픽셀 → 칸 좌표 변환(중심점 판정)은 client `drag.ts` 담당, shared는 칸 좌표만 다룬다.

### 서버 주소

- 클라이언트는 `io(\`http://${location.hostname}:3001\`)` 로 접속 → 같은 와이파이의 다른 노트북도 `http://<호스트IP>:5173` 으로 접속 가능.
- 서버 CORS는 모든 origin 허용(오늘은 로컬 전용).
- 루트 `npm run dev` = `concurrently` 로 server(tsx watch)와 client(vite --host) 동시 실행.

---

## 6. 소켓 이벤트 계약 (shared/src/events.ts)

> 이 계약이 6명의 약속이다. 바꾸려면 PR로 팀 합의 후 변경.

### 클라이언트 → 서버

| 이벤트 | 데이터 | 설명 |
|---|---|---|
| `room:create` | `{ nickname: string }` | 방 만들기 |
| `room:join` | `{ code: string, nickname: string }` | 코드로 입장 |
| `room:leave` | — | 방 나가기 |
| `player:ready` | — | 준비 완료 |
| `score:update` | `{ score: number, cleared: number[] }` | 사과를 터뜨릴 때마다 전송. `cleared` = 이번에 제거한 칸 인덱스(미니맵용) |

### 서버 → 클라이언트

| 이벤트 | 데이터 | 설명 |
|---|---|---|
| `room:state` | `{ code: string, players: { id: string, nickname: string, ready: boolean }[] }` | 방 상태 바뀔 때마다 |
| `room:error` | `{ message: string }` | 없는 코드, 꽉 찬 방 등 |
| `game:start` | `{ seed: number, startAt: number, durationMs: number }` | `startAt` = 서버 시각(ms) 기준 카운트다운 끝나는 시점 |
| `opponent:score` | `{ score: number, cleared: number[] }` | 상대 점수 중계 |
| `game:end` | `{ scores: Record<string, number>, winnerId: string \| null, reason: 'timeup' \| 'opponent-left' }` | `winnerId=null`이면 무승부 |

### 타이밍 규칙

- 서버는 `game:start` 를 보낼 때 `startAt = Date.now() + COUNTDOWN_MS`.
- 클라이언트는 받은 즉시 3초 카운트다운을 시작하고 그 뒤 120초 진행(서버 시각과 PC 시계 차이는 무시 — 오늘은 같은 와이파이라 충분).
- 서버는 `startAt + durationMs + 500ms` 시점에 마지막으로 받은 점수로 `game:end` 를 보낸다. 클라이언트는 자기 타이머가 0이 되면 입력을 막고 `game:end` 를 기다린다.

---

## 7. 완료 기준 (오늘 저녁 체크)

- [ ] `npm install && npm run dev` 한 번으로 서버+클라이언트가 뜬다
- [ ] 브라우저 탭 2개(또는 노트북 2대)로 방 만들기 → 입장 → 준비 → 120초 대결 → 결과까지 끝까지 간다
- [ ] 두 판의 숫자 배치가 똑같다
- [ ] 상대 점수가 1초 안에 내 화면에 반영된다
- [ ] 6명 모두 **기능 PR 2개 이상 머지**(Round 0 README 소개 PR은 별도), **리뷰 1개 이상**
- [ ] 팀 전체가 **머지 충돌을 최소 1번** 직접 해결해 봤다
- [ ] `main`에 직접 push 0회
