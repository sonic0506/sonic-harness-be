---
description: 새 feature 뼈대 만들기 (module·controller·service·repository·DTO·entity·테스트)
argument-hint: '<kebab-case 이름> [--plural <복수형>]'
allowed-tools: Bash(node:*), Bash(npm:*), Bash(npx:*), Read, Edit, Write
---

스크립트: `node "${CLAUDE_PLUGIN_ROOT}/scripts/harness.mjs"`

인자: `$ARGUMENTS`

## 순서

1. 인자가 없으면 feature 이름(kebab-case 단수 명사, 예: `order-item`)을 물어요. 이름이 동사거나 복수형이면 명사 단수로 바꾸자고 제안해요.
2. 먼저 확인해요(harness.md 12절):
   - 비슷한 feature가 이미 있는지 `src/modules/`를 봐요. 있으면 그 feature를 넓힐지 물어요.
   - 단순 분류·유형 값이면 feature 대신 공통 코드 그룹이 맞는지 물어요.
3. `harness.mjs feature <이름>`을 실행해요. 복수형이 불규칙하면(`person` → `people`) `--plural <복수형>`을 붙여요. 경로는 `/v1/<복수형>`, 테이블은 `<복수형_스네이크>`가 돼요.
4. 사용자가 말한 요구에 맞게 뼈대를 채워요(작업 순서는 harness.md 10절).
   - entity 필드 → `npm run migration:generate -- src/infra/database/migrations/add-<복수형>` (DB가 필요해요. 없으면 사용자에게 `.env`의 `DATABASE_URL`을 확인해 달라고 해요)
   - 요청·응답 DTO(JSDoc 설명 포함) → repository → service와 단위 테스트 → controller → e2e
   - 필요 없는 API(예: 삭제)는 뼈대에서 지워요. 그 테스트도 같이 지워요.
5. `npm run lint`, `npm run typecheck`, `npm test`를 돌리고, Docker가 있으면 `npm run test:e2e`도 돌려요. AGENTS.md "완료 보고" 형식으로 알려요.
