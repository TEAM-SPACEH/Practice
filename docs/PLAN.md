# 사과게임 PvP — 계획서 (PLAN)

> 작성일: 2026-10-19 · 기능 상세는 [SPEC.md](./SPEC.md)
> 오늘 하루(약 12:30 ~ 18:00) 안에 끝내는 일정

## 1. 역할 분담 (6명)

각자 **주로 자기 폴더/파일만** 건드리도록 나눴다 → 평소엔 충돌이 적고, 충돌 연습은 정해진 곳에서만 한다.

| 역할 | 담당 기능 | 주로 건드리는 파일 | 브랜치 예시 |
|---|---|---|---|
| **A. 팀장·통합** | F-01 뼈대, F-02 공용 타입·상수, GitHub 설정, 최종 통합 | 루트 설정 파일, `shared/src/constants.ts`, `shared/src/events.ts` | `chore/F-01-scaffold` |
| **B. 게임 로직** | F-03 시드·판 생성, F-04 선택·판정, F-17 테스트 | `shared/src/random.ts`, `board.ts`, `rules.ts` | `feat/F-04-rules` |
| **C. 판 화면** | F-05 판 렌더링, F-06 드래그 선택 | `client/src/game/board-view.ts`, `drag.ts` | `feat/F-06-drag` |
| **D. 화면 흐름** | F-07 로비, F-08 대기실·카운트다운, F-10 결과, 화면 전환 | `client/src/main.ts`, `client/src/screens/*` | `feat/F-07-lobby` |
| **E. 클라 네트워크** | F-11 소켓 클라이언트, F-09 HUD, F-16 미니맵(P1) | `client/src/net.ts`, `client/src/game/hud.ts` | `feat/F-11-net` |
| **F. 서버** | F-12 방 관리, F-13 게임 진행, F-14 끊김 처리 | `server/src/*` | `feat/F-12-rooms` |

- F-15 다시하기(P1)는 **D + F 페어**로 진행.
- 누구 이름이 어떤 역할인지는 킥오프 때 이 표 옆에 적는다.

## 2. 일정

| 시간 | 단계 | 할 일 | 끝났다는 기준 |
|---|---|---|---|
| 12:30–13:00 | **킥오프** | SPEC·PLAN 같이 읽기, 역할 확정, A가 GitHub 설정(아래 4장), **A가 README에 빈 "팀원" 표 머지** (Round 0 준비) | 모두 저장소 clone 완료 |
| 13:00–13:30 | **Round 0: 충돌 연습** | 각자 `docs/intro-이름` 브랜치에서 README "팀원" 표에 **같은 위치에** 자기 줄 추가 → PR. 늦게 머지하는 사람일수록 충돌이 나고, 직접 해결 | 6개 PR 전부 머지, README에 6명 |
| 13:00–13:30 | (동시에) A: 뼈대 | A가 F-01 뼈대 PR, F-02 계약 PR(이벤트 타입 + 아래 "모듈 틀") → B가 리뷰 → 머지 | `npm run dev`로 빈 화면 + 서버 뜸 |
| 13:30 | **모두 `git pull`** | 뼈대·이벤트 계약이 들어간 `main`에서 각자 브랜치 생성 | — |
| 13:30–15:30 | **Round 1: 각자 기능** | 1장 담당 기능 P0 구현, **1인 1 PR 이상** | 각 PR 리뷰 1명 승인 후 머지 |
| 15:30–16:30 | **Round 2: 연결** | 화면 ↔ 판 ↔ 네트워크 ↔ 서버 연결 PR | 탭 2개로 한 판 끝까지 플레이 |
| 16:30–17:30 | **통합·버그·P1** | 같이 플레이해 보며 `fix/` 브랜치로 버그 수정, 남는 사람은 P1 | SPEC 7장 체크리스트 |
| 17:30–18:00 | **회고** | 잘 된 것 / 막힌 것(특히 Git), 커밋 그래프 같이 보기 | — |

### 머지 순서 (의존 관계)

```
A 뼈대+계약(F-01,02)
   ├─▶ B 로직(F-03,04) ─▶ C 판 화면(F-05,06)
   ├─▶ F 서버(F-12,13,14)
   ├─▶ E 소켓 클라(F-11) ─▶ E HUD(F-09)
   └─▶ D 화면 흐름(F-07,08,10)
                     └─ Round 2: D가 C·E 결과물을 main.ts에서 연결
```

