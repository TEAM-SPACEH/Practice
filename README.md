# 🍎 사과게임 PvP

1 대 1 실시간 점수 대결 사과게임 (원작: [Fruit Box](https://www.gamesaien.com/game/fruit_box_a/)).
Git 협업 연습용 팀 프로젝트입니다.

- 기능명세서: [docs/SPEC.md](docs/SPEC.md)
- 계획서(역할·일정·Git 규칙): [docs/PLAN.md](docs/PLAN.md)

## 실행

```bash
npm install
npm run dev        # 서버 :3001 + 클라이언트 :5173 동시 실행
```

- 브라우저 탭 2개로 http://localhost:5173 을 열어 대결
- 같은 와이파이의 다른 노트북: `http://<호스트IP>:5173`

| 명령 | 설명 |
|---|---|
| `npm run typecheck` | 전체 타입 검사 (PR 올리기 전 필수) |
| `npm test` | shared 로직 테스트 |
| `npm run format` | prettier 정리 |

## 폴더

```
shared/  공용 타입·상수·게임 로직 (클라·서버 공용)
client/  Vite + TS 화면
server/  Node + Socket.IO
docs/    SPEC, PLAN
```

## 팀원

| 이름 | 역할 | GitHub |
|---|---|---|