- **모듈 틀(A가 13:30 전에 머지)**: 아래 함수들을 빈 껍데기(`throw new Error('TODO')` 또는 console.log)로 미리 만들어 둔다. 각 담당자는 **내용만 채우므로** Round 2 연결 때 이름·인자가 안 맞는 일이 없다.
  ```ts
  // client/src/game/board-view.ts (C)
  export function renderBoard(root: HTMLElement, board: number[]): void;
  // client/src/game/drag.ts (C)  — 드래그를 놓았을 때 칸 좌표 사각형을 콜백으로
  export function attachDrag(root: HTMLElement, onSelect: (rect: Rect) => void): () => void; // 해제 함수 반환
  // client/src/game/hud.ts (E)
  export function renderHud(root: HTMLElement, s: { remainingMs: number; myScore: number; oppName: string; oppScore: number }): void;
  // client/src/net.ts (E)
  export const net: {
    connect(): void;
    emit<K extends keyof ClientToServer>(e: K, ...args: Parameters<ClientToServer[K]>): void;
    on<K extends keyof ServerToClient>(e: K, fn: ServerToClient[K]): void;
  };
  // client/src/main.ts (D) — 화면 상태
  type Screen = 'lobby' | 'room' | 'countdown' | 'game' | 'result';
  ```
- 개인별 **기능 PR 2개** 맞추는 방법: 기능을 2개 이상 맡은 사람은 기능별로, 하나뿐인 사람은 "1차 동작 → 2차 마무리/테스트"로 나눈다.
- **B가 늦으면 C가 막힌다** → B는 `createBoard`·`trySelect` 함수 **틀(시그니처)부터 먼저 PR** 올리고, 내용은 다음 PR에서 채워도 된다.
- C는 서버 없이 고정 시드(`createBoard(1234)`)로 혼자 테스트하고, D는 가짜 데이터로 화면만 먼저 만든다.

## 3. Git 규칙

### 브랜치

- `main` 은 **항상 실행되는 상태**. 직접 push 금지.
- 브랜치 이름: `종류/기능ID-짧은설명`
  - `feat/F-06-drag`, `fix/F-13-end-timer`, `docs/intro-hong`, `chore/F-01-scaffold`
- 브랜치는 **항상 최신 `main`에서** 딴다: `git switch main && git pull && git switch -c feat/...`

### 커밋 메시지

```
종류: 무엇을 했는지 (한국어 OK)

feat: 드래그 사각형 그리기
fix: 합이 10일 때 제거 안 되던 문제
docs: README 팀원 추가
chore: tsconfig 설정
test: rules.ts 판정 테스트
```

### PR

- 제목: `[F-06] 드래그 선택 UI`
- 본문: 무엇을 / 어떻게 확인했는지 / 스크린샷(화면 작업이면)
- **리뷰어 1명 승인** 후 머지. 리뷰어는 직접 브랜치를 받아 실행해 보는 걸 권장.
- PR은 작게(대략 300줄 이하). 크면 쪼갠다.
- PR 올리기 전: `git pull origin main`으로 최신 반영 → 충돌 있으면 내가 해결 → 실행 확인.
- 머지 방식: **Squash and merge** (main 히스토리를 기능 단위로 깔끔하게).
- 머지 후 브랜치 삭제.

### AI 코딩 도구

- 사용 OK. 단 **PR 내용은 본인이 설명할 수 있어야** 하고, 리뷰 때 물어보면 답할 수 있어야 한다.
- 담당 파일 밖을 AI가 고쳤으면 되돌리거나 PR 본문에 이유를 적는다 (남의 파일 건드리면 충돌 원인).
- `shared/src/events.ts` 는 AI가 임의로 바꾸지 않게 주의.

### 충돌 났을 때

1. 당황하지 말고 `git status` 로 충돌 파일 확인
2. 파일에서 `<<<<<<<`, `=======`, `>>>>>>>` 부분을 **두 사람 내용이 모두 살도록** 수정
3. `git add 파일` → `git commit` (merge) 또는 `git rebase --continue` (rebase)
4. 상대 코드 의도를 모르겠으면 **그 사람에게 물어본다**

## 4. GitHub 설정 (A가 킥오프 때)

- [ ] 팀원 5명 Collaborator 초대 (Write 권한)
- [ ] `main` 브랜치 보호: PR 필수, 승인 1명, 직접 push 금지
- [ ] PR 템플릿 `.github/pull_request_template.md`
- [ ] (선택) SPEC 4장 기능마다 Issue 생성 → PR 본문에 `Closes #번호`

## 5. 위험 요소와 대응

| 위험 | 대응 |
|---|---|
| 뼈대(F-01)가 늦어져 모두 대기 | A는 13:30까지 **최소 실행되는 뼈대만** 머지. 나머지 설정은 후속 PR |
| 이벤트 계약을 누가 몰래 바꿔서 연결 시 터짐 | `shared/src/events.ts` 변경은 PR + 팀 공지 필수 |
| Round 2 연결 때 한꺼번에 머지해서 main이 깨짐 | 연결 PR은 **한 번에 하나씩**, 머지 후 바로 탭 2개로 확인 |
| 노트북 2대 연결이 안 됨(방화벽 등) | 같은 PC 브라우저 탭 2개로 테스트해도 완료 기준 충족 |
| 시간 부족 | P1·P2는 과감히 버린다. 목표는 협업 흐름 |
